const { Op } = require('sequelize');
const validator = require('validator');
const Emails = require('../models/Emails');

exports.createEmails = async (req, res) => {
  try {
    const { title, email_for, subject, description, is_seller_direct, message, status } = req.body;
    if (!title || !email_for || !subject || !description || !is_seller_direct || !message || !status) {
      return res.status(400).json({ message: 'All fields (title, email_for, subject, description, is_seller_direct, message, status) are required' });
    }
    const emails = await Emails.create({ title, email_for, subject, description, is_seller_direct, message, status });
    res.status(201).json({ message: 'Email created', emails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllEmails = async (req, res) => {
  try {
    const emails = await Emails.findAll({ order: [['id', 'ASC']] });
    const modifiedEmails = emails.map(email => {
      const emailsData = email.toJSON();
      emailsData.getStatus = emailsData.status === 1 ? 'Active' : 'Inactive';
      return emailsData;
    });
    res.json(modifiedEmails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmailsById = async (req, res) => {
  try {
    const emails = await Emails.findByPk(req.params.id);
    if (!emails) return res.status(404).json({ message: 'Email not found' });
    const response = {
      ...emails.toJSON(),
      message: emails.message?.toString('utf8') || null
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmails = async (req, res) => {
  try {
    const { title, email_for, subject, description, is_seller_direct, message, status } = req.body;
    const emails = await Emails.findByPk(req.params.id);
    if (!emails) return res.status(404).json({ message: 'Email not found' });
    emails.title = title;
    emails.email_for = email_for;
    emails.subject = subject;
    emails.description = description;
    emails.is_seller_direct = is_seller_direct;
    emails.message = message;
    emails.status = status;
    emails.updated_at = new Date();
    await emails.save();

    res.json({ message: 'Email updated', emails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEmails = async (req, res) => {
  try {
    const emails = await Emails.findByPk(req.params.id);
    if (!emails) return res.status(404).json({ message: 'Email not found' });
    await emails.destroy();
    res.json({ message: 'Email deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllEmailsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      emailFor = ''
    } = req.query;
    const validColumns = ['id', 'title', 'email_for', 'subject', 'description', 'is_seller_direct', 
      'message', 'status', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      if (search.toLowerCase() === 'active') {
        where.status = 1;
      } else if (search.toLowerCase() === 'inactive') {
        where.status = 0;
      } else {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { email_for: { [Op.like]: `%${search}%` } },
          { subject: { [Op.like]: `%${search}%` } },
        ];
      }
    }
    if (emailFor) {
      where.email_for = {
        [Op.like]: `%${emailFor}%`
      };
    }
    const totalRecords = await Emails.count();
    const { count: filteredRecords, rows } = await Emails.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      email_for: row.email_for,
      subject: row.subject,
      description: row.description,
      is_seller_direct: row.is_seller_direct,
      message: row.message?.toString('utf8') || null,
      status: row.status === 1 ? 'Active' : 'Inactive',  // Mapping status
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    if (sortBy === 'status') {
      mappedRows.sort((a, b) => {
        if (a.status === 'Active' && b.status === 'Inactive') return sortDirection === 'ASC' ? -1 : 1;
        if (a.status === 'Inactive' && b.status === 'Active') return sortDirection === 'ASC' ? 1 : -1;
        return 0;
      });
    }
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
