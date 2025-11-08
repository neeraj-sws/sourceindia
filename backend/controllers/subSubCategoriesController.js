const { Op } = require('sequelize');
const moment = require('moment');
const SubSubCategories = require('../models/SubSubCategories');
const InterestCategories = require('../models/InterestCategories');
const InterestSubCategories = require('../models/InterestSubCategories');

exports.createSubSubCategories = async (req, res) => {
  try {
    const { name, category, sub_category, status } = req.body;
    /*if (!name || !category || !sub_category || !status) {
        return res.status(400).json({ message: 'All fields (name, category, sub_category, status) are required' });
      }*/
    const subSubCategories = await SubSubCategories.create({ name, category, sub_category, status });
    res.status(201).json({ message: 'Sub Sub Categories created', subSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubSubCategories = async (req, res) => {
  try {
    const subSubCategories = await SubSubCategories.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: InterestCategories,
          as: 'InterestCategories',
          attributes: ['id', 'name'],
        },
        {
          model: InterestSubCategories,
          as: 'InterestSubCategories',
          attributes: ['id', 'name'],
        }
      ],
    });
    const modifiedSubSubCategories = subSubCategories.map(sub_sub_categories => {
      const subSubCategoriesData = sub_sub_categories.toJSON();
      subSubCategoriesData.getStatus = subSubCategoriesData.status === 1 ? 'Active' : 'Inactive';
      subSubCategoriesData.category_name = subSubCategoriesData.InterestCategories?.name || null;
      subSubCategoriesData.sub_category_name = subSubCategoriesData.InterestSubCategories?.name || null;
      delete subSubCategoriesData.InterestCategories;
      delete subSubCategoriesData.InterestSubCategories;      
      return subSubCategoriesData;
    });
    res.json(modifiedSubSubCategories);
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

exports.deleteSelectedSubSubCategories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const subSubCategories = await SubSubCategories.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (subSubCategories.length === 0) {
      return res.status(404).json({ message: 'No sub sub categories found with the given IDs.' });
    }
    await SubSubCategories.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${subSubCategories.length} sub sub categories marked as deleted.` });
  } catch (err) {
    console.error(err);
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

exports.updateSubSubCategoriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const subSubCategories = await SubSubCategories.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Sub Sub Categories not found' });
    subSubCategories.is_delete = is_delete;
    await subSubCategories.save();
    res.json({ message: 'Sub Sub Categories is removed', subSubCategories });
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
      dateRange = '',
      startDate,
      endDate,
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$InterestCategories.name$': { [Op.like]: `%${search}%` } },
        { '$InterestSubCategories.name$': { [Op.like]: `%${search}%` } }
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
    const totalRecords = await SubSubCategories.count({ where });
    const { count: filteredRecords, rows } = await SubSubCategories.findAndCountAll({
      where: searchWhere,
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

exports.getSubSubCategoriesCount = async (req, res) => {
  try {
    const total = await SubSubCategories.count({where: { is_delete: 0 }});
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};