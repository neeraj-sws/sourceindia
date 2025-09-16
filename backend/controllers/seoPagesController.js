const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const SeoPages = require('../models/SeoPages');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');
const upload = getMulterUpload('seo').single('meta_image');

function createSlug(inputString) {
  return inputString.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

exports.createSeoPages = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { title, meta_title, meta_description } = req.body;
      if (!title || !meta_title || !meta_description || !req.file) {
        return res.status(400).json({ message: 'All fields (title, meta_title, meta_description, file) are required' });
      }
      const meta_image = req.file ? `upload/seo/${req.file.filename}` : null;
      const slug = createSlug(title);
      const seoPages = await SeoPages.create({
        title,
        slug,
        meta_title,
        meta_description,
        meta_image,
      });
      res.status(201).json({ message: 'Seo Pages created', seoPages });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllSeoPages = async (req, res) => {
  try {
    const seoPages = await SeoPages.findAll({ order: [['id', 'ASC']] });
    res.json(seoPages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSeoPagesById = async (req, res) => {
  try {
    const seoPages = await SeoPages.findByPk(req.params.id);
    if (!seoPages) {
      return res.status(404).json({ message: 'Seo Pages not found' });
    }
    res.json(seoPages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSeoPages = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { title, meta_title, meta_description } = req.body;
      if (!title || !meta_title || !meta_description) {
        return res.status(400).json({ message: 'All fields (title, meta_title, meta_description) are required' });
      }
      const seoPages = await SeoPages.findByPk(req.params.id);
      if (!seoPages) {
        return res.status(404).json({ message: 'Seo Pagess not found' });
      }
      const uploadDir = path.resolve('upload/home_banners');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      seoPages.title = title;
      seoPages.slug = createSlug(title);
      seoPages.meta_title = meta_title;
      seoPages.meta_description = meta_description;
      if (req.file) { 
      if (seoPages.meta_image) {
        const oldPath = path.join(__dirname, '../', seoPages.meta_image);
        fs.unlink(oldPath, (err) => {
          console.log(oldPath)
          if (err) console.error('Failed to delete old meta_image:', err);
        });
      }
      seoPages.meta_image = `upload/seo/${req.file.filename}`; }
      seoPages.updated_at = new Date();
      await seoPages.save();
      res.json({ message: 'Seo Pages updated', seoPages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteSeoPages = async (req, res) => {
  try {
    const seoPages = await SeoPages.findByPk(req.params.id);
    if (!seoPages) return res.status(404).json({ message: 'Seo Pages not found' });
    if (seoPages.meta_image) {
      const filePath = path.join(__dirname, '../', seoPages.meta_image);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete file:', err);
        }
      });
    }
    await seoPages.destroy();
    res.json({ message: 'Seo Pages deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSeoPagesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'meta_title', 'meta_description', 'created_at', 'updated_at'];
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
        { title: { [Op.like]: `%${search}%` } },
        { meta_title: { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await SeoPages.count();
    const { count: filteredRecords, rows } = await SeoPages.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      meta_image: row.meta_image,
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