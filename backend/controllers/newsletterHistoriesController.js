const { Sequelize, Op, fn, col, literal } = require('sequelize');
const NewsletterHistories = require('../models/NewsletterHistories');
const Users = require('../models/Users');

exports.getNewsletterHistoriesCount = async (req, res) => {
  try {
    const { newsLatter_id } = req.query;
    if (!newsLatter_id) {
      return res.status(400).json({ error: "newsLatter_id is required" });
    }
    const whereClause = { newsLatter_id };
    const [all, mailSent, mailUnSent, mailOpen, mailNotOpen] = await Promise.all([
      NewsletterHistories.count({ where: whereClause }),
      NewsletterHistories.count({ where: { ...whereClause, is_mail: 1 } }),
      NewsletterHistories.count({ where: { ...whereClause, is_mail: 0 } }),
      NewsletterHistories.count({ where: { ...whereClause, email_view_count: 1 } }),
      NewsletterHistories.count({ where: { ...whereClause, email_view_count: 0 } }),
    ]);
    res.json({
      all,
      mailSent,
      mailUnSent,
      mailOpen,
      mailNotOpen
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllNewsletterHistoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      newsLatter_id,
    } = req.query;
    const validColumns = ['id', 'is_mail', 'created_at', 'updated_at', 'code', 'email_view_count', 'user_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'user_name') {
      order = [[Sequelize.literal("CONCAT(`Users`.`fname`, ' ', `Users`.`lname`)"), sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const baseWhere = {};
    if (newsLatter_id) {
      baseWhere.newsLatter_id = newsLatter_id;
    }
    if (search) {
      baseWhere[Op.or] = [
        literal(`CONCAT(Users.fname, ' ', Users.lname) LIKE '%${search}%'`),
      ];
    }
    const totalRecords = await NewsletterHistories.count({where: { ...baseWhere }});
    const { count: filteredRecords, rows } = await NewsletterHistories.findAndCountAll({
      where: baseWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: [
            'is_seller', 'fname', 'lname', [fn('CONCAT', col('Users.fname'), ' ', col('Users.lname')), 'full_name']
          ],
          required: false,
        },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.Users ? `${row.Users.fname} ${row.Users.lname}` : null,
      user_is_seller: row.Users ? row.Users.is_seller : null,
      is_mail: row.is_mail,
      code: row.code,
      email_view_count: row.email_view_count,
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