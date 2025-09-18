const Sequelize = require('sequelize');
const { Op, fn, col } = Sequelize;
const fs = require('fs');
const path = require('path');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const UploadImage = require('../models/UploadImage');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');
const getMulterUpload = require('../utils/upload');
const validator = require('validator');
const bcrypt = require('bcryptjs');

function createSlug(inputString) {
  return inputString.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

exports.createSeller = async (req, res) => {
  const upload = getMulterUpload();
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_logo', maxCount: 1 },
    { name: 'sample_file_id', maxCount: 1 },
    { name: 'company_sample_ppt_file', maxCount: 1 },
    { name: 'company_video', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const deleteUploadedFiles = () => {
      const files = [];
      if (req.files?.file) files.push(req.files.file[0].path);
      if (req.files?.company_logo) files.push(req.files.company_logo[0].path);
      if (req.files?.sample_file_id) files.push(req.files.sample_file_id[0].path);
      if (req.files?.company_sample_ppt_file) files.push(req.files.company_sample_ppt_file[0].path);
      if (req.files?.company_video) files.push(req.files.company_video[0].path);
      files.forEach(filePath => {
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file ${filePath}:`, err.message);
        });
      });
    };
    try {
      const {
        fname, lname, email, password, mobile, country, state, city, zipcode,
        address, status, is_trading, elcina_member, user_company, website, products,
        step, mode, real_password, remember_token, payment_status, is_email_verify, featured_company, is_approve,
        organization_name, user_type, core_activity, activity, category_sell, sub_category,
        company_website, company_location, is_star_seller, is_verified, role,
        company_meta_title, company_video_second, brief_company,
        organizations_product_description, designation
      } = req.body;
      if (!fname || !lname || !email || !password || !mobile || !country || !state || !city || !zipcode || !address) {
        deleteUploadedFiles();
        return res.status(400).json({ message: 'Missing required user fields.' });
      }
      if (!validator.isEmail(email)) {
        deleteUploadedFiles();
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (!req.files?.file || !req.files?.company_logo) {
        deleteUploadedFiles();
        return res.status(400).json({ message: 'All required files must be uploaded' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const profileImage = await UploadImage.create({ file: `upload/users/${req.files.file[0].filename}` });
      const companyLogoImage = await UploadImage.create({ file: `upload/users/${req.files.company_logo[0].filename}` });
      const companySampleFile = await UploadImage.create({ file: `upload/users/${req.files.sample_file_id[0].filename}` });
      const companyPptFile = await UploadImage.create({ file: `upload/users/${req.files.company_sample_ppt_file[0].filename}` });
      const companyVideoFile = await UploadImage.create({ file: `upload/users/video/${req.files.company_video[0].filename}` });
      const organization_slug = createSlug(user_company);
      const user = await Users.create({
        fname,
        lname,
        email,
        mobile,
        country,
        state,
        city,
        zipcode,
        address,
        products,
        status: status || 1,
        is_trading: is_trading || 0,
        is_approve: is_approve || 1,
        elcina_member: elcina_member || 2,
        user_company,
        website,
        step: step || 0,
        mode: mode || 0,
        password: hashedPassword,
        real_password: real_password || '',
        remember_token: remember_token || '',
        payment_status: payment_status || 0,
        is_email_verify: is_email_verify || 0,
        featured_company: featured_company || 0,
        is_seller: 1,
        file_id: profileImage.id,
        company_file_id: companyLogoImage.id,
      });
      const companyInfo = await CompanyInfo.create({
        organization_name: user_company,
        organization_slug,
        role,
        user_type,
        core_activity,
        activity,
        category_sell,
        sub_category,
        company_website: website,
        company_location,
        is_star_seller: is_star_seller || 0,
        is_verified: is_verified || 0,
        company_meta_title,
        company_video_second,
        brief_company,
        organizations_product_description: products,
        designation,
        featured_company: featured_company || 0,
        company_logo: companyLogoImage.id,
        sample_file_id: companySampleFile.id,
        company_sample_ppt_file: companyPptFile.id,
        company_video: companyVideoFile.id,
        is_delete: 0,
      });
      await user.update({
        company_id: companyInfo.id
      });
      res.status(201).json({
        message: 'Seller created successfully',
        user,
        companyInfo
      });
    } catch (error) {
      deleteUploadedFiles();
      return res.status(500).json({ error: error.message });
    }
  });
};

exports.getAllSeller = async (req, res) => {
  try {
    const sellers = await Users.findAll({
      where: { is_seller: 1 },
      order: [['id', 'ASC']]
    });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSellerById = async (req, res) => {
  try {
    const seller = await Users.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        as: 'file',
        attributes: ['file'],
      },
      {
        model: UploadImage,
        as: 'company_file',
        attributes: ['file'],
      }],
    });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    const companyInfo = await CompanyInfo.findByPk(seller.company_id, {
      include: [{
        model: UploadImage,
        as: 'companySamplePptFile',
        attributes: ['file'],
      }, {
        model: UploadImage,
        as: 'companySampleFile',
        attributes: ['file'],
      }, {
        model: UploadImage,
        as: 'companyVideo',
        attributes: ['file'],
      }],
    });
    const response = {
      ...seller.toJSON(), ...companyInfo.toJSON(),
      file_name: seller.file ? seller.file.file : null,
      company_file_name: seller.company_file ? seller.company_file.file : null,
      company_sample_ppt_file_name: companyInfo.companySamplePptFile ? companyInfo.companySamplePptFile.file : null,
      company_sample_file_name: companyInfo.companySampleFile ? companyInfo.companySampleFile.file : null,
      company_video_file_name: companyInfo.companyVideo ? companyInfo.companyVideo.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSellerCount = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const [total, addedToday, statusActive, statusInactive, notApproved] = await Promise.all([
      Users.count({ where: { is_seller: 1 } }),
      Users.count({
        where: {
          created_at: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
      }),
      Users.count({ where: { is_seller: 1, status: 1 } }),
      Users.count({ where: { is_seller: 1, status: 0 } }),
      Users.count({ where: { is_seller: 1, is_approve: 0 } }),
    ]);
    res.json({
      total,
      addedToday,
      statusActive,
      statusInactive,
      notApproved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSeller = async (req, res) => {
  const upload = getMulterUpload('users');
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_logo', maxCount: 1 },
    { name: 'sample_file_id', maxCount: 1 },
    { name: 'company_sample_ppt_file', maxCount: 1 },
    { name: 'company_video', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const sellerId = req.params.id;
      const user = await Users.findByPk(sellerId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const companyInfo = await CompanyInfo.findOne({ where: { id: user.company_id } });
      const updatedData = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        mobile: req.body.mobile,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        zipcode: req.body.zipcode,
        address: req.body.address,
        user_company: req.body.user_company,
        is_trading: req.body.is_trading,
        elcina_member: req.body.elcina_member,
        status: req.body.status,
        website: req.body.website,
        featured_company: req.body.featured_company,
        products: req.body.products,
      };
      const profileImage = req.files?.file?.[0];
      if (profileImage) {
        const existingImage = await UploadImage.findByPk(user.file_id);
        if (existingImage) {
          const oldPath = path.resolve(existingImage.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingImage.file = `upload/users/${profileImage.filename}`;
          existingImage.updated_at = new Date();
          await existingImage.save();
        } else {
          const newImage = await UploadImage.create({
            file: `upload/users/${profileImage.filename}`
          });
          updatedData.file_id = newImage.id;
        }
      }
      const companyLogo = req.files?.company_logo?.[0];
      if (companyLogo) {
        const existingLogo = await UploadImage.findByPk(user.company_file_id);
        if (existingLogo) {
          const oldPath = path.resolve(existingLogo.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingLogo.file = `upload/users/${companyLogo.filename}`;
          existingLogo.updated_at = new Date();
          await existingLogo.save();
        } else {
          const newLogo = await UploadImage.create({
            file: `upload/users/${companyLogo.filename}`
          });
          updatedData.company_file_id = newLogo.id;
        }
      }
      const sampleFile = req.files?.sample_file_id?.[0];
      if (sampleFile && companyInfo) {
        const existingSample = await UploadImage.findByPk(companyInfo.sample_file_id);
        if (existingSample) {
          const oldPath = path.resolve(existingSample.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingSample.file = `upload/users/${sampleFile.filename}`;
          existingSample.updated_at = new Date();
          await existingSample.save();
        } else {
          const newPpt = await UploadImage.create({
            file: `upload/users/${sampleFile.filename}`
          });
          await companyInfo.update({ sample_file_id: newPpt.id });
        }
      }
      const pptFile = req.files?.company_sample_ppt_file?.[0];
      if (pptFile && companyInfo) {
        const existingPpt = await UploadImage.findByPk(companyInfo.company_sample_ppt_file);
        if (existingPpt) {
          const oldPath = path.resolve(existingPpt.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingPpt.file = `upload/users/${pptFile.filename}`;
          existingPpt.updated_at = new Date();
          await existingPpt.save();
        } else {
          const newPpt = await UploadImage.create({
            file: `upload/users/${pptFile.filename}`
          });
          await companyInfo.update({ company_sample_ppt_file: newPpt.id });
        }
      }
      const videoFile = req.files?.company_video?.[0];
      if (videoFile && companyInfo) {
        const existingVideo = await UploadImage.findByPk(companyInfo.company_video);
        if (existingVideo) {
          const oldPath = path.resolve(existingVideo.file);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          existingVideo.file = `upload/users/video/${videoFile.filename}`;
          existingVideo.updated_at = new Date();
          await existingVideo.save();
        } else {
          const newVideo = await UploadImage.create({
            file: `upload/users/video/${videoFile.filename}`
          });
          await companyInfo.update({ company_video: newVideo.id });
        }
      }
      await user.update(updatedData);
      if (companyInfo) {
        await companyInfo.update({
          organization_name: req.body.user_company,
          organization_slug: createSlug(req.body.user_company),
          role: req.body.role,
          user_type: req.body.user_type,
          core_activity: req.body.core_activity,
          activity: req.body.activity,
          category_sell: req.body.category_sell,
          sub_category: req.body.sub_category,
          company_location: req.body.company_location,
          company_website: req.body.website,
          company_meta_title: req.body.company_meta_title,
          company_video_second: req.body.company_video_second,
          brief_company: req.body.brief_company,
          organizations_product_description: req.body.products,
          designation: req.body.designation,
          is_star_seller: req.body.is_star_seller || 0,
          is_verified: req.body.is_verified || 0,
          featured_company: req.body.featured_company || 0
        });
      }
      res.status(200).json({ message: 'Seller updated successfully', user });
    } catch (err) {
      console.error('Error in updateSeller:', err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteSeller = async (req, res) => {
  try {
    const seller = await Users.findByPk(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    if (seller.file_id) {
      const profileImage = await UploadImage.findByPk(seller.file_id);
      if (profileImage) {
        const oldImagePath = path.resolve(profileImage.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await profileImage.destroy();
      }
    }
    if (seller.company_file_id) {
      const companyLogo = await UploadImage.findByPk(seller.company_file_id);
      if (companyLogo) {
        const oldImagePath = path.resolve(companyLogo.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await companyLogo.destroy();
      }
    }
    const companyInfo = await CompanyInfo.findOne({ where: { id: seller.company_id } });
    if (companyInfo) {
      if (companyInfo.sample_file_id) {
        const sampleFile = await UploadImage.findByPk(companyInfo.sample_file_id);
        if (sampleFile) {
          const oldFilePath = path.resolve(sampleFile.file);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
          await sampleFile.destroy();
        }
      }
      if (companyInfo.company_sample_ppt_file) {
        const pptFile = await UploadImage.findByPk(companyInfo.company_sample_ppt_file);
        if (pptFile) {
          const oldFilePath = path.resolve(pptFile.file);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
          await pptFile.destroy();
        }
      }
      if (companyInfo.company_video) {
        const videoFile = await UploadImage.findByPk(companyInfo.company_video);
        if (videoFile) {
          const oldVideoPath = path.resolve(videoFile.file);
          if (fs.existsSync(oldVideoPath)) {
            fs.unlinkSync(oldVideoPath);
          }
          await videoFile.destroy();
        }
      }
      await companyInfo.destroy();
    }
    await seller.destroy();
    res.json({ message: 'Seller deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSellerServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'fname', 'lname', 'full_name', 'email', 'mobile', 'country_name', 'state_name', 'city_name',
      'zipcode', 'user_company', 'website', 'is_trading', 'elcina_member', 'address', 'products', 'category_name', 'sub_category_name',
      'designation', 'coreactivity_name', 'activity_name', 'status', 'is_approve', 'is_seller', 'walkin_buyer', 'created_at', 'updated_at'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, { model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (sortBy === 'sub_category_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, { model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (sortBy === 'coreactivity_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, { model: CoreActivity, as: 'CoreActivity' }, 'name', sortDirection]];
    } else if (sortBy === 'activity_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, { model: Activity, as: 'Activity' }, 'name', sortDirection]];
    } else if (sortBy === 'country_name') {
      order = [[{ model: Countries, as: 'Countries' }, 'name', sortDirection]];
    } else if (sortBy === 'state_name') {
      order = [[{ model: States, as: 'States' }, 'name', sortDirection]];
    } else if (sortBy === 'city_name') {
      order = [[{ model: Cities, as: 'Cities' }, 'name', sortDirection]];
    } else if (sortBy === 'organization_name') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection]];
    } else if (sortBy === 'designation') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, 'designation', sortDirection]];
    } else if (sortBy === 'full_name') {
      order = [[fn('concat', col('fname'), ' ', col('lname')), sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    where.is_seller = 1;
    where.is_delete = 0;
    if (req.query.getInactive === 'true') {
      where.status = 0;
    }
    if (req.query.getNotApproved === 'true') {
      where.is_approve = 0;
    }
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { website: { [Op.like]: `%${search}%` } },
        { '$company_info.organization_name$': { [Op.like]: `%${search}%` } },
        { '$company_info.designation$': { [Op.like]: `%${search}%` } },
        { '$company_info.Categories.name$': { [Op.like]: `%${search}%` } },
        { '$company_info.CoreActivity.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const companyInfoInclude = {
      model: CompanyInfo,
      as: 'company_info',
      attributes: ['organization_name', 'company_location', 'designation'],
      include: [
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
        { model: Categories, as: 'Categories', attributes: ['name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['name'] },
      ],
    };
    const totalRecords = await Users.count({
      where,
      include: [
        {
          ...companyInfoInclude,
          attributes: [],
          include: [
            { model: CoreActivity, as: 'CoreActivity', attributes: [] },
            { model: Categories, as: 'Categories', attributes: [] },
          ],
        },
      ],
    });
    const { count: filteredRecords, rows } = await Users.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: UploadImage, as: 'file', attributes: ['file'] },
        { model: UploadImage, as: 'company_file', attributes: ['file'] },
        companyInfoInclude,
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      full_name: `${row.fname} ${row.lname}`,
      email: row.email,
      file_id: row.file_id,
      file_name: row.file ? row.file.file : null,
      company_file_id: row.company_file_id,
      company_file_name: row.company_file ? row.company_file.file : null,
      mobile: row.mobile,
      country: row.country,
      state: row.state,
      city: row.city,
      zipcode: row.zipcode,
      user_company: row.user_company,
      website: row.website,
      is_trading: row.is_trading,
      elcina_member: row.elcina_member,
      address: row.address,
      products: row.products,
      status: row.status,
      products: row.products,
      status: row.status,
      is_approve: row.is_approve,
      is_seller: row.is_seller,
      is_delete: row.is_delete,
      walkin_buyer: row.walkin_buyer,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization_name: row.company_info ? row.company_info.organization_name : null,
      company_location: row.company_info ? row.company_info.company_location : null,
      designation: row.company_info ? row.company_info.designation : null,
      category_name: row.company_info?.Categories?.name || null,
      sub_category_name: row.company_info?.SubCategories?.name || null,
      coreactivity_name: row.company_info?.CoreActivity?.name || null,
      activity_name: row.company_info?.Activity?.name || null,
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