const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const Categories = require('../models/Categories');
const UploadImage = require('../models/UploadImage');
const Products = require('../models/Products');
const CompanyInfo = require('../models/CompanyInfo');
const getMulterUpload = require('../utils/upload');

exports.createCategories = async (req, res) => {
  const upload = getMulterUpload('category');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, top_category, status } = req.body;
      /*if (!name || !top_category || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, top_category, status, file) are required' });
      }*/
      const uploadImage = await UploadImage.create({
        file: `upload/category/${req.file.filename}`,
      });
      const categories = await Categories.create({
        name,
        top_category,
        status,
        cat_file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Categories created', categories });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllCategories = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const isDeleted = req.query.is_delete;
    const status = req.query.status;

    const whereCondition = {};
    if (typeof isDeleted !== 'undefined') {
      whereCondition.is_delete = parseInt(isDeleted);
    }
    if (typeof status !== 'undefined') {
      whereCondition.status = parseInt(status);
    }

    const categories = await Categories.findAll({
      order: [['id', 'ASC']], // ✅ fixed
      include: [
        {
          model: UploadImage,
          attributes: ['file'],
        },
      ],
      where: whereCondition,
      ...(limit && { limit }),
    });

    // product count per category
    const productCounts = await Products.findAll({
      attributes: ['category', [fn('COUNT', col('product_id')), 'count']],
      where: { is_delete: 0, is_approve: 1, status: 1 },
      group: ['category'],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.category] = parseInt(item.count);
    });

    // company count per category (simplified for now)
    const companyCounts = await CompanyInfo.findAll({
      attributes: [
        [fn('COUNT', col('company_id')), 'count'],
        'category_sell'
      ],
      where: { is_delete: 0 },
      group: ['category_sell'],
      raw: true,
    });

    const companyCountMap = {};
    companyCounts.forEach(item => {
      const csv = item.category_sell || '';
      const count = parseInt(item.count) || 0;
      csv.split(',').forEach(catIdStr => {
        const catId = parseInt(catIdStr);
        if (!isNaN(catId)) {
          companyCountMap[catId] = (companyCountMap[catId] || 0) + count;
        }
      });
    });

    const modifiedCategories = categories.map(category => {
      const cd = category.toJSON();
      const { UploadImage, ...rest } = cd;
      return {
        ...rest,
        file_name: UploadImage?.file || null,
        product_count: productCountMap[category.id] || 0, // ✅ fixed
        company_count: companyCountMap[category.id] || 0, // ✅ fixed
      };
    });

    res.json(modifiedCategories);
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriesById = async (req, res) => {
  try {
    const categories = await Categories.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!categories) {
      return res.status(404).json({ message: 'Categories not found' });
    }
    const response = {
      ...categories.toJSON(),
      file_name: categories.UploadImage ? categories.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriesCount = async (req, res) => {
  try {
    const total = await Categories.count({ where: { is_delete: 0 } });
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategories = async (req, res) => {
  const upload = getMulterUpload('category');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, top_category, status } = req.body;
      /*if (!name || !top_category || !status) {
        return res.status(400).json({ message: 'All fields (name, top_category, status) are required' });
      }*/
      const categories = await Categories.findByPk(req.params.id);
      if (!categories) {
        return res.status(404).json({ message: 'Categories not found' });
      }
      const uploadDir = path.resolve('upload/category');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const cat_file_id = categories.cat_file_id;
      if (req.file) {
        if (cat_file_id) {
          const existingImage = await UploadImage.findByPk(cat_file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/category/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/category/${req.file.filename}`,
            });
            categories.cat_file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/category/${req.file.filename}`,
          });
          categories.cat_file_id = newImage.id;
        }
      }
      categories.name = name;
      categories.top_category = top_category;
      categories.status = status;
      categories.updated_at = new Date();
      await categories.save();
      res.json({ message: 'Categories updated', categories });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteCategories = async (req, res) => {
  try {
    const categories = await Categories.findByPk(req.params.id);
    if (!categories) return res.status(404).json({ message: 'Categories not found' });

    if (categories.cat_file_id) {
      const uploadImage = await UploadImage.findByPk(categories.cat_file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await categories.destroy();
    res.json({ message: 'Categories deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedCategories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const categories = await Categories.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found with the given IDs.' });
    }
    await Categories.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${categories.length} categories marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const categories = await Categories.findByPk(req.params.id);
    if (!categories) return res.status(404).json({ message: 'Categories not found' });
    categories.status = status;
    await categories.save();
    res.json({ message: 'Status updated', categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesTopCategory = async (req, res) => {
  try {
    const { top_category } = req.body;
    if (top_category !== 0 && top_category !== 1) {
      return res.status(400).json({ message: 'Invalid category status. Use 1 (Active) or 0 (Deactive).' });
    }
    const categories = await Categories.findByPk(req.params.id);
    if (!categories) return res.status(404).json({ message: 'Categories not found' });
    categories.top_category = top_category;
    await categories.save();
    res.json({ message: 'Category status updated', categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const categories = await Categories.findByPk(req.params.id);
    if (!categories) return res.status(404).json({ message: 'Categories not found' });
    categories.is_delete = is_delete;
    await categories.save();
    res.json({ message: 'Categories is removed', categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategoriesServerSide = async (req, res) => {
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
    const validColumns = ['id', 'name', 'top_category', 'created_at', 'updated_at', 'product_count'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'product_count') {
      order = [[literal('product_count'), sortDirection]];
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
    const totalRecords = await Categories.count({ where });
    const { count: filteredRecords, rows } = await Categories.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      attributes: {
        include: [
          [literal(`(SELECT COUNT(*) FROM products WHERE products.category = Categories.id AND products.is_delete = 0)`), 'product_count']
        ]
      },
      include: [
        {
          model: UploadImage,
          attributes: ['file']
        }
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      top_category: row.top_category,
      cat_file_id: row.cat_file_id,
      file_name: row.UploadImage ? row.UploadImage.file : null,
      status: row.status,
      is_delete: row.is_delete,
      product_count: row.get('product_count') || 0,
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