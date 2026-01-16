const { Op, fn, col, literal, Sequelize, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
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
const SellerCategory = require('../models/SellerCategory');

const UserActivity = require('../models/UserActivity');
const Emails = require('../models/Emails');
const { getTransporter } = require('../helpers/mailHelper');
const { getCategoryNames } = require('../helpers/mailHelper');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UploadImage = require('../models/UploadImage');
const CoreActivity = require('../models/CoreActivity');
const Activity = require('../models/Activity');

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
            ['user_id', 'id'],
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
            attributes: ['organization_name', 'organization_slug'],
            include: [{
              model: CoreActivity,
              as: 'CoreActivity',
              attributes: ['name'],
            }, {
              model: Activity,
              as: 'Activity',
              attributes: ['name'],
            }
            ]
          }],
        },
        {
          model: Users,
          as: 'to_user',
          attributes: ['id', 'email', 'mobile', 'company_id', 'fname', 'lname'],
          include: [{
            model: CompanyInfo,
            as: 'company_info',
            attributes: ['organization_name'],
          }],
        },
        {
          model: EnquiryUsers,
          as: 'enquiry_users',
          attributes: ['id', 'product_name', 'product_id', 'company_id', 'enquiry_status'],
          include: [
            {
              model: Products,
              as: 'Products',
              attributes: ['id', 'title', 'slug', 'description', 'user_id', 'category', 'sub_category'],
              include: [
                { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
                { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
                { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
              ],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

    const eu = enquiry.enquiry_users?.[0];
    let single_product = null;

    if (eu?.product_id) {
      single_product = await Products.findByPk(eu.product_id, {
        attributes: ['id', 'title', 'slug', 'description', 'user_id', 'category', 'sub_category'],
        include: [
          { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
          { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
          { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
        ],
      });
    }

    // ✅ Fetch seller (the user whose company_id matches the enquiry company)
    let sellerUser = null;
    if (eu?.company_id) {
      sellerUser = await Users.findOne({
        where: { company_id: enquiry.company_id },
        include: { model: CompanyInfo, as: 'company_info' },
      });
    }


    // ✅ Get category & subcategory names for seller
    let category_sell_names = '';
    let sub_category_names = '';
    if (sellerUser) {
      const catData = await getCategoryNames(sellerUser);
      category_sell_names = catData.category_sell_names || '';
      sub_category_names = catData.sub_category_names || '';
    }

    res.json({
      ...enquiry.toJSON(),
      from_full_name: enquiry.from_user ? `${enquiry.from_user.fname} ${enquiry.from_user.lname}`.trim() : null,
      from_email: enquiry.from_user?.email || null,
      from_mobile: enquiry.from_user?.mobile || null,
      from_company_id: enquiry.from_user?.company_id || null,
      from_organization_name: enquiry.from_user?.company_info?.organization_name || null,
      from_organization_slug: enquiry.from_user?.company_info?.organization_slug || null,
      from_core_activity_name: enquiry.from_user?.company_info?.CoreActivity?.name || null,
      from_activity_name: enquiry.from_user?.company_info?.Activity?.name || null,

      to_full_name: enquiry.to_user ? `${enquiry.to_user.fname} ${enquiry.to_user.lname}`.trim() : null,
      to_email: enquiry.to_user?.email || null,
      to_mobile: enquiry.to_user?.mobile || null,
      to_company_id: enquiry.to_user?.company_id || null,
      to_organization_name: enquiry.to_user?.company_info?.organization_name || null,

      enquiry_product: eu?.product_name || null,
      enquiryUser: eu || null,
      product_details: single_product || eu?.Products || null,

      // ✅ New fields
      seller_category_names: category_sell_names,
      seller_subcategory_names: sub_category_names,

      product_source: single_product ? 'from_findByPk' : (eu?.Products ? 'from_include' : 'not_found'),
    });

  } catch (err) {
    console.error('Error in getEnquiriesByNumber:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEnquiriesCount = async (req, res) => {
  try {
    const [total, all, status1, status2, status0, getPublic, getApprove, getNotApprove] = await Promise.all([
      Enquiries.count({ where: { is_delete: 0 } }),
      Enquiries.count(),
      Enquiries.count({ where: { status: 1 } }),
      Enquiries.count({ where: { status: 2 } }),
      Enquiries.count({ where: { status: 0 } }),
      Enquiries.count({ where: { user_id: null, is_delete: 0 } }),
      Enquiries.count({ where: { is_approve: 1, is_delete: 0 } }),
      Enquiries.count({ where: { is_approve: 0, is_delete: 0 } }),
    ]);
    res.json({
      total, all, status1, status2, status0, getPublic, getApprove, getNotApprove
    });
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

exports.updateEnquiriesDeleteStatusold = async (req, res) => {
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


exports.updateEnquiriesDeleteStatus = async (req, res) => {
  try {
    const is_delete = 1;
    const { id } = req.params;

    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }

    const enquiry = await Enquiries.findByPk(id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

    enquiry.is_delete = is_delete;
    await enquiry.save();
    const userInfo = await EnquiryUsers.findOne({ where: { enquiry_id: id } });

    let messageInfo = null;
    if (userInfo) {
      messageInfo = await UserMessage.findOne({ where: { message_id: userInfo.id } });
    }

    const enquiryMessage = await EnquiryMessage.findOne({ where: { enquiry_id: id } });
    if (enquiryMessage) {
      enquiryMessage.is_delete = is_delete;
      await enquiryMessage.save();
    }

    if (userInfo) {
      userInfo.is_delete = is_delete;
      await userInfo.save();
    }

    if (messageInfo) {
      messageInfo.is_delete = is_delete;
      await messageInfo.save();
    }
    res.json({
      message: is_delete === 1 ? 'Enquiry and related data marked as deleted' : 'Enquiry restored successfully',
      enquiry,
    });
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
      'id', 'enquiry_number', 'created_at', 'updated_at', 'name', 'email', 'phone',
      'category_name', 'sub_category_name', 'company', 'from_email',
      'from_organization_name', 'to_organization_name', 'enquiry_product',
      'quantity', 'is_approve'
    ];

    const viewType = req.query.viewType || 'dashboard';
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Sorting logic
    let order = [];
    if (sortBy === 'from_full_name') {
      order = [[literal(`CONCAT(from_user.fname, ' ', from_user.lname)`), sortDirection]];
    } else if (sortBy === 'from_organization_name') {
      order = [[{ model: Users, as: 'from_user' }, { model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection]];
    } else if (sortBy === 'to_organization_name') {
      order = [[{ model: Users, as: 'to_user' }, { model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection]];
    } else if (sortBy === 'enquiry_product') {
      order = [[{ model: EnquiryUsers, as: 'enquiry_users' }, 'product_name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }

    // Filtering conditions
    const where = {};
    if (req.query.getPublic === 'true') { where.user_id = null; where.is_delete = 0; }
    if (req.query.user_id) { where.user_id = req.query.user_id; where.is_delete = 0; }
    if (req.query.getApprove === 'true') { where.is_approve = 1; where.is_delete = 0; }
    if (req.query.getNotApprove === 'true') { where.is_approve = 0; where.is_delete = 0; }
    if (req.query.getDeleted === 'true') { where.is_delete = 1; }

    // Search conditions
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [];
      /*if (viewType === 'leads') {*/
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
      /*} else {
        searchWhere[Op.or].push(
          { enquiry_number: { [Op.like]: `%${search}%` } },
          { category_name: { [Op.like]: `%${search}%` } },
          literal(`CONCAT(from_user.fname, ' ', from_user.lname) LIKE '%${search}%'`),
          { '$from_user.email$': { [Op.like]: `%${search}%` } },
          { '$to_user.company_info.organization_name$': { [Op.like]: `%${search}%` } },
          { '$enquiry_users.product_name$': { [Op.like]: `%${search}%` } }
        );
      }*/
    }

    // Extra filters
    if (enquiry_no) searchWhere.enquiry_number = { [Op.like]: `%${enquiry_no}%` };
    if (category) searchWhere.category_name = { [Op.like]: `%${category}%` };
    if (sub_category) searchWhere.sub_category_name = { [Op.like]: `%${sub_category}%` };
    if (user_id) searchWhere.user_id = user_id;

    // Date filter
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();
      if (range === 'today') dateCondition = { [Op.gte]: today.toDate(), [Op.lte]: now.toDate() };
      else if (range === 'yesterday') dateCondition = { [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(), [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate() };
      else if (range === 'last7days') dateCondition = { [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      else if (range === 'last30days') dateCondition = { [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      else if (range === 'thismonth') dateCondition = { [Op.gte]: moment().startOf('month').toDate(), [Op.lte]: now.toDate() };
      else if (range === 'lastmonth') dateCondition = { [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(), [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate() };
      else if (range === 'customrange' && startDate && endDate)
        dateCondition = { [Op.gte]: moment(startDate).startOf('day').toDate(), [Op.lte]: moment(endDate).endOf('day').toDate() };
      else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = { [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(), [Op.lte]: now.toDate() };
      }
    }
    if (dateCondition) searchWhere.created_at = dateCondition;

    // Fetch main data
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
          attributes: ['id', 'email', 'mobile', 'company_id', 'is_seller', 'fname', 'lname',
            [fn('CONCAT', col('from_user.fname'), ' ', col('from_user.lname')), 'full_name']],
          include: [{ model: CompanyInfo, as: 'company_info', attributes: [['organization_name', 'organization_name'], ['organization_slug', 'organization_slug']], required: false }],
          required: false,
        },
        {
          model: Users,
          as: 'to_user',
          attributes: [['user_id', 'id'], ['email', 'to_email'], ['mobile', 'to_mobile'],
          ['company_id', 'to_company_id'], 'is_seller', 'fname', 'lname',
          [fn('CONCAT', col('to_user.fname'), ' ', col('to_user.lname')), 'to_full_name']],
          include: [{ model: CompanyInfo, as: 'company_info', attributes: [['organization_name', 'organization_name'], ['organization_slug', 'organization_slug']], required: false }],
          required: false,
        },
        {
          model: EnquiryUsers,
          as: 'enquiry_users',
          attributes: ['id', 'product_name'],
          include: [
            {
              model: Products,
              as: 'Products',
              attributes: ['id', 'slug'],
              required: false,
            }
          ],
          required: false,
        }
      ]
    });

    // Enrich with seller category/subcategory info
    const enrichedRows = [];
    for (const enq of rows) {
      const enquiryJSON = enq.toJSON();
      let category_sell_names = '';
      let sub_category_names = '';

      if (enquiryJSON.company_id) {
        const sellerUser = await Users.findOne({
          where: { company_id: enquiryJSON.company_id },
          include: { model: CompanyInfo, as: 'company_info' },
        });
        if (sellerUser) {
          const names = await getCategoryNames(sellerUser);
          category_sell_names = names?.category_sell_names || '';
          sub_category_names = names?.sub_category_names || '';
        }
      }

      enrichedRows.push({
        ...enquiryJSON,
        category_name: category_sell_names,
        sub_category_name: sub_category_names,
      });
    }

    // Final mapped response
    const mappedRows = enrichedRows.map(row => {
      const base = {
        id: row.id,
        user_id: row.user_id,
        enquiry_number: row.enquiry_number,
        quantity: row.quantity,
        category_name: row.category_name,
        sub_category_name: row.sub_category_name,
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
          to_organization_slug: row.to_user?.company_info?.organization_slug || null,
          product_slug: row.enquiry_users?.[0]?.Products?.slug || null,
        };
      }

      if (viewType === 'leads') {
        return {
          ...base,
          from_mobile: row.from_user?.mobile || null,
          from_organization_name: row.from_user?.company_info?.organization_name || null,
          from_organization_slug: row.from_user?.company_info?.organization_slug || null,
          from_user_type: row.from_user?.is_seller ?? null,
          to_full_name: row.to_user ? `${row.to_user.fname} ${row.to_user.lname}` : null,
          to_email: row.to_user?.to_email || null,
          to_mobile: row.to_user?.to_mobile || null,
          to_company_id: row.to_user?.to_company_id || null,
          to_organization_name: row.to_user?.company_info?.organization_name || null,
          to_organization_slug: row.to_user?.company_info?.organization_slug || null,
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
      company_id,
      isAdmin,
      type,
      all = false
    } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const sortDirection = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let order = [[sortBy, sortDirection]];
    if (sortBy === 'enquiry_product') {
      order = [[{ model: EnquiryUsers, as: 'enquiry_users' }, 'product_name', sortDirection]];
    }

    const where = { is_delete: 0 };
    if (!isAdmin) {
      where.is_approve = 1;
      if (type == "lead") {
        where.company_id = company_id;
      } else {
        where.user_id = user_id;
      }


    }

    const user = await Users.findByPk(user_id, {
      include: { model: CompanyInfo, as: 'company_info' }
    });

    const companyId = user?.company_info?.id;

    const include = [
      {
        model: EnquiryUsers,
        as: 'enquiry_users',
        required: true,
      },
      {
        model: Users,
        as: 'from_user',
        attributes: [
          'id',
          'fname',
          'lname',
          'email',
          [Sequelize.literal("CONCAT(from_user.fname, ' ', from_user.lname)"), 'full_name']
        ],
      },
      {
        model: Users,
        as: 'to_user',
        attributes: [
          'id',
          'fname',
          'lname',
          'email',
          [Sequelize.literal("CONCAT(to_user.fname, ' ', to_user.lname)"), 'full_name']
        ],
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



    const enrichedRows = [];
    for (const enq of rows) {
      const enquiryJSON = enq.toJSON();
      const sellerUser = await Users.findOne({
        where: { company_id: enquiryJSON.company_id },
        include: { model: CompanyInfo, as: 'company_info' }
      });

      // get that seller’s category info
      const { category_sell_names, sub_category_names } = await getCategoryNames(sellerUser);

      enrichedRows.push({
        ...enquiryJSON,
        category_name: category_sell_names || '',
        sub_category_name: sub_category_names || '',
      });
    }

    res.json({
      data: enrichedRows,
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
  const transaction = await sequelize.transaction();
  try {
    const { email } = req.body;

    const user = await Users.findOne({ where: { email } });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const password =
      'SI' +
      new Date().getFullYear() +
      Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ If user already exists
    if (user) {
      await user.update({ otp }, { transaction });
      await sendOtpEmail(email, otp);

      await transaction.commit();
      return res.status(200).json({
        exists: true,
        otpSent: true,
        userId: user.id,
        message: 'OTP sent to registered email',
      });
    }

    // ✅ 1. Create Company first
    const company = await CompanyInfo.create(
      {
        company_email: email,
        is_verified: 0,
      },
      { transaction }
    );

    // ✅ 2. Create User with company_id
    const newUser = await Users.create(
      {
        email,
        otp,
        password: hashedPassword,
        real_password: password,
        company_id: company.id, 
        fname: '',
        lname: '',
        step: 0,
        mode: 0,
        country: '',
        state: '',
        city: '',
        address: '',
        remember_token: '',
        is_seller: 0,
        status: 1,
        payment_status: 1,
        is_approve: 0,
        is_email_verify: 0,
        featured_company: 0,
        is_intrest: 0,
        website: '',
        products: '',
        request_admin: 0,
      },
      { transaction }
    );

    await sendOtpEmail(email, otp);

    await transaction.commit();

    return res.status(200).json({
      exists: false,
      otpSent: true,
      userId: newUser.id,
      companyId: company.id,
      message: 'User and company created successfully',
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message });
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
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.is_otp = 1;
    user.is_email_verify = 1;
    await user.save();

    // 🔐 Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      verified: true,
      exists: true,
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.storeEnquiry = async (req, res) => {
  try {
    const {
      userId,
      name,
      company,
      phone,
      description,
      product_id,
      enq_company_id
    } = req.body;

    /* -------------------- 1. Fetch product safely -------------------- */
    const product = await Products.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    /* -------------------- 2. Fetch seller company -------------------- */
    const companyinfo = await CompanyInfo.findByPk(product.company_id);

    let category_ids = '';
    let category_names = '';
    let subcategory_ids = '';
    let subcategory_names = '';

    /* -------------------- 3. Categories & subcategories -------------------- */
    if (companyinfo && companyinfo.category_sell) {
      const catIds = companyinfo.category_sell
        .split(',')
        .map(id => id.trim())
        .filter(id => id && !isNaN(id));

      const categories = await Categories.findAll({
        where: { id: catIds },
        attributes: [
          'id',
          'name',
          'cat_file_id',
          'stock_file_id',
          'slug'
        ]
      });

      category_ids = categories.map(c => c.id).join(', ');
      category_names = categories.map(c => c.name).join(', ');

      if (product.sub_category) {
        const subCategories = await SubCategories.findAll({
          where: {
            id: product.sub_category,
            category: catIds
          }
        });

        subcategory_ids = subCategories.map(sc => sc.id).join(', ');
        subcategory_names = subCategories.map(sc => sc.name.trim()).join(', ');
      }
    }

    /* -------------------- 4. Create buyer company -------------------- */
    const newCompany = await CompanyInfo.create({
      organization_name: company
    });

    /* -------------------- 5. Update user -------------------- */
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      fname: name,
      company_id: newCompany.id,
      mobile: phone,
      is_new: 1,
      is_profile: 1,
      is_complete: 1
    });

    /* -------------------- 6. Create enquiry -------------------- */
    const enquiry_number = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const enquiry = await Enquiries.create({
      enquiry_number,
      company_id: enq_company_id,
      user_id: user.id,
      buyer_company_id: newCompany.id,
      description,
      type: 1,
      quantity: 1,
      category: category_ids,
      sub_category: subcategory_ids,
      category_name: category_names,
      sub_category_name: subcategory_names
    });

    /* -------------------- 7. Enquiry product mapping -------------------- */
    await EnquiryUsers.create({
      enquiry_id: enquiry.id,
      company_id: enq_company_id,
      product_id,
      product_name: product.title
    });

    /* -------------------- 8. Enquiry message -------------------- */
    const enquiryMessage = await EnquiryMessage.create({
      seller_company_id: enq_company_id,
      enquiry_id: enquiry.id,
      buyer_company_id: newCompany.id
    });

    await UserMessage.create({
      user_id: user.id,
      message: description,
      message_id: enquiryMessage.id,
      company_id: newCompany.id
    });

    /* -------------------- 9. Send confirmation mail -------------------- */
    await sendEnquiryConfirmation(user.email, name);

    res.status(200).json({
      message: 'Enquiry submitted successfully',
      enquiry_number
    });

  } catch (err) {
    console.error('Store Enquiry Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.submitEnquiryuser = async (req, res) => {
  try {
    const {
      userId,
      quantity,
      description,
      product_id,
      enq_company_id
    } = req.body;

    /* ------------------------------
       1. Get product and sender user
    ------------------------------ */

    const product = await Products.findByPk(product_id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const senderUser = await Users.findByPk(userId, {
      include: [{ model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] }]
    });
    if (!senderUser) return res.status(404).json({ message: 'User not found' });

    /* ------------------------------
       2. Approval logic
    ------------------------------ */

    let is_approve = senderUser.walkin_buyer === 1 ? 0 : 1;

    /* ------------------------------
       3. Create enquiry and related records
    ------------------------------ */

    const enquiry_number = Math.random().toString(36).substring(2, 10).toUpperCase();

    const enquiry = await Enquiries.create({
      enquiry_number,
      company_id: enq_company_id,
      buyer_company_id: senderUser.company_id,
      user_id: senderUser.id,
      type: 1,
      quantity,
      is_approve,
      description
    });

    await EnquiryUsers.create({
      enquiry_id: enquiry.id,
      company_id: enq_company_id,
      product_id,
      product_name: product.title
    });

    const enquiryMessage = await EnquiryMessage.create({
      seller_company_id: enq_company_id,
      enquiry_id: enquiry.id,
      buyer_company_id: senderUser.company_id
    });

    await UserMessage.create({
      user_id: senderUser.id,
      message: description,
      message_id: enquiryMessage.id,
      company_id: senderUser.company_id
    });

    /* ------------------------------
       4. Get receiver user (seller)
    ------------------------------ */

    const receiverUser = await Users.findOne({
      where: { company_id: enq_company_id, is_seller: 1, status: 1 },
      include: [{ model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] }]
    });

    if (!receiverUser) return res.status(404).json({ message: 'Seller not found' });

    /* ------------------------------
       5. Get transporter & site config
    ------------------------------ */

    const { transporter } = await getTransporter();

    /* ------------------------------
       6. Prepare emails (plain text)
    ------------------------------ */

    const senderMail = `
Dear ${senderUser.fname},

A new enquiry has been submitted by you. Please check the enquiry details below:

Product Title: ${product.title}
Quantity: ${quantity}

Seller Company: ${receiverUser.company_info.organization_name}
Seller Name: ${receiverUser.fname} ${receiverUser.lname}
Seller Email: ${receiverUser.email}
Seller Mobile: ${receiverUser.mobile}

Enquiry Number: ${enquiry.enquiry_number}
Enquiry Message: ${description}

Thanks`;

    const receiverMail = `
Dear ${receiverUser.fname},

A new enquiry has been received on your company. Please check the enquiry details below:

Product Title: ${product.title}
Quantity: ${quantity}

Company Name: ${senderUser.company_info.organization_name}
Name: ${senderUser.fname} ${senderUser.lname}
Email: ${senderUser.email}
Mobile: ${senderUser.mobile}

Enquiry Number: ${enquiry.enquiry_number}
Enquiry Message: ${description}

Thanks`;

    /* ------------------------------
       7. Send mails
    ------------------------------ */

    await transporter.sendMail({
      from: `"Source India-Electronics Supply Chain Portal " <info@sourceindia-electronics.com>`,
      to: senderUser.email,
      subject: 'Buyer company enquiry mail',
      text: senderMail
    });

    await transporter.sendMail({
      from: `"Source India-Electronics Supply Chain Portal " <info@sourceindia-electronics.com>`,
      to: receiverUser.email,
      subject: 'New company enquiry received',
      text: receiverMail
    });

    /* ------------------------------
       8. Final response
    ------------------------------ */

    return res.status(200).json({
      message: 'Enquiry submitted successfully',
      enquiry_number: enquiry.enquiry_number
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
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

    let enquiryPayload = isAuthenticated
      ? { ...commonEnquiryFields, user_id: parseInt(formData.user_id, 10) }
      : {
        ...commonEnquiryFields,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
      };
    const user = await Users.findByPk(formData.user_id);


    if (isAuthenticated) {
      let suser = await Users.findByPk(formData.user_id);
      enquiryPayload = { ...commonEnquiryFields, user_id: parseInt(formData.user_id, 10) };
    } else {
      let password =
        'SI' +
        new Date().getFullYear() +
        Math.floor(1000 + Math.random() * 9000).toString();
      const hashedPassword = await bcrypt.hash(password, 10);
      const company = await CompanyInfo.create({
        organization_name: formData.company.trim()
      });
      let suser = await Users.create({
        fname: formData.name.trim(),
        lname: "",
        company_id: company.id,
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        user_company: formData.company.trim(),
        password: hashedPassword,
        real_password: password,
      });
      console.log(suser.id);

      enquiryPayload = { ...commonEnquiryFields, user_id: parseInt(suser.id, 10) };
    }









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

exports.getLeadsCount = async (req, res) => {
  try {
    const { companyId, enquiryId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Missing companyId parameter' });
    }

    const user = await Users.findOne({
      where: { company_id: companyId }
    });
    const whereAwarded = { is_delete: 0 };
    const whereShortlisted = { is_delete: 0 };
    const whereAccepted = {
      is_delete: 0, enquiry_status: 1,
      ...(enquiryId ? { enquiry_id: enquiryId } : {}),
    };

    // only add enquiry_id if provided
    if (enquiryId) {
      whereAwarded.enquiry_id = enquiryId;
      whereAccepted.enquiry_id = enquiryId;;
      whereShortlisted.enquiry_id = enquiryId;;
    }


    // Run all 3 queries in parallel for speed
    const [totalResult, openResult, closedResult, noEnquiry, openEnquiry, closeEnquiry, enquiryFloated, enquirySeen, awerded, acceptCount, shortlisted] = await Promise.all([
      Enquiries.findAndCountAll({
        include: [{
          model: EnquiryUsers,
          as: 'enquiry_users', // ✅ must match alias
          where: { company_id: companyId },
          required: true,
        }],
        where: { is_delete: 0, is_approve: 1 },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        include: [{
          model: EnquiryUsers,
          as: 'enquiry_users',
          where: { company_id: companyId },
          required: true,
        }],
        where: { is_delete: 0, is_approve: 1, status: 1 },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        include: [{
          model: EnquiryUsers,
          as: 'enquiry_users',
          where: { company_id: companyId },
          required: true,
        }],
        where: { is_delete: 0, is_approve: 1, status: 0 },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        where: { is_delete: 0, is_approve: 1, user_id: user.id },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        where: { is_delete: 0, is_approve: 1, status: 1, user_id: user.id },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        where: { is_delete: 0, is_approve: 1, status: 0, user_id: user.id },
        distinct: true,
        col: 'enquiry_id',
      }),

      Enquiries.findAndCountAll({
        col: 'enquiry_id',
      }),

      EnquiryUsers.findAndCountAll({
        where: { enquiry_status: 1 },
        col: 'enquiry_id',
      }),

      EnquiryUsers.findAndCountAll({
        where: whereAwarded,
        col: 'enquiry_id',
      }),
      EnquiryUsers.findAndCountAll({
        where: whereAccepted,
        col: 'enquiry_id',
      }),
      EnquiryUsers.findAndCountAll({
        where: whereShortlisted,
        col: 'enquiry_id',
      }),

    ]);

    res.json({
      total: Number(totalResult.count),
      open: Number(openResult.count),
      closed: Number(closedResult.count),
      enquirytotal: Number(noEnquiry.count),
      enquiryopen: Number(openEnquiry.count),
      enquiryclosed: Number(closeEnquiry.count),
      enquiryFloated: Number(enquiryFloated.count),
      enquirySeen: Number(enquirySeen.count),
      awerded: Number(awerded.count),
      acceptCount: Number(acceptCount.count),
      shortlisted: Number(shortlisted.count),
    });
  } catch (err) {
    console.error('Lead stats error:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.dashboardEnquiryProve = async (req, res) => {
  try {
    const { enq_id, type, id } = req.body;

    if (!type || (!id && !enq_id)) {
      return res.status(400).json({ success: 0, message: "Missing required fields" });
    }

    if (type == 1 || type == 2) {
      const enquiryUser = await EnquiryUsers.findOne({ where: { id } });
      if (!enquiryUser) {
        return res.status(404).json({ success: 0, message: "Enquiry user not found" });
      }

      enquiryUser.enquiry_status = type;
      await enquiryUser.save();

      return res.json({ success: 1, message: "Enquiry user status updated successfully" });
    }

    if (enq_id) {
      const enquiry = await Enquiries.findOne({ where: { id: enq_id } });
      if (!enquiry) {
        return res.status(404).json({ success: 0, message: "Enquiry not found" });
      }
      enquiry.status = type;
      await enquiry.save();
      return res.json({ success: 1, message: "Enquiry closed successfully" });
    }

    return res.status(400).json({ success: 0, message: "Invalid request" });

  } catch (error) {
    console.error("Error in dashboardEnquiryProve:", error);
    res.status(500).json({ success: 0, message: "Server error", error: error.message });
  }
};

exports.getAwardedEnquiries = async (req, res) => {
  try {
    const { enq_id } = req.query;

    if (!enq_id) {
      return res.status(400).json({ success: 0, message: "enq_id is required" });
    }

    // ✅ Fetch awarded companies where enquiry_status = 1 OR 3
    const awarded = await EnquiryUsers.findAll({
      where: {
        enquiry_id: enq_id,
        is_delete: 0
      },
      include: [
        {
          model: CompanyInfo,
          as: "CompanyInfo", // must match your association alias
          attributes: ["organization_name"],
        },
      ],
      attributes: ["id", "company_id", "enquiry_id", "enquiry_status"],
      order: [["id", "ASC"]],
    });

    const count = awarded.length;

    if (count > 0) {
      return res.status(200).json({
        success: 1,
        count,
        data: awarded.map((item, index) => ({
          sno: index + 1,
          company_name: item.CompanyInfo?.organization_name || "-",
          enquiry_status: item.enquiry_status,
        })),
      });
    } else {
      return res.status(200).json({
        success: 1,
        count: 0,
        data: [],
        message: "No Enquiry Awarded.",
      });
    }
  } catch (error) {
    console.error("Error fetching awarded enquiries:", error);
    return res.status(500).json({
      success: 0,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



exports.getAcceptEnquiries = async (req, res) => {
  try {
    const { enq_id } = req.query;

    if (!enq_id) {
      return res.status(400).json({ success: 0, message: "enq_id is required" });
    }
    const mainenquiry = await Enquiries.findByPk(enq_id);

    // ✅ Fetch accepted enquiries
    const enquiries = await EnquiryUsers.findAll({
      where: {
        enquiry_id: enq_id,
        is_delete: 0,

        [Op.or]: [
          { enquiry_status: 1 },
          { enquiry_status: 3 },
        ],
      },
      include: [
        {
          model: CompanyInfo,
          as: "CompanyInfo", // must match association alias
          attributes: ["organization_name"],
        },
      ],
      attributes: ["id", "company_id", "enquiry_id", "enquiry_status"],
      order: [["id", "ASC"]],
    });

    const count = enquiries.length;

    if (count === 0) {
      return res.status(200).json({
        success: 1,
        count: 0,
        data: [],
        message: "No Enquiry Found.",
      });
    }

    // ✅ Transform result
    const data = enquiries.map((enquiry, index) => {
      let status = "";
      let color = "";

      // 🟢 Status and Color
      switch (enquiry.enquiry_status) {
        case 1:
          status = "Open";
          color = "success";
          break;
        case 2:
        case 3:
          status = "Closed";
          color = "danger";
          break;
        default:
          status = "Pending";
          color = "warning";
      }

      // 🔒 Disable checkbox if status == 3
      const disabled = mainenquiry.status === 3 ? "disabled" : "";

      // ✅ Checkbox logic (shortlist)
      const checked = '';

      // ✅ Badge HTML
      const statusHTML = `<div className="badge rounded-pill text-${color} bg-light-${color} p-2 px-3" style="font-size:10px;">${status}</div>`;

      return {
        sno: index + 1,
        name: enquiry.CompanyInfo?.organization_name || "-",
        status: statusHTML,
        shortlist: checked,
      };
    });

    // ✅ Response
    return res.status(200).json({
      success: 1,
      count,
      data,
    });
  } catch (error) {
    console.error("Error fetching accepted enquiries:", error);
    return res.status(500).json({
      success: 0,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getShortlistedenquiries = async (req, res) => {
  try {
    const { enq_id } = req.query;

    if (!enq_id) {
      return res.status(400).json({ success: 0, message: "enq_id is required" });
    }

    // ✅ Fetch shortlisted enquiries + print query
    const enquiries = await EnquiryUsers.findAll({
      where: {
        enquiry_id: enq_id,
        enquiry_status: 1,
        is_delete: 0,
      },
      include: [
        {
          model: CompanyInfo,
          as: "CompanyInfo", // must match association alias
          attributes: ["organization_name"],
        },
      ],
      attributes: ["id", "company_id", "enquiry_id"],
      order: [["id", "ASC"]],

    });

    const count = enquiries.length;

    if (count === 0) {
      return res.status(200).json({
        success: 1,
        count: 0,
        data: [],
        message: "No shortlisted enquiries found.",
      });
    }

    // ✅ Format only sno & name
    const data = enquiries.map((enquiry, index) => ({
      sno: index + 1,
      name: enquiry.CompanyInfo?.organization_name || "-",
    }));

    return res.status(200).json({
      success: 1,
      count,
      data,
    });
  } catch (error) {
    console.error("❌ Error fetching shortlisted enquiries:", error);
    return res.status(500).json({
      success: 0,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getMessageenquiries = async (req, res) => {
  try {

    const { enq_id } = req.query;

    const enquiry = await Enquiries.findOne({
      where: { id: enq_id },
      include: { model: Users, as: 'from_user' }
    });
    const user = await Users.findOne({
      where: { id: enquiry.user_id },
      include: {
        model: CompanyInfo, as: 'company_info',
        include: [
          {
            model: UploadImage,
            as: 'companyLogo', // 👈 alias same hona chahiye
            required: false
          }
        ]
      }
    });


    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found"
      });
    }

    const companyId = user.company_id;

    const data = await sequelize.query(
      `
  SELECT 
    user_messages.*,
    enquiry_messages.enquiry_message_id AS mid,
    user_images.file AS user_file,
    seller_images.file AS seller_file,
    user_mid.fname AS user_fname,
    user_mid.lname AS user_lname,
    user_seller.fname AS seller_fname,
    user_seller.lname AS seller_lname
  FROM user_messages
  LEFT JOIN enquiry_messages 
    ON user_messages.message_id = enquiry_messages.enquiry_message_id
  LEFT JOIN users AS user_mid 
    ON user_messages.user_id = user_mid.user_id
  LEFT JOIN users AS user_seller 
    ON user_messages.company_id = user_seller.company_id
  LEFT JOIN upload_images AS user_images 
    ON user_mid.file_id = user_images.upload_image_id
  LEFT JOIN upload_images AS seller_images 
    ON user_seller.file_id = seller_images.upload_image_id
  WHERE user_messages.is_delete = 0
    AND enquiry_messages.enquiry_id = :messageId
  ORDER BY user_messages.updated_at ASC
  `,
      {
        replacements: {
          messageId: enq_id
        },
        type: QueryTypes.SELECT
      }
    );

    return res.status(200).json({
      success: true,
      data,
      user,
      enquiry
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const { companyId, is_type } = req.query;
    let enquiryMessages;

    const condition =
      is_type === 'myenquiry'
        ? 'enquiry_messages.buyer_company_id = :company_id'
        : 'enquiry_messages.seller_company_id = :company_id';

    enquiryMessages = await sequelize.query(
      `
      SELECT 
        enquiry_messages.*,
        enquiries.enquiry_number,
        company_info.organization_name,
        company_info.company_location,
        companyinformation.organization_name as org_name,
        companyinformation.company_location as com_location,
        s_user.fname,
        s_user.lname,
        upload_images.file,
        company_images.file as company_logo,
        company_images_new.file as company_logo_new
      FROM enquiry_messages
      LEFT JOIN enquiries 
        ON enquiry_messages.enquiry_id = enquiries.enquiry_id
      LEFT JOIN company_info 
        ON enquiry_messages.seller_company_id = company_info.company_id
        LEFT JOIN company_info as companyinformation
        ON enquiry_messages.buyer_company_id = companyinformation.company_id
      LEFT JOIN users AS s_user 
        ON enquiry_messages.seller_company_id = s_user.company_id
      LEFT JOIN upload_images 
        ON s_user.file_id = upload_images.upload_image_id
        LEFT JOIN upload_images AS company_images 
        ON company_info.company_logo = company_images.upload_image_id
        LEFT JOIN upload_images AS company_images_new 
        ON companyinformation.company_logo = company_images_new.upload_image_id
      WHERE enquiries.is_delete = 0
        AND ${condition}
      ORDER BY enquiry_messages.enquiry_message_id DESC
      `,
      {
        replacements: { company_id: companyId },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    return res.json({ success: true, data: enquiryMessages });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};


exports.postSendMessage = async (req, res) => {
  try {
    const { enquiry_id, message, user } = req.body;

    const enq_msg = await EnquiryMessage.findOne({
      where: { enquiry_id: enquiry_id }
    });
    const user_messages = await UserMessage.findOne({
      where: { is_delete: 0 },
      include: [
        {
          model: EnquiryMessage,
          as: 'EnquiryMessage',
          required: true,
          where: { enquiry_id },
          attributes: []
        }
      ],
      attributes: [
        'id',
        'user_id',
        'company_id',
        [Sequelize.col('EnquiryMessage.enquiry_message_id'), 'mid']
      ]
    });

    if (!user_messages) {
      return res.status(400).json({ success: false, message: "No base message found" });
    }

    const uid = user_messages.user_id;
    const userid = user.id;

    // ❗ yahan 0 nahi, NULL
    let user_id = 0;
    let company_id = 0;
    let seller_id = 0;
    let user_company_id = 0;

    user_id = user.id;
    company_id = user.company_id;


    const message_id = enq_msg.id;


    const data = await UserMessage.create({
      user_id,
      company_id,
      enquiry_id,
      message,
      message_id,
      user_company_id,
      seller_id,
      is_delete: 0
    });

    return res.json({ success: true, data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};


exports.getEnquiriesByEnquiryServerSide = async (req, res) => {
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
      user_id: user_id,
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
      },
      {
        model: Users,
        as: 'from_user',
        attributes: [
          'id',
          'fname',
          'lname',
          'email',
          [Sequelize.literal("CONCAT(from_user.fname, ' ', from_user.lname)"), 'full_name']
        ],
      },
      {
        model: Users,
        as: 'to_user',
        attributes: [
          'id',
          'fname',
          'lname',
          'email',
          [Sequelize.literal("CONCAT(to_user.fname, ' ', to_user.lname)"), 'full_name']
        ],
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



    const enrichedRows = [];
    for (const enq of rows) {
      const enquiryJSON = enq.toJSON();
      const sellerUser = await Users.findOne({
        where: { company_id: enquiryJSON.company_id },
        include: { model: CompanyInfo, as: 'company_info' }
      });

      // get that seller’s category info
      const { category_sell_names, sub_category_names } = await getCategoryNames(sellerUser);

      enrichedRows.push({
        ...enquiryJSON,
        category_name: category_sell_names || '',
        sub_category_name: sub_category_names || '',
      });
    }

    res.json({
      data: enrichedRows,
      filteredRecords,
      totalRecords: filteredRecords,
      isAll
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFilteredEnquiries = async (req, res) => {
  try {
    const {
      enquiry_number,
      category_name,
      sub_category_name,
      company_id,
      dateRange = '',
      startDate,
      endDate
    } = req.query;

    // Base where condition
    const where = {
      is_delete: 0,
    };

    if (enquiry_number) where.enquiry_number = { [Op.like]: `%${enquiry_number}%` };
    if (category_name) where.category_name = { [Op.like]: `%${category_name}%` };
    if (sub_category_name) where.sub_category_name = { [Op.like]: `%${sub_category_name}%` };
    if (company_id) where.company_id = company_id;

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

    // Fetch companies with associations
    const companies = await Enquiries.findAll({
      where,
      include: [
        {
          model: Users,
          as: 'to_user',
          attributes: ['id'],
          include: [
            { model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] },
          ]
        }
      ]
    });

    // Map the results
    const data = companies.map(company => {
      const s = company.toJSON();

      return {
        id: s.id,
        enquiry_number: s.enquiry_number,
        category_name: s.category_name,
        sub_category_name: s.sub_category_name,
        company_name: s.to_user?.company_info?.organization_name || 'NA',
        created_at: s.created_at
      };
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { logged_in_user_id, company_id, title, message, receiver_name } = req.body;

    const sender = await Users.findByPk(logged_in_user_id);
    if (!sender) return res.status(404).json({ message: "User not found" });

    // get company user
    const companyUser = await Users.findOne({ where: { company_id } });
    if (!companyUser) return res.status(404).json({ message: "Company user not found" });



const data = await BuyerEnquiry.create({
      user_id,
      company_id,
      enquiry_id,
      message,
      message_id,
      user_company_id,
      seller_id,
      is_delete: 0
    });




    // email format template
    const html = `
    <div style="background-color:#fff; padding:10px; margin:15px; border:1px dashed #ccc;">
        <p>Dear ${receiver_name},</p>
        <p style="text-align:right;">You have received a new message from user ${sender.fname} ${sender.lname}</p>
        <p>${title}</p>
        <p style="text-align:center;">${message}</p>
    </div>
    `;

    const { transporter } = await getTransporter();

    await transporter.sendMail({
      from: `"SourceIndia Electronics" <info@sourceindia-electronics.com>`,
      to: companyUser.email,
      subject: title,
      html
    });

    return res.status(200).json({ message: "Mail sent successfully" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getNextUnapprovedEnquiry = async (req, res) => {
  try {
    const { enquiry_number } = req.params;

    const current = await Enquiries.findOne({
      where: { enquiry_number }
    });

    if (!current) return res.json({ next: null });

    // NEXT in DESC list = smaller id
    const next = await Enquiries.findOne({
      where: {
        is_approve: 0,
        is_delete: 0,
        id: { [Op.lt]: current.id }
      },
      order: [['id', 'DESC']]   // Because list is descending
    });

    res.json({ next: next ? next.enquiry_number : null });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPreviousUnapprovedEnquiry = async (req, res) => {
  try {
    const { enquiry_number } = req.params;

    const current = await Enquiries.findOne({
      where: { enquiry_number }
    });

    if (!current) return res.json({ prev: null });

    // PREVIOUS in DESC list = larger id
    const prev = await Enquiries.findOne({
      where: {
        is_approve: 0,
        is_delete: 0,
        id: { [Op.gt]: current.id }
      },
      order: [['id', 'ASC']]   // Smallest greater ID first
    });

    res.json({ prev: prev ? prev.enquiry_number : null });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEnquiriesApproveStatus = async (req, res) => {
  try {
    const { is_approve } = req.body;
    if (is_approve !== 0 && is_approve !== 1) {
      return res.status(400).json({ message: 'Invalid account status. Use 1 (Active) or 0 (Deactive).' });
    }
    const enquiries = await Enquiries.findByPk(req.params.id);
    if (!enquiries) return res.status(404).json({ message: 'Enquiries not found' });
    enquiries.is_approve = is_approve;
    await enquiries.save();
    res.json({ message: 'Approve status updated', enquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEnquiryChartData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const earliestUser = await Enquiries.findOne({
      where: { is_delete: 0 },
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
    const chartData = await Enquiries.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("Enquiries.created_at")), "date"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Enquiries.is_approve = 1 THEN 1 ELSE 0 END"
            )
          ),
          "approved"
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN Enquiries.is_approve = 0 THEN 1 ELSE 0 END"
            )
          ),
          "notApproved"
        ],
      ],
      where: {
        is_delete: 0,
        created_at: { [Op.between]: [start, end] },
      },
      group: [Sequelize.fn("DATE", Sequelize.col("Enquiries.created_at"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("Enquiries.created_at")), "ASC"]],
    });

    // Convert to map for fast lookup
    const dataMap = {};
    chartData.forEach(row => {
      const rowDateStr = row.getDataValue("date"); // already 'YYYY-MM-DD'
      dataMap[rowDateStr] = {
        Approved: parseInt(row.getDataValue("approved")),
        NotApproved: parseInt(row.getDataValue("notApproved")),
      };
    });

    // Fill missing dates
    const chartArray = [];
    const currentDate = new Date(start);
    let cumulativeApproved = 0;
    let cumulativeNotApproved = 0;

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const entry = dataMap[dateStr] || {
        Approved: 0,
        NotApproved: 0,
      };

      // Update cumulative totals
      cumulativeApproved += entry.Approved;
      cumulativeNotApproved += entry.NotApproved;

      const total = cumulativeApproved + cumulativeNotApproved;

      chartArray.push({
        date: dateStr,
        Approved: cumulativeApproved,
        NotApproved: cumulativeNotApproved,
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