const { Op } = require('sequelize');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');

exports.createSubCategories = async (req, res) => {
  try {
    const { name, category, status } = req.body;
    if (!name || !category || !status) {
        return res.status(400).json({ message: 'All fields (name, category, status) are required' });
      }
    const subCategories = await SubCategories.create({ name, category, status });
    res.status(201).json({ message: 'Sub Category created', subCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategories.findAll({ order: [['id', 'ASC']] });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoriesById = async (req, res) => {
  try {
    const subCategories = await SubCategories.findByPk(req.params.id);
    if (!subCategories) return res.status(404).json({ message: 'Sub Category not found' });
    res.json(subCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }
    const interestSubCategories = await SubCategories.findAll({
      where: { category },
      order: [['id', 'ASC']],
    });
    res.json(interestSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoriesCount = async (req, res) => {
  try {
    const total = await SubCategories.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubCategories = async (req, res) => {
  try {
    const { name, category, status } = req.body;
    const subCategories = await SubCategories.findByPk(req.params.id);
    if (!subCategories) return res.status(404).json({ message: 'Sub Category not found' });

    subCategories.name = name;
    subCategories.category = category;
    subCategories.status = status;
    subCategories.updated_at = new Date();
    await subCategories.save();

    res.json({ message: 'Sub Category updated', subCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategories.findByPk(req.params.id);
    if (!subCategories) return res.status(404).json({ message: 'Sub Category not found' });

    await subCategories.destroy();
    res.json({ message: 'Sub Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const subCategories = await SubCategories.findByPk(req.params.id);
    if (!subCategories) return res.status(404).json({ message: 'Sub Category not found' });

    subCategories.status = status;
    await subCategories.save();

    res.json({ message: 'Status updated', subCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at', 'category_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Categories.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await SubCategories.count();
    const { count: filteredRecords, rows } = await SubCategories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      category_name: row.Categories ? row.Categories.name : null,
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