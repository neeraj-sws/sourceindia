const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Categories = require('../models/Categories');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createCategories = async (req, res) => {
  const upload = getMulterUpload('category');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, top_category, status } = req.body;
      if (!name || !top_category || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, top_category, status, file) are required' });
      }
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
    const categories = await Categories.findAll({ order: [['id', 'ASC']] });
    res.json(categories);
  } catch (err) {
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
    const total = await Categories.count();
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
      if (!name || !top_category || !status) {
        return res.status(400).json({ message: 'All fields (name, top_category, status) are required' });
      }
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

exports.getAllCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'top_category', 'created_at', 'updated_at'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
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
      ];
    }
    const totalRecords = await Categories.count();
    const { count: filteredRecords, rows } = await Categories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: UploadImage, attributes: ['file'] },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      top_category: row.top_category,
      cat_file_id: row.cat_file_id,
      file_name: row.UploadImage ? row.UploadImage.file : null,
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