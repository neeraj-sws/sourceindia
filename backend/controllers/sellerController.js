const Sequelize = require('sequelize');
const moment = require('moment');
const { Op, fn, col } = Sequelize;
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
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
const MembershipPlan = require('../models/MembershipPlan');
const Designations = require('../models/Designations');
const NatureBusinesses = require('../models/NatureBusinesses');
const Products = require('../models/Products');
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
      order: [['id', 'ASC']],
      include: [
        { model: Countries, as: 'country_data', attributes: ['id', 'name'] },
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name', 'category_sell', 'sub_category', 'designation', 
          'company_website', 'company_email', 'organization_quality_certification'],
          include: [
            { model: MembershipPlan, as: 'MembershipPlan', attributes: ['id', 'name'] },
            { model: CoreActivity, as: 'CoreActivity', attributes: ['id', 'name'] },
            { model: Activity, as: 'Activity', attributes: ['id', 'name'] },
          ]
        },
      ],
    });
    const productCounts = await Products.findAll({
      attributes: ['user_id', [sequelize.fn('COUNT', sequelize.col('user_id')), 'product_count']],
      where: {
        user_id: {
          [Sequelize.Op.in]: sellers.map(seller => seller.id)
        },
        is_delete: 0,
      },
      group: ['user_id'],
    });
    const productCountMap = productCounts.reduce((acc, productCount) => {
      acc[productCount.user_id] = productCount.dataValues.product_count;
      return acc;
    }, {});
    const categorySellValues = Array.from(new Set(
      sellers.flatMap(seller => seller.company_info?.category_sell ? seller.company_info.category_sell.split(',') : [])
    ));
    const categories = await Categories.findAll({
      where: {
        id: categorySellValues
      },
      attributes: ['id', 'name']
    });
    const categoryMap = categories.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
    const subCategorySellValues = Array.from(new Set(
      sellers.flatMap(seller => seller.company_info?.sub_category ? seller.company_info.sub_category.split(',') : [])
    ));
    const sub_categories = await SubCategories.findAll({
      where: {
        id: subCategorySellValues
      },
      attributes: ['id', 'name']
    });
    const subCategoryMap = sub_categories.reduce((acc, subCategory) => {
      acc[subCategory.id] = subCategory.name;
      return acc;
    }, {});
    const modifiedSellers = sellers.map(seller => {
      const sellersData = seller.toJSON();
      const categoryNames = sellersData.company_info?.category_sell?.split(',').map(id => categoryMap[id]).join(', ') || 'NA';
      const subCategoryNames = sellersData.company_info?.sub_category?.split(',').map(id => subCategoryMap[id]).join(', ') || 'NA';
      sellersData.getStatus = sellersData.status === 1 ? 'Active' : 'Inactive';
      sellersData.getApproved = sellersData.is_approve === 1 ? 'Approved' : 'Not Approved';
      sellersData.country_name = sellersData.country_data?.name || 'NA';
      sellersData.state_name = sellersData.state_data?.name || 'NA';
      sellersData.city_name = sellersData.city_data?.name || 'NA';
      sellersData.company_name = sellersData.company_info?.organization_name || null;
      sellersData.designation = sellersData.company_info?.designation || null;
      sellersData.company_website = sellersData.company_info?.company_website || null;
      sellersData.company_email = sellersData.company_info?.company_email || null;
      sellersData.membership_plan_name = sellersData.company_info?.MembershipPlan?.name || 'NA';
      sellersData.coreactivity_name = sellersData.company_info?.CoreActivity?.name || 'NA';
      sellersData.activity_name = sellersData.company_info?.Activity?.name || 'NA';
      sellersData.quality_certification = sellersData.company_info?.organization_quality_certification || null;
      sellersData.category_names = categoryNames;
      sellersData.sub_category_names = subCategoryNames;
      sellersData.user_count = productCountMap[sellersData.id] || 0;
      delete sellersData.country_data;
      delete sellersData.state_data;
      delete sellersData.city_data;
      delete sellersData.company_info;
      return sellersData;
    });
    res.json(modifiedSellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSellerById = async (req, res) => {
  try {
    const seller = await Users.findByPk(req.params.id, {
      include: [
        {model: UploadImage, as: 'file', attributes: ['file']},
        {model: UploadImage, as: 'company_file', attributes: ['file']},
        {model: Countries, as: 'country_data', attributes: ['name']},
        {model: States, as: 'state_data', attributes: ['name']},
        {model: Cities, as: 'city_data', attributes: ['name']}
      ],
    });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    const companyInfo = await CompanyInfo.findByPk(seller.company_id, {
      include: [
        {model: UploadImage, as: 'companySamplePptFile', attributes: ['file']},
        {model: UploadImage, as: 'companySampleFile', attributes: ['file']},
        {model: UploadImage, as: 'companyVideo', attributes: ['file']},
        {model: CoreActivity, as: 'CoreActivity', attributes: ['name']},
        {model: Activity, as: 'Activity', attributes: ['name']},
        {model: Categories, as: 'Categories', attributes: ['name']},
        {model: MembershipPlan, as: 'MembershipPlan', attributes: ['name']}
      ],
    });
    const response = {
      ...seller.toJSON(), ...companyInfo.toJSON(),
      file_name: seller.file ? seller.file.file : null,
      company_file_name: seller.company_file ? seller.company_file.file : null,
      country_name: seller.country_data ? seller.country_data.name : null,
      state_name: seller.state_data ? seller.state_data.name : null,
      city_name: seller.city_data ? seller.city_data.name : null,
      coreactivity_name: companyInfo && companyInfo.CoreActivity ? companyInfo.CoreActivity.name : null,
      activity_name: companyInfo && companyInfo.Activity ? companyInfo.Activity.name : null,
      category_name: companyInfo && companyInfo.Categories ? companyInfo.Categories.name : null,
      company_sample_ppt_file_name: companyInfo.companySamplePptFile ? companyInfo.companySamplePptFile.file : null,
      company_sample_file_name: companyInfo.companySampleFile ? companyInfo.companySampleFile.file : null,
      company_video_file_name: companyInfo.companyVideo ? companyInfo.companyVideo.file : null,
      plan_name: companyInfo && companyInfo.MembershipPlan ? companyInfo.MembershipPlan.name : null,
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
      Users.count({ where: { is_seller: 1, is_complete: 0 } }),
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
          organization_slug: createSlug(req.body.organization_name),
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

exports.deleteSelectedSeller = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const sellers = await Users.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (sellers.length === 0) {
      return res.status(404).json({ message: 'No seller found with the given IDs.' });
    }
    await Users.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${sellers.length} seller marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllDesignations = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = {};
    if (status !== undefined) {
      whereClause.status = status;
    }
    const designations = await Designations.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
    });
    res.json(designations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllNatureBusinesses = async (req, res) => {
  try {
    const nature_businesses = await NatureBusinesses.findAll({ order: [['id', 'ASC']] });
    res.json(nature_businesses);
  } catch (err) {
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
      dateRange = '',
      startDate,
      endDate,
      country,
      state,
      city,
      core_activity,
      activity,
      firstName,
      lastName,
      customerId,
      organizationName,
      designation,
      categoryId,
      nature_business,
      elcina_member
    } = req.query;
    const validColumns = ['id', 'fname', 'lname', 'full_name', 'email', 'mobile', 'country_name', 'state_name', 'city_name',
      'zipcode', 'user_company', 'website', 'is_trading', 'elcina_member', 'address', 'products', 'category_name', 'sub_category_name',
      'designation', 'coreactivity_name', 'activity_name', 'status', 'is_approve', 'is_complete', 'is_seller', 'walkin_buyer', 'created_at', 'updated_at'];
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
      order = [[{ model: Countries, as: 'country_data' }, 'name', sortDirection]];
    } else if (sortBy === 'state_name') {
      order = [[{ model: States, as: 'state_data' }, 'name', sortDirection]];
    } else if (sortBy === 'city_name') {
      order = [[{ model: Cities, as: 'city_data' }, 'name', sortDirection]];
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
    if (req.query.getNotCompleted === 'true') {
      where.is_complete = 0;
    }
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (country) {
      searchWhere.country = country;
    }
    if (state) {
      searchWhere.state = state;
    }
    if (city) {
      searchWhere.city = city;
    }
    if (elcina_member) {
      searchWhere.elcina_member = elcina_member;
    }
    if (core_activity) {
      searchWhere['$company_info.CoreActivity.id$'] = core_activity;
    }
    if (activity) {
      searchWhere['$company_info.Activity.id$'] = activity;
    }
    if (nature_business) {
      searchWhere['$company_info.NatureBusinesses.id$'] = nature_business;
    }
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
        { '$state_data.name$': { [Op.like]: `%${search}%` } },
        { '$city_data.name$': { [Op.like]: `%${search}%` } },
        { '$company_info.SubCategories.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    if (customerId) {
      searchWhere.id = {
        [Op.like]: `%${customerId}%`
      };
    }
    if (firstName) {
      searchWhere.fname = {
        [Op.like]: `%${firstName}%`
      };
    }
    if (lastName) {
      searchWhere.lname = {
        [Op.like]: `%${lastName}%`
      };
    }
    if (organizationName) {
      searchWhere['$company_info.organization_name$'] = {
        [Op.like]: `%${organizationName}%`
      };
    }
    if (designation) {
      searchWhere['$company_info.designation$'] = {
        [Op.like]: `%${designation}%`
      };
    }
    if (categoryId) {
      searchWhere['$company_info.Categories.name$'] = {
        [Op.like]: `%${categoryId}%`
      };
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
    const companyInfoInclude = {
      model: CompanyInfo,
      as: 'company_info',
      attributes: ['organization_name', 'company_location', 'designation', 'category_sell', 'sub_category'],
      include: [
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
        { model: Categories, as: 'Categories', attributes: ['name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['name'] },
        { model: NatureBusinesses, as: 'NatureBusinesses', attributes: ['name'] },
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
        { model: Countries, as: 'country_data', attributes: [] },
        { model: States, as: 'state_data', attributes: [] },
        { model: Cities, as: 'city_data', attributes: [] },
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
        { model: Countries, as: 'country_data', attributes: ['name'] },
        { model: States, as: 'state_data', attributes: ['name'] },
        { model: Cities, as: 'city_data', attributes: ['name'] },
      ],
    });
    const mappedRows = await Promise.all(
      rows.map(async (row) => {
        const productCount = await Products.count({ where: { user_id: row.id } });
        const categoryNames = await getNamesByIds(Categories, row.company_info?.category_sell);
        const subCategoryNames = await getNamesByIds(SubCategories, row.company_info?.sub_category);
        return {
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
          is_approve: row.is_approve,
          is_seller: row.is_seller,
          is_complete: row.is_complete,
          is_delete: row.is_delete,
          walkin_buyer: row.walkin_buyer,
          created_at: row.created_at,
          updated_at: row.updated_at,
          organization_name: row.company_info ? row.company_info.organization_name : null,
          company_location: row.company_info ? row.company_info.company_location : null,
          designation: row.company_info ? row.company_info.designation : null,
          category_name: categoryNames,
          sub_category_name: subCategoryNames,
          coreactivity_name: row.company_info?.CoreActivity?.name || null,
          activity_name: row.company_info?.Activity?.name || null,
          country_name: row.country_data?.name || null,
          state_name: row.state_data?.name || null,
          city_name: row.city_data?.name || null,
          user_count: productCount
        };
      })
    );
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

async function getNamesByIds(Model, idsString) {
  if (!idsString) return null;

  // Split string into array of IDs
  const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);

  if (ids.length === 0) return null;

  const records = await Model.findAll({
    where: { id: ids },
    attributes: ['name'],
  });

  return records.map(r => r.name).join(', ');
}