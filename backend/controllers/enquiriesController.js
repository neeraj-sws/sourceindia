const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const Enquiries = require('../models/Enquiries');
const OpenEnquriy = require('../models/OpenEnquiries');
const Users = require('../models/Users');
const Products = require('../models/Products');
const CompanyInfo = require('../models/CompanyInfo');
const EnquiryUsers = require('../models/EnquiryUsers');
const UserMessage = require('../models/UserMessage');
const EnquiryMessage = require('../models/EnquiryMessage');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const UserActivity = require('../models/UserActivity');
const Emails = require('../models/Emails');
const { getTransporter } = require('../helpers/mailHelper');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiries.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: Users,
          as: 'from_user',
          attributes: [
            'id', 'email', 'mobile', 'company_id', 'is_seller', 'fname', 'lname',
            [fn('CONCAT', col('from_user.fname'), ' ', col('from_user.lname')), 'full_name']
          ],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: [['organization_name', 'organization_name']],
              required: false,
            }
          ],
          required: false,
        },
        {
          model: Users,
          as: 'to_user',
          attributes: [
            ['id', 'id'],
            ['email', 'to_email'],
            ['mobile', 'to_mobile'],
            ['company_id', 'to_company_id'],
            'is_seller',
            'fname',
            'lname',
            [fn('CONCAT', col('to_user.fname'), ' ', col('to_user.lname')), 'to_full_name']
          ],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: [['organization_name', 'organization_name']],
              required: false,
            }
          ],
          required: false,
        }
      ]
    });
    const modifiedEnquiries = enquiries.map(enquiry => {
      const data = enquiry.toJSON();
      const result = {
        ...data,
        getStatus: data.status === 1 ? 'Active' : 'Inactive',
        from_full_name: data.from_user ? `${data.from_user.fname} ${data.from_user.lname}` : null,
        from_fname: data.from_user?.fname || null,
        from_lname: data.from_user?.lname || null,
        from_email: data.from_user?.email || null,
        from_mobile: data.from_user?.mobile || null,
        from_organization_name: data.from_user?.company_info?.organization_name || null,
        from_user_type: data.from_user?.is_seller ?? null,
        to_full_name: data.to_user ? `${data.to_user.fname} ${data.to_user.lname}` : null,
        to_fname: data.to_user?.fname || null,
        to_lname: data.to_user?.lname || null,
        to_email: data.to_user?.to_email || null,
        to_mobile: data.to_user?.to_mobile || null,
        to_company_id: data.to_user?.to_company_id || null,
        to_organization_name: data.to_user?.company_info?.organization_name || null,
        to_user_type: data.to_user?.is_seller ?? null,
      };
      delete result.from_user;
      delete result.to_user;
      return result;
    });
    res.json(modifiedEnquiries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEnquiriesByNumber = async (req, res) => {
  try {
    const enquiry = await Enquiries.findOne({
      where: { enquiry_number: req.params.enquiry_number },
      include: [
        {
          model: Users,
          as: 'from_user',
          attributes: ['id', 'email', 'mobile', 'company_id', 'fname', 'lname'],
          include: [{
            model: CompanyInfo,
            as: 'company_info',
            attributes: ['organization_name'],
            required: false,
          }],
          required: false,
        },
        {
          model: Users,
          as: 'to_user',
          attributes: ['id', 'email', 'mobile', 'company_id', 'fname', 'lname'],
          include: [{
            model: CompanyInfo,
            as: 'company_info',
            attributes: ['organization_name'],
            required: false,
          }],
          required: false,
        },
        {
          model: EnquiryUsers,
          as: 'enquiry_users',
          attributes: ['id', 'product_name']
        }
      ]
    });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({
      ...enquiry.toJSON(),
      from_full_name: enquiry.from_user ? `${enquiry.from_user.fname} ${enquiry.from_user.lname}` : null,
      from_email: enquiry.from_user?.email || null,
      from_mobile: enquiry.from_user?.mobile || null,
      from_company_id: enquiry.from_user?.company_id || null,
      from_organization_name: enquiry.from_user?.company_info?.organization_name || null,
      to_full_name: enquiry.to_user ? `${enquiry.to_user.fname} ${enquiry.to_user.lname}` : null,
      to_email: enquiry.to_user?.email || null,
      to_mobile: enquiry.to_user?.mobile || null,
      to_company_id: enquiry.to_user?.company_id || null,
      to_organization_name: enquiry.to_user?.company_info?.organization_name || null,
      enquiry_product: enquiry.enquiry_users[0]?.product_name || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEnquiriesCount = async (req, res) => {
  try {
    const total = await Enquiries.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEnquiries = async (req, res) => {
  try {
    const enquiry = await Enquiries.findByPk(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiries not found' });
    await enquiry.destroy();
    res.json({ message: 'Enquiries deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedEnquiries = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const enquiries = await Enquiries.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (enquiries.length === 0) {
      return res.status(404).json({ message: 'No enquiries found with the given IDs.' });
    }
    await Enquiries.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${enquiries.length} enquiries marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateEnquiriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const enquiries = await Enquiries.findByPk(req.params.id);
    if (!enquiries) return res.status(404).json({ message: 'Enquiries not found' });
    enquiries.is_delete = is_delete;
    await enquiries.save();
    res.json({ message: 'Enquiries is removed', enquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllEnquiriesServerSide = async (req, res) => {
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
      enquiry_no,
      category,
      sub_category,
      user_id
    } = req.query;
    const validColumns = [
      'id', 'enquiry_number', 'created_at', 'updated_at', 'name', 'email', 'phone', 'category_name', 'sub_category_name',
      'company', 'from_email', 'from_organization_name', 'to_organization_name', 'enquiry_product', 'quantity', 'is_approve'
    ];
    const viewType = req.query.viewType || 'dashboard';
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'from_full_name') {
      order = [[
        literal(`CONCAT(from_user.fname, ' ', from_user.lname)`), sortDirection
      ]];
    } else if (sortBy === 'from_organization_name') {
      order = [[
        { model: Users, as: 'from_user' },
        { model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection
      ]];
    } else if (sortBy === 'to_organization_name') {
      order = [[
        { model: Users, as: 'to_user' },
        { model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection
      ]];
    } else if (sortBy === 'enquiry_product') {
      order = [[
        { model: EnquiryUsers, as: 'enquiry_users' }, 'product_name', sortDirection
      ]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (req.query.getPublic === 'true') { where.user_id = null; }
    if (req.query.user_id) { where.user_id = req.query.user_id; }
    if (req.query.getApprove === 'true') { where.is_approve = 1; }
    if (req.query.getNotApprove === 'true') { where.is_approve = 0; }
    if (req.query.getDeleted === 'true') { baseWhere.is_delete = 1; }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [];
      if (viewType === 'leads') {
        searchWhere[Op.or].push(
          { enquiry_number: { [Op.like]: `%${search}%` } },
          { quantity: { [Op.like]: `%${search}%` } },
          { category_name: { [Op.like]: `%${search}%` } },
          literal(`CONCAT(from_user.fname, ' ', from_user.lname) LIKE '%${search}%'`),
          { '$from_user.email$': { [Op.like]: `%${search}%` } },
          { '$from_user.mobile$': { [Op.like]: `%${search}%` } },
          { '$from_user.company_info.organization_name$': { [Op.like]: `%${search}%` } },
          literal(`CONCAT(to_user.fname, ' ', to_user.lname) LIKE '%${search}%'`),
          { '$to_user.email$': { [Op.like]: `%${search}%` } },
          { '$to_user.mobile$': { [Op.like]: `%${search}%` } },
          { '$to_user.company_info.organization_name$': { [Op.like]: `%${search}%` } }
        );
      } else {
        searchWhere[Op.or].push(
          { enquiry_number: { [Op.like]: `%${search}%` } },
          { category_name: { [Op.like]: `%${search}%` } },
          literal(`CONCAT(from_user.fname, ' ', from_user.lname) LIKE '%${search}%'`),
          { '$from_user.email$': { [Op.like]: `%${search}%` } },
          { '$to_user.company_info.organization_name$': { [Op.like]: `%${search}%` } },
          { '$enquiry_users.product_name$': { [Op.like]: `%${search}%` } }
        );
      }
    }
    if (enquiry_no) {
      searchWhere.enquiry_number = {
        [Op.like]: `%${enquiry_no}%`
      };
    }
    if (category) {
      searchWhere.category_name = {
        [Op.like]: `%${category}%`
      };
    }
    if (sub_category) {
      searchWhere.sub_category_name = {
        [Op.like]: `%${sub_category}%`
      };
    }
    if (user_id) {
      searchWhere.user_id = user_id;
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
    const totalRecords = await Enquiries.count({ where });
    const { count: filteredRecords, rows } = await Enquiries.findAndCountAll({
      subQuery: false,
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        {
          model: Users,
          as: 'from_user',
          attributes: [
            'id',
            'email',
            'mobile',
            'company_id',
            'is_seller',
            'fname',
            'lname',
            [fn('CONCAT', col('from_user.fname'), ' ', col('from_user.lname')), 'full_name']
          ],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: [['organization_name', 'organization_name']],
              required: false,
            }
          ],
          required: false,
        },
        {
          model: Users,
          as: 'to_user',
          attributes: [
            ['id', 'id'],
            ['email', 'to_email'],
            ['mobile', 'to_mobile'],
            ['company_id', 'to_company_id'],
            'is_seller',
            'fname',
            'lname',
            [fn('CONCAT', col('to_user.fname'), ' ', col('to_user.lname')), 'to_full_name']
          ],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: [['organization_name', 'organization_name']],
              required: false,
            }
          ],
          required: false,
        },
        {
          model: EnquiryUsers,
          as: 'enquiry_users',
          attributes: ['id', 'product_name'],
          required: false,
        }
      ]
    });
    const mappedRows = rows.map(row => {
      const base = {
        id: row.id,
        user_id: row.user_id,
        enquiry_number: row.enquiry_number,
        quantity: row.quantity,
        category_name: row.category_name,
        is_delete: row.is_delete,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_approve: row.is_approve,
        from_full_name: row.from_user ? `${row.from_user.fname} ${row.from_user.lname}` : null,
        from_email: row.from_user?.email || null,
      };
      if (viewType === 'dashboard') {
        return {
          ...base,
          enquiry_product: row.enquiry_users?.[0]?.product_name || null,
          to_organization_name: row.to_user?.company_info?.organization_name || null,
        };
      }
      if (viewType === 'leads') {
        return {
          ...base,
          from_mobile: row.from_user?.mobile || null,
          from_organization_name: row.from_user?.company_info?.organization_name || null,
          from_user_type: row.from_user?.is_seller ?? null,
          to_full_name: row.to_user ? `${row.to_user.fname} ${row.to_user.lname}` : null,
          to_email: row.to_user?.to_email || null,
          to_mobile: row.to_user?.to_mobile || null,
          to_company_id: row.to_user?.to_company_id || null,
          to_organization_name: row.to_user?.company_info?.organization_name || null,
          to_user_type: row.to_user?.is_seller ?? null,
        };
      }
      return base;
    });
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

exports.getEnquiriesByUserServerSide = async (req, res) => {
  try {
    const {
      page,
      limit,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      user_id,
      all = false // optional query param ?all=true to get all data
    } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const sortDirection = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let order = [[sortBy, sortDirection]];
    if (sortBy === 'enquiry_product') {
      order = [[{ model: EnquiryUsers, as: 'enquiry_users' }, 'product_name', sortDirection]];
    }

    const where = {
      is_approve: 1,
      is_delete: 0
    };

    const user = await Users.findByPk(user_id, { 
      include: { model: CompanyInfo, as: 'company_info' } 
    });

    const companyId = user?.company_info?.id;

    const include = [
      {
        model: EnquiryUsers,
        as: 'enquiry_users',
        required: true,
        where: { company_id: companyId },
      },
    ];

    if (search) {
      where[Op.or] = [
        { enquiry_number: { [Op.like]: `%${search}%` } },
        { category_name: { [Op.like]: `%${search}%` } },
        literal(`EXISTS (
          SELECT 1 FROM users AS u 
          WHERE u.id = enquiries.user_id 
          AND CONCAT(u.fname, ' ', u.lname) LIKE '%${search}%'
        )`)
      ];
    }

    // If ?all=true, skip pagination
    const isAll = all === 'true' || all === true;
    const limitValue = isAll ? null : parseInt(limit) || 10;
    const offset = isAll ? null : ((parseInt(page) || 1) - 1) * limitValue;

    const { count: filteredRecords, rows } = await Enquiries.findAndCountAll({
      subQuery: false,
      where,
      order,
      ...(isAll ? {} : { limit: limitValue, offset }),
      include
    });

    res.json({
      data: rows,
      filteredRecords,
      totalRecords: filteredRecords,
      isAll
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const sendOtpEmail = async (to, otp) => {
  const emailTemplate = await Emails.findByPk(97);
  const msgStr = emailTemplate.message.toString('utf8');
  let userMessage = msgStr.replace("{{ OTP }}", otp);

  const { transporter } = await getTransporter();
  await transporter.sendMail({
    from: `"OTP Verification" <info@sourceindia-electronics.com>`,
    to: to,
    subject: emailTemplate?.subject || "Verify your email",
    html: userMessage,
  });
};

const sendEnquiryConfirmation = async (to, name) => {

  const emailTemplate = await Emails.findByPk(98);
  const msgStr = emailTemplate.message.toString('utf8');
  let userMessage = msgStr.replace("{{ USER_FNAME }}", name);

  const { transporter } = await getTransporter();
  await transporter.sendMail({
    from: `"OTP Verification" <info@sourceindia-electronics.com>`,
    to: to,
    subject: emailTemplate?.subject || "Verify your email",
    html: userMessage,
  });
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ where: { email } });
    console.log(user);
    if (user) {
      return res.status(200).json({ exists: true, message: 'User exists, please login' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const password = 'SI' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Users({
      email,
      otp,
      password: hashedPassword,
      real_password: password,
    });
    await newUser.save();
    await sendOtpEmail(email, otp);
    res.status(200).json({ exists: false, otpSent: true, userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    await user.save();
    await sendOtpEmail(email, otp);
    res.status(200).json({ message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit OTP


exports.submitOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await Users.findOne({ where: { email } });
    if (!user || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.otp = null;
    await user.save();
    res.status(200).json({ verified: true, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Store Enquiry
exports.storeEnquiry = async (req, res) => {
  try {
    const { userId, name, company, phone, description, product_id, enq_company_id } = req.body;

    let category_ids = '';
    let subcategory_names = '';
    let subcategory_ids = '';
    let category_names = '';

    const product = await Products.findByPk(product_id);
    const companyinfo = await CompanyInfo.findByPk(product.company_id);
    if (companyinfo.category_sell) {
      const catIds = companyinfo.category_sell.split(",");
      const categoryDataArr = [];
      const categoryNameArr = [];

      for (const catId of catIds) {
        const category = await Categories.findByPk(catId);
        if (category) {
          categoryDataArr.push(category.id);
          categoryNameArr.push(category.name);
        }
      }

      category_ids = categoryDataArr.join(", ");
      category_names = categoryNameArr.join(", ");


      let sub_cat_data_arr = [];
      let sub_cat_name_arr = [];

      for (const cat_id of catIds) {
        if (cat_id !== "38") {
          const sub_cat = await SubCategories.findOne({
            where: {
              id: product.sub_category,
              category: cat_id,
            },
          });

          if (sub_cat) {
            sub_cat_data_arr.push(sub_cat.id);
            sub_cat_name_arr.push(sub_cat.name);
          }
        }
      }

      subcategory_ids = sub_cat_data_arr.join(", ");
      subcategory_names = sub_cat_name_arr.join(", ");

    }

    const newCompany = new CompanyInfo({ organization_name: company });
    await newCompany.save();

    const user = await Users.findByPk(userId);
    // console.log('storeEnquiry' + user);
    user.fname = name;
    user.company_id = newCompany.id;
    user.mobile = phone;
    user.is_new = 1;
    user.is_profile = 1;
    user.is_complete = 1;
    await user.save();

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const enquiry_number = Math.random().toString(36).substring(2, 10).toUpperCase();
    const enquiry = new Enquiries({
      enquiry_number,
      company_id: enq_company_id,
      user_id: user.id,
      description,
      category: category_ids,  // Fetch real data as needed
      sub_category: subcategory_ids,
      category_name: category_names,
      sub_category_name: subcategory_names,
    });
    await enquiry.save();

    const enquiryUser = new EnquiryUsers({
      enquiry_id: enquiry.id,
      company_id: enq_company_id,
      product_id,
      product_name: product.title,
    });
    await enquiryUser.save();

    const enquiryMessage = new EnquiryMessage({
      seller_company_id: enq_company_id,
      enquiry_id: enquiry.id,
      buyer_company_id: newCompany.id,
    });
    await enquiryMessage.save();

    const userMessage = new UserMessage({
      user_id: user.id,
      message: description,
      message_id: enquiryMessage.id,
      company_id: newCompany.id,
    });
    await userMessage.save();

    await sendEnquiryConfirmation(user.email, name);
    res.status(200).json({ message: 'Enquiry submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
};


const createUserActivity = async (req, userId = null, type = 'enquiry_created', isSide = 'front') => {
  try {
    const payload = {
      user_id: userId ? parseInt(userId, 10) : null,
      type,
      is_side: isSide,
      ip_address: getClientIp(req),
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log('User Activity Logged:', payload);
    await UserActivity.create(payload);
  } catch (err) {
    console.error('Failed to log UserActivity:', err.message);

  }
};

exports.submitEnquiry = async (req, res) => {
  const formData = req.body;
  const isAuthenticated = formData.isAuthenticated === true;
  const clientIp = getClientIp(req);
  const errors = {};

  console.log('isAuthenticated:', isAuthenticated);
  console.log('Client IP:', clientIp);

  try {
    // ========== VALIDATION ==========
    if (!formData.title?.trim()) {
      errors.title = 'Enquiry title is required';
    }
    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (isAuthenticated) {
      if (!formData.user_id || isNaN(formData.user_id)) {
        errors.user_id = 'Valid user ID is required';
      }
    } else {
      if (!formData.name?.trim()) errors.name = 'Name is required';

      if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email))
        errors.email = 'Valid email is required';

      const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
      if (!phoneDigits || phoneDigits.length !== 10)
        errors.phone = 'Phone number must be 10 digits';

      if (!formData.company?.trim()) errors.company = 'Company name is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    // ========== PREPARE ENQUIRY PAYLOAD ==========
    const commonEnquiryFields = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      ip_address: clientIp,
      status: 'pending',
    };

    const enquiryPayload = isAuthenticated
      ? { ...commonEnquiryFields, user_id: parseInt(formData.user_id, 10) }
      : {
        ...commonEnquiryFields,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
      };
    const user = await Users.findByPk(formData.user_id);




    // ========== SAVE ENQUIRY ==========
    const enquiry = await OpenEnquriy.create(enquiryPayload);

    // ========== LOG USER ACTIVITY ==========
    if (isAuthenticated) {
      await createUserActivity(
        req,
        formData.user_id,
        'open_enquiry_created',
        'front'
      );
    }



    if (isAuthenticated) {
      const emailTemplate = await Emails.findByPk(88);
      const msgStr = emailTemplate.message.toString('utf8');
      const full_name = user.fname + ' ' + user.lname;
      let userMessage = msgStr.replace("{{ USER_FNAME }}", full_name);

      const subject = formData.title.trim();
      const { transporter, siteConfig } = await getTransporter();
      await transporter.sendMail({
        from: `"Enquiry " <info@sourceindia-electronics.com>`,
        to: user.email,
        subject: subject || "Enquiry submit successfully",
        html: userMessage,
      });
    } else {

      const emailTemplate = await Emails.findByPk(88);
      const msgStr = emailTemplate.message.toString('utf8');
      const full_name = formData.name.trim();
      let userMessage = msgStr.replace("{{ USER_FNAME }}", full_name);

      const subject = formData.title.trim();
      const { transporter, siteConfig } = await getTransporter();
      await transporter.sendMail({
        from: `"Enquiry " <info@sourceindia-electronics.com>`,
        to: formData.email.trim(),
        subject: subject || "Enquiry submit successfully",
        html: userMessage,
      });
    }
    // ========== SUCCESS RESPONSE ==========
    return res.json({
      success: true,
      message: 'New Enquiry Added Successfully',
      data: enquiry,
    });

  } catch (err) {
    console.error('Submit Enquiry Error:', err);

    if (err.name === 'SequelizeValidationError') {
      const validationErrors = {};
      err.errors.forEach(e => {
        validationErrors[e.path] = e.message;
      });
      return res.status(422).json({ success: false, errors: validationErrors });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};
