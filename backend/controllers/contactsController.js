const Sequelize = require('sequelize');
const { Op, fn, col, where: SequelizeWhere } = Sequelize;
const moment = require('moment');
const Contacts = require('../models/Contacts');
const Emails = require('../models/Emails');
const nodemailer = require('nodemailer');
const { getTransporter } = require('../helpers/mailHelper');



exports.contactStore = async (req, res) => {
  try {
    const { fname, lname, email, subject, message } = req.body;

    // Validation
    if (!fname || !lname || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // 🗃️ Save contact to database
    const newContact = await Contacts.create({
      fname,
      lname,
      email,
      subject,
      message,
      is_delete: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // ✉️ Email configuration (SMTP)
   

    const adminEmailTemplateId = 61;
    const adminEmailData = await Emails.findByPk(adminEmailTemplateId);
    let adminMessage = "";
    if (adminEmailData.message) {
      // longblob / buffer ko string me convert karo
      const msgStr = adminEmailData.message.toString('utf8');
      adminMessage = msgStr
        .replace("{{ USER_FNAME }}", `${fname} ${lname}`)
        .replace("{{ EMAIL }}", email)
        .replace("{{ SUBJECT }}", subject)
        .replace("{{ MESSAGE }}", message);
    } else {
      adminMessage = `<p>New message from ${fname} ${lname}</p>`;
    }
 const { transporter, siteConfig } = await getTransporter();
    const adminMailOptions = {
      from: `"Contact Form" <${email}>`,
      to: siteConfig['site_email'],
      subject: adminEmailData.subject || `New Contact from ${fname} ${lname}`,
      html: adminMessage,
    };


    await transporter.sendMail(adminMailOptions);


    // 📧 Optional: Send confirmation email to user
    const userEmailTemplateId = 59;
    const userEmailData = await Emails.findByPk(userEmailTemplateId);

    let userMessage = "";
    if (userEmailData.message) {
      const usermsgStr = userEmailData.message.toString('utf8');
      userMessage = usermsgStr.replace("{{ USER_FNAME }}", `${fname} ${lname}`);
    } else {
      userMessage = `<p>Hi ${fname}, thank you for contacting us!</p>`;
    }

    const userMailOptions = {
      from: "support@elcina.com",
      to: email,
      subject: userEmailData.subject || "Thanks for contacting us!",
      html: userMessage,
    };


    await transporter.sendMail(userMailOptions);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
      contact: newContact,
    });

  } catch (err) {
    console.error("❌ contactStore Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
      error: err.message,
    });
  }
};

// ================================
// 🗃️ OTHER EXISTING CONTACT METHODS
// ================================




exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contacts.findAll({ order: [['id', 'ASC']] });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteContacts = async (req, res) => {
  try {
    const contacts = await Contacts.findByPk(req.params.id);
    if (!contacts) return res.status(404).json({ message: 'Contact not found' });
    await contacts.destroy();
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedContacts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const contacts = await Contacts.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (contacts.length === 0) {
      return res.status(404).json({ message: 'No contacts found with the given IDs.' });
    }
    await Contacts.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${contacts.length} contacts marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateContactsDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const contacts = await Contacts.findByPk(req.params.id);
    if (!contacts) return res.status(404).json({ message: 'Contacts not found' });
    contacts.is_delete = is_delete;
    await contacts.save();
    res.json({ message: 'Contacts is removed', contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllContactsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      dateRange = '',
      startDate,
      endDate,
    } = req.query;
    const validColumns = ['id', 'fname', 'lname', 'full_name', 'email', 'subject', 'message', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'full_name') {
      order = [[fn('concat', col('fname'), ' ', col('lname')), sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        SequelizeWhere(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
      ];
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
      searchWhere.created_at = dateCondition;
    }
    const totalRecords = await Contacts.count({ where });
    const { count: filteredRecords, rows } = await Contacts.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      full_name: `${row.fname} ${row.lname}`,
      email: row.email,
      subject: row.subject,
      message: row.message,
      is_delete: row.is_delete,
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

exports.getContactsCount = async (req, res) => {
  try {
    const total = await Contacts.count({where: { is_delete: 0 }});
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};