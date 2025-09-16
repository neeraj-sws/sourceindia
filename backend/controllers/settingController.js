const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const SiteSettings = require('../models/SiteSettings');
const HomeSettings = require('../models/HomeSettings');
const Abouts = require('../models/Abouts');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.getSiteSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findAll();
    const formatted = {};
    let logoFileId = null;
    let faviconFileId = null;
    for (const setting of settings) {
      if (setting.meta_key === 'logo_file_id') {
        logoFileId = setting.meta_value;
        formatted.logo_file_id = logoFileId;
      } else if (setting.meta_key === 'favicon_file_id') {
        faviconFileId = setting.meta_value;
        formatted.favicon_file_id = faviconFileId;
      } else {
        formatted[setting.meta_key] = setting.meta_value;
      }
    }
    if (logoFileId) {
      const logoImage = await UploadImage.findByPk(logoFileId);
      if (logoImage) {
        formatted.logo_file = logoImage.file;
      }
    }
    if (faviconFileId) {
      const faviconImage = await UploadImage.findByPk(faviconFileId);
      if (faviconImage) {
        formatted.favicon_file = faviconImage.file;
      }
    }
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSiteSettings = async (req, res) => {
  const upload = getMulterUpload('siteSettings');
  upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'favicon_file', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const uploadDir = path.resolve('upload/siteSettings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const textSettingsToUpdate = req.body;
      const keys = Object.keys(textSettingsToUpdate).filter(
        key => key !== 'logo_file' && key !== 'favicon_file'
      );
      if (keys.length) {
        const settings = await SiteSettings.findAll({
          where: { meta_key: keys }
        });
        const foundKeys = settings.map(setting => setting.meta_key);
        const missingKeys = keys.filter(key => !foundKeys.includes(key));
        if (missingKeys.length) {
          return res.status(404).json({
            message: `Settings not found for keys: ${missingKeys.join(', ')}`
          });
        }
        for (const setting of settings) {
          setting.meta_value = textSettingsToUpdate[setting.meta_key];
          await setting.save();
        }
      }
      if (req.files?.logo_file) {
        const file = req.files.logo_file[0];
        await handleSettingImageUpdate('logo_file_id', file, SiteSettings);
      }
      if (req.files?.favicon_file) {
        const file = req.files.favicon_file[0];
        await handleSettingImageUpdate('favicon_file_id', file, SiteSettings);
      }
      res.json({ message: 'Site settings updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getHomeSettings = async (req, res) => {
  try {
    const settings = await HomeSettings.findAll();
    const formatted = {};
    let aboutFileId = null;
    for (const setting of settings) {
      if (setting.meta_key === 'about_file_id') {
        aboutFileId = setting.meta_value;
        formatted.about_file_id = aboutFileId;
      } else {
        formatted[setting.meta_key] = setting.meta_value;
      }
    }
    if (aboutFileId) {
      const aboutImage = await UploadImage.findByPk(aboutFileId);
      if (aboutImage) {
        formatted.about_file = aboutImage.file;
      }
    }
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateHomeSettings = async (req, res) => {
  const upload = getMulterUpload('siteSettings');
  upload.fields([
    { name: 'about_file', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const uploadDir = path.resolve('upload/siteSettings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const textSettingsToUpdate = req.body;
      const keys = Object.keys(textSettingsToUpdate).filter(
        key => key !== 'about_file'
      );
      if (keys.length) {
        const settings = await HomeSettings.findAll({
          where: { meta_key: keys }
        });
        const foundKeys = settings.map(setting => setting.meta_key);
        const missingKeys = keys.filter(key => !foundKeys.includes(key));
        if (missingKeys.length) {
          return res.status(404).json({
            message: `Settings not found for keys: ${missingKeys.join(', ')}`
          });
        }
        for (const setting of settings) {
          setting.meta_value = textSettingsToUpdate[setting.meta_key];
          await setting.save();
        }
      }
      if (req.files?.about_file) {
        const file = req.files.about_file[0];
        await handleSettingImageUpdate('about_file_id', file, HomeSettings);
      }
      res.json({ message: 'Home settings updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAbouts = async (req, res) => {
  try {
    const settings = await Abouts.findAll();
    const formatted = {};
    let aboutFileId = null;
    let visionFileId = null;
    let missionFileId = null;
    let valueFileId = null;
    let visionIconId = null;
    let missionIconId = null;
    let valueIconId = null;
    let categoryFileId = null;
    for (const setting of settings) {
      if (setting.meta_key === 'about_file_id') {
        aboutFileId = setting.meta_value;
        formatted.about_file_id = aboutFileId;
      } else if (setting.meta_key === 'vision_file_id') {
        visionFileId = setting.meta_value;
        formatted.vision_file_id = visionFileId;
      } else if (setting.meta_key === 'mission_file_id') {
        missionFileId = setting.meta_value;
        formatted.mission_file_id = missionFileId;
      } else if (setting.meta_key === 'value_file_id') {
        valueFileId = setting.meta_value;
        formatted.value_file_id = valueFileId;
      }  else if (setting.meta_key === 'vision_icon_id') {
        visionIconId = setting.meta_value;
        formatted.vision_icon_id = visionIconId;
      } else if (setting.meta_key === 'mission_icon_id') {
        missionIconId = setting.meta_value;
        formatted.mission_icon_id = missionIconId;
      } else if (setting.meta_key === 'value_icon_id') {
        valueIconId = setting.meta_value;
        formatted.value_icon_id = valueIconId;
      }  else if (setting.meta_key === 'category_file_id') {
        categoryFileId = setting.meta_value;
        formatted.category_file_id = categoryFileId;
      } else {
        formatted[setting.meta_key] = setting.meta_value;
      }
    }
    if (aboutFileId) {
      const aboutImage = await UploadImage.findByPk(aboutFileId);
      if (aboutImage) {
        formatted.about_file = aboutImage.file;
      }
    }
    if (visionFileId) {
      const visionImage = await UploadImage.findByPk(visionFileId);
      if (visionImage) {
        formatted.vision_file = visionImage.file;
      }
    }
    if (missionFileId) {
      const missionImage = await UploadImage.findByPk(missionFileId);
      if (missionImage) {
        formatted.mission_file = missionImage.file;
      }
    }
    if (valueFileId) {
      const valueImage = await UploadImage.findByPk(valueFileId);
      if (valueImage) {
        formatted.value_file = valueImage.file;
      }
    }
    if (visionIconId) {
      const visionIcon = await UploadImage.findByPk(visionIconId);
      if (visionIcon) {
        formatted.vision_icon = visionIcon.file;
      }
    }
    if (missionIconId) {
      const missionIcon = await UploadImage.findByPk(missionIconId);
      if (missionIcon) {
        formatted.mission_icon = missionIcon.file;
      }
    }
    if (valueIconId) {
      const valueIcon = await UploadImage.findByPk(valueIconId);
      if (valueIcon) {
        formatted.value_icon = valueIcon.file;
      }
    }
    if (categoryFileId) {
      const categoryImage = await UploadImage.findByPk(categoryFileId);
      if (categoryImage) {
        formatted.category_file = categoryImage.file;
      }
    }
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAbouts = async (req, res) => {
  const upload = getMulterUpload('siteSettings');
  upload.fields([
    { name: 'about_file', maxCount: 1 },
    { name: 'vision_file', maxCount: 1 },
    { name: 'mission_file', maxCount: 1 },
    { name: 'value_file', maxCount: 1 },
    { name: 'vision_icon', maxCount: 1 },
    { name: 'mission_icon', maxCount: 1 },
    { name: 'value_icon', maxCount: 1 },
    { name: 'category_file', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const uploadDir = path.resolve('upload/siteSettings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const textSettingsToUpdate = req.body;
      const keys = Object.keys(textSettingsToUpdate).filter(
        key => key !== 'about_file' && key !== 'vision_file' && key !== 'mission_file' && key !== 'value_file'
         && key !== 'vision_icon' && key !== 'mission_icon' && key !== 'value_icon' && key !== 'category_file'
      );
      if (keys.length) {
        const settings = await Abouts.findAll({
          where: { meta_key: keys }
        });
        const foundKeys = settings.map(setting => setting.meta_key);
        const missingKeys = keys.filter(key => !foundKeys.includes(key));
        if (missingKeys.length) {
          return res.status(404).json({
            message: `Settings not found for keys: ${missingKeys.join(', ')}`
          });
        }
        for (const setting of settings) {
          setting.meta_value = textSettingsToUpdate[setting.meta_key];
          await setting.save();
        }
      }
      if (req.files?.about_file) {
        const file = req.files.about_file[0];
        await handleSettingImageUpdate('about_file_id', file, Abouts);
      }
      if (req.files?.vision_file) {
        const file = req.files.vision_file[0];
        await handleSettingImageUpdate('vision_file_id', file, Abouts);
      }
      if (req.files?.mission_file) {
        const file = req.files.mission_file[0];
        await handleSettingImageUpdate('mission_file_id', file, Abouts);
      }
      if (req.files?.value_file) {
        const file = req.files.value_file[0];
        await handleSettingImageUpdate('value_file_id', file, Abouts);
      }
      if (req.files?.vision_icon) {
        const file = req.files.vision_icon[0];
        await handleSettingImageUpdate('vision_icon_id', file, Abouts);
      }
      if (req.files?.mission_icon) {
        const file = req.files.mission_icon[0];
        await handleSettingImageUpdate('mission_icon_id', file, Abouts);
      }
      if (req.files?.value_icon) {
        const file = req.files.value_icon[0];
        await handleSettingImageUpdate('value_icon_id', file, Abouts);
      }
      if (req.files?.category_file) {
        const file = req.files.category_file[0];
        await handleSettingImageUpdate('category_file_id', file, Abouts);
      }
      res.json({ message: 'Site settings updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

async function handleSettingImageUpdate(metaKey, file, table) {
  const setting = await table.findOne({ where: { meta_key: metaKey } });
  if (!setting) throw new Error(`Setting not found for key: ${metaKey}`);
  const existingFileId = setting.meta_value;
  if (existingFileId) {
    const existingImage = await UploadImage.findByPk(existingFileId);
    if (existingImage) {
      const oldImagePath = path.resolve(existingImage.file);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      existingImage.file = `upload/siteSettings/${file.filename}`;
      existingImage.updated_at = new Date();
      await existingImage.save();
      return;
    }
  }
  const newImage = await UploadImage.create({
    file: `upload/siteSettings/${file.filename}`
  });
  setting.meta_value = newImage.id.toString();
  setting.updated_at = new Date();
  await setting.save();
}
