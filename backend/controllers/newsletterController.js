const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Newsletters = require('../models/Newsletters');
const UserCategory = require('../models/UserCategory');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');
const sequelize = require('../config/database');

exports.createNewsletters = async (req, res) => {
  const upload = getMulterUpload('newsletters');
  upload.array('files', 10)(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { 
        title, subject, user_type, description, ip_address, country, location
      } = req.body;
      if (!title || !subject || !user_type || !description || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'All fields (title, subject, user_type, description) are required' });
      }
      const uploadImages = await Promise.all(req.files.map(async (file) => {
        return await UploadImage.create({
          file: `upload/newsletters/${file.filename}`,
        });
      }));
      const fileIds = uploadImages.map(image => image.id).join(',');
      const newsletters = await Newsletters.create({
        title, 
        subject,
        user_type,
        description,
        attachment: fileIds,
        ip_address: ip_address || '',
        country: country || '',
        location: location || '',
      });
      res.status(201).json({ message: 'Newsletter created', newsletters });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletters.findAll({ order: [['id', 'ASC']],
    include: [
      {
        model: UserCategory,
        as: 'UserCategory',
        attributes: ['id', 'name'],
      },
    ], });
    const modifiedNewsletters = newsletters.map(activity => {
      const newslettersData = activity.toJSON();
      newslettersData.user_category_name = newslettersData.UserCategory?.name || null;
      delete newslettersData.UserCategory;
      return newslettersData;
    });
    res.json(modifiedNewsletters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewslettersById = async (req, res) => {
  try {
    const newsletters = await Newsletters.findByPk(req.params.id);
    if (!newsletters) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    const fileIds = newsletters.attachment ? newsletters.attachment.split(',') : [];
    const associatedImages = await UploadImage.findAll({
      where: {
        id: {
          [Op.in]: fileIds,
        },
      },
      attributes: ['id', 'file'],
    });
    const response = {
      ...newsletters.toJSON(),
      images: associatedImages.map(image => ({
        id: image.id,
        file: image.file,
      })),
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateNewsletters = async (req, res) => {
  try {
    const {
      title,
      subject,
      user_type,
      description,
    } = req.body;
    const newsletters = await Newsletters.findByPk(req.params.id);
    if (!newsletters) {
      return res.status(404).json({ message: "Newsletter not found" });
    }
    await newsletters.update({
      title,
      subject,
      user_type,
      description,
    });
    res.status(200).json({
      message: "Newsletter updated successfully",
      newsletters,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.appendNewslettersImages = async (req, res) => {
  const upload = getMulterUpload("newsletters");
  upload.array("files", 10)(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const newsletters = await Newsletters.findByPk(req.params.id);
      if (!newsletters) return res.status(404).json({ message: "Newsletter not found" });
      let fileIds = newsletters.attachment ? newsletters.attachment.split(",") : [];
      const newFileIds = await Promise.all(
        req.files.map(async (file) => {
          const newImage = await UploadImage.create({
            file: `upload/newsletters/${file.filename}`,
          });
          return newImage.id.toString();
        })
      );
      fileIds = [...fileIds, ...newFileIds];
      await newsletters.update({
        attachment: fileIds.join(","),
      });
      res.status(200).json({ message: "Images added successfully", newsletters });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.removeNewslettersImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const newsletters = await Newsletters.findByPk(id);
    if (!newsletters) {
      return res.status(404).json({ error: "Newsletter not found" });
    }
    let fileIds = newsletters.attachment ? newsletters.attachment.split(",") : [];
    if (!fileIds.includes(imageId.toString())) {
      return res.status(404).json({ error: "Image not found in this newsletters" });
    }
    fileIds = fileIds.filter(fid => fid !== imageId.toString());
    const imageToDelete = await UploadImage.findByPk(imageId);
    if (imageToDelete && imageToDelete.file) {
      const filePath = path.join(__dirname, `../${imageToDelete.file}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await imageToDelete.destroy();
    }
    await newsletters.update({
      attachment: fileIds.join(","),
    });
    res.json({ success: true, message: "Image removed successfully" });
  } catch (err) {
    console.error("Error removing image:", err);
    res.status(500).json({ error: "Failed to remove image" });
  }
};

exports.deleteNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletters.findByPk(req.params.id);
    if (!newsletters) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    if (newsletters.attachment) {
      const fileIds = newsletters.attachment.split(',');
      for (const fileId of fileIds) {
        const uploadImage = await UploadImage.findByPk(fileId);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await uploadImage.destroy();
        }
      }
    }
    await newsletters.destroy();
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUserCategory = async (req, res) => {
  try {
    const userCategory = await UserCategory.findAll({ order: [['id', 'ASC']] });
    res.json(userCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllNewslettersServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'title', 'created_at', 'updated_at', 'user_type_name'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'user_type_name') {
      order = [[{ model: UserCategory, as: 'UserCategory' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      baseWhere.is_delete = 1;
    }
    if (search) {
      baseWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { '$UserCategory.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Newsletters.count();
    const { count: filteredRecords, rows } = await Newsletters.findAndCountAll({
      where: { ...baseWhere },
      order,
      limit: limitValue,
      offset,
      include: [
        { model: UserCategory, attributes: ['name'], as: 'UserCategory' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      user_type: row.user_type,
      user_type_name: row.UserCategory ? row.UserCategory.name : null,
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
