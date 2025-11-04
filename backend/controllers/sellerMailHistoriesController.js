const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const SellerMailHistories = require('../models/SellerMailHistories');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');

exports.getAllSellerMailHistories = async (req, res) => {
  try {
    const sellerMailHistories = await SellerMailHistories.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: [
            'id',
            'fname',
            'lname',
            'email',
            [fn('CONCAT', col('Users.fname'), ' ', col('Users.lname')), 'full_name']
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
      ],
    });

    const formatted = sellerMailHistories.map(row => {
      let mailTypeText = null;
      switch (row.mail_type) {
        case 0:
          mailTypeText = 'Direct';
          break;
        case 1:
          mailTypeText = 'Selected';
          break;
        case 3:
          mailTypeText = 'All';
          break;
        default:
          mailTypeText = 'Unknown';
      }

      return {
        id: row.id,
        user_id: row.user_id,
        fname: row.Users ? row.Users.fname : null,
        lname: row.Users ? row.Users.lname : null,
        user_name: row.Users ? `${row.Users.fname} ${row.Users.lname}` : null,
        user_email: row.Users ? row.Users.email : null,
        user_company_name: row.Users?.company_info?.organization_name || null,
        mail_type: mailTypeText, // ✅ readable label
        country: row.country,
        state: row.state,
        city: row.city,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSellerMailHistoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid home status. Use 1 (Active) or 0 (Deactive).' });
    }
    const sellerMailHistories = await SellerMailHistories.findByPk(req.params.id);
    if (!sellerMailHistories) return res.status(404).json({ message: 'Seller mail histories not found' });
    sellerMailHistories.status = status;
    await sellerMailHistories.save();
    res.json({ message: 'Home status updated', sellerMailHistories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSellerMailHistories = async (req, res) => {
  try {
    const enquiry = await SellerMailHistories.findByPk(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Seller mail histories not found' });
    await enquiry.destroy();
    res.json({ message: 'Seller mail histories deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedSellerMailHistories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const enquiries = await SellerMailHistories.findAll({
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
    await SellerMailHistories.update(
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

exports.updateSellerMailHistoriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const enquiries = await SellerMailHistories.findByPk(req.params.id);
    if (!enquiries) return res.status(404).json({ message: 'Seller mail histories not found' });
    enquiries.is_delete = is_delete;
    await enquiries.save();
    res.json({ message: 'Seller mail histories is removed', enquiries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSellerMailHistoriesServerSide = async (req, res) => {
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
      companyId,
      mail_type
    } = req.query;
    const validColumns = ['id', 'created_at', 'updated_at', 'user_company_name', 'user_name', 'user_email', 'user_mobile',
    'user_status', 'user_is_seller', 'user_elcina_member', 'country', 'state', 'city', 'mail_type'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'user_name') {
      literal(`CONCAT(Users.fname, ' ', Users.lname)`), sortDirection
    } else if (sortBy === 'user_email') {
      order = [[
        { model: Users, as: 'Users' }, 'email', sortDirection
      ]];
    } else if (sortBy === 'user_mobile') {
      order = [[
        { model: Users, as: 'Users' }, 'mobile', sortDirection
      ]];
    } else if (sortBy === 'user_company_name') {
      order = [[
        { model: Users, as: 'Users' },
        { model: CompanyInfo, as: 'company_info' }, 'organization_name', sortDirection
      ]];
    } else if (sortBy === 'user_status') {
      order = [[
        { model: Users, as: 'Users' }, 'status', sortDirection
      ]];
    } else if (sortBy === 'user_is_seller') {
      order = [[
        { model: Users, as: 'Users' }, 'is_seller', sortDirection
      ]];
    } else if (sortBy === 'user_elcina_member') {
      order = [[
        { model: Users, as: 'Users' }, 'elcina_member', sortDirection
      ]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (companyId) {
      searchWhere['$Users.company_id$'] = companyId;
    }
    if (mail_type) {
      searchWhere.mail_type = mail_type;
    }
    if (search) {
      searchWhere[Op.or] = [
        literal(`CONCAT(Users.fname, ' ', Users.lname) LIKE '%${search}%'`),
        { '$Users.email$': { [Op.like]: `%${search}%` } },
        { '$Users.company_info.organization_name$': { [Op.like]: `%${search}%` } },
      ];
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
    const totalRecords = await SellerMailHistories.count({ where });
    const { count: filteredRecords, rows } = await SellerMailHistories.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: [
            'id',
            'email',
            'mobile',
            'company_id',
            'status',
            'is_seller',
            'elcina_member',
            'fname',
            'lname',
            [fn('CONCAT', col('Users.fname'), ' ', col('Users.lname')), 'full_name']
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
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_company_name: row.Users?.company_info?.organization_name || null,
      user_name: row.Users ? `${row.Users.fname} ${row.Users.lname}` : null,
      user_email: row.Users ? row.Users.email : null,
      user_mobile: row.Users ? row.Users.mobile : null,
      user_status: row.Users ? row.Users.status : null,
      user_is_seller: row.Users ? row.Users.is_seller : null,
      user_elcina_member: row.Users ? row.Users.elcina_member : null,
      country: row.country,
      state: row.state,
      city: row.city,
      mail_type: row.mail_type,
      status: row.status,
      is_delete: row.is_delete,
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