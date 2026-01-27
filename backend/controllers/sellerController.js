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
const SellerCategory = require('../models/SellerCategory');
const SellerMailHistories = require('../models/SellerMailHistories');
const Emails = require('../models/Emails');
const { getTransporter, sendMail, getSiteConfig } = require('../helpers/mailHelper');
const SellerMessages = require('../models/SellerMessages');
const getMulterUpload = require('../utils/upload');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const logSQL = false;

async function createUniqueSlug(name) {
  if (!name) return '';
  let slug = name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')  // remove invalid chars
    .replace(/\s+/g, '-')          // replace spaces with -
    .replace(/-+/g, '-');
  let uniqueSlug = slug;
  let counter = 1;
  while (await CompanyInfo.findOne({ where: { organization_slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

exports.createSeller = async (req, res) => {
  const upload = getMulterUpload('users'); // Fixed: Add 'users' param like updateSeller
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
      files.forEach(filePath => fs.unlink(filePath, err => {
        if (err) console.error(`Error deleting file ${filePath}:`, err.message);
      }));
    };

    try {
      const {
        fname, lname, email, password, mobile, alternate_number, country_code, country, state, city, zipcode,
        address, status, is_trading, elcina_member, user_company, website, products,
        step, mode, real_password, remember_token, payment_status, is_email_verify, featured_company, is_approve,
        organization_name, organization_slug, user_type, core_activity, activity, categories, subcategory_ids, // Added subcategory_ids
        company_website, company_location, is_star_seller, is_verified, role,
        company_meta_title, company_video_second, brief_company,
        organizations_product_description, designation, is_profile, is_company, is_intrest, request_admin, is_complete
      } = req.body;

      // Validation (unchanged)
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

      // Create UploadImage records for files (same logic)
      const profileImage = await UploadImage.create({ file: `upload/users/${req.files.file[0].filename}` });
      const companyLogoImage = await UploadImage.create({ file: `upload/users/${req.files.company_logo[0].filename}` });
      const companySampleFile = req.files?.sample_file_id ? await UploadImage.create({ file: `upload/users/${req.files.sample_file_id[0].filename}` }) : null;
      const companyPptFile = req.files?.company_sample_ppt_file ? await UploadImage.create({ file: `upload/users/${req.files.company_sample_ppt_file[0].filename}` }) : null;
      const companyVideoFile = req.files?.company_video ? await UploadImage.create({ file: `upload/users/video/${req.files.company_video[0].filename}` }) : null;

      // Create user (unchanged)
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await Users.create({
        fname, lname, email, mobile, alternate_number, country_code, country, state, city, zipcode, address, products,
        status: status || 1, is_trading: is_trading || 0, is_approve: is_approve || 1,
        elcina_member: elcina_member || 2, user_company, website, step: step || 0, mode: mode || 0,
        password: hashedPassword, real_password: real_password || '', remember_token: remember_token || '',
        payment_status: payment_status || 0, featured_company: featured_company || 0, is_seller: 1,
        file_id: profileImage.id, company_file_id: companyLogoImage.id,
        is_email_verify: is_email_verify || 1, is_profile: is_profile || 1, is_company: is_company || 1,
        is_intrest: is_intrest || 0, request_admin: request_admin || 0, is_complete: is_complete || 1
      });

      // Create company info (unchanged)
      const companyInfo = await CompanyInfo.create({
        organization_name: user_company, organization_slug: await createUniqueSlug(user_company), role, user_type: user_type || 9,
        core_activity, activity, company_website: website, company_location,
        is_star_seller: is_star_seller || 0, is_verified: is_verified || 0, company_meta_title,
        company_video_second, brief_company, organizations_product_description: products, designation,
        featured_company: featured_company || 0, company_logo: companyLogoImage.id,
        sample_file_id: companySampleFile?.id || null, company_sample_ppt_file: companyPptFile?.id || null,
        company_video: companyVideoFile?.id || null, is_delete: 0,
      });
      await user.update({ company_id: companyInfo.id });

      // FIXED: Category handling - same exact logic as updateSeller
      const existingCategories = await SellerCategory.findAll({ where: { user_id: user.id } });
      const existingCategoryMap = existingCategories.map(c => `${c.category_id}-${c.subcategory_id ?? 'null'}`);
      const incomingCategoryMap = [];

      // Handle categories (comma-separated string)
      if (categories) {
        const categoryIds = categories.split(',').map(id => parseInt(id.trim()));
        for (const categoryId of categoryIds) {
          const key = `${categoryId}-null`;
          incomingCategoryMap.push(key);
          if (!existingCategoryMap.includes(key)) {
            await SellerCategory.create({ user_id: user.id, category_id: categoryId, subcategory_id: null });
          }
        }
      }

      // Handle subcategories (comma-separated string)
      const subcategoryIds = subcategory_ids ? subcategory_ids.split(',').map(id => parseInt(id.trim())) : [];
      for (const subcategoryId of subcategoryIds) {
        const subCategory = await SubCategories.findOne({ where: { id: subcategoryId, is_delete: 0 } });
        if (subCategory) {
          const categoryId = subCategory.category;
          const key = `${categoryId}-${subcategoryId}`;
          incomingCategoryMap.push(key);
          if (!existingCategoryMap.includes(key)) {
            await SellerCategory.create({ user_id: user.id, category_id: categoryId, subcategory_id: subcategoryId });
          }
        }
      }

      // Clean up removed categories (same logic)
      const nullSubcategoryRows = await SellerCategory.findAll({
        where: { user_id: user.id, subcategory_id: null }
      });
      for (const existing of nullSubcategoryRows) {
        const categoryId = existing.category_id;
        if (!incomingCategoryMap.includes(`${categoryId}-null`)) {
          await SellerCategory.destroy({
            where: { user_id: user.id, category_id: categoryId, subcategory_id: null }
          });
        }
      }

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
    const { is_delete, status, is_approve, is_complete } = req.query;

    // 🔹 Build dynamic where condition
    const sellerWhere = { is_seller: 1 };

    if (is_delete !== undefined) { sellerWhere.is_delete = is_delete; }
    if (status !== undefined) { sellerWhere.status = status; }
    if (is_approve !== undefined) { sellerWhere.is_approve = is_approve; }
    if (is_complete !== undefined) { sellerWhere.is_complete = is_complete; }

    const sellers = await Users.findAll({
      where: sellerWhere,
      order: [['id', 'ASC']],
      include: [
        { model: Countries, as: 'country_data', attributes: ['id', 'name'] },
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name', 'designation', 'company_website', 'company_email', 'organization_quality_certification'],
          include: [
            { model: MembershipPlan, as: 'MembershipPlan', attributes: ['id', 'name'] },
            { model: CoreActivity, as: 'CoreActivity', attributes: ['id', 'name'] },
            { model: Activity, as: 'Activity', attributes: ['id', 'name'] },
          ]
        },
        {
          model: require('../models/SellerCategory'),
          as: 'seller_categories',
          attributes: ['id'],
          include: [
            { model: require('../models/Categories'), as: 'category', attributes: ['id', 'name'] },
            { model: require('../models/SubCategories'), as: 'subcategory', attributes: ['id', 'name'] },
          ]
        }
      ]
    });

    const productCounts = await Products.findAll({
      attributes: ['user_id', [sequelize.fn('COUNT', sequelize.col('user_id')), 'product_count']],
      where: {
        user_id: { [Sequelize.Op.in]: sellers.map(s => s.id) },
        is_delete: 0,
      },
      group: ['user_id'],
    });

    const productCountMap = productCounts.reduce((acc, item) => {
      acc[item.user_id] = item.dataValues.product_count;
      return acc;
    }, {});

    const modifiedSellers = sellers.map(seller => {
      const s = seller.toJSON();

      // Map categories & subcategories
      const categoryNames = s.seller_categories
        ? Array.from(new Set(s.seller_categories.map(sc => sc.category?.name).filter(Boolean))).join(', ')
        : 'NA';

      const subCategoryNames = s.seller_categories
        ? Array.from(new Set(s.seller_categories.map(sc => sc.subcategory?.name).filter(Boolean))).join(', ')
        : 'NA';

      return {
        ...s,
        getStatus: s.status === 1 ? 'Active' : 'Inactive',
        getApproved: s.is_approve === 1 ? 'Approved' : 'Not Approved',
        country_name: s.country_data?.name || 'NA',
        state_name: s.state_data?.name || 'NA',
        city_name: s.city_data?.name || 'NA',
        company_name: s.company_info?.organization_name || null,
        designation: s.company_info?.designation || null,
        company_website: s.company_info?.company_website || null,
        company_email: s.company_info?.company_email || null,
        membership_plan_name: s.company_info?.MembershipPlan?.name || 'NA',
        coreactivity_name: s.company_info?.CoreActivity?.name || 'NA',
        activity_name: s.company_info?.Activity?.name || 'NA',
        quality_certification: s.company_info?.organization_quality_certification || null,
        category_names: categoryNames,
        sub_category_names: subCategoryNames,
        user_count: productCountMap[s.id] || 0,
      };
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
        { model: UploadImage, as: 'file', attributes: ['file'] },
        { model: Countries, as: 'country_data', attributes: ['name'] },
        { model: States, as: 'state_data', attributes: ['name'] },
        { model: Cities, as: 'city_data', attributes: ['name'] },
      ],
    });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const companyInfo = await CompanyInfo.findByPk(seller.company_id, {
      include: [
        { model: UploadImage, as: 'companyLogo', attributes: ['file'] },
        { model: UploadImage, as: 'companySamplePptFile', attributes: ['file'] },
        { model: UploadImage, as: 'companySampleFile', attributes: ['file'] },
        { model: UploadImage, as: 'companyVideo', attributes: ['file'] },
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
        { model: MembershipPlan, as: 'MembershipPlan', attributes: ['name'] },
      ],
    });

    // Fetch all categories & subcategories from SellerCategory
    const sellerCategories = await SellerCategory.findAll({
      where: { user_id: seller.id },
      include: [
        { model: Categories, as: 'category', attributes: ['name'] },
        { model: SubCategories, as: 'subcategory', attributes: ['name'] },
      ],
    });

    const categories = sellerCategories.map(sc => ({
      category_id: sc.category_id,
      category_name: sc.category ? sc.category.name : null,
      subcategory_id: sc.subcategory_id,
      subcategory_name: sc.subcategory ? sc.subcategory.name : null,
    }));

    const response = {
      ...seller.toJSON(),
      ...companyInfo.toJSON(),
      file_name: seller.file ? seller.file.file : null,
      company_file_name: companyInfo.companyLogo ? companyInfo.companyLogo.file : null,
      country_name: seller.country_data ? seller.country_data.name : null,
      state_name: seller.state_data ? seller.state_data.name : null,
      city_name: seller.city_data ? seller.city_data.name : null,
      coreactivity_name: companyInfo && companyInfo.CoreActivity ? companyInfo.CoreActivity.name : null,
      activity_name: companyInfo && companyInfo.Activity ? companyInfo.Activity.name : null,
      company_sample_ppt_file_name: companyInfo.companySamplePptFile ? companyInfo.companySamplePptFile.file : null,
      company_sample_file_name: companyInfo.companySampleFile ? companyInfo.companySampleFile.file : null,
      company_video_file_name: companyInfo.companyVideo ? companyInfo.companyVideo.file : null,
      plan_name: companyInfo && companyInfo.MembershipPlan ? companyInfo.MembershipPlan.name : null,
      categories, // <-- return array of categories & subcategories
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

    // Optional SQL logger
    const logSQL = (sql) => {
      // console.log("\n🧠 Executing SQL Query:\n", sql, "\n");
    };

    const [
      total,
      addedToday,
      statusActive,
      statusInactive,
      notApproved,
      notCompleted,
      deleted
    ] = await Promise.all([
      // Total sellers
      Users.count({
        where: { is_seller: 1 },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Sellers added today
      Users.count({
        where: {
          is_seller: 1,
          is_delete: 0,
          created_at: { [Op.between]: [todayStart, todayEnd] },
        },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Active sellers
      Users.count({
        where: {
          is_seller: 1,
          status: 1,
          is_delete: 0,
          member_role: 1,
          is_complete: 1,
          is_approve: 1,
        },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Inactive sellers
      Users.count({
        where: {
          is_seller: 1,
          status: 0,
          is_delete: 0,
          member_role: 1,
          is_complete: 1,
        },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Not approved sellers
      Users.count({
        where: {
          is_seller: 1,
          is_approve: 0,
          is_delete: 0,
          is_complete: 1
        },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Not completed sellers
      Users.count({
        where: {
          is_seller: 1,
          is_complete: 0,
          is_delete: 0,
          is_approve: 0,
        },
        include: [
          {
            model: CompanyInfo,
            as: 'company_info',
            required: true,
          },
        ],
        logging: logSQL,
      }),

      // Deleted sellers
      Users.count({
        where: {
          is_seller: 1,
          is_delete: 1,
        },
        logging: logSQL,
      }),
    ]);

    return res.json({
      total,
      addedToday,
      statusActive,
      statusInactive,
      notApproved,
      notCompleted,
      deleted,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
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
      const companyInfo = await CompanyInfo.findByPk(user.company_id);
      const updatedData = {
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        mobile: req.body.mobile,
        alternate_number: req.body.alternate_number,
        country_code: req.body.country_code,
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

      const fileFields = [
        { field: 'file', model: 'user', column: 'file_id', folder: 'users' },
        { field: 'company_logo', model: 'company', column: 'company_logo', folder: 'users' },
        { field: 'sample_file_id', model: 'company', column: 'sample_file_id', folder: 'users' },
        { field: 'company_sample_ppt_file', model: 'company', column: 'company_sample_ppt_file', folder: 'users' },
        { field: 'company_video', model: 'company', column: 'company_video', folder: 'users/video' }
      ];

      // Handling file uploads
      for (const f of fileFields) {
        const uploadedFile = req.files?.[f.field]?.[0];
        if (!uploadedFile) continue;

        const filePath = `upload/${f.folder}/${uploadedFile.filename}`;

        if (f.model === 'user') {
          const oldImageId = user[f.column];
          const oldImage = oldImageId ? await UploadImage.findByPk(oldImageId) : null;

          if (oldImage) {
            if (fs.existsSync(path.resolve(oldImage.file))) {
              fs.unlinkSync(path.resolve(oldImage.file));
            }
            await oldImage.update({ file: filePath });
          } else {
            const newImage = await UploadImage.create({ file: filePath });
            await user.update({ [f.column]: newImage.id });
          }
        }

        if (f.model === 'company' && companyInfo) {
          const oldImageId = companyInfo[f.column];
          const oldImage = oldImageId ? await UploadImage.findByPk(oldImageId) : null;

          if (oldImage) {
            if (fs.existsSync(path.resolve(oldImage.file))) {
              fs.unlinkSync(path.resolve(oldImage.file));
            }
            await oldImage.update({ file: filePath });
          } else {
            const newImage = await UploadImage.create({ file: filePath });
            await companyInfo.update({ [f.column]: newImage.id });
          }
        }
      }

      await user.update(updatedData);

      // Update company information if exists
      if (companyInfo) {
        await companyInfo.update({
          organization_name: req.body.user_company,
          organization_slug: await createUniqueSlug(req.body.user_company),
          role: req.body.role,
          // user_type: req.body.user_type,
          core_activity: req.body.core_activity,
          activity: req.body.activity,
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

      // Step 1: Add Categories without Subcategories first
      const categoryIds = req.body.categories
        ? req.body.categories.split(',').map(id => parseInt(id.trim()))
        : [];
      const existingCategories = await SellerCategory.findAll({ where: { user_id: sellerId } });
      const existingCategoryMap = existingCategories.map(c => `${c.category_id}-${c.subcategory_id ?? 'null'}`);
      const incomingCategoryMap = [];

      // First, create SellerCategory for all categories with subcategory_id = null
      for (const categoryId of categoryIds) {
        const key = `${categoryId}-null`;
        incomingCategoryMap.push(key);

        // If category does not have a subcategory_id or it is not present in existing categories, create a record with null subcategory
        if (!existingCategoryMap.includes(key)) {
          await SellerCategory.create({ user_id: sellerId, category_id: categoryId, subcategory_id: null });
        }
      }

      // Step 2: Add Subcategories if available
      const subcategoryIds = req.body.subcategory_ids ? req.body.subcategory_ids.split(',').map(id => parseInt(id.trim())) : [];

      for (const subcategoryId of subcategoryIds) {
        const subCategory = await SubCategories.findOne({ where: { id: subcategoryId, is_delete: 0 } });
        if (subCategory) {
          const categoryId = subCategory.category;
          const key = `${categoryId}-${subcategoryId}`;
          incomingCategoryMap.push(key);

          // Add or update the category-subcategory pair
          if (!existingCategoryMap.includes(key)) {
            await SellerCategory.create({ user_id: sellerId, category_id: categoryId, subcategory_id: subcategoryId });
          }
        }
      }

      // Step 3: Cleanup redundant rows where subcategory_id is null
      // Remove rows where subcategory_id = null for the same user_id and category_id
      const nullSubcategoryRows = await SellerCategory.findAll({
        where: {
          user_id: sellerId,
          subcategory_id: null
        }
      });

      // We want to delete **only** redundant `null` rows that are already existing with category_id and user_id
      for (const existing of nullSubcategoryRows) {
        const categoryId = existing.category_id;

        // If the category has valid subcategories added, remove the `null` row
        if (!incomingCategoryMap.includes(`${categoryId}-null`)) {
          await SellerCategory.destroy({
            where: {
              user_id: sellerId,
              category_id: categoryId,
              subcategory_id: null
            }
          });
        }
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
      subCategoryId,
      nature_business,
      elcina_member
    } = req.query;

    const validColumns = [
      'id', 'fname', 'lname', 'full_name', 'email', 'mobile', 'country_name',
      'state_name', 'city_name', 'zipcode', 'user_company', 'website',
      'is_trading', 'elcina_member', 'address', 'products', 'category_name',
      'sub_category_name', 'designation', 'coreactivity_name', 'activity_name',
      'status', 'is_approve', 'is_complete', 'is_seller', 'walkin_buyer',
      'created_at', 'updated_at', 'approve_date'
    ];

    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // 🧭 Dynamic Sorting Logic
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: SellerCategory, as: 'seller_categories' }, { model: Categories, as: 'category' }, 'name', sortDirection]];
    } else if (sortBy === 'sub_category_name') {
      order = [[{ model: SellerCategory, as: 'seller_categories' }, { model: SubCategories, as: 'subcategory' }, 'name', sortDirection]];
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


    // 🧾 WHERE Clauses
    let where = {};
    let searchWhere = {};

    if (req.query.todayOnly === 'true') {
      // Only apply is_seller, is_delete, and date filter
      where.is_seller = 1;
      where.is_delete = 0;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.created_at = {
        [Op.between]: [startOfDay, endOfDay],
      };
      searchWhere = { ...where };
    } else {
      where.is_seller = 1; where.is_delete = 0;
      where.status = 1;
      where.member_role = 1;
      where.is_complete = 1;

      if (req.query.getNotCompleted !== 'true') where.is_approve = 1;
      if (req.query.getInactive === 'true') where.status = 0;
      if (req.query.getNotApproved === 'true') where.is_approve = 0;
      if (req.query.getNotCompleted === 'true') {
        where.is_complete = 0;
        where.is_approve = 0;
      }
      if (req.query.getDeleted === 'true') {
        where.is_delete = 1;
        delete where.is_approve;
        delete where.status;
        delete where.member_role;
        delete where.is_complete;
      }
      searchWhere = { ...where };
    }

    if (country) searchWhere.country = country;
    if (state) searchWhere.state = state;
    if (city) searchWhere.city = city;
    if (elcina_member) searchWhere.elcina_member = elcina_member;
    if (core_activity) searchWhere['$company_info.CoreActivity.core_activity_id$'] = core_activity;
    if (activity) searchWhere['$company_info.Activity.activity_id$'] = activity;
    if (nature_business) searchWhere['$company_info.NatureBusinesses.nature_business_id$'] = nature_business;

    // 🔍 Search
    if (search) {
      const escapedSearch = search.replace(/[%_]/g, '\\$&');

      searchWhere[Op.or] = [
        Sequelize.where(
          fn('concat', col('fname'), ' ', col('lname')),
          { [Op.like]: `%${escapedSearch}%` }
        ),
        { email: { [Op.like]: `%${escapedSearch}%` } },
        { mobile: { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.organization_name$': { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.designation$': { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.company_website$': { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.organization_quality_certification$': { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.CoreActivity.name$': { [Op.like]: `%${escapedSearch}%` } },
        { '$company_info.Activity.name$': { [Op.like]: `%${escapedSearch}%` } },
        { '$city_data.name$': { [Op.like]: `%${search}%` } },
        { '$state_data.name$': { [Op.like]: `%${search}%` } },

        // ✅ CATEGORY NAME SEARCH
        Sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM seller_categories sc
        JOIN categories c ON c.category_id = sc.category_id
        WHERE sc.user_id = users.user_id
        AND c.name LIKE '%${escapedSearch}%'
      )
    `),

        // ✅ SUB-CATEGORY NAME SEARCH (NEW)
        Sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM seller_categories sc
        JOIN sub_categories s ON s.sub_category_id = sc.subcategory_id
        WHERE sc.user_id = users.user_id
        AND s.name LIKE '%${escapedSearch}%'
      )
    `),
      ];
    }

    if (customerId) searchWhere.id = { [Op.like]: `%${customerId}%` };
    if (firstName) searchWhere.fname = { [Op.like]: `%${firstName}%` };
    if (lastName) searchWhere.lname = { [Op.like]: `%${lastName}%` };
    if (organizationName) searchWhere['$company_info.organization_name$'] = { [Op.like]: `%${organizationName}%` };
    if (designation) searchWhere['$company_info.designation$'] = { [Op.like]: `%${designation}%` };

    // 📅 Date Range Filter
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();
      const dateMap = {
        today: [today, now],
        yesterday: [moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day')],
        last7days: [moment().subtract(6, 'days').startOf('day'), now],
        last30days: [moment().subtract(29, 'days').startOf('day'), now],
        thismonth: [moment().startOf('month'), now],
        lastmonth: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      };
      if (dateMap[range]) {
        dateCondition = { [Op.gte]: dateMap[range][0].toDate(), [Op.lte]: dateMap[range][1].toDate() };
      } else if (range === 'customrange' && startDate && endDate) {
        dateCondition = {
          [Op.gte]: moment(startDate).startOf('day').toDate(),
          [Op.lte]: moment(endDate).endOf('day').toDate()
        };
      } else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = {
          [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate()
        };
      }
    }
    if (dateCondition) searchWhere.created_at = dateCondition;

    const requiresSellerCategoryJoin =
      search ||
      categoryId ||
      subCategoryId ||
      (searchWhere[Op.or] &&
        searchWhere[Op.or].some(c => JSON.stringify(c).includes('seller_categories')));

    // 🏢 Include Relationships (with category/subcategory filter fix)
    const sellerCategoryInclude = {
      model: SellerCategory,
      as: 'seller_categories',
      required: false, separate: true,
      attributes: ['category_id', 'subcategory_id'],
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'], required: false },
        { model: SubCategories, as: 'subcategory', attributes: ['id', 'name'], required: false },
      ],
    };

    if (categoryId) {
      searchWhere[Op.and] = searchWhere[Op.and] || [];

      searchWhere[Op.and].push(
        Sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM seller_categories sc
        WHERE sc.user_id = users.user_id
        AND sc.category_id = ${Number(categoryId)}
      )
    `)
      );
    }

    if (subCategoryId) {
      searchWhere[Op.and] = searchWhere[Op.and] || [];

      searchWhere[Op.and].push(
        Sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM seller_categories sc
        WHERE sc.user_id = users.user_id
        AND sc.subcategory_id = ${Number(subCategoryId)}
      )
    `)
      );
    }

    if (!categoryId && !subCategoryId) {
      delete sellerCategoryInclude.where; // avoid empty WHERE {}
    }

    const companyInfoInclude = {
      model: CompanyInfo,
      as: 'company_info',
      attributes: ['organization_name', 'organization_slug', 'company_location', 'designation', 'company_website', 'organization_quality_certification', 'company_email'],
      include: [
        { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
        { model: Activity, as: 'Activity', attributes: ['name'] },
        { model: NatureBusinesses, as: 'NatureBusinesses', attributes: ['name'] },
        { model: MembershipPlan, as: 'MembershipPlan', attributes: ['name'] }
      ],
      required: false
    };

    const totalRecords = await Users.count({
      where,
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
        sellerCategoryInclude,
      ],
      subQuery: false,
      distinct: true,
    });

    // 🧠 Map Result
    const mappedRows = await Promise.all(rows.map(async (row) => {
      const s = row.toJSON();
      const categoryNames = s.seller_categories?.length
        ? [...new Set(s.seller_categories.map(sc => sc.category?.name).filter(Boolean))].join(', ')
        : 'NA';
      const subCategoryNames = s.seller_categories?.length
        ? [...new Set(s.seller_categories.map(sc => sc.subcategory?.name).filter(Boolean))].join(', ')
        : 'NA';
      const productCount = await Products.count({ where: { user_id: row.id } });

      return {
        id: row.id,
        full_name: `${row.fname} ${row.lname}`,
        fname: row.fname,
        lname: row.lname,
        email: row.email,
        mobile: row.mobile,
        address: row.address,
        zipcode: row.zipcode,
        organization_name: row.company_info?.organization_name || null,
        organization_slug: row.company_info?.organization_slug || null,
        company_email: row.company_info?.company_email || null,
        designation: row.company_info?.designation || null,
        company_website: row.company_info?.company_website || null,
        organization_quality_certification: row.company_info?.organization_quality_certification || null,
        category_name: categoryNames,
        sub_category_name: subCategoryNames,
        coreactivity_name: row.company_info?.CoreActivity?.name || null,
        activity_name: row.company_info?.Activity?.name || null,
        membership_plan_name: row.company_info?.MembershipPlan?.name || null,
        country_name: row.country_data?.name || null,
        state_name: row.state_data?.name || null,
        city_name: row.city_data?.name || null,
        elcina_member: row.elcina_member,
        user_count: productCount,
        status: row.status,
        getStatus: row.status === 1 ? 'Active' : 'Inactive',
        is_approve: row.is_approve,
        getApproved: row.is_approve === 1 ? 'Approved' : 'Not Approved',
        is_delete: row.is_delete,
        created_at: row.created_at,
        updated_at: row.updated_at,
        approve_date: row.approve_date
      };
    }));

    res.json({ data: mappedRows, totalRecords, filteredRecords });

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

exports.getEmailtemplate = async (req, res) => {

  try {
    const templates = await Emails.findAll({
      where: {
        is_seller_direct: 1,
        title: { [Op.ne]: "Incomplete Seller" }
      },
      order: [["id", "DESC"]]
    });

    return res.json(templates);

  } catch (error) {
    console.log("Email template load error:", error);
    return res.status(500).json({
      status: false,
      message: "Error loading email templates"
    });
  }
};

exports.sendMail = async (req, res) => {
  try {
    const { ids, template_id } = req.body;
    console.log(ids);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: false, message: "Seller IDs missing" });
    }

    if (!template_id) {
      return res.status(400).json({ status: false, message: "Template not selected" });
    }

    const template = await Emails.findOne({
      where: {
        id: template_id,
        is_seller_direct: 1
      }
    });

    if (!template) {
      return res.status(404).json({ status: false, message: "Template not found" });
    }

    // Get all sellers by IDs
    const sellers = await Users.findAll({
      where: { id: ids, status: 1 }
    });

    // send mails
    for (const seller of sellers) {

      let verification_link = `<a class='back_to' href='/'  
        style='background: linear-gradient(90deg, rgb(248 143 66) 45%, #38a15a 100%);
        border: 1px solid transparent; padding: 4px 10px; font-size: 12px; 
        border-radius: 4px; color: #fff;'>
        Click and Login Account
      </a>`;

      const APP_URL = process.env.APP_URL

      const msgStr = template.message.toString('utf8');
      let userMessage = msgStr
        .replace("{{ USER_NAME }}", `${seller.fname} ${seller.lname}`)
        .replace("{{ USER_EMAIL }}", seller.email)
        .replace("{{ USER_PASSWORD }}", seller.real_password)
        .replace("{{ APP_URL }}", APP_URL)
        .replace("{{ VERIFICATION_LINK }}", verification_link);

      await sendMail({ to: seller.email, subject: template?.subject, message: userMessage });



      const ipaddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '0.0.0.0';

      // Optional: if you use a location library
      let city = null, state = null, country = null, location = null;
      try {
        const currentUserInfo = await Location.get(ipaddress);
        city = currentUserInfo?.cityName || null;
        state = currentUserInfo?.regionName || null;
        country = currentUserInfo?.countryName || null;
        location = JSON.stringify(currentUserInfo || {});
      } catch (e) {
        console.warn("Location fetch failed:", e.message);
      }
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await SellerMailHistories.create({
        mail_type: 3,
        mail: seller.email,
        mail_template_id: template.id,
        user_id: seller.id,
        email_id: template.id,
        status: 1,
        company_id: seller.company_id,
        ip_address: ipaddress,
        city: city || '',
        state: state || '',
        country: country || '',
        location: location || '',
        mail_send_time: now,
        is_sent: 0,
        is_failed: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    return res.json({ status: true, message: "Mail sent successfully!" });

  } catch (error) {
    console.error("Send mail error:", error);
    return res.status(500).json({ status: false, message: "Internal error" });
  }
};

exports.getFilteredSellers = async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      mobile,
      zipcode,
      company_id,
      member_role,
      status,
      is_approve,
      state,
      city,
      dateRange = '',
      startDate,
      endDate
    } = req.query;

    // Base where condition
    const where = {
      is_seller: 1,
      is_delete: 0
    };

    if (fname) where.fname = { [Op.like]: `%${fname}%` };
    if (lname) where.lname = { [Op.like]: `%${lname}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (mobile) where.mobile = { [Op.like]: `%${mobile}%` };
    if (zipcode) where.zipcode = { [Op.like]: `%${zipcode}%` };
    if (company_id) where.company_id = company_id;
    if (member_role) where.member_role = member_role;
    if (status) where.status = status;
    if (is_approve) where.is_approve = is_approve;
    if (state) where.state = state;
    if (city) where.city = city;

    // Date filter
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
      where.created_at = dateCondition;
    }

    // Fetch sellers with associations
    const sellers = await Users.findAll({
      where,
      include: [
        { model: Countries, as: 'country_data', attributes: ['name'] },
        { model: States, as: 'state_data', attributes: ['name'] },
        { model: Cities, as: 'city_data', attributes: ['name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['organization_name', 'designation'],
          include: [
            { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
            { model: Activity, as: 'Activity', attributes: ['name'] },
          ]
        },
        {
          model: SellerCategory,
          as: 'seller_categories',
          attributes: ['id'],
          include: [
            { model: Categories, as: 'category', attributes: ['id', 'name'] },
            { model: SubCategories, as: 'subcategory', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    // Map the results
    const data = sellers.map(seller => {
      const s = seller.toJSON();
      const categoryNames = s.seller_categories?.length
        ? [...new Set(s.seller_categories.map(sc => sc.category?.name).filter(Boolean))].join(', ')
        : 'NA';
      const subCategoryNames = s.seller_categories?.length
        ? [...new Set(s.seller_categories.map(sc => sc.subcategory?.name).filter(Boolean))].join(', ')
        : 'NA';

      return {
        id: s.id,
        full_name: `${s.fname} ${s.lname}`,
        fname: s.fname,
        lname: s.lname,
        email: s.email,
        mobile: s.mobile,
        address: s.address,
        zipcode: s.zipcode,
        country_name: s.country_data?.name || 'NA',
        state_name: s.state_data?.name || 'NA',
        city_name: s.city_data?.name || 'NA',
        organization_name: s.company_info?.organization_name || null,
        designation: s.company_info?.designation || null,
        coreactivity_name: s.company_info?.CoreActivity?.name || 'NA',
        activity_name: s.company_info?.Activity?.name || 'NA',
        category_names: categoryNames,
        sub_category_names: subCategoryNames,
        status: s.status == 1 ? 'Active' : 'Inactive',
        is_approve: s.is_approve == 1 ? 'Approved' : 'Pending',
        member_role: s.member_role == 1 ? 'Admin' : '',
        created_at: s.created_at
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccountStatus = async (req, res) => {
  try {
    const { is_approve } = req.body;
    if (is_approve !== 0 && is_approve !== 1) {
      return res.status(400).json({ message: 'Invalid account status. Use 1 (Approve) or 0 (Unapprove).' });
    }
    const sellers = await Users.findByPk(req.params.id);
    if (!sellers) return res.status(404).json({ message: 'Seller not found' });
    sellers.is_approve = is_approve;
    if (is_approve === 1) {
      sellers.is_new = 1;
      sellers.status = 1;
      sellers.approve_date = new Date();
    } else {
      sellers.approve_date = null;
    }
    await sellers.save();
    // Send approval email when account is approved (template id 63)
    try {
      if (is_approve === 1) {
        const template = await Emails.findByPk(63);
        let msgStr = template && template.message ? template.message.toString('utf8') : '';
        if (!msgStr) msgStr = 'Your account has been approved.';
        // Try to fetch company name if available
        let companyName = '';
        try {
          const company = await CompanyInfo.findByPk(sellers.company_id);
          companyName = company?.organization_name || '';
        } catch (e) {
          // ignore
        }
        const userFullName = (sellers.fname || sellers.lname) ? `${sellers.fname || ''} ${sellers.lname || ''}`.trim() : (sellers.email || '');
        msgStr = msgStr
          .replace(/{{\s*USER_NAME\s*}}/gi, userFullName)
          .replace(/{{\s*USER_EMAIL\s*}}/gi, sellers.email || '')
          .replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName || '');
        try {
          await sendMail({ to: sellers.email, subject: template?.subject || 'Account approved', message: msgStr });
        } catch (err) {
          console.error('Error sending approval email to seller:', err);
        }
      }
    } catch (e) {
      console.error('Approval email flow error:', e);
    }

    res.json({ message: 'Account status updated', sellers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addOrUpdateSellerMessage = async (req, res) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id)
      return res.status(400).json({ message: "user_id is required" });
    // load user (for sending decline email) when message is created/updated
    const user = await Users.findByPk(user_id);
    const existing = await SellerMessages.findOne({
      where: { user_id }
    });
    if (existing) {
      existing.message = message;
      existing.updated_at = new Date();
      await existing.save();
      // attempt to send decline email (template id 64) but do not block response
      try {
        const template = await Emails.findByPk(64);
        if (template && user && user.email) {
          let msgStr = template.message ? template.message.toString('utf8') : '';
          const userMessage = msgStr
            .replace(/{{\s*USER_NAME\s*}}/gi, `${user.fname || ''} ${user.lname || ''}`.trim())
            .replace(/{{\s*USER_EMAIL\s*}}/gi, user.email || '')
            .replace(/{{\s*MESSAGE\s*}}/gi, message || '')
            .replace(/{{\s*COMPANY_NAME\s*}}/gi, user?.user_company || '');
          try { await sendMail({ to: user.email, subject: template?.subject || 'Application Declined', message: userMessage }); } catch (e) { console.error('Decline mail send error:', e.message || e); }
        }
      } catch (e) {
        console.error('Decline template lookup/send error:', e.message || e);
      }

      return res.json({
        message: 'Seller message updated',
        data: existing
      });
    }
    const created = await SellerMessages.create({
      user_id,
      message
    });
    // attempt to send decline email (template id 64) but do not block response
    try {
      const template = await Emails.findByPk(64);
      if (template && user && user.email) {
        let msgStr = template.message ? template.message.toString('utf8') : '';
        const userMessage = msgStr
          .replace(/{{\s*USER_NAME\s*}}/gi, `${user.fname || ''} ${user.lname || ''}`.trim())
          .replace(/{{\s*USER_EMAIL\s*}}/gi, user.email || '')
          .replace(/{{\s*MESSAGE\s*}}/gi, message || '')
          .replace(/{{\s*COMPANY_NAME\s*}}/gi, user?.user_company || '');
        try { await sendMail({ to: user.email, subject: template?.subject || 'Application Declined', message: userMessage }); } catch (e) { console.error('Decline mail send error:', e.message || e); }
      }
    } catch (e) {
      console.error('Decline template lookup/send error:', e.message || e);
    }
    return res.json({
      message: 'Seller message created',
      data: created
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getSellerMessage = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id)
      return res.status(400).json({ message: "user_id is required" });
    const message = await SellerMessages.findOne({
      where: { user_id },
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['id', 'fname', 'lname', 'email', 'is_seller']
        }
      ]
    });
    if (!message) { return res.status(404).json({ message: "Seller message not found", data: null }); }
    return res.json({
      message: "Seller message fetched successfully",
      data: message
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getSellersWithMessages = async (req, res) => {
  try {
    const messages = await SellerMessages.findAll({
      attributes: ['user_id'],
      where: { user_id: { [Sequelize.Op.ne]: null } }
    });
    const user_ids = messages.map(m => m.user_id);
    res.json({ user_ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSellerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const sellers = await Users.findByPk(req.params.id);
    if (!sellers) return res.status(404).json({ message: 'Sellers not found' });
    sellers.status = status;
    await sellers.save();
    res.json({ message: 'Status updated', sellers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSellerDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const sellers = await Users.findByPk(req.params.id);
    if (!sellers) return res.status(404).json({ message: 'Seller not found' });
    sellers.is_delete = is_delete;
    await sellers.save();
    res.json({ message: 'Seller is removed', sellers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSellerCategories = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const sellerCategories = await SellerCategory.findAll({
      where: { user_id },
      attributes: [], // we only want included category
      include: [
        {
          model: Categories,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      raw: true,
    });

    // Deduplicate categories
    const categoryMap = {};
    sellerCategories.forEach(sc => {
      if (sc['category.id'] && !categoryMap[sc['category.id']]) {
        categoryMap[sc['category.id']] = {
          id: sc['category.id'],
          name: sc['category.name'],
          slug: sc['category.slug'],
        };
      }
    });

    const categories = Object.values(categoryMap);
    res.json(categories);
  } catch (err) {
    console.error('getSellerCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get subcategories for a seller and category
exports.getSellerSubCategories = async (req, res) => {
  try {
    const { user_id, category_id } = req.query;

    if (!user_id || !category_id)
      return res.status(400).json({ error: 'user_id and category_id are required' });

    const sellerSubCategories = await SellerCategory.findAll({
      where: { user_id, category_id },
      attributes: [],
      include: [
        {
          model: SubCategories,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      raw: true,
    });

    // Deduplicate subcategories
    const subCategoryMap = {};
    sellerSubCategories.forEach(sc => {
      if (sc['subcategory.id'] && !subCategoryMap[sc['subcategory.id']]) {
        subCategoryMap[sc['subcategory.id']] = {
          id: sc['subcategory.id'],
          name: sc['subcategory.name'],
          slug: sc['subcategory.slug'],
        };
      }
    });

    const subcategories = Object.values(subCategoryMap);
    res.json(subcategories);
  } catch (err) {
    console.error('getSellerSubCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

const buildEmptyTrend = (period) => {
  const trend = {};

  if (period === "day") {
    for (let i = 0; i < 30; i++) {
      trend[moment().subtract(29 - i, "days").format("YYYY-MM-DD")] = 0;
    }
  } else if (period === "month") {
    for (let i = 0; i < 12; i++) {
      trend[moment().subtract(11 - i, "months").format("YYYY-MM")] = 0;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      trend[moment().subtract(4 - i, "years").format("YYYY")] = 0;
    }
  }
  return trend;
};

const fetchTrend = async (where, groupFormat, startDate, today) => {
  const rows = await Users.findAll({
    attributes: [
      [fn("DATE_FORMAT", col("created_at"), groupFormat), "date"],
      [fn("COUNT", col("user_id")), "count"],
    ],
    where: {
      ...where,
      created_at: { [Op.between]: [startDate, today] },
    },
    group: ["date"],
    raw: true,
  });

  return rows.reduce((acc, r) => {
    acc[r.date] = parseInt(r.count, 10);
    return acc;
  }, {});
};

exports.getSellerTrends = async (req, res) => {
  try {
    const period = req.query.period || "day";
    const fromDateStr = req.query.from; // expected format: YYYY-MM-DD or YYYY-MM or YYYY
    const toDateStr = req.query.to;

    let startDate, today, groupFormat;

    // Parse 'to' date or default to end of today
    today = toDateStr ? moment(toDateStr).endOf("day") : moment().endOf("day");

    // Parse 'from' date or default based on period
    if (fromDateStr) {
      startDate = moment(fromDateStr).startOf("day");
    } else {
      if (period === "day") {
        startDate = moment().subtract(29, "days").startOf("day");
      } else if (period === "month") {
        startDate = moment().subtract(11, "months").startOf("month");
      } else {
        startDate = moment().subtract(4, "years").startOf("year");
      }
    }

    // Determine groupFormat based on period or date range
    // You can also add logic to infer groupFormat from date range length if you want
    if (period === "day") {
      groupFormat = "%Y-%m-%d";
    } else if (period === "month") {
      groupFormat = "%Y-%m";
    } else {
      groupFormat = "%Y";
    }

    // Build empty trend based on the actual date range length
    // Optionally, you can modify buildEmptyTrend to accept startDate and endDate for more flexibility
    const base = buildEmptyTrend(period);

    const active = {
      ...base,
      ...(await fetchTrend(
        {
          is_seller: 1,
          status: 1,
          is_delete: 0,
          member_role: 1,
          is_complete: 1,
          is_approve: 1,
        },
        groupFormat,
        startDate.toDate(),
        today.toDate()
      )),
    };

    const inactive = {
      ...base,
      ...(await fetchTrend(
        {
          is_seller: 1,
          status: 0,
          is_delete: 0,
          member_role: 1,
          is_complete: 1,
        },
        groupFormat,
        startDate.toDate(),
        today.toDate()
      )),
    };

    const notApproved = {
      ...base,
      ...(await fetchTrend(
        {
          is_seller: 1,
          is_approve: 0,
          is_delete: 0,
          is_complete: 1,
        },
        groupFormat,
        startDate.toDate(),
        today.toDate()
      )),
    };

    const notCompleted = {
      ...base,
      ...(await fetchTrend(
        {
          is_seller: 1,
          is_complete: 0,
          is_delete: 0,
          is_approve: 0,
        },
        groupFormat,
        startDate.toDate(),
        today.toDate()
      )),
    };

    res.json({
      period,
      from: startDate.format("YYYY-MM-DD"),
      to: today.format("YYYY-MM-DD"),
      active,
      inactive,
      notApproved,
      notCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSellerChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch earliest seller record for MAX period
    const earliestUser = await Users.findOne({
      where: { is_seller: 1 },
      order: [["created_at", "ASC"]],
    });

    const start = startDate
      ? new Date(startDate)
      : earliestUser
        ? new Date(earliestUser.created_at)
        : new Date(new Date().setFullYear(new Date().getFullYear() - 1)); // fallback 1 year ago

    const end = endDate ? new Date(endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Fetch grouped data
    const chartData = await Users.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("Users.created_at")), "date"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.status = 1 AND Users.is_delete = 0 AND Users.member_role = 1 AND Users.is_complete = 1 AND Users.is_approve = 1 THEN 1 ELSE 0 END"
            )
          ),
          "active"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.status = 0 AND Users.is_delete = 0 AND Users.member_role = 1 AND Users.is_complete = 1 THEN 1 ELSE 0 END"
            )
          ),
          "inactive"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.is_approve = 0 AND Users.is_delete = 0 AND Users.is_complete = 1 THEN 1 ELSE 0 END"
            )
          ),
          "notApproved"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.is_complete = 0 AND Users.is_delete = 0 AND Users.is_approve = 0 THEN 1 ELSE 0 END"
            )
          ),
          "notCompleted"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.is_delete = 1 THEN 1 ELSE 0 END"
            )
          ),
          "deleted"
        ],
      ],
      where: {
        is_seller: 1,
        created_at: { [Op.between]: [start, end] },
      },
      group: [Sequelize.fn("DATE", Sequelize.col("Users.created_at"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("Users.created_at")), "ASC"]],
    });

    // Convert to map for fast lookup
    const dataMap = {};
    chartData.forEach(row => {
      const rowDateStr = row.getDataValue("date"); // already 'YYYY-MM-DD'
      dataMap[rowDateStr] = {
        Active: parseInt(row.getDataValue("active")),
        Inactive: parseInt(row.getDataValue("inactive")),
        NotApproved: parseInt(row.getDataValue("notApproved")),
        NotCompleted: parseInt(row.getDataValue("notCompleted")),
        Deleted: parseInt(row.getDataValue("deleted")),
      };
    });

    // Fill missing dates
    const chartArray = [];
    const currentDate = new Date(start);
    let cumulativeActive = 0;
    let cumulativeInactive = 0;
    let cumulativeNotApproved = 0;
    let cumulativeNotCompleted = 0;
    let cumulativeDeleted = 0;

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const entry = dataMap[dateStr] || {
        Active: 0,
        Inactive: 0,
        NotApproved: 0,
        NotCompleted: 0,
        Deleted: 0
      };

      // Update cumulative totals
      cumulativeActive += entry.Active;
      cumulativeInactive += entry.Inactive;
      cumulativeNotApproved += entry.NotApproved;
      cumulativeNotCompleted += entry.NotCompleted;
      cumulativeDeleted += entry.Deleted;

      const total = cumulativeActive + cumulativeInactive + cumulativeNotApproved + cumulativeNotCompleted + cumulativeDeleted;

      chartArray.push({
        date: dateStr,
        Active: cumulativeActive,
        Inactive: cumulativeInactive,
        NotApproved: cumulativeNotApproved,
        NotCompleted: cumulativeNotCompleted,
        Deleted: cumulativeDeleted,
        Total: total
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.json(chartArray);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getSellerSubCategoriesByUser = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const rows = await SellerCategory.findAll({
      where: {
        user_id,
        subcategory_id: { [require('sequelize').Op.ne]: null },
      },
      attributes: [],
      include: [
        {
          model: SubCategories,
          as: 'subcategory',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Categories,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      raw: true,
    });

    // Deduplicate by subcategory id
    const subCategoryMap = {};

    rows.forEach(row => {
      const subId = row['subcategory.id'];
      if (!subId || subCategoryMap[subId]) return;

      subCategoryMap[subId] = {
        id: row['subcategory.id'],
        name: row['subcategory.name'],
        slug: row['subcategory.slug'],
        category_id: row['category.id'] || '',
        category_name: row['category.name'] || '',
        category_slug: row['category.slug'] || '',
      };
    });

    res.json(Object.values(subCategoryMap));
  } catch (err) {
    console.error('getSellerSubCategoriesByUser error:', err);
    res.status(500).json({ error: err.message });
  }
};