const { Op, fn, col, literal } = require('sequelize');
const UserActivity = require('../models/UserActivity');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');

exports.getAllUserActivity = async (req, res) => {
  try {
    const userActivity = await UserActivity.findAll({ order: [['id', 'ASC']],
    include: [
      {
        model: Users,
        as: 'Users',
        attributes: ['id', 'fname', 'lname', 'email', 'mobile', 'is_seller'], include: [
      {
        model: CompanyInfo,
        as: 'company_info',
        attributes: [['organization_name', 'organization_name']],
        required: false,
      }]}
    ]});
    const modifiedNewsletters = userActivity.map(user_activity => {
      const userActivityData = user_activity.toJSON();
      if (userActivityData.Users) {
        userActivityData.user_fname = userActivityData.Users.fname || null;
        userActivityData.user_lname = userActivityData.Users.lname || null;
        userActivityData.user_email = userActivityData.Users.email || null;
        userActivityData.user_mobile = userActivityData.Users.mobile || null;

        if (userActivityData.Users.is_seller !== null && userActivityData.Users.is_seller !== undefined) {
          userActivityData.user_type = userActivityData.Users.is_seller == 1 ? 'Seller' : 'Buyer';
        } else {
          userActivityData.user_type = '';
        }

        userActivityData.company_name = userActivityData.Users.company_info?.organization_name || null;
      } else {
        userActivityData.user_fname = null;
        userActivityData.user_lname = null;
        userActivityData.user_type = '';
        userActivityData.company_name = null;
      }
      delete userActivityData.Users;
      return userActivityData;
    });
    res.json(modifiedNewsletters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserActivitiesCount = async (req, res) => {
  try {
    const userIdsInActivity = await UserActivity.findAll({
      attributes: ['user_id'],
      group: ['user_id'],
      raw: true
    });
    const activeUserIds = userIdsInActivity.map(item => item.user_id);
    const [total, UserInactiveStatus, UserActiveStatus, UserApprove, UserDeleted] = await Promise.all([
      UserActivity.count(),
      Users.count({ where: { id: activeUserIds, status: 0 } }),
      Users.count({ where: { id: activeUserIds, status: 1 } }),
      Users.count({ where: { id: activeUserIds, is_approve: 1 } }),
      Users.count({ where: { id: activeUserIds, is_delete: 1 } }),
    ]);
    res.json({
      total,
      UserInactiveStatus,
      UserActiveStatus,
      UserApprove,
      UserDeleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserActivitiesByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const user_activity = await UserActivity.findAll({
      where: { user_id },
      order: [['id', 'ASC']],
    });
    const users = await Users.findByPk(user_id);
    res.json({
      user_fname:users?.fname || null,
      user_lname:users?.lname || null,
      user_status:users?.status || null,
      user_is_seller:users?.is_seller || null,
      user_updated_at:users?.updated_at || null,
      user_activity:user_activity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUserActivitiesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'created_at', 'updated_at', 'user_company_name', 'user_name', 'user_email', 'user_mobile',
    'user_status', 'user_is_seller'];
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
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        literal(`CONCAT(Users.fname, ' ', Users.lname) LIKE '%${search}%'`),
        { '$Users.email$': { [Op.like]: `%${search}%` } },
        { '$Users.mobile$': { [Op.like]: `%${search}%` } },
        { '$Users.company_info.organization_name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await UserActivity.count();
    const { count: filteredRecords, rows } = await UserActivity.findAndCountAll({
      where,
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
            'fname',
            'lname',
            [fn('CONCAT', col('Users.fname'), ' ', col('Users.lname')), 'full_name']
          ],
          include: [
            {
              model: CompanyInfo,
              as: 'company_info',
              attributes: [['organization_name', 'organization_name'],['organization_slug', 'organization_slug']],
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
      user_company_slug: row.Users?.company_info?.organization_slug || null,
      user_name: row.Users ? `${row.Users.fname} ${row.Users.lname}` : null,
      user_email: row.Users ? row.Users.email : null,
      user_mobile: row.Users ? row.Users.mobile : null,
      user_status: row.Users ? row.Users.status : null,
      user_is_seller: row.Users ? row.Users.is_seller : null,
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