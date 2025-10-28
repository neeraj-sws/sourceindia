const { Op } = require('sequelize');
const OpenEnquiries = require('../models/OpenEnquiries');
const OpenEnquiriesChats = require('../models/OpenEnquiriesChats');

const Categories = require('../models/Categories');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const UploadImage = require('../models/UploadImage');

exports.getAllOpenEnquiries = async (req, res) => {
  try {
    const { is_delete, is_home, user_id } = req.query;
    const whereConditions = {};
    if (is_delete !== undefined) {
      whereConditions.is_delete = is_delete;
    }
    if (is_home !== undefined) {
      whereConditions.is_home = is_home;
    }
    if (user_id !== undefined) {
      whereConditions.user_id = user_id;
    }

    const openEnquiries = await OpenEnquiries.findAll({
      where: whereConditions,
      order: [['id', 'ASC']],
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['fname', 'lname', 'email', 'company_id'],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: ['organization_name', 'organization_slug'],
              include: [
                {
                  model: UploadImage,
                  as: 'companyLogo',
                  attributes: ['file']
                }
              ]
            }
          ]
        }
      ],
      raw: false,
      nest: true,

    });


    const transformed = openEnquiries.map(item => {
      const enquiry = item.toJSON();
      const flattened = {
        ...enquiry,
        ...enquiry.Users && {
          fname: enquiry.Users.fname,
          lname: enquiry.Users.lname,
          email: enquiry.Users.email,
          company_id: enquiry.Users.company_id,
          organization_name: enquiry.Users.company_info?.organization_name || null,
          company_logo: enquiry.Users.company_info?.companyLogo?.file || null,
          organization_slug: enquiry.Users.company_info?.organization_slug || null
        }
      };
      delete flattened.Users;
      return flattened;
    });

    res.json(transformed);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};


exports.getFrontOpenEnquiries = async (req, res) => {
  try {
    const { is_delete, is_home, user_id } = req.query;
    const whereConditions = {};
    if (is_delete !== undefined) {
      whereConditions.is_delete = is_delete;
    }
    // if (is_home !== undefined) {
    //   whereConditions.is_home = is_home;
    // }
    if (user_id !== undefined) {
      whereConditions.user_id = user_id;
    }

    const openEnquiries = await OpenEnquiries.findAll({
      where: whereConditions,
      order: [['id', 'ASC']],
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['fname', 'lname', 'email', 'company_id'],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: ['organization_name', 'organization_slug'],
              include: [
                {
                  model: UploadImage,
                  as: 'companyLogo',
                  attributes: ['file']
                }
              ]
            }
          ]
        }
      ],
      raw: false,
      nest: true,

    });



    const transformed = openEnquiries.map(item => {
      const enquiry = item.toJSON();
      const flattened = {
        ...enquiry,
        ...enquiry.Users && {
          fname: enquiry.Users.fname,
          lname: enquiry.Users.lname,
          email: enquiry.Users.email,
          company_id: enquiry.Users.company_id,
          organization_name: enquiry.Users.company_info?.organization_name || null,
          company_logo: enquiry.Users.company_info?.companyLogo?.file || null,
          organization_slug: enquiry.Users.company_info?.organization_slug || null
        }
      };
      delete flattened.Users;
      return flattened;
    });

    res.json(transformed);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};



exports.updateOpenEnquiriesStatus = async (req, res) => {
  try {
    const { is_home } = req.body;
    if (is_home !== 0 && is_home !== 1) {
      return res.status(400).json({ message: 'Invalid home status. Use 1 (Active) or 0 (Deactive).' });
    }
    const openEnquiries = await OpenEnquiries.findByPk(req.params.id);
    if (!openEnquiries) return res.status(404).json({ message: 'Open Enquiries not found' });
    openEnquiries.is_home = is_home;
    await openEnquiries.save();
    res.json({ message: 'Home status updated', openEnquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOpenEnquiriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const openEnquiries = await OpenEnquiries.findByPk(req.params.id);
    if (!openEnquiries) return res.status(404).json({ message: 'Open Enquiries not found' });
    openEnquiries.is_delete = is_delete;
    await openEnquiries.save();
    res.json({ message: 'Open Enquiries is removed', openEnquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOpenEnquiries = async (req, res) => {
  try {
    const openEnquiries = await OpenEnquiries.findByPk(req.params.id);
    if (!openEnquiries) return res.status(404).json({ message: 'Open Enquiries not found' });

    await openEnquiries.destroy();
    res.json({ message: 'Open Enquiries deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOpenEnquiriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      user_id,
      dateRange = '',
      startDate,
      endDate,
    } = req.query;
    const validColumns = ['id', 'title', 'created_at', 'updated_at', 'name', 'email', 'phone', 'description', 'company'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = {};
    if (user_id) {
      baseWhere.user_id = user_id;
    }
    baseWhere.is_delete = 0;
    if (req.query.getDeleted === 'true') {
      baseWhere.is_delete = 1;
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
      baseWhere.created_at = dateCondition;
    }
    if (search) {
      baseWhere[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await OpenEnquiries.count({ where: { ...baseWhere } });
    const { count: filteredRecords, rows } = await OpenEnquiries.findAndCountAll({
      where: baseWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Users, attributes: ['is_seller'], as: 'Users' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      name: row.name,
      email: row.email,
      phone: row.phone,
      description: row.description,
      company: row.company,
      is_home: row.is_home,
      is_delete: row.is_delete,
      user_type: row.Users ? row.Users.is_seller : null,
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


exports.cheakUserchats = async (req, res) => {

  const { id, user } = req.body;

  const userId = user.id;
  console.log(userId);
  try {
    const existing = await OpenEnquiriesChats.findOne({
      where: { enquiry_id: id, user_id: userId },
    });

    if (!existing) {
      const enquiry = await OpenEnquiries.findByPk(id);
      if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

      await OpenEnquiriesChats.create({
        message: 'Hii',
        user_id: userId,
        enquiry_user_id: enquiry.user_id,
        enquiry_id: id,
        reply_user_id: userId,
      });

      return res.json({ success: 1, enquiry_id: id });
    }

    res.json({ success: 2, enquiry_id: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};