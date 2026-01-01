const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const InterestCategories = require('../models/InterestCategories');
const Color = require('../models/Color');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createInterestCategories = async (req, res) => {
  const upload = getMulterUpload('interest_category');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, color, status } = req.body;
      /*if (!name || !color || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, color, status, file) are required' });
      }*/
      const uploadImage = await UploadImage.create({
        file: `upload/interest_category/${req.file.filename}`,
      });
      const interestCategory = await InterestCategories.create({
        name,
        color,
        status,
        file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Interest Category created', interestCategory });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllInterestCategories = async (req, res) => {
  try {
    const interestCategory = await InterestCategories.findAll({ order: [['id', 'ASC']] });
    res.json(interestCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInterestCategoriesById = async (req, res) => {
  try {
    const interestCategory = await InterestCategories.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!interestCategory) {
      return res.status(404).json({ message: 'Interest Category not found' });
    }
    const response = {
      ...interestCategory.toJSON(),
      file_name: interestCategory.UploadImage ? interestCategory.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateInterestCategories = async (req, res) => {
  const upload = getMulterUpload('interest_category');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, color, status } = req.body;
      /*if (!name || !color || !status) {
        return res.status(400).json({ message: 'All fields (name, color, status) are required' });
      }*/
      const interestCategory = await InterestCategories.findByPk(req.params.id);
      if (!interestCategory) {
        return res.status(404).json({ message: 'Interest Category not found' });
      }
      const uploadDir = path.resolve('upload/interest_category');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = interestCategory.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/interest_category/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/interest_category/${req.file.filename}`,
            });
            interestCategory.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/interest_category/${req.file.filename}`,
          });
          interestCategory.file_id = newImage.id;
        }
      }
      interestCategory.name = name;
      interestCategory.color = color;
      interestCategory.status = status;
      interestCategory.updated_at = new Date();
      await interestCategory.save();
      res.json({ message: 'Interest Category updated', interestCategory });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteInterestCategories = async (req, res) => {
  try {
    const interestCategory = await InterestCategories.findByPk(req.params.id);
    if (!interestCategory) return res.status(404).json({ message: 'Interest Category not found' });

    if (interestCategory.file_id && interestCategory.file_id !== 0) {
      const uploadImage = await UploadImage.findByPk(interestCategory.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await interestCategory.destroy();
    res.json({ message: 'Interest Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateInterestCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const interestCategory = await InterestCategories.findByPk(req.params.id);
    if (!interestCategory) return res.status(404).json({ message: 'Interest Category not found' });
    interestCategory.status = status;
    await interestCategory.save();
    res.json({ message: 'Status updated', interestCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllInterestCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at', 'color_name'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'color_name') {
      order = [[{ model: Color, as: 'Color' }, 'title', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Color.title$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await InterestCategories.count();
    const { count: filteredRecords, rows } = await InterestCategories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Color, attributes: ['title'], as: 'Color' },
        { model: UploadImage, attributes: ['file'] },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      color_name: row.Color ? row.Color.title : null,
      file_id: row.file_id,
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

exports.getInterestCategoriesCount = async (req, res) => {
  try {
    const total = await InterestCategories.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};