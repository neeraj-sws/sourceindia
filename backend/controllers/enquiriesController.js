const { Op, fn, col, literal } = require('sequelize');
const Enquiries = require('../models/Enquiries');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const EnquiryUsers = require('../models/EnquiryUsers');

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
          attributes: ['id','product_name']
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

exports.getAllEnquiriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = [
      'id', 'enquiry_number', 'created_at', 'updated_at', 'name', 'email', 'phone', 'category_name', 'company',
      'from_email', 'from_organization_name', 'to_organization_name', 'enquiry_product'
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
    if (req.query.getApprove === 'true') { where.is_approve = 1; }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [];
      if (viewType === 'leads') {
        searchWhere[Op.or].push(
          { enquiry_number: { [Op.like]: `%${search}%` } },
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
        enquiry_number: row.enquiry_number,
        category_name: row.category_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
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
          to_full_name: row.to_user ? `${row.to_user.fname} ${row.to_user.lname}` : null,
          to_email: row.to_user?.to_email || null,
          to_mobile: row.to_user?.to_mobile || null,
          to_company_id: row.to_user?.to_company_id || null,
          to_organization_name: row.to_user?.company_info?.organization_name || null,
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
