const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Testimonials = require('../models/Testimonials');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createTestimonials = async (req, res) => {
  const upload = getMulterUpload('testimonials');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, description, status } = req.body;
      if (!name || !description || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, description, status, file) are required' });
      }
      const uploadImage = await UploadImage.create({
        file: `upload/testimonials/${req.file.filename}`,
      });
      const testimonials = await Testimonials.create({
        name,
        description,
        status,
        file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Testimonials created', testimonials });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonials.findAll({ order: [['id', 'ASC']] });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTestimonialsById = async (req, res) => {
  try {
    const testimonials = await Testimonials.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!testimonials) {
      return res.status(404).json({ message: 'Testimonials not found' });
    }
    const response = {
      ...testimonials.toJSON(),
      file_name: testimonials.UploadImage ? testimonials.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateTestimonials = async (req, res) => {
  const upload = getMulterUpload('testimonials');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, description, status } = req.body;
      if (!name || !description || !status) {
        return res.status(400).json({ message: 'All fields (name, description, status) are required' });
      }
      const testimonials = await Testimonials.findByPk(req.params.id);
      if (!testimonials) {
        return res.status(404).json({ message: 'Testimonials not found' });
      }
      const uploadDir = path.resolve('upload/testimonials');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = testimonials.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/testimonials/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/testimonials/${req.file.filename}`,
            });
            testimonials.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/testimonials/${req.file.filename}`,
          });
          testimonials.file_id = newImage.id;
        }
      }
      testimonials.name = name;
      testimonials.description = description;
      testimonials.status = status;
      testimonials.updated_at = new Date();
      await testimonials.save();
      res.json({ message: 'Testimonials updated', testimonials });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonials.findByPk(req.params.id);
    if (!testimonials) return res.status(404).json({ message: 'Testimonials not found' });

    if (testimonials.file_id) {
      const uploadImage = await UploadImage.findByPk(testimonials.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await testimonials.destroy();
    res.json({ message: 'Testimonials deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateTestimonialsStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const testimonials = await Testimonials.findByPk(req.params.id);
    if (!testimonials) return res.status(404).json({ message: 'Testimonials not found' });
    testimonials.status = status;
    await testimonials.save();
    res.json({ message: 'Status updated', testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllTestimonialsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'description', 'created_at', 'updated_at'];
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
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Testimonials.count();
    const { count: filteredRecords, rows } = await Testimonials.findAndCountAll({
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
      description: row.description,
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