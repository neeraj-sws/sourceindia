const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Applications = require('../models/Applications');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createApplications = async (req, res) => {
  const upload = getMulterUpload('applications');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, top_category, status } = req.body;
      if (!name || !top_category || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, top_category, status, file) are required' });
      }
      const uploadImage = await UploadImage.create({
        file: `upload/applications/${req.file.filename}`,
      });
      const applications = await Applications.create({
        name,
        top_category,
        status,
        cat_file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Application created', applications });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Applications.findAll({ order: [['id', 'ASC']] });
    const modifiedApplications = applications.map(application => {
      const applicationsData = application.toJSON();
      applicationsData.getStatus = applicationsData.status === 1 ? 'Active' : 'Inactive';
      return applicationsData;
    });
    res.json(modifiedApplications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getApplicationsById = async (req, res) => {
  try {
    const applications = await Applications.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!applications) {
      return res.status(404).json({ message: 'Application not found' });
    }
    const response = {
      ...applications.toJSON(),
      file_name: applications.UploadImage ? applications.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplications = async (req, res) => {
  const upload = getMulterUpload('applications');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, top_category, status } = req.body;
      if (!name || !top_category || !status) {
        return res.status(400).json({ message: 'All fields (name, top_category, status) are required' });
      }
      const applications = await Applications.findByPk(req.params.id);
      if (!applications) {
        return res.status(404).json({ message: 'Applications not found' });
      }
      const uploadDir = path.resolve('upload/applications');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const cat_file_id = applications.cat_file_id;
      if (req.file) {
        if (cat_file_id) {
          const existingImage = await UploadImage.findByPk(cat_file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/applications/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/applications/${req.file.filename}`,
            });
            applications.cat_file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/applications/${req.file.filename}`,
          });
          applications.cat_file_id = newImage.id;
        }
      }
      applications.name = name;
      applications.top_category = top_category;
      applications.status = status;
      applications.updated_at = new Date();
      await applications.save();
      res.json({ message: 'Application updated', applications });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteApplications = async (req, res) => {
  try {
    const applications = await Applications.findByPk(req.params.id);
    if (!applications) return res.status(404).json({ message: 'Applications not found' });

    const fileId = applications.cat_file_id;
    await applications.destroy();
    if (fileId) {
      const uploadImage = await UploadImage.findByPk(fileId);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedApplications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const applications = await Applications.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found with the given IDs.' });
    }
    await Applications.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${applications.length} applications marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplicationsStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const applications = await Applications.findByPk(req.params.id);
    if (!applications) return res.status(404).json({ message: 'Applications not found' });
    applications.status = status;
    await applications.save();
    res.json({ message: 'Status updated', applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplicationsDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const applications = await Applications.findByPk(req.params.id);
    if (!applications) return res.status(404).json({ message: 'Applications not found' });
    applications.is_delete = is_delete;
    await applications.save();
    res.json({ message: 'Applications is removed', applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateApplicationsTopCategory = async (req, res) => {
  try {
    const { top_category } = req.body;
    if (top_category !== 0 && top_category !== 1) {
      return res.status(400).json({ message: 'Invalid category status. Use 1 (Active) or 0 (Deactive).' });
    }
    const applications = await Applications.findByPk(req.params.id);
    if (!applications) return res.status(404).json({ message: 'Applications not found' });
    applications.top_category = top_category;
    await applications.save();
    res.json({ message: 'Category status updated', applications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllApplicationsServerSide = async (req, res) => {
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
    const totalRecords = await Applications.count({ where });
    const { count: filteredRecords, rows } = await Applications.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: UploadImage, attributes: ['file'] },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM products AS p
              WHERE p.application = Applications.id
            )`),
            'product_count'
          ]
        ]
      }
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      top_category: row.top_category,
      cat_file_id: row.cat_file_id,
      file_name: row.UploadImage ? row.UploadImage.file : null,
      status: row.status,
      is_delete: row.is_delete,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product_count: row.getDataValue('product_count'),
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