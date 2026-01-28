const Sequelize = require('sequelize');
const moment = require('moment');
const { Op, fn, col } = Sequelize;
const fs = require('fs');
const path = require('path');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const UploadImage = require('../models/UploadImage');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');
const Categories = require('../models/Categories');
const MembershipPlan = require('../models/MembershipPlan');
const BuyerInterests = require('../models/BuyerInterests');
const InterestSubCategories = require('../models/InterestSubCategories');
const getMulterUpload = require('../utils/upload');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Emails = require('../models/Emails');
const { sendMail, getSiteConfig } = require('../helpers/mailHelper');

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

exports.createBuyer = async (req, res) => {
  const upload = getMulterUpload('users');
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_file', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const deleteUploadedFiles = () => {
      const files = [];
      if (req.files?.file) files.push(req.files.file[0].path);
      if (req.files?.company_file) files.push(req.files.company_file[0].path);
      files.forEach(filePath => {
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file ${filePath}:`, err.message);
        });
      });
    };
    try {
      const {
        fname, lname, email, password, mobile, alternate_number, country_code, country, state, city, zipcode,
        user_company, website, is_trading, elcina_member, address, status, is_approve, step, products, is_seller,
        mode, real_password, remember_token, payment_status, is_email_verify, featured_company, user_category, is_complete,
        organization_name, company_website, organizations_product_description, is_star_seller, is_verified, is_intrest, request_admin,
      } = req.body;
      // if (!fname || !lname || !email || !password || !mobile || !country || !state || !city || !zipcode ||
      //     !user_company || !website || !is_trading || !elcina_member || !address || !products) {
      //   deleteUploadedFiles();
      //   return res.status(400).json({ message: 'Missing required user fields.' });
      // }
      if (!validator.isEmail(email)) {
        deleteUploadedFiles();
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (!req.files?.file || !req.files?.company_file) {
        deleteUploadedFiles();
        return res.status(400).json({ message: 'All required files must be uploaded' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const profileImage = await UploadImage.create({ file: `upload/users/${req.files.file[0].filename}` });
      const companyLogoImage = await UploadImage.create({ file: `upload/users/${req.files.company_file[0].filename}` });
      const organization_slug = await createUniqueSlug(user_company);
      const user = await Users.create({
        fname,
        lname,
        email,
        mobile,
        alternate_number,
        country_code,
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
        is_seller: 0,
        file_id: profileImage.id,
        company_file_id: companyLogoImage.id,
        is_complete: is_complete || 1,
        is_intrest: is_intrest || 0,
        request_admin: request_admin || 0,
      });
      const companyInfo = await CompanyInfo.create({
        organization_name: user_company,
        organization_slug,
        company_website: website,
        is_star_seller: is_star_seller || 0,
        is_verified: is_verified || 0,
        organizations_product_description: products,
        featured_company: featured_company || 0,
        company_logo: companyLogoImage.id,
        is_delete: 0,
        user_category,
      });
      await user.update({
        company_id: companyInfo.id
      });
      res.status(201).json({
        message: 'Buyer created successfully',
        user,
        companyInfo
      });
    } catch (error) {
      deleteUploadedFiles();
      return res.status(500).json({ error: error.message });
    }
  });
};

exports.getAllBuyer = async (req, res) => {
  try {
    const buyers = await Users.findAll({
      where: { is_seller: 0 },
      order: [['id', 'ASC']],
      include: [
        { model: Countries, as: 'country_data', attributes: ['id', 'name'] },
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
        {
          model: CompanyInfo,
          as: 'company_info',
          attributes: ['id', 'organization_name'],
          include: [
            { model: MembershipPlan, as: 'MembershipPlan', attributes: ['id', 'name'] },
          ]
        },
        /*{
          model: BuyerInterests,
          as: 'buyer_interests',
          attributes: ['activity_id'],
          include: [
            { model: InterestSubCategories, as: 'activity', attributes: ['name'] }
          ]
        }*/
      ],
    });
    const modifiedBuyers = buyers.map(buyer => {
      const buyersData = buyer.toJSON();
      buyersData.getStatus = buyersData.status === 1 ? 'Active' : 'Inactive';
      buyersData.getApproved = buyersData.is_approve === 1 ? 'Approved' : 'Not Approved';
      buyersData.country_name = buyersData.country_data?.name || 'NA';
      buyersData.state_name = buyersData.state_data?.name || 'NA';
      buyersData.city_name = buyersData.city_data?.name || 'NA';
      buyersData.company_name = buyersData.company_info?.organization_name || null;
      buyersData.membership_plan_name = buyersData.company_info?.MembershipPlan?.name || 'NA';
      // buyersData.interest_names = buyersData.buyer_interests?.map(bi => bi.activity?.name).filter(Boolean).join(', ') || '';
      delete buyersData.country_data;
      delete buyersData.state_data;
      delete buyersData.city_data;
      delete buyersData.company_info;
      // delete buyersData.buyer_interests;
      return buyersData;
    });
    res.json(modifiedBuyers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerById = async (req, res) => {
  try {
    const buyers = await Users.findByPk(req.params.id, {
      include: [
        { model: UploadImage, as: 'file', attributes: ['file'] },
        { model: UploadImage, as: 'company_file', attributes: ['file'] },
        { model: Countries, as: 'country_data', attributes: ['name'] },
        { model: States, as: 'state_data', attributes: ['name'] },
        { model: Cities, as: 'city_data', attributes: ['name'] }
      ]
    });
    if (!buyers) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    let companyInfo = null;
    if (buyers.company_id) {
      companyInfo = await CompanyInfo.findByPk(buyers.company_id, {
        include: [
          { model: CoreActivity, as: 'CoreActivity', attributes: ['name'] },
          { model: Activity, as: 'Activity', attributes: ['name'] },
          { model: Categories, as: 'Categories', attributes: ['name'] },
          { model: MembershipPlan, as: 'MembershipPlan', attributes: ['name'] }
        ]
      });
    }
    const response = {
      ...buyers.toJSON(),
      ...(companyInfo ? companyInfo.toJSON() : {}),
      file_name: buyers.file ? buyers.file.file : null,
      company_file_name: buyers.company_file ? buyers.company_file.file : null,
      country_name: buyers.country_data ? buyers.country_data.name : null,
      state_name: buyers.state_data ? buyers.state_data.name : null,
      city_name: buyers.city_data ? buyers.city_data.name : null,
      coreactivity_name: companyInfo && companyInfo.CoreActivity ? companyInfo.CoreActivity.name : null,
      activity_name: companyInfo && companyInfo.Activity ? companyInfo.Activity.name : null,
      category_name: companyInfo && companyInfo.Categories ? companyInfo.Categories.name : null,
      plan_name: companyInfo && companyInfo.MembershipPlan ? companyInfo.MembershipPlan.name : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerCount = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const [total, addedToday, statusActive, statusInactive, notApproved, deleted] = await Promise.all([
      Users.count({
        where: { is_seller: 0 },
      }),

      // Sellers added today
      Users.count({

        where: { is_seller: 0, created_at: { [Op.between]: [todayStart, todayEnd] } },
      }),

      // Active sellers
      Users.count({
        where: { is_seller: 0, status: 1, is_delete: 0, is_approve: 1 },
      }),

      // Inactive sellers
      Users.count({
        where: { is_seller: 0, status: 0, is_delete: 0 },
      }),

      // Not approved sellers
      Users.count({
        where: { is_seller: 0, is_approve: 0, is_delete: 0, is_complete: 1, status: 1 },
      }),

      Users.count({
        where: { is_seller: 0, is_delete: 1 }
      }),
    ]);

    res.json({
      total,
      addedToday,
      statusActive,
      statusInactive,
      notApproved,
      deleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateBuyer = async (req, res) => {
  const upload = getMulterUpload('users');
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'company_file', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const buyerId = req.params.id;
      const user = await Users.findByPk(buyerId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const companyInfo = await CompanyInfo.findOne({ where: { id: user.company_id } });
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
        website: req.body.website,
        products: req.body.products,
        updated_at: new Date(),
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
      const companyLogo = req.files?.company_file?.[0];
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
      await user.update(updatedData);
      if (companyInfo) {
        let organization_slug = companyInfo.organization_slug;
        if (req.body.user_company && req.body.user_company !== companyInfo.organization_name) {
          organization_slug = await createUniqueSlug(req.body.user_company);
        }
        await companyInfo.update({
          organization_name: req.body.user_company,
          organization_slug,
          company_website: req.body.website,
          organizations_product_description: req.body.products,
          user_category: req.body.user_category,
        });
      }
      res.status(200).json({ message: 'Buyer updated successfully', user });
    } catch (err) {
      console.error('Error in updateBuyer:', err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteBuyer = async (req, res) => {
  try {
    const buyers = await Users.findByPk(req.params.id);
    if (!buyers) return res.status(404).json({ message: 'Buyer not found' });
    if (buyers.file_id) {
      const profileImage = await UploadImage.findByPk(buyers.file_id);
      if (profileImage) {
        const oldImagePath = path.resolve(profileImage.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await profileImage.destroy();
      }
    }
    if (buyers.company_file_id) {
      const companyLogo = await UploadImage.findByPk(buyers.company_file_id);
      if (companyLogo) {
        const oldImagePath = path.resolve(companyLogo.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await companyLogo.destroy();
      }
    }
    const companyInfo = await CompanyInfo.findOne({ where: { id: buyers.company_id } });
    if (companyInfo) {
      await companyInfo.destroy();
    }
    await buyers.destroy();
    res.json({ message: 'Buyer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedBuyer = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const buyers = await Users.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (buyers.length === 0) {
      return res.status(404).json({ message: 'No buyer found with the given IDs.' });
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
    res.json({ message: `${buyers.length} buyer marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateBuyerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const buyers = await Users.findByPk(req.params.id);
    if (!buyers) return res.status(404).json({ message: 'Buyer not found' });
    buyers.status = status;
    await buyers.save();

    // Send notification emails based on status (non-blocking)
    try {
      const siteConfig = await getSiteConfig();

      const company = await CompanyInfo.findByPk(buyers.company_id).catch(() => null);
      const companyName = company?.organization_name || '';
      const userFullName = `${buyers.fname || ''} ${buyers.lname || ''}`.trim() || buyers.email || '';

      if (status === 1) {
        // status=1: user -> template 4, admin -> template 11
        try {
          const userTpl = await Emails.findByPk(4);
          let msgStr = userTpl && userTpl.message ? userTpl.message.toString('utf8') : '';
          if (!msgStr) msgStr = 'Your account has been activated.';
          msgStr = msgStr
            .replace(/{{\s*USER_FNAME\s*}}/gi, userFullName)
            .replace(/{{\s*USER_EMAIL\s*}}/gi, buyers.email || '')
            .replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName);
          try { if (buyers.email) await sendMail({ to: buyers.email, subject: userTpl?.subject || 'Account Activated', message: msgStr }); } catch (e) { console.error('Error sending buyer status=1 user email:', e); }
        } catch (e) { console.error('Error preparing buyer status=1 user email:', e); }

        try {
          const adminTpl = await Emails.findByPk(11);
          let msgStr = adminTpl && adminTpl.message ? adminTpl.message.toString('utf8') : '';
          if (!msgStr) msgStr = `Buyer ${userFullName} has been activated.`;
          msgStr = msgStr
            .replace(/{{\s*USER_FNAME\s*}}/gi, userFullName)
            .replace(/{{\s*USER_EMAIL\s*}}/gi, buyers.email || '')
            .replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName);
          try { if (siteConfig && siteConfig['site_email']) await sendMail({ to: siteConfig['site_email'], subject: adminTpl?.subject || 'Buyer Activated', message: msgStr }); } catch (e) { console.error('Error sending buyer status=1 admin email:', e); }
        } catch (e) { console.error('Error preparing buyer status=1 admin email:', e); }
      } else {
        // status=0: user -> template 5, admin -> template 12
        try {
          const userTpl = await Emails.findByPk(5);
          let msgStr = userTpl && userTpl.message ? userTpl.message.toString('utf8') : '';
          if (!msgStr) msgStr = 'Your account has been deactivated.';
          msgStr = msgStr
            .replace(/{{\s*USER_FNAME\s*}}/gi, userFullName)
            .replace(/{{\s*USER_EMAIL\s*}}/gi, buyers.email || '')
            .replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName);
          try { if (buyers.email) await sendMail({ to: buyers.email, subject: userTpl?.subject || 'Account Deactivated', message: msgStr }); } catch (e) { console.error('Error sending buyer status=0 user email:', e); }
        } catch (e) { console.error('Error preparing buyer status=0 user email:', e); }

        try {
          const adminTpl = await Emails.findByPk(12);
          let msgStr = adminTpl && adminTpl.message ? adminTpl.message.toString('utf8') : '';
          if (!msgStr) msgStr = `Buyer ${userFullName} has been deactivated.`;
          msgStr = msgStr
            .replace(/{{\s*USER_FNAME\s*}}/gi, userFullName)
            .replace(/{{\s*USER_EMAIL\s*}}/gi, buyers.email || '')
            .replace(/{{\s*COMPANY_NAME\s*}}/gi, companyName);
          try { if (siteConfig && siteConfig['site_email']) await sendMail({ to: siteConfig['site_email'], subject: adminTpl?.subject || 'Buyer Deactivated', message: msgStr }); } catch (e) { console.error('Error sending buyer status=0 admin email:', e); }
        } catch (e) { console.error('Error preparing buyer status=0 admin email:', e); }
      }
    } catch (e) {
      console.error('Buyer status email flow error:', e);
    }

    res.json({ message: 'Status updated', buyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccountStatus = async (req, res) => {
  try {
    const { is_approve } = req.body;
    if (is_approve !== 0 && is_approve !== 1) {
      return res.status(400).json({ message: 'Invalid account status. Use 1 (Active) or 0 (Deactive).' });
    }
    const buyers = await Users.findByPk(req.params.id);
    if (!buyers) return res.status(404).json({ message: 'Buyer not found' });
    buyers.is_approve = is_approve;
    await buyers.save();

    // Send approval email when account is approved (template id 63)
    try {
      if (is_approve === 1) {
        const template = await Emails.findByPk(63);
        let msgStr = template && template.message ? template.message.toString('utf8') : '';
        if (!msgStr) msgStr = 'Your account has been approved.';
        let companyName = '';
        try {
          const company = await CompanyInfo.findByPk(buyers.company_id);
          companyName = company?.organization_name || '';
        } catch (e) { }
        const userFullName = (buyers.fname || buyers.lname) ? `${buyers.fname || ''} ${buyers.lname || ''}`.trim() : (buyers.email || '');


        msgStr = msgStr
          .replace(/{{\s*USER_FNAME\s*}}/gi, userFullName)
          .replace(/{{\s*USER_TYPE\s*}}/gi, buyers.user_type === 1 ? 'Seller' : 'Buyer');
        try {
          await sendMail({ to: buyers.email, subject: template?.subject || 'Account approved', message: msgStr });
        } catch (err) {
          console.error('Error sending approval email to buyer:', err);
        }
      }
    } catch (e) {
      console.error('Approval email flow error (buyer):', e);
    }

    res.json({ message: 'Account status updated', buyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSellerStatus = async (req, res) => {
  try {
    const { is_seller } = req.body;
    if (is_seller !== 0 && is_seller !== 1) {
      return res.status(400).json({ message: 'Invalid seller status. Use 1 (Active) or 0 (Deactive).' });
    }
    const buyers = await Users.findByPk(req.params.id);
    if (!buyers) return res.status(404).json({ message: 'Buyer not found' });
    buyers.is_seller = is_seller;
    await buyers.save();
    res.json({ message: 'Seller status updated', buyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBuyerDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const buyers = await Users.findByPk(req.params.id);
    if (!buyers) return res.status(404).json({ message: 'Buyer not found' });
    buyers.is_delete = is_delete;
    await buyers.save();
    res.json({ message: 'Buyer is removed', buyers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBuyerServerSide = async (req, res) => {
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
      full_name,
      customerId
    } = req.query;
    const validColumns = ['id', 'fname', 'lname', 'full_name', 'email', 'mobile', 'country_name', 'state_name',
      'city_name', 'zipcode', 'user_company', 'website', 'is_trading', 'elcina_member', 'address', 'products',
      'status', 'is_approve', 'is_seller', 'walkin_buyer', 'user_category', 'created_at', 'updated_at'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'country_name') {
      order = [[{ model: Countries, as: 'Countries' }, 'name', sortDirection]];
    } else if (sortBy === 'state_name') {
      order = [[{ model: States, as: 'States' }, 'name', sortDirection]];
    } else if (sortBy === 'city_name') {
      order = [[{ model: Cities, as: 'Cities' }, 'name', sortDirection]];
    } else if (sortBy === 'full_name') {
      order = [[fn('concat', col('fname'), ' ', col('lname')), sortDirection]];
    } else if (sortBy === 'user_category') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, 'user_category', sortDirection]];
    } else if (sortBy === 'user_company') {
      order = [[{ model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }

    let where = {};
    let searchWhere = {};

    if (req.query.todayOnly === 'true') {
      // Only apply is_seller, is_delete, and date filter
      where.is_seller = 0;
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
      where.is_seller = 0;
      where.is_delete = 0;
      if (req.query.getInactive !== 'true' && req.query.getDeleted !== 'true') {
        where.is_approve = 1;
        where.status = 1;
        where.member_role = 1;
        // where.step >= 3;
        where.is_complete = 1;
      }
      if (req.query.getInactive === 'true') {
        where.status = 0;
      }
      if (req.query.getNotApproved === 'true') {
        where.is_approve = 0;
      }
      if (req.query.getDeleted === 'true') {
        where.is_delete = 1;
      }
      searchWhere = { ...where };
    }
    if (country) {
      searchWhere.country = country;
    }
    if (state) {
      searchWhere.state = state;
    }
    if (city) {
      searchWhere.city = city;
    }
    if (search) {
      searchWhere[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { '$company_info.organization_name$': { [Op.like]: `%${search}%` } },
        { '$company_info.user_category$': { [Op.like]: `%${search}%` } },
        { '$country_data.name$': { [Op.like]: `%${search}%` } },
        { '$state_data.name$': { [Op.like]: `%${search}%` } },
        { '$city_data.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    if (customerId) {
      searchWhere.id = {
        [Op.like]: `%${customerId}%`
      };
    }
    if (full_name) {
      if (!searchWhere[Op.or]) searchWhere[Op.or] = [];
      searchWhere[Op.or].push(
        Sequelize.where(
          fn('concat', col('fname'), ' ', col('lname')),
          {
            [Op.like]: `%${full_name}%`
          }
        )
      );
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
    const totalRecords = await Users.count({ where });
    const { count: filteredRecords, rows } = await Users.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: UploadImage, as: 'file', attributes: ['file'] },
        { model: UploadImage, as: 'company_file', attributes: ['file'] },
        { model: CompanyInfo, as: 'company_info', attributes: ['organization_name', 'organization_slug', 'user_category'] },
        { model: Countries, as: 'country_data', attributes: ['name'] },
        { model: States, as: 'state_data', attributes: ['name'] },
        { model: Cities, as: 'city_data', attributes: ['name'] },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      full_name: `${row.fname} ${row.lname}`,
      email: row.email,
      password: row.password,
      remember_token: row.remember_token,
      file_id: row.file_id,
      file_name: row.file ? row.file.file : null,
      company_file_id: row.company_file_id,
      company_file_name: row.company_file ? row.company_file.file : null,
      user_category: row.company_info ? row.company_info.user_category : null,
      mobile: row.mobile,
      country: row.country,
      state: row.state,
      city: row.city,
      country_name: row.country_data?.name || 'NA',
      state_name: row.state_data?.name || 'NA',
      city_name: row.city_data?.name || 'NA',
      zipcode: row.zipcode,
      user_company: row.company_info ? row.company_info.organization_name : null,
      company_slug: row.company_info ? row.company_info.organization_slug : null,
      website: row.website,
      is_trading: row.is_trading,
      elcina_member: row.elcina_member,
      address: row.address,
      products: row.products,
      status: row.status,
      is_approve: row.is_approve,
      is_seller: row.is_seller,
      is_delete: row.is_delete,
      walkin_buyer: row.walkin_buyer,
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

exports.getFilteredBuyers = async (req, res) => {
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
      is_seller: 0,
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

    // Fetch buyers with associations
    const buyers = await Users.findAll({
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
        }
      ]
    });

    // Map the results
    const data = buyers.map(buyer => {
      const s = buyer.toJSON();

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

exports.getBuyerChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch earliest seller record for MAX period
    const earliestUser = await Users.findOne({
      where: { is_seller: 0 },
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
              "CASE WHEN Users.status = 1 AND Users.is_delete = 0 AND Users.is_approve = 1 THEN 1 ELSE 0 END"
            )
          ),
          "active"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.status = 0 AND Users.is_delete = 0 THEN 1 ELSE 0 END"
            )
          ),
          "inactive"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Users.is_approve = 0 AND Users.is_delete = 0 AND Users.status = 1 THEN 1 ELSE 0 END"
            )
          ),
          "notApproved"
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
        is_seller: 0,
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
        Deleted: parseInt(row.getDataValue("deleted")),
      };
    });

    // Fill missing dates
    const chartArray = [];
    const currentDate = new Date(start);
    let cumulativeActive = 0;
    let cumulativeInactive = 0;
    let cumulativeNotApproved = 0;
    let cumulativeDeleted = 0;

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const entry = dataMap[dateStr] || {
        Active: 0,
        Inactive: 0,
        NotApproved: 0,
        Deleted: 0
      };

      // Update cumulative totals
      cumulativeActive += entry.Active;
      cumulativeInactive += entry.Inactive;
      cumulativeNotApproved += entry.NotApproved;
      cumulativeDeleted += entry.Deleted;

      const total = cumulativeActive + cumulativeInactive + cumulativeNotApproved + cumulativeDeleted;

      chartArray.push({
        date: dateStr,
        Active: cumulativeActive,
        Inactive: cumulativeInactive,
        NotApproved: cumulativeNotApproved,
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