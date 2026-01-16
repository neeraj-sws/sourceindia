const { Op } = require('sequelize');
const validator = require('validator');
const FaqCategory = require('../models/FaqCategory');

exports.createFaqCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    /*if (!name || !status) {
        return res.status(400).json({ message: 'All fields (name, status) are required' });
      }*/
    const faqCategory = await FaqCategory.create({ name, status });
    res.status(201).json({ message: 'Faq Category created', faqCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaqCategories = async (req, res) => {
  try {
    const faqCategory = await FaqCategory.findAll({ order: [['id', 'ASC']] });
    res.json(faqCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFaqCategoryById = async (req, res) => {
  try {
    const faqCategory = await FaqCategory.findByPk(req.params.id);
    if (!faqCategory) return res.status(404).json({ message: 'Faq Category not found' });
    res.json(faqCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFaqCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const faqCategory = await FaqCategory.findByPk(req.params.id);
    if (!faqCategory) return res.status(404).json({ message: 'Faq Category not found' });

    faqCategory.name = name;
    faqCategory.status = status;
    faqCategory.updated_at = new Date();
    await faqCategory.save();

    res.json({ message: 'Faq Category updated', faqCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFaqCategory = async (req, res) => {
  try {
    const faqCategory = await FaqCategory.findByPk(req.params.id);
    if (!faqCategory) return res.status(404).json({ message: 'Faq Category not found' });

    await faqCategory.destroy();
    res.json({ message: 'Faq Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFaqCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const faqCategory = await FaqCategory.findByPk(req.params.id);
    if (!faqCategory) return res.status(404).json({ message: 'Faq Category not found' });

    faqCategory.status = status;
    await faqCategory.save();

    res.json({ message: 'Status updated', faqCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaqCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at'];
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
        { name: { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await FaqCategory.count();
    const { count: filteredRecords, rows } = await FaqCategory.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
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