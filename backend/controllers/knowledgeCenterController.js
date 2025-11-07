const { Op } = require('sequelize');
const moment = require('moment');
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
    const modifiedKnowledgeCenter = knowledgeCenter.map(knowledge_center => {
      const knowledgeCenterData = knowledge_center.toJSON();
      knowledgeCenterData.getStatus = knowledgeCenterData.status === 1 ? 'Active' : 'Inactive';
      return knowledgeCenterData;
    });
    res.json(modifiedKnowledgeCenter);
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

exports.deleteSelectedKnowledgeCenter = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const knowledgeCenter = await KnowledgeCenter.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (knowledgeCenter.length === 0) {
      return res.status(404).json({ message: 'No knowledge center found with the given IDs.' });
    }
    await KnowledgeCenter.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${knowledgeCenter.length} knowledge center marked as deleted.` });
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

exports.updateKnowledgeCenterDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const knowledgeCenter = await KnowledgeCenter.findByPk(req.params.id);
    if (!knowledgeCenter) return res.status(404).json({ message: 'Knowledge Center not found' });
    knowledgeCenter.is_delete = is_delete;
    await knowledgeCenter.save();
    res.json({ message: 'Knowledge Center is removed', knowledgeCenter });
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
      dateRange = '',
      startDate,
      endDate,
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
    const totalRecords = await KnowledgeCenter.count({ where });
    const { count: filteredRecords, rows } = await KnowledgeCenter.findAndCountAll({
      where: searchWhere,
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

exports.getKnowledgeCenterCount = async (req, res) => {
  try {
    const total = await KnowledgeCenter.count({where: { is_delete: 0 }});
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};