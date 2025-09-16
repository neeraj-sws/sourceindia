const { Op } = require('sequelize');
const validator = require('validator');
const TicketCategory = require('../models/TicketCategory');

exports.createTicketCategory = async (req, res) => {
  try {
    const { name, email, status } = req.body;
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const ticketCategory = await TicketCategory.create({ name, email, status });
    res.status(201).json({ message: 'Ticket Category created', ticketCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTicketCategories = async (req, res) => {
  try {
    const ticketCategory = await TicketCategory.findAll({ order: [['id', 'ASC']] });
    res.json(ticketCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTicketCategoryById = async (req, res) => {
  try {
    const ticketCategory = await TicketCategory.findByPk(req.params.id);
    if (!ticketCategory) return res.status(404).json({ message: 'Ticket Category not found' });
    res.json(ticketCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTicketCategory = async (req, res) => {
  try {
    const { name, email, status } = req.body;
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const ticketCategory = await TicketCategory.findByPk(req.params.id);
    if (!ticketCategory) return res.status(404).json({ message: 'Ticket Category not found' });

    ticketCategory.name = name;
    ticketCategory.email = email;
    ticketCategory.status = status;
    ticketCategory.updated_at = new Date();
    await ticketCategory.save();

    res.json({ message: 'Ticket Category updated', ticketCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTicketCategory = async (req, res) => {
  try {
    const ticketCategory = await TicketCategory.findByPk(req.params.id);
    if (!ticketCategory) return res.status(404).json({ message: 'Ticket Category not found' });

    await ticketCategory.destroy();
    res.json({ message: 'Ticket Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTicketCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const ticketCategory = await TicketCategory.findByPk(req.params.id);
    if (!ticketCategory) return res.status(404).json({ message: 'Ticket Category not found' });

    ticketCategory.status = status;
    await ticketCategory.save();

    res.json({ message: 'Status updated', ticketCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTicketCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'email', 'created_at', 'updated_at'];
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
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await TicketCategory.count();
    const { count: filteredRecords, rows } = await TicketCategory.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
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