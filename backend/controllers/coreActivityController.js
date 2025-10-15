const { Op } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const CoreActivity = require('../models/CoreActivity');
const Color = require('../models/Color');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createCoreActivity = async (req, res) => {
  const upload = getMulterUpload('coreactivity');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, color, status } = req.body;
      let file_id = null;
      if (req.file) {
        const uploadImage = await UploadImage.create({
          file: `upload/coreactivity/${req.file.filename}`,
        });
        file_id = uploadImage.id;
      }
      const coreActivity = await CoreActivity.create({
        name,
        color,
        status,
        file_id
      });
      res.status(201).json({ message: 'Core activity created', coreActivity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllCoreActivities = async (req, res) => {
  try {
    const coreActivity = await CoreActivity.findAll({ order: [['id', 'ASC']] });
    const modifiedCoreActivity = coreActivity.map(core_activity => {
      const coreActivityData = core_activity.toJSON();
      coreActivityData.getStatus = coreActivityData.status === 1 ? 'Active' : 'Inactive';
      return coreActivityData;
    });
    res.json(modifiedCoreActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCoreActivityById = async (req, res) => {
  try {
    const coreActivity = await CoreActivity.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!coreActivity) {
      return res.status(404).json({ message: 'Core activity not found' });
    }
    const response = {
      ...coreActivity.toJSON(),
      file_name: coreActivity.UploadImage ? coreActivity.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCoreActivity = async (req, res) => {
  const upload = getMulterUpload('coreactivity');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, color, status } = req.body;
      if (!name || !color || !status) {
        return res.status(400).json({ message: 'All fields (name, color, status) are required' });
      }
      const coreActivity = await CoreActivity.findByPk(req.params.id);
      if (!coreActivity) {
        return res.status(404).json({ message: 'Core activity not found' });
      }
      const uploadDir = path.resolve('upload/coreactivity');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = coreActivity.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/coreactivity/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/coreactivity/${req.file.filename}`,
            });
            coreActivity.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/coreactivity/${req.file.filename}`,
          });
          coreActivity.file_id = newImage.id;
        }
      }
      coreActivity.name = name;
      coreActivity.color = color;
      coreActivity.status = status;
      coreActivity.updated_at = new Date();
      await coreActivity.save();
      res.json({ message: 'Core activity updated', coreActivity });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteCoreActivity = async (req, res) => {
  try {
    const coreActivity = await CoreActivity.findByPk(req.params.id);
    if (!coreActivity) return res.status(404).json({ message: 'Core activity not found' });

    if (coreActivity.file_id) {
      const uploadImage = await UploadImage.findByPk(coreActivity.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await coreActivity.destroy();
    res.json({ message: 'Core activity deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedCoreActivity = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const coreActivity = await CoreActivity.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (coreActivity.length === 0) {
      return res.status(404).json({ message: 'No core activity found with the given IDs.' });
    }
    await CoreActivity.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${coreActivity.length} core activity marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCoreActivityStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const coreActivity = await CoreActivity.findByPk(req.params.id);
    if (!coreActivity) return res.status(404).json({ message: 'Core activity not found' });
    coreActivity.status = status;
    await coreActivity.save();
    res.json({ message: 'Status updated', coreActivity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCoreActivityDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const coreActivity = await CoreActivity.findByPk(req.params.id);
    if (!coreActivity) return res.status(404).json({ message: 'Core activity not found' });
    coreActivity.is_delete = is_delete;
    await coreActivity.save();
    res.json({ message: 'Core activity is removed', coreActivity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllColors = async (req, res) => {
  try {
    const colors = await Color.findAll({ order: [['id', 'ASC']] });
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCoreActivitiesServerSide = async (req, res) => {
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Color.title$': { [Op.like]: `%${search}%` } }
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
    const totalRecords = await CoreActivity.count({ where });
    const { count: filteredRecords, rows } = await CoreActivity.findAndCountAll({
      where: searchWhere,
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