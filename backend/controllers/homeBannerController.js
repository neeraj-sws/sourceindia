const { Op } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const HomeBanners = require('../models/HomeBanners');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createHomeBanners = async (req, res) => {
  const upload = getMulterUpload('home_banners');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { title, sub_title, description, button_text, button_url, status } = req.body;
      if (!status || !req.file) {
        return res.status(400).json({ message: 'All fields (title, sub_title, description, button_text, button_url, status, file) are required' });
      }
      const uploadImage = await UploadImage.create({
        file: `upload/home_banners/${req.file.filename}`,
      });
      const homeBanners = await HomeBanners.create({
        title,
        sub_title,
        description,
        button_text,
        button_url,
        status,
        file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Home Banner created', homeBanners });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllHomeBanners = async (req, res) => {
  try {
    const homeBanners = await HomeBanners.findAll({ 
      order: [['id', 'ASC']],
      include: [
        { model: UploadImage, attributes: ['file'] },
      ],
    });
    const modifiedHomeBanners = homeBanners.map(home_banner => {
      const homeBannersData = home_banner.toJSON();
      homeBannersData.file_name = homeBannersData.UploadImage?.file || null;
      homeBannersData.getStatus = homeBannersData.status === 1 ? 'Active' : 'Inactive';
      delete homeBannersData.UploadImage;
      return homeBannersData;
    });
    res.json(modifiedHomeBanners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHomeBannersById = async (req, res) => {
  try {
    const homeBanners = await HomeBanners.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!homeBanners) {
      return res.status(404).json({ message: 'Home Banner not found' });
    }
    const response = {
      ...homeBanners.toJSON(),
      file_name: homeBanners.UploadImage ? homeBanners.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateHomeBanners = async (req, res) => {
  const upload = getMulterUpload('home_banners');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { title, sub_title, description, button_text, button_url, status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'All fields (title, sub_title, description, button_text, button_url, status) are required' });
      }
      const homeBanners = await HomeBanners.findByPk(req.params.id);
      if (!homeBanners) {
        return res.status(404).json({ message: 'Home Banners not found' });
      }
      const uploadDir = path.resolve('upload/home_banners');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = homeBanners.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/home_banners/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/home_banners/${req.file.filename}`,
            });
            homeBanners.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/home_banners/${req.file.filename}`,
          });
          homeBanners.file_id = newImage.id;
        }
      }
      homeBanners.title = title;
      homeBanners.sub_title = sub_title;
      homeBanners.description = description;
      homeBanners.button_text = button_text;
      homeBanners.button_url = button_url;
      homeBanners.status = status;
      homeBanners.updated_at = new Date();
      await homeBanners.save();
      res.json({ message: 'Home Banner updated', homeBanners });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteHomeBanners = async (req, res) => {
  try {
    const homeBanners = await HomeBanners.findByPk(req.params.id);
    if (!homeBanners) return res.status(404).json({ message: 'Home Banners not found' });

    const fileId = homeBanners.file_id;
    await homeBanners.destroy();
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
    res.json({ message: 'Home Banner deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedHomeBanners = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const homeBanners = await HomeBanners.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (homeBanners.length === 0) {
      return res.status(404).json({ message: 'No Home Banner found with the given IDs.' });
    }
    await HomeBanners.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${homeBanners.length} Home Banner marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateHomeBannersStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const homeBanners = await HomeBanners.findByPk(req.params.id);
    if (!homeBanners) return res.status(404).json({ message: 'Home Banners not found' });
    homeBanners.status = status;
    await homeBanners.save();
    res.json({ message: 'Status updated', homeBanners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateHomeBannersDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const homeBanners = await HomeBanners.findByPk(req.params.id);
    if (!homeBanners) return res.status(404).json({ message: 'Home Banners not found' });
    homeBanners.is_delete = is_delete;
    await homeBanners.save();
    res.json({ message: 'Home Banners is removed', homeBanners });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllHomeBannersServerSide = async (req, res) => {
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
    const validColumns = ['id', 'title', 'sub_title', 'description', 'button_text', 'button_url', 'created_at', 'updated_at'];
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
        { title: { [Op.like]: `%${search}%` } },
        { button_text: { [Op.like]: `%${search}%` } },
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
    const totalRecords = await HomeBanners.count({ where });
    const { count: filteredRecords, rows } = await HomeBanners.findAndCountAll({
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
      title: row.title,
      sub_title: row.sub_title,
      description: row.description,
      button_text: row.button_text,
      button_url: row.button_url,
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