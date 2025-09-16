const { Op } = require('sequelize');
const Faq = require('../models/Faq');
const FaqCategory = require('../models/FaqCategory');

exports.createFaq = async (req, res) => {
  try {
    const { title, description, category, status } = req.body;
    if (!title || !description || !category || !status) {
        return res.status(400).json({ message: 'All fields (title, description, category, status) are required' });
      }
    const faq = await Faq.create({ title, description, category, status });
    res.status(201).json({ message: 'Faq created', faq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaqs = async (req, res) => {
  try {
    const faq = await Faq.findAll({ order: [['id', 'ASC']] });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'Faq not found' });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { title, description, category, status } = req.body;
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'Faq not found' });

    faq.title = title;
    faq.description = description;
    faq.category = category;
    faq.status = status;
    faq.updated_at = new Date();
    await faq.save();

    res.json({ message: 'Faq updated', faq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'Faq not found' });

    await faq.destroy();
    res.json({ message: 'Faq deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFaqStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'Faq not found' });

    faq.status = status;
    await faq.save();

    res.json({ message: 'Status updated', faq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaqsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'description', 'created_at', 'updated_at', 'category_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: FaqCategory, as: 'FaqCategory' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { '$FaqCategory.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Faq.count();
    const { count: filteredRecords, rows } = await Faq.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: FaqCategory, attributes: ['name'], as: 'FaqCategory' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      category_name: row.FaqCategory ? row.FaqCategory.name : null,
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