const { Op } = require('sequelize');
const moment = require('moment');
const Faq = require('../models/Faq');
const FaqCategory = require('../models/FaqCategory');

exports.createFaq = async (req, res) => {
  try {
    const { title, description, category, status } = req.body;
    /*if (!title || !description || !category || !status) {
        return res.status(400).json({ message: 'All fields (title, description, category, status) are required' });
      }*/
    const faq = await Faq.create({ title, description, category, status });
    res.status(201).json({ message: 'Faq created', faq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.findAll({ order: [['id', 'ASC']],
      include: [
        {
          model: FaqCategory,
          as: 'FaqCategory',
          attributes: ['id', 'name'],
        },
      ],
    });
    const modifiedFaq = faqs.map(faq => {
      const faqData = faq.toJSON();
      faqData.getStatus = faqData.status === 1 ? 'Active' : 'Inactive';
      faqData.category_name = faqData.FaqCategory?.name || null;
      delete faqData.FaqCategory;
      return faqData;
    });
    res.json(modifiedFaq);
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

exports.deleteSelectedFaq = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const faq = await Faq.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (faq.length === 0) {
      return res.status(404).json({ message: 'No knowledge center found with the given IDs.' });
    }
    await Faq.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${faq.length} knowledge center marked as deleted.` });
  } catch (err) {
    console.error(err);
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

exports.updateFaqDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'Knowledge Center not found' });
    faq.is_delete = is_delete;
    await faq.save();
    res.json({ message: 'Knowledge Center is removed', faq });
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
      dateRange = '',
      startDate,
      endDate,
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { '$FaqCategory.name$': { [Op.like]: `%${search}%` } }
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
    const totalRecords = await Faq.count({ where });
    const { count: filteredRecords, rows } = await Faq.findAndCountAll({
      where: searchWhere,
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

exports.getFaqCount = async (req, res) => {
  try {
    const total = await Faq.count({where: { is_delete: 0 }});
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};