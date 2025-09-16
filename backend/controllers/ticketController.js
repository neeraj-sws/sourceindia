const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Tickets = require('../models/Tickets');
const TicketCategory = require('../models/TicketCategory');
const Users = require('../models/Users');
const getMulterUpload = require('../utils/upload');
const upload = getMulterUpload('tickets').single('attachment');
const moment = require('moment');

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
    res.json(tickets);
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
      tickets.attachment = req.file.filename; }
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