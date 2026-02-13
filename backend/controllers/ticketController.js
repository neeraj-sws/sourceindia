const { Op, fn, col, Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Tickets = require('../models/Tickets');
const TicketCategory = require('../models/TicketCategory');
const TicketReply = require('../models/TicketReply');
const Emails = require('../models/Emails');
const Users = require('../models/Users');
const Admin = require('../models/Admin');
const Roles = require('../models/Roles');
const getMulterUpload = require('../utils/upload');
const { body, validationResult } = require('express-validator');
const upload = getMulterUpload('tickets').single('attachment');
const moment = require('moment');
const { getTransporter, sendMail, getSiteConfig } = require('../helpers/mailHelper');
require('dotenv').config();

exports.createTickets = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: "Attachment upload failed",
        details: err.message,
      });
    }

    try {
      const adminId = req.user.id;

      const admin = await Admin.findByPk(adminId, {
        include: [{ association: "Roles" }],
      });

      if (!admin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        user_id,
        title,
        message,
        priority,
        status,
      } = req.body;

      let category;

      // 🔐 CATEGORY LOGIC BASED ON TOKEN
      if (admin.Roles.id === 4) {
        // Super Admin → allow category from request
        category = req.body.category;
      } else {
        // Normal Admin → FORCE category from role
        category = admin.Roles.ticket_category;

        if (!category || category === 0) {
          return res.status(403).json({
            message: "You are not allowed to create tickets in this category",
          });
        }
      }

      const user = await Users.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const dateStr = moment().format("YYYYMMDD");
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticketId = `SOURCE-INDIA-${dateStr}-${randomNum}`;

      const crypto = require("crypto");
      const token = crypto
        .createHash("md5")
        .update(title + Date.now())
        .digest("hex");

      /*let acceptance_status = 0;
      let accepted_by = 0;

      // If NOT super admin → auto accept by that subadmin
      if (admin.Roles?.id !== 4) {
        acceptance_status = 1;
        accepted_by = adminId;
      }*/
      let acceptance_status = 0;
      let accepted_by = 0;
      let ticketStatus = 0;

      if (admin.Roles?.id === 4) {
        // Main Admin creating ticket

        const subAdmins = await Admin.findAll({
          include: [
            {
              model: Roles,
              as: "Roles",
              where: {
                ticket_category: category,
                status: 1,
                is_delete: 0,
              },
              required: true,
            },
          ],
          where: {
            status: 1,
            role: { [Op.ne]: 4 },
          },
        });

        if (subAdmins.length === 1) {
          acceptance_status = 1;
          accepted_by = subAdmins[0].id;
          ticketStatus = 1;
        }

      } else {
        acceptance_status = 1;
        accepted_by = adminId;
        ticketStatus = 1;
      }

      const ticket = await Tickets.create({
        user_id,
        ticket_id: ticketId,
        title,
        message,
        priority,
        category, // ✅ enforced from token
        status: ticketStatus,
        attachment: req.file ? req.file.filename : null,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        phone: user.mobile,
        added_by: "admin",
        created_by: "Admin",
        token,
        is_complete: 1,
        acceptance_status,
        accepted_by
      });

      await TicketReply.create({
        user_id,
        ticket_id: ticket.id,
        reply: message,
        added_by: "Admin",
        attachment: req.file ? req.file.filename : null,
        media_type: req.file?.mimetype?.startsWith("image/")
          ? "image"
          : req.file
          ? "file"
          : "text",
      });

      return res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        ticket,
        ticket_id: ticketId,
        token,
        accepted_by_name: acceptedByAdmin ? acceptedByAdmin.name : null,
      });

    } catch (error) {
      console.error("Admin Ticket Create Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create ticket",
      });
    }
  });
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Tickets.findAll({ order: [['id', 'ASC']] });
    const modifiedTicket = tickets.map(ticket => {
      const ticketData = ticket.toJSON();
      ticketData.getStatus = ticketData.status === 0 ? 'Pending' : ticketData.status === 1 ? 'In Progress' :
        ticketData.status === 2 ? 'Resolved' : ticketData.status === 3 ? 'Cancel' : '';
      return ticketData;
    });
    res.json(modifiedTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTicketsById = async (req, res) => {
  try {
    const ticketId = req.params.id; // primary key id
    const tickets = await Tickets.findByPk(ticketId, {
      include: [
        { model: TicketCategory, attributes: ['name'], as: 'TicketCategory' },
        { model: Admin, attributes: ['id', 'name'], as: 'AcceptedByAdmin' },
      ],
    });

    if (!tickets) return res.status(404).json({ message: 'Ticket not found' });
    const ticketData = {
      ...tickets.toJSON(),
      accepted_by_name: tickets.AcceptedByAdmin
        ? tickets.AcceptedByAdmin.name
        : null
    };

    // Fetch all completed tickets for the same email
    const relatedTickets = await Tickets.findAll({
      where: { is_complete: 1, email: tickets.email },
    });

    // Fetch all replies for this ticket
    const ticketReplies = await TicketReply.findAll({
      where: { ticket_id: tickets.id },
      order: [['id', 'DESC']],
    });

    const lastReply = ticketReplies.length > 0 ? ticketReplies[0] : null;

    return res.json({
      ticket: ticketData,
      relatedTickets,
      replies: ticketReplies,
      lastReply,
    });
  } catch (err) {
    console.error('Error fetching ticket by ID:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateTickets = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: "Attachment upload failed", details: err.message });
    }

    try {
      const adminId = req.user.id;
      const admin = await Admin.findByPk(adminId, { include: [{ association: "Roles" }] });
      if (!admin) return res.status(401).json({ message: "Unauthorized" });

      const { user_id, title, message, priority, status } = req.body;

      // Find the ticket
      const ticket = await Tickets.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      // Determine category based on admin role
      let category;
      if (admin.Roles.id === 4) {
        // Super Admin → allow category from request
        category = req.body.category;
      } else {
        // Normal Admin → enforce category from role
        category = admin.Roles.ticket_category;
        if (!category || category === 0) {
          return res.status(403).json({
            message: "You are not allowed to update tickets in this category",
          });
        }
      }

      // Validate the user
      const user = await Users.findByPk(user_id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Update ticket fields
      ticket.user_id = user_id;
      ticket.title = title;
      ticket.message = message;
      ticket.priority = priority;
      ticket.status = status || ticket.status;
      ticket.category = category;

      // Handle attachment
      if (req.file) {
        if (ticket.attachment) {
          const oldPath = path.join(__dirname, "../upload/tickets/", ticket.attachment);
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Failed to delete old attachment:", err);
          });
        }
        ticket.attachment = req.file.filename;
      }

      ticket.updated_at = new Date();
      await ticket.save();

      // Optional: create a new TicketReply if message updated
      if (message && message !== ticket.message) {
        await TicketReply.create({
          user_id,
          ticket_id: ticket.id,
          reply: message,
          added_by: "Admin",
          attachment: req.file ? req.file.filename : null,
          media_type: req.file?.mimetype?.startsWith("image/") ? "image" : req.file ? "file" : "text",
        });
      }

      return res.json({ success: true, message: "Ticket updated successfully", ticket });
    } catch (error) {
      console.error("Admin Ticket Update Error:", error);
      return res.status(500).json({ success: false, message: "Failed to update ticket", error: error.message });
    }
  });
};

exports.deleteTickets = async (req, res) => {
  try {
    const tickets = await Tickets.findByPk(req.params.id);
    if (!tickets) return res.status(404).json({ message: 'Ticket not found' });
    if (tickets.attachment) {
      const filePath = path.join(__dirname, '../upload/tickets', tickets.attachment);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete file:', err);
        }
      });
    }
    await tickets.destroy();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTicketsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 2 = resolve, 3 = cancel

    if (![2, 3].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await Tickets.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.update({
      status,
      is_complete: status === 2 ? 1 : ticket.is_complete,
    });

    // Send emails for resolved/cancelled status
    try {
      const userName = `${ticket.fname || ''} ${ticket.lname || ''}`.trim();
      const nowStr = new Date().toLocaleString();
      const siteConfig = await getSiteConfig();
      if (status === 2) { // Resolved
        // User mail (117)
        const userEmailTemplate = await Emails.findByPk(117);
        if (userEmailTemplate) {
          let userMsg = userEmailTemplate.message.toString("utf8");
          userMsg = userMsg
            .replace(/{{ USER_NAME }}/g, userName)
            .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
            .replace(/{{ TICKET_SUBJECT }}/g, ticket.title)
            .replace(/{{ DATE_TIME }}/g, nowStr);
          await sendMail({
            to: ticket.email,
            subject: userEmailTemplate.subject || "Your Support Ticket Has Been Resolved",
            message: userMsg,
          });
        }
        // Admin mail (116)
        const adminEmailTemplate = await Emails.findByPk(116);
        if (adminEmailTemplate) {
          let adminMsg = adminEmailTemplate.message.toString("utf8");
          adminMsg = adminMsg
            .replace(/{{ USER_NAME }}/g, userName)
            .replace(/{{ USER_EMAIL }}/g, ticket.email)
            .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
            .replace(/{{ TICKET_SUBJECT }}/g, ticket.title)
            .replace(/{{ DATE_TIME }}/g, nowStr);
          await sendMail({
            to: siteConfig['site_email'],
            subject: adminEmailTemplate.subject || "Admin Alert: Ticket Resolved",
            message: adminMsg,
          });
        }
      } else if (status === 3) { // Cancelled
        // User mail (118)
        const userEmailTemplate = await Emails.findByPk(118);
        if (userEmailTemplate) {
          let userMsg = userEmailTemplate.message.toString("utf8");
          userMsg = userMsg
            .replace(/{{ USER_NAME }}/g, userName)
            .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
            .replace(/{{ TICKET_SUBJECT }}/g, ticket.title)
            .replace(/{{ DATE_TIME }}/g, nowStr);
          await sendMail({
            to: ticket.email,
            subject: userEmailTemplate.subject || "Your Support Ticket Has Been Cancelled",
            message: userMsg,
          });
        }
        // Admin mail (119)
        const adminEmailTemplate = await Emails.findByPk(119);
        if (adminEmailTemplate) {
          let adminMsg = adminEmailTemplate.message.toString("utf8");
          adminMsg = adminMsg
            .replace(/{{ USER_NAME }}/g, userName)
            .replace(/{{ USER_EMAIL }}/g, ticket.email)
            .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
            .replace(/{{ TICKET_SUBJECT }}/g, ticket.title)
            .replace(/{{ DATE_TIME }}/g, nowStr);
          await sendMail({
            to: siteConfig['site_email'],
            subject: adminEmailTemplate.subject || "Admin Alert: Ticket Cancelled",
            message: adminMsg,
          });
        }
      }
    } catch (mailErr) {
      console.error('Status update mail error:', mailErr);
    }

    return res.json({
      message: 'Ticket status updated successfully',
      ticket,
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTicketsServerSide = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await Admin.findByPk(adminId, {
      include: [{ association: 'Roles' }]
    });

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      dateRange = '',
      startDate,
      endDate,
      title,
      status,
      priority,
      category,
    } = req.query;
    const validColumns = ['id', 'fname', 'lname', 'full_name', 'email', 'title', 'ticket_id', 'message',
      'priority', 'created_at', 'updated_at', 'category_name', 'user_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: TicketCategory, as: 'TicketCategory' }, 'name', sortDirection]];
    } else if (sortBy === 'user_name') {
      order = [[{ model: Users, as: 'Users' }, 'fname', sortDirection]];
    } else if (sortBy === 'full_name') {
      order = [[fn('concat', col('Tickets.fname'), ' ', col('Tickets.lname')), sortDirection]];
    } else if (sortBy === 'last_reply_date') {
      // Sort by last_reply_date literal
      order = [[Sequelize.literal(`(
        SELECT MAX(created_at) FROM ticket_replies AS TicketReplies WHERE TicketReplies.ticket_id = Tickets.tickets_id
      )`), sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = {};
    if (admin.Roles?.id !== 4) {
      if (admin.Roles?.ticket_category === 0) {
        // show all categories → do nothing
      } else if (
        admin.Roles?.ticket_category !== null &&
        admin.Roles?.ticket_category !== undefined
      ) {
        baseWhere.category = admin.Roles.ticket_category;
      } else {
        baseWhere.category = -1; // no tickets
      }
    }
    if (admin.Roles?.id !== 4) {
      baseWhere[Op.and] = [{
        [Op.or]: [
          { acceptance_status: 0 },
          {
            [Op.and]: [
              { acceptance_status: 1 },
              { accepted_by: admin.id }
            ]
          },
          {
            [Op.and]: [
              { acceptance_status: 2 },
              { accepted_by: { [Op.ne]: admin.id } }
            ]
          }
        ]
      }];
    }
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();
      if (range === 'today') {
        dateCondition = {
          [Op.gte]: today.toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'yesterday') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(),
          [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate(),
        };
      } else if (range === 'last7days') {
        dateCondition = {
          [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'last30days') {
        dateCondition = {
          [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'thismonth') {
        dateCondition = {
          [Op.gte]: moment().startOf('month').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'lastmonth') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate(),
        };
      } else if (range === 'customrange' && startDate && endDate) {
        dateCondition = {
          [Op.gte]: moment(startDate).startOf('day').toDate(),
          [Op.lte]: moment(endDate).endOf('day').toDate(),
        };
      } else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = {
          [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      }
    }
    if (dateCondition) {
      baseWhere.created_at = dateCondition;
    }
    if (status) {
      baseWhere.status = status;
    }
    if (priority) {
      baseWhere.priority = priority;
    }
    if (category && admin.Roles?.id === 4) {
      baseWhere.category = category;
    }
    if (title) {
      baseWhere.title = {
        [Op.like]: `%${title}%`
      };
    }
    if (search) {
      baseWhere[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
        { ticket_id: { [Op.like]: `%${search}%` } },
        { priority: { [Op.like]: `%${search}%` } },
        { '$TicketCategory.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Tickets.count({
      where: { ...baseWhere },
    });
    const { count: filteredRecords, rows } = await Tickets.findAndCountAll({
      where: baseWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: TicketCategory, attributes: ['name'], as: 'TicketCategory' },
        { model: Users, attributes: ['fname'], as: 'Users' },
        { model: Admin, attributes: ['id', 'name'], as: 'AcceptedByAdmin' },
      ],
      attributes: {
        include: [
          [
            // Subquery to get last reply date
            Sequelize.literal(`(
              SELECT MAX(created_at)
              FROM ticket_replies AS TicketReplies
              WHERE TicketReplies.ticket_id = Tickets.tickets_id
            )`),
            'last_reply_date'
          ]
        ]
      }
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      full_name: `${row.fname} ${row.lname}`,
      email: row.email,
      title: row.title,
      ticket_id: row.ticket_id,
      message: row.message,
      priority: row.priority,
      category: row.category,
      category_name: row.TicketCategory ? row.TicketCategory.name : null,
      user_id: row.user_id,
      user_name: row.Users ? row.Users.fname : null,
      attachment: row.attachment,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      accepted_by: row.accepted_by,
      accepted_by_name: row.AcceptedByAdmin ? row.AcceptedByAdmin.name : null,
      acceptance_status: row.acceptance_status,
      last_reply_date: row.getDataValue('last_reply_date')
    }));
    res.json({
      data: mappedRows,
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email, user_id, created_by } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Step 1: Generate 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000);

    // Step 2: Find or create ticket
    let ticket = await Tickets.findOne({
      where: {
        email,
        is_complete: 0,
      },
    });

    if (ticket) {
      ticket.otp = generatedOtp;
      ticket.added_by = 'front';
      if (user_id) {
        ticket.created_by = created_by;
        ticket.user_id = user_id; // ✅ update user_id
      }
      await ticket.save();
    } else {
      ticket = await Tickets.create({
        email,
        otp: generatedOtp,
        added_by: 'front',
        user_id: user_id || 0,
        created_by: created_by || "Guest",
      });
    }

    // Step 3: Get Email Template (ID: 86)
    const emailTemplate = await Emails.findByPk(87);
    if (!emailTemplate) {
      return res.status(404).json({ message: "Email template not found" });
    }

    const msgStr = emailTemplate.message.toString("utf8");
    const userMessage = msgStr
      .replace("{{ OTP }}", generatedOtp)
      .replace("{{ USER_FNAME }}", "Guest");

    // Step 4: Send OTP via Mail
    await sendMail({ to: email, subject: emailTemplate.subject || "Your OTP Code", message: userMessage });

    return res.json({
      success: 1,
      message: "OTP sent successfully",
      ticket_id: ticket.id,
      email: ticket.email,
    });
  } catch (err) {
    console.error("OTP Error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const ticket = await Tickets.findOne({
      where: {
        email,
        is_complete: 0,
      }
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    ticket.is_verify = 1;
    await ticket.save();

    return res.json({
      success: 2,
      message: "OTP verified successfully",
      ticket_id: ticket.id,
      email: ticket.email,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};

exports.createstoreTicket = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Attachment upload failed', details: err.message });
    }
    try {
      const { first_name, last_name, phone, title, message, email, ticket_id, user_id, added_by } = req.body;

      const ticket = await Tickets.findByPk(ticket_id);
      if (!ticket || ticket.email !== email) {
        return res.status(403).json({ message: "Email not verified" });
      }
      const ticketId = `SOURCE-INDIA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
      const crypto = require("crypto");
      const token = crypto.createHash("md5").update(req.body.title).digest("hex");
      // Save final ticket info
      ticket.fname = first_name;
      ticket.lname = last_name;
      ticket.phone = phone;
      ticket.title = title;
      ticket.message = message;
      ticket.ticket_id = ticketId;
      ticket.attachment = req.file ? req.file.filename : null;
      ticket.status = 0;
      ticket.priority = 'high';
      ticket.category = 1;
      ticket.is_complete = 1;
      ticket.created_by = added_by || "Guest";
      ticket.token = token;
      await ticket.save();

      const mediaType = req.file?.mimetype?.startsWith("image/") ? "image" : "file";

      await TicketReply.create({
        user_id: user_id || 0, // since guest
        ticket_id: ticket_id,
        reply: message,
        added_by: added_by || "Guest",
        attachment: req.file ? req.file.filename : null,
        media_type: mediaType,
      });

      // --- Send User Email (template 110) ---
      try {
        const userEmailTemplate = await Emails.findByPk(110);

        if (userEmailTemplate) {
          let userMsg = userEmailTemplate.message.toString("utf8");
          userMsg = userMsg
            .replace(/{{ USER_NAME }}/g, `${first_name} ${last_name}`)
            .replace(/{{ TICKET_ID }}/g, ticketId)
            .replace(/{{ TICKET_SUBJECT }}/g, title)
            .replace(/{{ DATE_TIME }}/g, new Date().toLocaleString());
          await sendMail({
            to: email,
            subject: userEmailTemplate.subject || "Support Ticket Created",
            message: userMsg,
          });
        }
      } catch (mailErr) {
        console.error("User mail send error:", mailErr);
      }
      // --- Send Admin Email (template 111) ---
      const siteConfig = await getSiteConfig();
      try {
        const adminEmailTemplate = await Emails.findByPk(111);
        if (adminEmailTemplate) {
          let adminMsg = adminEmailTemplate.message.toString("utf8");
          adminMsg = adminMsg
            .replace(/{{ USER_NAME }}/g, `${first_name} ${last_name}`)
            .replace(/{{ USER_EMAIL }}/g, email)
            .replace(/{{ TICKET_ID }}/g, ticketId)
            .replace(/{{ TICKET_SUBJECT }}/g, title)
            .replace(/{{ TICKET_MESSAGE }}/g, message)
            .replace(/{{ DATE_TIME }}/g, new Date().toLocaleString());
          const adminEmail = siteConfig['site_email'];
          await sendMail({
            to: adminEmail,
            subject: adminEmailTemplate.subject || "New Support Ticket Submitted",
            message: adminMsg,
          });
        }
      } catch (mailErr) {
        console.error("Admin mail send error:", mailErr);
      }

      res.json({
        success: true,
        message: "Ticket created successfully",
        ticket_id: ticketId, // Return the new ticket_id
        token: token, // Return the generated token
      });
    } catch (err) {
      console.error("Ticket Create Error:", err);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });
};

exports.trackTicket = async (req, res) => {
  upload(req, res, async (err) => {

    try {

      const { email, ticketId } = req.body;

      const ticket = await Tickets.findOne({
        where: {
          ticket_id: ticketId,
          email: email.toLowerCase(), // Case-insensitive email match
        },
      });
      if (!ticket || ticket.email !== email) {
        return res.status(403).json({ message: "Please enter valid credentials." });
      }

      const token = ticket.token;

      res.json({
        success: true,
        message: "Ticket successfully",
        ticket_id: ticketId,
        token: token,
      });

    } catch (err) {
      console.error("Ticket Create Error:", err);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });
};

exports.getTicketByNumber = async (req, res) => {
  try {
    const ticketId = req.params.number; // e.g. SOURCE-INDIA-20251019-395
    const { token } = req.query;

    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    const getTicket = await Tickets.findOne({
      where: { ticket_id: ticketId },
      include: [
        { model: TicketCategory, attributes: ['name'], as: 'TicketCategory' },
      ],
    });

    const trackUrl = `/support-ticket/track/${ticketId}`;

    if (!token) {
      return res.redirect(trackUrl);
    }

    if (getTicket && getTicket.token !== token) {
      return res.redirect(trackUrl);
    }

    if (!getTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const allTicket = await Tickets.findAll({
      where: { is_complete: 1, email: getTicket.email },
    });

    const ticketReply = await TicketReply.findAll({
      where: { ticket_id: getTicket.id },
      order: [['id', 'DESC']],
    });


    const ticketLastReply = ticketReply.length > 0 ? ticketReply[0] : null;


    return res.json({
      ticket: getTicket,
      relatedTickets: allTicket,
      replies: ticketReply,
      lastReply: ticketLastReply,
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    return res.status(500).json({ error: err.message });
  }
};


exports.ticketReplystore = async (req, res) => {
  try {
    upload(req, res, async () => {
      const { id, message, type, added_by, user_id } = req.body;
      const attachment = req.file;

      // Validate required fields
      if (!id || !message) {
        return res.status(400).json({ message: 'Ticket ID and message are required' });
      }

      // Find the ticket
      const ticket = await Tickets.findOne({ where: { ticket_id: id } });
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Handle attachment
      let attachmentUrl = '';
      if (attachment) {
        const allowedExtensions = ['pdf', 'xls', 'xlsx', 'csv', 'jpg', 'png', 'jpeg', 'txt', 'svg'];
        const ext = attachment.originalname.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return res.status(400).json({ message: 'Invalid file extension' });
        }
        attachmentUrl = `/uploads/${attachment.filename}`;
      }

      // Create a new reply
      const reply = await TicketReply.create({
        ticket_id: ticket.id,
        reply: message,
        attachment: attachment ? attachment.filename : null,
        media_type: type || 'reply',
        added_by: added_by || 'Guest',
        user_id: user_id || 0,
      });

      // Update ticket status if needed
      if (ticket.status === 0) {
        ticket.status = 1;
        await ticket.save();
      }

      // Fetch all replies for the ticket
      const ticketReply = await TicketReply.findAll({
        where: { ticket_id: ticket.id },
        order: [['id', 'DESC']],
      });

      // Prepare response data
      const detailArr = {
        user_name: ticket.fname + ' ' + ticket.lname,
        message,
        ticket_id: ticket.ticket_id,
        added_by: reply.added_by,
        attachmentUrl: attachmentUrl || '',
        ticketReply,
      };

      // --- Send Reply Emails (admin vs user) ---
      const isAdminReply = (reply.added_by && reply.added_by.toLowerCase() === 'admin');
      const nowStr = new Date().toLocaleString();
      const userName = ticket.fname + ' ' + ticket.lname;
      const siteConfig = await getSiteConfig();

      if (isAdminReply) {
        // User mail (114)
        try {
          const userEmailTemplate = await Emails.findByPk(114);
          if (userEmailTemplate) {
            let userMsg = userEmailTemplate.message.toString("utf8");
            userMsg = userMsg
              .replace(/{{ USER_NAME }}/g, userName)
              .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
              .replace(/{{ SUPPORT_REPLY }}/g, message)
              .replace(/{{ DATE_TIME }}/g, nowStr);
            await sendMail({
              to: ticket.email,
              subject: userEmailTemplate.subject || "Support Team Replied to Your Ticket",
              message: userMsg,
            });
          }
        } catch (mailErr) {
          console.error("User reply mail send error:", mailErr);
        }
        // Admin mail (115)
        try {
          const adminEmailTemplate = await Emails.findByPk(115);
          if (adminEmailTemplate) {
            let adminMsg = adminEmailTemplate.message.toString("utf8");
            adminMsg = adminMsg
              .replace(/{{ USER_NAME }}/g, userName)
              .replace(/{{ USER_EMAIL }}/g, ticket.email)
              .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
              .replace(/{{ SUPPORT_REPLY }}/g, message)
              .replace(/{{ DATE_TIME }}/g, nowStr);
            await sendMail({
              to: siteConfig['site_email'],
              subject: adminEmailTemplate.subject || "Support Team Ticket Reply",
              message: adminMsg,
            });
          }
        } catch (mailErr) {
          console.error("Admin reply mail send error:", mailErr);
        }
      } else {
        // User mail (113)
        try {
          const userEmailTemplate = await Emails.findByPk(113);
          if (userEmailTemplate) {
            let userMsg = userEmailTemplate.message.toString("utf8");
            userMsg = userMsg
              .replace(/{{ USER_NAME }}/g, userName)
              .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
              .replace(/{{ USER_REPLY }}/g, message)
              .replace(/{{ DATE_TIME }}/g, nowStr);
            await sendMail({
              to: ticket.email,
              subject: userEmailTemplate.subject || "Support Ticket Reply Received",
              message: userMsg,
            });
          }
        } catch (mailErr) {
          console.error("User reply mail send error:", mailErr);
        }
        // Admin mail (112)
        try {
          const adminEmailTemplate = await Emails.findByPk(112);
          if (adminEmailTemplate) {
            let adminMsg = adminEmailTemplate.message.toString("utf8");
            adminMsg = adminMsg
              .replace(/{{ USER_NAME }}/g, userName)
              .replace(/{{ USER_EMAIL }}/g, ticket.email)
              .replace(/{{ TICKET_ID }}/g, ticket.ticket_id)
              .replace(/{{ USER_REPLY }}/g, message)
              .replace(/{{ DATE_TIME }}/g, nowStr);
            await sendMail({
              to: siteConfig['site_email'],
              subject: adminEmailTemplate.subject || "Support Ticket Reply Alert",
              message: adminMsg,
            });
          }
        } catch (mailErr) {
          console.error("Admin reply mail send error:", mailErr);
        }
      }

      // Generate view HTML
      const view = attachmentUrl
        ? `<div><h6>${reply.added_by}</h6><span>${new Date().toLocaleString()}</span><p>${message}</p><a href="${attachmentUrl}">View Attachment</a></div>`
        : `<div><h6>${reply.added_by}</h6><span>${new Date().toLocaleString()}</span><p>${message}</p></div>`;

      return res.json({
        success: 1,
        view,
        message: 'Support ticket reply sent successfully.',
      });
    });
  } catch (error) {
    console.error('Error storing ticket reply:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getTicketsCount = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await Admin.findByPk(adminId, {
      include: [{ association: 'Roles' }]
    });

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const baseWhere = {};

    // Apply category restriction (same as getAllTicketsServerSide)
    if (admin.Roles?.id !== 4) {
      if (admin.Roles?.ticket_category === 0) {
        // show all categories → do nothing
      } else if (
        admin.Roles?.ticket_category !== null &&
        admin.Roles?.ticket_category !== undefined
      ) {
        baseWhere.category = admin.Roles.ticket_category;
      } else {
        baseWhere.category = -1; // no tickets
      }
    }

    // Apply acceptance logic (same as getAllTicketsServerSide)
    if (admin.Roles?.id !== 4) {
      baseWhere[Op.and] = [{
        [Op.or]: [
          { acceptance_status: 0 },
          {
            [Op.and]: [
              { acceptance_status: 1 },
              { accepted_by: admin.id }
            ]
          },
          {
            [Op.and]: [
              { acceptance_status: 2 },
              { accepted_by: { [Op.ne]: admin.id } }
            ]
          }
        ]
      }];
    }

    const total = await Tickets.count({
      where: baseWhere
    });

    res.json({ total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getNextTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    // Find the current ticket by ticket_id
    const current = await Tickets.findOne({
      where: { ticket_id }
    });

    if (!current) return res.json({ next: null });

    // Find the next ticket with smaller id (descending order)
    const next = await Tickets.findOne({
      where: {
        id: { [Op.lt]: current.id }
      },
      order: [['id', 'DESC']],
      attributes: ['ticket_id', 'token']  // Select ticket_id and token fields
    });

    res.json({
      next: next ? next.ticket_id : null,
      token: next ? next.token : null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNextTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid id parameter' });
    }

    // 1. Get logged-in admin
    const adminId = req.user.id;

    const admin = await Admin.findByPk(adminId, {
      include: [{ association: 'Roles' }]
    });

    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2. Build baseWhere like getAllTicketsServerSide
    const baseWhere = {};

    if (admin.Roles?.id !== 4) {
      if (admin.Roles?.ticket_category === 0) {
        // all categories → no filter
      } else if (
        admin.Roles?.ticket_category !== null &&
        admin.Roles?.ticket_category !== undefined
      ) {
        baseWhere.category = admin.Roles.ticket_category;
      } else {
        baseWhere.category = -1; // no tickets
      }
    }

    // 3. Find current ticket WITH role condition
    const current = await Tickets.findOne({
      where: {
        id: ticketId,
        ...baseWhere
      }
    });

    if (!current) {
      return res.json({ next: null, token: null, id: null });
    }

    // 4. Find next ticket (previous ID) WITH SAME condition
    const next = await Tickets.findOne({
      where: {
        id: { [Op.lt]: current.id },
        ...baseWhere
      },
      order: [['id', 'DESC']],
      attributes: ['ticket_id', 'token', 'id']
    });

    res.json({
      next: next ? next.ticket_id : null,
      token: next ? next.token : null,
      id: next ? next.id : null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.acceptDeclineTicket = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { action } = req.body; // "accept" or "decline"

    const admin = await Admin.findByPk(adminId, {
      include: [{ association: 'Roles' }]
    });

    if (!admin || admin.Roles?.id === 4) {
      return res.status(403).json({ message: 'Invalid action' });
    }

    const ticket = await Tickets.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Category check
    if (Number(ticket.category) !== Number(admin.Roles.ticket_category)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Already processed
    if (ticket.acceptance_status !== 0) {
      return res.status(400).json({ message: 'Ticket already processed' });
    }

    if (action === 'accept') {
      ticket.acceptance_status = 1;
      ticket.accepted_by = adminId;
      ticket.status = 1;
    }

    if (action === 'decline') {
      ticket.acceptance_status = 2;
      ticket.accepted_by = adminId;
    }

    await ticket.save();

    res.json({
      success: true,
      message: `Ticket ${action}ed successfully`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};