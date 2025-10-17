const { Op } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');
const Products = require('../models/Products');

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
    const subCategories = await SubCategories.findAll({ order: [['id', 'ASC']],
      include: [
        {
          model: Categories,
          as: 'Categories',
          attributes: ['id', 'name'],
        },
      ],
    });
    const modifiedSubCategories = subCategories.map(sub_categories => {
      const subCategoriesData = sub_categories.toJSON();
      subCategoriesData.getStatus = subCategoriesData.status === 1 ? 'Active' : 'Inactive';
      subCategoriesData.category_name = subCategoriesData.Categories?.name || null;
      delete subCategoriesData.Categories;
      return subCategoriesData;
    });
    res.json(modifiedSubCategories);
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

exports.getSubCategoriesByCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'categories array is required and cannot be empty' });
    }

    // Fetch subcategories with category info
    const subCategories = await SubCategories.findAll({
      where: {
        category: {
          [Op.in]: categories,
        },
        is_delete: 0,
        status: 1
      },
      order: [['id', 'ASC']],
      include: [
        {
          model: Categories,
          as: 'Categories',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Fetch product counts grouped by sub_category
    const productCounts = await Products.findAll({
      attributes: ['sub_category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { is_delete: 0, is_approve: 1, status: 1 },
      group: ['sub_category'],
      raw: true,
    });

    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.sub_category] = parseInt(item.count);
    });

    // Modify subcategories to add status text, category name, and product count
    const modifiedSubCategories = subCategories.map(sub_categories => {
      const subCategoriesData = sub_categories.toJSON();
      subCategoriesData.getStatus = subCategoriesData.status === 1 ? 'Active' : 'Inactive';
      subCategoriesData.category_name = subCategoriesData.Categories?.name || null;
      subCategoriesData.product_count = countMap[subCategoriesData.id] || 0;
      delete subCategoriesData.Categories;
      return subCategoriesData;
    });

    res.json(modifiedSubCategories);
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

exports.deleteSelectedSubCategories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const subCategories = await SubCategories.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (subCategories.length === 0) {
      return res.status(404).json({ message: 'No sub categories found with the given IDs.' });
    }
    await SubCategories.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${subCategories.length} sub categories marked as deleted.` });
  } catch (err) {
    console.error(err);
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

exports.updateSubCategoriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const subCategories = await SubCategories.findByPk(req.params.id);
    if (!subCategories) return res.status(404).json({ message: 'Sub Categories not found' });
    subCategories.is_delete = is_delete;
    await subCategories.save();
    res.json({ message: 'Sub Categories is removed', subCategories });
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
      dateRange = '',
      startDate,
      endDate,
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Categories.name$': { [Op.like]: `%${search}%` } }
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
    const totalRecords = await SubCategories.count({ where });
    const { count: filteredRecords, rows } = await SubCategories.findAndCountAll({
      where: searchWhere,
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