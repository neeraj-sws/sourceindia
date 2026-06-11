const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const moment = require('moment');
const sequelize = require('../config/database');
const SellerMailHistories = require('../models/SellerMailHistories');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Emails = require('../models/Emails');
const MailMaster = require('../models/MailMaster');
const { sendMail } = require('../helpers/mailHelper');
const crypto = require('crypto');

const getTrackingBaseUrl = () => {
  const root = (process.env.ROOT_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
  const apiBasePath = (process.env.API_BASE_PATH || '/v2').trim();
  if (!apiBasePath || apiBasePath === '/') return root;
  const normalizedApiBasePath = apiBasePath.startsWith('/') ? apiBasePath : `/${apiBasePath}`;
  return root.endsWith(normalizedApiBasePath) ? root : `${root}${normalizedApiBasePath}`;
};

const appendTrackingPixel = (html, token) => {
  if (!html || !token) return html || '';
  const trackingUrl = `${getTrackingBaseUrl()}/api/seller_mail_histories/track-open/${encodeURIComponent(token)}`;
  const pixelTag = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
  return `${html}${pixelTag}`;
};

exports.getAllSellerMailHistories = async (req, res) => {
  try {
    // Check if user_id is provided in query parameters
    const { user_id } = req.query;  // You can send the user_id in the query string

    // Build query options
    const options = {
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
        }, {
          model: Emails,
          as: 'Emails',
          attributes: ['id', 'title'],
          required: false,
        }
      ],
    };

    // If user_id is provided, add it to the where condition to filter by user_id
    if (user_id) {
      options.where = {
        user_id: user_id
      };
    }

    // Fetch the seller mail histories with the applied conditions
    const sellerMailHistories = await SellerMailHistories.findAll(options);

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
        mail_title: row.Emails?.title || null,
        mail_type: mailTypeText,
        country: row.country,
        state: row.state,
        city: row.city,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    // Return the formatted data as a response
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSellerMailHistoriesold = async (req, res) => {
  try {
    // Check if user_id is provided in query parameters
    const { user_id } = req.query;  // You can send the user_id in the query string

    // Build query options
    const options = {
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
        }, {
          model: Emails,
          as: 'Emails',
          attributes: ['id', 'title'],
          required: false,
        }
      ],
    };

    // If user_id is provided, add it to the where condition to filter by user_id
    if (user_id) {
      options.where = {
        user_id: user_id
      };
    }

    // Fetch the seller mail histories with the applied conditions
    const sellerMailHistories = await SellerMailHistories.findAll(options);

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
        mail_title: row.Emails?.title || null,
        mail_type: mailTypeText,
        country: row.country,
        state: row.state,
        city: row.city,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    // Return the formatted data as a response
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
    const validColumns = ['id', 'mail_code', 'mail_master_list', 'mail_master_type', 'pending_count', 'success_count', 'failed_count', 'opened_count', 'not_opened_count', 'total_mail_histories', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    const safeSortBy = validColumns.includes(sortBy) ? sortBy : 'id';
    const isDeletedFilter = req.query.getDeleted === 'true' ? 1 : 0;

    const replacements = {
      search: `%${search || ''}%`,
      isDeletedFilter,
      startDate: null,
      endDate: null,
      companyId: companyId || null,
      mailType: mail_type || null,
      limitValue,
      offset
    };

    const filterConditions = [
      'smh.is_delete = :isDeletedFilter',
      '(:companyId IS NULL OR smh.company_id = :companyId)',
      '(:mailType IS NULL OR smh.mail_type = :mailType)',
      '(mm.code LIKE :search OR mm.list LIKE :search OR mm.type LIKE :search)'
    ];

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
      replacements.startDate = dateCondition[Op.gte] || null;
      replacements.endDate = dateCondition[Op.lte] || null;
      filterConditions.push('smh.created_at BETWEEN :startDate AND :endDate');
    }

    const whereSql = filterConditions.join(' AND ');
    const orderByMap = {
      id: 'mm.mail_master_id',
      mail_code: 'mm.code',
      mail_master_list: 'mm.list',
      mail_master_type: 'mm.type',
      pending_count: 'pending_count',
      success_count: 'success_count',
      failed_count: 'failed_count',
      opened_count: 'opened_count',
      not_opened_count: 'not_opened_count',
      total_mail_histories: 'total_mail_histories',
      created_at: 'mm.created_at',
      updated_at: 'mm.updated_at'
    };
    const orderByColumn = orderByMap[safeSortBy] || 'mm.mail_master_id';

    const totalRecordsRows = await sequelize.query(
      `
      SELECT COUNT(DISTINCT mm.mail_master_id) AS total
      FROM mail_master mm
      INNER JOIN seller_mail_histories smh ON smh.mail_code = mm.code
      WHERE smh.is_delete = :isDeletedFilter
      `,
      {
        replacements: { isDeletedFilter },
        type: QueryTypes.SELECT
      }
    );

    const filteredRecordsRows = await sequelize.query(
      `
      SELECT COUNT(DISTINCT mm.mail_master_id) AS total
      FROM mail_master mm
      INNER JOIN seller_mail_histories smh ON smh.mail_code = mm.code
      WHERE ${whereSql}
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    const rows = await sequelize.query(
      `
      SELECT
        mm.mail_master_id AS id,
        mm.code AS mail_code,
        mm.list AS mail_master_list,
        mm.type AS mail_master_type,
        mm.created_at,
        mm.updated_at,
        SUM(CASE WHEN smh.is_sent = 0 AND smh.is_failed = 0 AND smh.status = 1 THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN smh.is_sent = 1 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN smh.is_failed = 1 THEN 1 ELSE 0 END) AS failed_count,
        SUM(CASE WHEN smh.is_open = 1 THEN 1 ELSE 0 END) AS opened_count,
        SUM(CASE WHEN smh.is_open = 0 THEN 1 ELSE 0 END) AS not_opened_count,
        COUNT(smh.seller_mail_history_id) AS total_mail_histories
      FROM mail_master mm
      INNER JOIN seller_mail_histories smh ON smh.mail_code = mm.code
      WHERE ${whereSql}
      GROUP BY mm.mail_master_id, mm.code, mm.list, mm.type, mm.created_at, mm.updated_at
      ORDER BY ${orderByColumn} ${sortDirection}
      LIMIT :limitValue OFFSET :offset
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    const mappedRows = rows.map((row) => ({
      id: row.id,
      mail_code: row.mail_code,
      mail_master_list: row.mail_master_list,
      mail_master_type: row.mail_master_type,
      pending_count: Number(row.pending_count || 0),
      success_count: Number(row.success_count || 0),
      failed_count: Number(row.failed_count || 0),
      opened_count: Number(row.opened_count || 0),
      not_opened_count: Number(row.not_opened_count || 0),
      total_mail_histories: Number(row.total_mail_histories || 0),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const totalRecords = Number(totalRecordsRows?.[0]?.total || 0);
    const filteredRecords = Number(filteredRecordsRows?.[0]?.total || 0);

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

exports.resendSellerMailHistory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid mail history id.' });
    }

    const history = await SellerMailHistories.findByPk(id);
    if (!history) {
      return res.status(404).json({ message: 'Mail history not found.' });
    }

    if (Number(history.is_failed) !== 1) {
      return res.status(400).json({ message: 'Only failed emails can be resent.' });
    }

    const template = await Emails.findByPk(history.email_id);
    if (!template) {
      return res.status(404).json({ message: 'Email template not found.' });
    }

    const user = await Users.findByPk(history.user_id, {
      attributes: ['id', 'fname', 'lname', 'email', 'real_password']
    });

    const recipientEmail = history.mail || user?.email;
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Recipient email not found.' });
    }

    const APP_URL = process.env.APP_URL || '';
    const verificationLink = APP_URL ? `<a href="${APP_URL}">Click and Login Account</a>` : '';

    const openToken = history.open_token || crypto.randomBytes(24).toString('hex');
    const msgStr = template.message?.toString('utf8') || '';



    const userMessage = appendTrackingPixel(
      msgStr
        .replace(/\{\{\s*USER_NAME\s*\}\}/g, `${user?.fname || ''} ${user?.lname || ''}`.trim())
        .replace(/\{\{\s*USER_EMAIL\s*\}\}/g, recipientEmail)
        .replace(/\{\{\s*USER_PASSWORD\s*\}\}/g, user?.real_password || '')
        .replace(/\{\{\s*APP_URL\s*\}\}/g, APP_URL)
        .replace(/\{\{\s*VERIFICATION_LINK\s*\}\}/g, verificationLink),
      openToken
    );

    try {
      await sendMail({
        to: recipientEmail,
        subject: template.subject,
        message: userMessage
      });

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await history.update({
        is_sent: 1,
        is_failed: 0,
        open_token: openToken,
        is_open: 0,
        open_count: 0,
        opened_at: null,
        last_open_ip: null,
        last_user_agent: null,
        mail_send_time: now,
        updated_at: new Date()
      });

      return res.json({ message: 'Mail resent successfully.' });
    } catch (sendError) {
      await history.update({
        is_sent: 0,
        is_failed: 1,
        updated_at: new Date()
      });

      return res.status(500).json({
        message: 'Failed to resend mail.',
        error: sendError.message
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.trackSellerMailOpen = async (req, res) => {
  try {
    const token = decodeURIComponent((req.params.token || '').trim());
    if (token) {
      const history = await SellerMailHistories.findOne({ where: { open_token: token } });
      if (history) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        await history.update({
          is_open: 1,
          open_count: Number(history.open_count || 0) + 1,
          opened_at: history.opened_at || new Date(),
          last_open_ip: ip,
          last_user_agent: userAgent,
          updated_at: new Date(),
        });
      }
    }

    const transparentGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.status(200).send(transparentGif);
  } catch (err) {
    console.error(err);
    const transparentGif = Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
    return res.status(200).send(transparentGif);
  }
};

exports.getSellerMailHistoryDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      sortBy = 'id',
      sort = 'DESC'
    } = req.query;

    const mailCode = decodeURIComponent((req.params.mailCode || '').trim());
    if (!mailCode) {
      return res.status(400).json({ message: 'Invalid mail history code.' });
    }

    const validColumns = ['id', 'user_name', 'user_email', 'organization_name', 'delivery_status', 'is_open', 'open_count', 'opened_at', 'mail_send_time', 'mail_type', 'city', 'state', 'country', 'created_at', 'updated_at'];
    const sortDirection = sort === 'ASC' ? 'ASC' : 'DESC';
    const safeSortBy = validColumns.includes(sortBy) ? sortBy : 'id';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitValue = parseInt(limit, 10);
    const isDeletedFilter = req.query.getDeleted === 'true' ? 1 : 0;

    const orderByMap = {
      id: 'smh.seller_mail_history_id',
      user_name: 'user_name',
      user_email: 'u.email',
      organization_name: 'organization_name',
      delivery_status: 'delivery_status',
      is_open: 'smh.is_open',
      open_count: 'smh.open_count',
      opened_at: 'smh.opened_at',
      mail_send_time: 'smh.mail_send_time',
      mail_type: 'smh.mail_type',
      city: 'smh.city',
      state: 'smh.state',
      country: 'smh.country',
      created_at: 'smh.created_at',
      updated_at: 'smh.updated_at'
    };

    const replacements = {
      mailCode,
      isDeletedFilter,
      search: `%${search || ''}%`,
      limitValue,
      offset
    };

    const summaryRows = await sequelize.query(
      `
      SELECT
        COALESCE(mm.mail_master_id, 0) AS id,
        smh.mail_code,
        MAX(mm.list) AS mail_master_list,
        MAX(mm.type) AS mail_master_type,
        MIN(smh.created_at) AS created_at,
        MAX(smh.updated_at) AS updated_at,
        SUM(CASE WHEN smh.is_sent = 0 AND smh.is_failed = 0 AND smh.status = 1 THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN smh.is_sent = 1 THEN 1 ELSE 0 END) AS success_count,
        SUM(CASE WHEN smh.is_failed = 1 THEN 1 ELSE 0 END) AS failed_count,
        COUNT(smh.seller_mail_history_id) AS total_mail_histories
      FROM seller_mail_histories smh
      LEFT JOIN mail_master mm ON mm.code = smh.mail_code
      WHERE smh.mail_code = :mailCode
        AND smh.is_delete = :isDeletedFilter
      GROUP BY smh.mail_code
      `,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    const summary = summaryRows?.[0];
    if (!summary) {
      return res.status(404).json({ message: 'Mail history details not found.' });
    }

    const detailFilterSql = `
      smh.mail_code = :mailCode
      AND smh.is_delete = :isDeletedFilter
      AND (
        CONCAT(COALESCE(u.fname, ''), ' ', COALESCE(u.lname, '')) LIKE :search
        OR COALESCE(u.email, '') LIKE :search
        OR COALESCE(ci.organization_name, '') LIKE :search
        OR COALESCE(smh.mail, '') LIKE :search
        OR COALESCE(smh.city, '') LIKE :search
        OR COALESCE(smh.state, '') LIKE :search
        OR COALESCE(smh.country, '') LIKE :search
        OR COALESCE(smh.ip_address, '') LIKE :search
      )
    `;

    const detailReplacements = replacements;

    const filteredRecordsRows = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM seller_mail_histories smh
      LEFT JOIN users u ON u.user_id = smh.user_id
      LEFT JOIN company_info ci ON ci.company_id = u.company_id
      WHERE ${detailFilterSql}
      `,
      {
        replacements: detailReplacements,
        type: QueryTypes.SELECT
      }
    );

    const rows = await sequelize.query(
      `
      SELECT
        smh.seller_mail_history_id AS id,
        smh.user_id,
        TRIM(CONCAT(COALESCE(u.fname, ''), ' ', COALESCE(u.lname, ''))) AS user_name,
        u.email AS user_email,
        COALESCE(ci.organization_name, '') AS organization_name,
        smh.mail,
        smh.mail_type,
        smh.mail_template_id,
        smh.email_id,
        smh.is_sent,
        smh.is_failed,
        smh.company_id,
        smh.mail_send_time,
        smh.open_token,
        smh.is_open,
        smh.open_count,
        smh.opened_at,
        smh.last_open_ip,
        smh.last_user_agent,
        smh.ip_address,
        smh.city,
        smh.state,
        smh.country,
        smh.location,
        smh.status,
        smh.created_at,
        smh.updated_at,
        CASE
          WHEN smh.is_sent = 1 THEN 'Success'
          WHEN smh.is_failed = 1 THEN 'Failed'
          ELSE 'Pending'
        END AS delivery_status
      FROM seller_mail_histories smh
      LEFT JOIN users u ON u.user_id = smh.user_id
      LEFT JOIN company_info ci ON ci.company_id = u.company_id
      WHERE ${detailFilterSql}
      ORDER BY ${orderByMap[safeSortBy]} ${sortDirection}
      LIMIT :limitValue OFFSET :offset
      `,
      {
        replacements: detailReplacements,
        type: QueryTypes.SELECT
      }
    );

    res.json({
      summary: {
        id: summary.id,
        mail_code: summary.mail_code,
        mail_master_list: summary.mail_master_list || summary.mail_code,
        mail_master_type: summary.mail_master_type || null,
        pending_count: Number(summary.pending_count || 0),
        success_count: Number(summary.success_count || 0),
        failed_count: Number(summary.failed_count || 0),
        total_mail_histories: Number(summary.total_mail_histories || 0),
        created_at: summary.created_at,
        updated_at: summary.updated_at
      },
      data: rows.map((row) => ({
        ...row,
        mail_type_label: Number(row.mail_type) === 0 ? 'Direct' : Number(row.mail_type) === 1 ? 'Selected' : Number(row.mail_type) === 3 ? 'All' : '-',
      })),
      totalRecords: Number(summary.total_mail_histories || 0),
      filteredRecords: Number(filteredRecordsRows?.[0]?.total || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};