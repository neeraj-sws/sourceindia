const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const KnowledgeCenter = require('../models/KnowledgeCenter');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createKnowledgeCenter = async (req, res) => {
  const upload = getMulterUpload('knowledge_center');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, video_url, status } = req.body;
      if (!name || !video_url || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, video_url, status, file) are required' });
      }
      const uploadImage = await UploadImage.create({
        file: `upload/knowledge_center/${req.file.filename}`,
      });
      const knowledgeCenter = await KnowledgeCenter.create({
        name,
        video_url,
        status,
        file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Knowledge Center created', knowledgeCenter });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllKnowledgeCenter = async (req, res) => {
  try {
    const knowledgeCenter = await KnowledgeCenter.findAll({ order: [['id', 'ASC']] });
    res.json(knowledgeCenter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getKnowledgeCenterById = async (req, res) => {
  try {
    const knowledgeCenter = await KnowledgeCenter.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!knowledgeCenter) {
      return res.status(404).json({ message: 'Knowledge Center not found' });
    }
    const response = {
      ...knowledgeCenter.toJSON(),
      file_name: knowledgeCenter.UploadImage ? knowledgeCenter.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateKnowledgeCenter = async (req, res) => {
  const upload = getMulterUpload('knowledge_center');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, video_url, status } = req.body;
      if (!name || !video_url || !status) {
        return res.status(400).json({ message: 'All fields (name, video_url, status) are required' });
      }
      const knowledgeCenter = await KnowledgeCenter.findByPk(req.params.id);
      if (!knowledgeCenter) {
        return res.status(404).json({ message: 'Knowledge Center not found' });
      }
      const uploadDir = path.resolve('upload/knowledge_center');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = knowledgeCenter.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/knowledge_center/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/knowledge_center/${req.file.filename}`,
            });
            knowledgeCenter.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/knowledge_center/${req.file.filename}`,
          });
          knowledgeCenter.file_id = newImage.id;
        }
      }
      knowledgeCenter.name = name;
      knowledgeCenter.video_url = video_url;
      knowledgeCenter.status = status;
      knowledgeCenter.updated_at = new Date();
      await knowledgeCenter.save();
      res.json({ message: 'Knowledge Center updated', knowledgeCenter });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteKnowledgeCenter = async (req, res) => {
  try {
    const knowledgeCenter = await KnowledgeCenter.findByPk(req.params.id);
    if (!knowledgeCenter) return res.status(404).json({ message: 'Knowledge Center not found' });

    if (knowledgeCenter.file_id) {
      const uploadImage = await UploadImage.findByPk(knowledgeCenter.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await knowledgeCenter.destroy();
    res.json({ message: 'Knowledge Center deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateKnowledgeCenterStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const knowledgeCenter = await KnowledgeCenter.findByPk(req.params.id);
    if (!knowledgeCenter) return res.status(404).json({ message: 'Knowledge Center not found' });
    knowledgeCenter.status = status;
    await knowledgeCenter.save();
    res.json({ message: 'Status updated', knowledgeCenter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllKnowledgeCenterServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'video_url', 'created_at', 'updated_at'];
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
    const totalRecords = await KnowledgeCenter.count();
    const { count: filteredRecords, rows } = await KnowledgeCenter.findAndCountAll({
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
      video_url: row.video_url,
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