const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const SiteSettings = require('../models/SiteSettings');
const HomeSettings = require('../models/HomeSettings');
const UploadImage = require('../models/UploadImage');
const FrontMenu = require('../models/FrontMenu');
const getMulterUpload = require('../utils/upload');

exports.getSiteSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findAll({
      attributes: ['id', 'meta_key', 'meta_value'], // add/remove fields as needed
    });
    const formatted = {};
    let logoFileId = null;
    let faviconFileId = null;
    const excludeKeys = [
      'smtp_password',
      'smtp_username',
      'smtp_server_address',
      'smtp_port',
      'smtp_from_address',
      'smtp_auto_reply',
      'sms_password',
      'sms_pid',
      // aur bhi jo nahi chahiye, yahan add karen
    ];
    for (const setting of settings) {
      if (excludeKeys.includes(setting.meta_key)) continue;
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
    /* ---------------- FRONT MENU ---------------- */
    const menus = await FrontMenu.findAll({
      attributes: ['id', 'name', 'type', 'position', 'parent_id', 'url'], // add/remove fields as needed
      order: [
        ['type', 'ASC'],
        ['position', 'ASC'],
      ],
      raw: true,
    });

    const menuMap = {};
    menus.forEach(menu => {
      menu.sub_menu = [];
      menuMap[menu.id] = menu;
    });

    const finalMenu = [];
    menus.forEach(menu => {
      if (menu.parent_id === 0) {
        finalMenu.push(menu);
      } else if (menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].sub_menu.push(menu);
      }
    });

    formatted.front_menu = finalMenu;

    /* ---------------- HOME SETTINGS ---------------- */
    const homeSettings = await HomeSettings.findAll();
    const homeFormatted = {};

    const imageKeyMap = {
      about_file_id: 'about_file',
      footer_logo_id: 'footer_logo',
      footer_img_1_id: 'footer_img_1',
      footer_img_2_id: 'footer_img_2'
    };

    const imageIds = {};

    for (const setting of homeSettings) {
      if (imageKeyMap[setting.meta_key]) {
        imageIds[setting.meta_key] = setting.meta_value;
        homeFormatted[setting.meta_key] = setting.meta_value;
      } else {
        homeFormatted[setting.meta_key] = setting.meta_value;
      }
    }

    for (const [metaKey, fileKey] of Object.entries(imageKeyMap)) {
      const fileId = imageIds[metaKey];
      if (fileId) {
        const image = await UploadImage.findByPk(fileId);
        if (image) {
          homeFormatted[fileKey] = image.file;
        }
      }
    }

    const allowedHomeKeys = [
      'footer_logo',
      'footer_heading',
      'footershort_description',
      'footer_img_1',
      'footer_img_2',
      'contactphone_1',
      'contactphone_2',
      'contactemail',
      'contact_map_url',
      'contactaddress',
      'facebook_url',
      'twitter_url',
      'linkedin_url',
      'youtube_url',
      'instagram_url'
    ];

    const filteredHomeSettings = {};

    allowedHomeKeys.forEach(key => {
      if (homeFormatted[key] !== undefined) {
        filteredHomeSettings[key] = homeFormatted[key];
      }
    });

    // ✅ Attach home settings
    formatted.home_settings = filteredHomeSettings;
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.getFrontSiteSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findAll();
    const formatted = {};
    let logoFileId = null;
    let faviconFileId = null;
    const excludeKeys = [
      'smtp_password',
      'smtp_username',
      'smtp_server_address',
      'smtp_port',
      'smtp_from_address',
      'smtp_auto_reply',
      'sms_password',
      'sms_pid',
      'site_email',
      'sms_dlt_template_id',
      'sms_route',
      'sms_url',
      'sms_username',
      'smtp_from_name',
      'smtp_tls',
      // aur bhi jo nahi chahiye, yahan add karen
    ];
    for (const setting of settings) {
      if (excludeKeys.includes(setting.meta_key)) continue;
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
        ;
        formatted.favicon_file = faviconImage.file;
      }
    }
    /* ---------------- FRONT MENU ---------------- */
    const menus = await FrontMenu.findAll({
      attributes: ['id', 'name', 'type', 'position', 'parent_id', 'link'], // add/remove fields as needed
      order: [
        ['type', 'ASC'],
        ['position', 'ASC'],
      ],
      raw: true,
    });

    const menuMap = {};
    menus.forEach(menu => {
      menu.sub_menu = [];
      menuMap[menu.id] = menu;
    });

    const finalMenu = [];
    menus.forEach(menu => {
      if (menu.parent_id === 0) {
        finalMenu.push(menu);
      } else if (menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].sub_menu.push(menu);
      }
    });

    formatted.front_menu = finalMenu;

    /* ---------------- HOME SETTINGS ---------------- */
    const homeSettings = await HomeSettings.findAll();
    const homeFormatted = {};

    const imageKeyMap = {
      about_file_id: 'about_file',
      footer_logo_id: 'footer_logo',
      footer_img_1_id: 'footer_img_1',
      footer_img_2_id: 'footer_img_2'
    };

    const imageIds = {};

    for (const setting of homeSettings) {
      if (imageKeyMap[setting.meta_key]) {
        imageIds[setting.meta_key] = setting.meta_value;
        homeFormatted[setting.meta_key] = setting.meta_value;
      } else {
        homeFormatted[setting.meta_key] = setting.meta_value;
      }
    }

    for (const [metaKey, fileKey] of Object.entries(imageKeyMap)) {
      const fileId = imageIds[metaKey];
      if (fileId) {
        const image = await UploadImage.findByPk(fileId);
        if (image) {
          homeFormatted[fileKey] = image.file;
        }
      }
    }

    const allowedHomeKeys = [
      'footer_logo',
      'footer_heading',
      'footershort_description',
      'footer_img_1',
      'footer_img_2',
      'contactphone_1',
      'contactphone_2',
      'contactemail',
      'contact_map_url',
      'contactaddress',
      'facebook_url',
      'twitter_url',
      'linkedin_url',
      'youtube_url',
      'instagram_url'
    ];

    const filteredHomeSettings = {};

    allowedHomeKeys.forEach(key => {
      if (homeFormatted[key] !== undefined) {
        filteredHomeSettings[key] = homeFormatted[key];
      }
    });

    // ✅ Attach home settings
    formatted.home_settings = filteredHomeSettings;
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
    const imageKeyMap = {
      about_file_id: 'about_file',
      footer_logo_id: 'footer_logo',
      footer_img_1_id: 'footer_img_1',
      footer_img_2_id: 'footer_img_2'
    };

    const imageIds = {};
    for (const setting of settings) {
      if (imageKeyMap[setting.meta_key]) {
        imageIds[setting.meta_key] = setting.meta_value;
        formatted[setting.meta_key] = setting.meta_value;
      } else {
        formatted[setting.meta_key] = setting.meta_value;
      }
    }
    for (const [metaKey, fileKey] of Object.entries(imageKeyMap)) {
      const fileId = imageIds[metaKey];
      if (fileId) {
        const image = await UploadImage.findByPk(fileId);
        if (image) {
          formatted[fileKey] = image.file;
        }
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
    { name: 'about_file', maxCount: 1 },
    { name: 'footer_logo', maxCount: 1 },
    { name: 'footer_img_1', maxCount: 1 },
    { name: 'footer_img_2', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const uploadDir = path.resolve('upload/siteSettings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const textSettingsToUpdate = req.body;
      const keys = Object.keys(textSettingsToUpdate).filter(
        key =>
          ![
            'about_file',
            'footer_logo',
            'footer_img_1',
            'footer_img_2'
          ].includes(key)
      );
      if (keys.length) {
        const settings = await HomeSettings.findAll({
          where: { meta_key: keys }
        });
        const foundKeys = settings.map(s => s.meta_key);
        const missingKeys = keys.filter(k => !foundKeys.includes(k));
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
      if (req.files?.about_file)
        await handleSettingImageUpdate('about_file_id', req.files.about_file[0], HomeSettings);

      if (req.files?.footer_logo)
        await handleSettingImageUpdate('footer_logo_id', req.files.footer_logo[0], HomeSettings);

      if (req.files?.footer_img_1)
        await handleSettingImageUpdate('footer_img_1_id', req.files.footer_img_1[0], HomeSettings);

      if (req.files?.footer_img_2)
        await handleSettingImageUpdate('footer_img_2_id', req.files.footer_img_2[0], HomeSettings);
      res.json({ message: 'Home settings updated successfully' });
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
