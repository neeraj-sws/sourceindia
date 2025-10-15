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
const secretKey = 'your_secret_key';
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await Users.findOne({
      where: { email: email, is_delete: 0 },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, is_seller: user.is_seller }, 'your_jwt_secret_key', {
      expiresIn: '1h',
    });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        is_seller: user.is_seller,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

function createSlug(inputString) {
  return inputString.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await Users.findOne({
      where: { email },
      attributes: ['id', 'fname', 'lname', 'email', 'password', 'status'] // Include password for comparison
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the hashed password stored in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, status: user.status }, // Add other info as needed
      secretKey,
      { expiresIn: '1h' } // Expiry time for the token
    );

    // Send the token to the client
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createBuyer = async (req, res) => {
  const upload = getMulterUpload();
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
        fname, lname, email, password, mobile, country, state, city, zipcode,
        user_company, website, is_trading, elcina_member, address, status, is_approve, step, products, is_seller,
        mode, real_password, remember_token, payment_status, is_email_verify, featured_company,        
        organization_name, company_website, organizations_product_description, is_star_seller, is_verified
      } = req.body;
      if (!fname || !lname || !email || !password || !mobile || !country || !state || !city || !zipcode ||
          !user_company || !website || !is_trading || !elcina_member || !address || !products) {
        deleteUploadedFiles();
        return res.status(400).json({ message: 'Missing required user fields.' });
      }
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
        is_seller: 0,
        file_id: profileImage.id,
        company_file_id: companyLogoImage.id,
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
          attributes: ['id', 'organization_name', 'category_sell'],
          include: [
            { model: MembershipPlan, as: 'MembershipPlan', attributes: ['id', 'name'] },
          ]
        },
        {
          model: BuyerInterests,
          as: 'buyer_interests',
          attributes: ['activity_id'],
          include: [
            { model: InterestSubCategories, as: 'activity', attributes: ['name'] }
          ]
        }
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
      buyersData.interest_names = buyersData.buyer_interests?.map(bi => bi.activity?.name).filter(Boolean).join(', ') || '';
      delete buyersData.country_data;
      delete buyersData.state_data;
      delete buyersData.city_data;
      delete buyersData.company_info;
      delete buyersData.buyer_interests;
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
        {model: UploadImage, as: 'file', attributes: ['file']},
        {model: UploadImage, as: 'company_file', attributes: ['file']},
        {model: Countries, as: 'country_data', attributes: ['name']},
        {model: States, as: 'state_data', attributes: ['name']},
        {model: Cities, as: 'city_data', attributes: ['name']}
      ]
    });    
    if (!buyers) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    let companyInfo = null;
    if (buyers.company_id) {
      companyInfo = await CompanyInfo.findByPk(buyers.company_id, {
      include: [
        {model: CoreActivity, as: 'CoreActivity', attributes: ['name']},
        {model: Activity, as: 'Activity', attributes: ['name']},
        {model: Categories, as: 'Categories', attributes: ['name']},
        {model: MembershipPlan, as: 'MembershipPlan', attributes: ['name']}
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
    const [total, addedToday, statusActive, statusInactive, notApproved] = await Promise.all([
      Users.count({ where: { is_seller: 0 } }),
      Users.count({
        where: {
          created_at: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
      }),
      Users.count({ where: { is_seller: 0, status: 1 } }),
      Users.count({ where: { is_seller: 0, status: 0 } }),
      Users.count({ where: { is_seller: 0, is_approve: 0 } }),
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
        await companyInfo.update({
          organization_name: req.body.user_company,
          organization_slug: createSlug(req.body.user_company),
          company_website: req.body.website,
          organizations_product_description: req.body.products,
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
      'status', 'is_approve', 'is_seller', 'walkin_buyer', 'created_at', 'updated_at'];
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
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    where.is_seller = 0;
    where.is_delete = 0;
    if (req.query.todayOnly === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.created_at = {
        [Op.between]: [startOfDay, endOfDay],
      };
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
    if (search) {
      searchWhere[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { user_company: { [Op.like]: `%${search}%` } },
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