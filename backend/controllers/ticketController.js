const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Tickets = require('../models/Tickets');
const TicketCategory = require('../models/TicketCategory');
const TicketReply = require('../models/TicketReply');
const Emails = require('../models/Emails');
const Users = require('../models/Users');
const getMulterUpload = require('../utils/upload');
const { body, validationResult } = require('express-validator');
const upload = getMulterUpload('tickets').single('attachment');
const moment = require('moment');
const { getTransporter } = require('../helpers/mailHelper');
require('dotenv').config();

exports.createTickets = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Attachment upload failed', details: err.message });
    }
    try {
      const { user_id, title, message, priority, category, status } = req.body;
      const attachment = req.file ? req.file.filename : null;
      const dateStr = moment().format('YYYYMMDD');
      const randomNum = Math.floor(100 + Math.random() * 900);
      const ticket_id = `SOURCE-INDIA-${dateStr}-${randomNum}`;
      const ticket = await Tickets.create({ user_id, ticket_id, title, message, priority, category, status, attachment });
      res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (err) {
      console.error('Error creating ticket:', err);
      res.status(500).json({ error: err.message });
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
    const tickets = await Tickets.findByPk(req.params.id);
    if (!tickets) return res.status(404).json({ message: 'Ticket not found' });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTickets = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Attachment upload failed', details: err.message });
    }
    try {
      const { user_id, title, message, priority, category, status } = req.body;
      const tickets = await Tickets.findByPk(req.params.id);
      if (!tickets) return res.status(404).json({ message: 'Ticket not found' });
      tickets.user_id = user_id;
      tickets.title = title;
      tickets.message = message;
      tickets.priority = priority;
      tickets.category = category;
      tickets.status = status;
      if (req.file) {
        if (tickets.attachment) {
          const oldPath = path.join(__dirname, '../upload/tickets/', tickets.attachment);
          fs.unlink(oldPath, (err) => {
            console.log(oldPath)
            if (err) console.error('Failed to delete old attachment:', err);
          });
        }
        tickets.attachment = req.file.filename;
      }
      tickets.updated_at = new Date();
      await tickets.save();
      res.json({ message: 'Ticket updated', tickets });
    } catch (err) {
      res.status(500).json({ error: err.message });
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
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const tickets = await Tickets.findByPk(req.params.id);
    if (!tickets) return res.status(404).json({ message: 'Ticket not found' });
    tickets.status = status;
    await tickets.save();
    res.json({ message: 'Status updated', tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllTicketsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'ticket_id', 'message', 'priority', 'created_at', 'updated_at', 'category_name', 'user_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: TicketCategory, as: 'TicketCategory' }, 'name', sortDirection]];
    } else if (sortBy === 'user_name') {
      order = [[{ model: Users, as: 'Users' }, 'fname', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { ticket_id: { [Op.like]: `%${search}%` } },
        { priority: { [Op.like]: `%${search}%` } },
        { '$TicketCategory.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Tickets.count();
    const { count: filteredRecords, rows } = await Tickets.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: TicketCategory, attributes: ['name'], as: 'TicketCategory' },
        { model: Users, attributes: ['fname'], as: 'Users' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
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
    const { email } = req.body;

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
      await ticket.save();
    } else {
      ticket = await Tickets.create({
        email,
        otp: generatedOtp,
        added_by: 'front',
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
    const { transporter } = await getTransporter();
    await transporter.sendMail({
      from: `"Support Team" <info@sourceindia-electronics.com>`,
      to: email,
      subject: emailTemplate.subject || "Your OTP Code",
      html: userMessage,
    });

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

      const { first_name, last_name, phone, title, message, email, ticket_id } = req.body;

      const ticket = await Tickets.findByPk(ticket_id);
      if (!ticket || ticket.email !== email) {
        return res.status(403).json({ message: "Email not verified" });
      }
      const created_by = "Guest";
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
      ticket.created_by = created_by;
      ticket.token = token;
      await ticket.save();

      const mediaType = req.file?.mimetype?.startsWith("image/") ? "image" : "file";

      await TicketReply.create({
        user_id: 0, // since guest
        ticket_id: ticket_id,
        reply: message,
        added_by: created_by,
        attachment: req.file ? req.file.filename : null,
        media_type: mediaType,
      });


      res.json({ success: true, message: "Ticket created successfully" });
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
      const { id, message, type } = req.body;
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
        added_by: req.user ? req.user.role : 'Guest', // Adjust based on your auth setup
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



      const emailTemplate = await Emails.findByPk(84);
      if (!emailTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }

      const attUrl = attachmentUrl ? process.env.ROOT_URL + attachmentUrl : '';
      const msgStr = emailTemplate.message.toString("utf8");
      const userMessage = msgStr
        .replace("{{ MESSAGE }}", message)
        .replace("{{ USER_FNAME }}", ticket.fname)
        .replace("{{ ADDED_BY }}", reply.added_by)
        .replace("{{ TICKET_ID }}", ticket.ticket_id)
        .replace("{{ LINK }}", attUrl)
        .replace("{{ TITLE }}", ticket.title)
        .replace("{{ ATTACHMENT }}", attUrl)
        .replace("{{ USER_EMAIL }}", ticket.email)
        .replace("{{ USER_NAME }}", ticket.fname + ' ' + ticket.lname);

      // Step 4: Send OTP via Mail
      const { transporter, siteConfig } = await getTransporter();

      await transporter.sendMail({
        from: `"Support Team" <info@sourceindia-electronics.com>`,
        to: ticket.email,
        subject: emailTemplate.subject,
        html: userMessage,
      });

      const adminemailTemplate = await Emails.findByPk(85);
      if (!adminemailTemplate) {
        return res.status(404).json({ message: "Admin Email template not found" });
      }

      const adminmsgStr = adminemailTemplate.message.toString("utf8");
      const adminMessage = adminmsgStr
        .replace("{{ MESSAGE }}", message)
        .replace("{{ USER_FNAME }}", ticket.fname)
        .replace("{{ ADDED_BY }}", reply.added_by)
        .replace("{{ TICKET_ID }}", ticket.ticket_id)
        .replace("{{ LINK }}", attUrl)
        .replace("{{ TITLE }}", ticket.title)
        .replace("{{ ATTACHMENT }}", attUrl)
        .replace("{{ USER_EMAIL }}", ticket.email)
        .replace("{{ USER_NAME }}", ticket.fname + ' ' + ticket.lname);


      await transporter.sendMail({
        from: `"Support Team" <info@sourceindia-electronics.com>`,
        to: siteConfig['site_email'],
        subject: adminemailTemplate.subject,
        html: adminMessage,
      });


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