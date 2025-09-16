const { Op } = require('sequelize');
const SubSubCategories = require('../models/SubSubCategories');
const InterestCategories = require('../models/InterestCategories');
const InterestSubCategories = require('../models/InterestSubCategories');

exports.createSubSubCategories = async (req, res) => {
  try {
    const { name, category, sub_category, status } = req.body;
    if (!name || !category || !sub_category || !status) {
        return res.status(400).json({ message: 'All fields (name, category, sub_category, status) are required' });
      }
    const subSubCategories = await SubSubCategories.create({ name, category, sub_category, status });
    res.status(201).json({ message: 'Sub Sub Categories created', subSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubSubCategories = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategories.findAll({ order: [['id', 'ASC']] });
    res.json(subSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubSubCategoriesById = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategories.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Sub Sub Categories not found' });
    res.json(subSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubSubCategories = async (req, res) => {
  try {
    const { name, category, sub_category, status } = req.body;
    const subSubCategories = await SubSubCategories.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Sub Sub Categories not found' });

    subSubCategories.name = name;
    subSubCategories.category = category;
    subSubCategories.sub_category = sub_category;
    subSubCategories.status = status;
    subSubCategories.updated_at = new Date();
    await subSubCategories.save();

    res.json({ message: 'Sub Sub Categories updated', subSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubSubCategories = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategories.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Sub Sub Categories not found' });

    await subSubCategories.destroy();
    res.json({ message: 'Sub Sub Categories deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubSubCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const subSubCategories = await SubSubCategories.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Sub Sub Categories not found' });

    subSubCategories.status = status;
    await subSubCategories.save();

    res.json({ message: 'Status updated', subSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubSubCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'description', 'created_at', 'updated_at', 'category_name', 'sub_category_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: InterestCategories, as: 'InterestCategories' }, 'name', sortDirection]];
    } else if (sortBy === 'sub_category_name') {
      order = [[{ model: InterestSubCategories, as: 'InterestSubCategories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$InterestCategories.name$': { [Op.like]: `%${search}%` } },
        { '$InterestSubCategories.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await SubSubCategories.count();
    const { count: filteredRecords, rows } = await SubSubCategories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: InterestCategories, attributes: ['name'], as: 'InterestCategories' },
        { model: InterestSubCategories, attributes: ['name'], as: 'InterestSubCategories' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      category_name: row.InterestCategories ? row.InterestCategories.name : null,
      sub_category: row.sub_category,
      sub_category_name: row.InterestSubCategories ? row.InterestSubCategories.name : null,
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