const { Op, Sequelize } = require('sequelize');

const bcrypt = require('bcryptjs');
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
          fname: enquiry?.Users?.fname ?? '',
          lname: enquiry?.Users?.lname ?? '',
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
      order: [['id', 'DESC']],
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

exports.getUserOpenEnquiries = async (req, res) => {
  try {
    const { enquiry_id, user_id } = req.query;
    const whereConditions = {};

    const openEnquiry = await OpenEnquiries.findByPk(enquiry_id);
    whereConditions.enquiry_id = enquiry_id;
    if (openEnquiry) {
      whereConditions.user_id = {
        [Op.ne]: openEnquiry.user_id
      };
      whereConditions.enquiry_user_id = openEnquiry.user_id;
    }

    const openEnquiries = await OpenEnquiriesChats.findAll({
      where: whereConditions,

      attributes: [
        'user_id',

        // 👇 aggregate column
        [Sequelize.fn('MAX', Sequelize.col('OpenEnquiriesChats.open_enquriychats_id')), 'open_enquriychats_id'],
        [Sequelize.fn('MAX', Sequelize.col('OpenEnquiriesChats.created_at')), 'created_at'],
        [Sequelize.fn('MAX', Sequelize.col('OpenEnquiriesChats.message')), 'message'],
      ],

      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['user_id', 'fname', 'lname', 'email', 'company_id'],
        },
        {
          model: OpenEnquiries,
          as: 'OpenEnquiries',
          attributes: ['title'],
        }
      ],

      group: ['user_id'],   // ✅ safe now
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

exports.getMessages = async (req, res) => {
  try {
    const { replyUserId, enquiry_id, enquiryId } = req.query;
    const whereConditions = {};

    if (replyUserId !== undefined) {
      whereConditions.reply_user_id = replyUserId;
    }

    whereConditions.enquiry_id = enquiry_id;
    const openEnquiries = await OpenEnquiriesChats.findAll({
      where: whereConditions,
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['fname', 'lname', 'email', 'company_id'],
          include: [
            {
              model: UploadImage,
              as: 'file',
              attributes: ['file']
            }
          ]
        }, {
          model: OpenEnquiries,
          as: 'OpenEnquiries',
          attributes: ['title'],
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
        { model: Users, as: 'Users' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      name: row?.Users?.fname + " " + row?.Users?.lname,
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
  try {
    const { id, user } = req.body;

    if (!id || !user || !user.id) {
      return res.status(400).json({
        error: "Invalid enquiry or user id",
      });
    }
    const userId = user.id;
    const existing = await OpenEnquiriesChats.findOne({
      where: {
        enquiry_id: id,
        user_id: user.id,
      },
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
    return res.json({ success: 2, enquiry_id: id });
  } catch (err) {
    console.error(
      "MYSQL REAL ERROR 👉",
      err.original?.message || err
    );
    return res.status(500).json({ error: "DB error" });
  }
};



exports.getOpenEnquiriesById = async (req, res) => {
  try {
    const openEnquiries = await OpenEnquiries.findByPk(req.params.id, {
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: ['fname', 'lname', 'email', 'user_company'],
          include: [
            { model: UploadImage, as: 'file', attributes: ['file'] }
          ]
        }
      ]
    });
    if (!openEnquiries)
      return res.status(404).json({ message: 'Open Enquiries not found' });
    const data = openEnquiries.toJSON();
    const mergedData = {
      ...data, ...(data.Users || {})
    };
    let user_image = null;
    if (data.Users && data.Users.file) {
      if (data.Users.file.file_path && data.Users.file.file_name) {
        user_image = `${data.Users.file.file_path}${data.Users.file.file_name}`;
      } else if (data.Users.file.file) {
        user_image = data.Users.file.file;
      }
    }
    mergedData.user_image = user_image;
    delete mergedData.Users;
    delete mergedData.file;
    res.json(mergedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOpenEnquiriesCountByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user_id' });
    }
    const totalOpenEnquiries = await OpenEnquiries.count({
      where: {
        user_id: userId,
        is_delete: 0
      }
    });
    res.json({
      user_id: userId,
      totalOpenEnquiries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOpenEnquiriesCount = async (req, res) => {
  try {
    const [total, deleted] = await Promise.all([
      OpenEnquiries.count({ where: { is_delete: 0 } }),
      OpenEnquiries.count({ where: { is_delete: 1 } }),
    ]);
    res.json({
      total, deleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { enquiry_id, message, user } = req.body;
    const enq_msg = await OpenEnquiries.findOne({
      where: { id: enquiry_id }
    });
    let reply_user_id = '';
    if (user.id != '') {
      reply_user_id = user.id;
    } else {
      reply_user_id = enq_msg.user_id;
    }
    const user_id = user.id;
    const enquiry_user_id = enq_msg.user_id;
    const data = await OpenEnquiriesChats.create({
      user_id,
      enquiry_user_id,
      enquiry_id,
      message,
      reply_user_id
    });
    return res.json({ success: true, data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
};

exports.getOpenenquiryEntryold = async (req, res) => {
  //   try {
  // 1️⃣ Get all open enquiries jinke user_id null hai
  const openEnquiries = await OpenEnquiries.findAll({
    where: { user_id: null }
  });

  if (!openEnquiries.length) {
    return res.json({
      message: 'No open enquiries found',
      count: 0
    });
  }

  let processed = 0;

  for (const enquiry of openEnquiries) {
    const { name, email, phone, company } = enquiry;

    // ❌ Skip if essential data missing
    if (!email || !company || !name) continue;

    // 2️⃣ Company: find or create
    const [companyRecord] = await CompanyInfo.findOrCreate({
      where: {
        organization_name: company.trim()
      }
    });

    // 3️⃣ User: check existing by email
    let user = await Users.findOne({
      where: {
        email: email.trim()
      }
    });

    // 4️⃣ Create user only if not exists
    if (!user) {
      const password =
        'SI' +
        new Date().getFullYear() +
        Math.floor(1000 + Math.random() * 9000);

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await Users.create({
        fname: name.trim(),
        lname: '',
        company_id: companyRecord.id,
        email: email.trim(),
        phone: phone?.trim() || null,
        user_company: company.trim(),
        password: hashedPassword,
        real_password: password,
      });

      // (optional) send password email here
    }

    // 5️⃣ Update enquiry with user_id
    enquiry.user_id = user.id;
    enquiry.enquiry_user_id = user.id; // agar aap use kar rahe ho
    await enquiry.save();

    processed++;
  }

  return res.json({
    message: 'Open enquiries processed successfully',
    processed
  });

  //   } catch (err) {
  //     console.error('getOpenenquiryEntry error:', err);
  //     console.error('DB error:', err?.parent);

  //     return res.status(500).json({
  //       error: err.message
  //     });
  //   }



}


exports.getOpenenquiryEntry = async (req, res) => {
  try {
    const openEnquiries = await OpenEnquiries.findAll({
      where: { user_id: null }
    });

    if (!openEnquiries.length) {
      return res.json({ message: 'No open enquiries found', count: 0 });
    }

    let processed = 0;

    for (const enquiry of openEnquiries) {
      const { name, email, phone, company } = enquiry;

      if (!email || !company || !name) continue;

      const cleanEmail = email.trim().toLowerCase();

      const [companyRecord] = await CompanyInfo.findOrCreate({
        where: { organization_name: company.trim() }
      });

      if (!companyRecord?.id) continue;

      let user = await Users.findOne({
        where: { email: cleanEmail }
      });

      if (!user) {
        const password =
          'SI' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await Users.create({
          fname: name.trim(),
          lname: '',
          step: 0,
          mode: 0,
          company_id: companyRecord.id,
          email: cleanEmail,
          phone: phone?.trim() || null,
          user_company: company.trim(),
          password: hashedPassword,
          real_password: password
        });
      }

      enquiry.user_id = user.id;
      enquiry.enquiry_user_id = user.id;
      await enquiry.save();

      processed++;
    }

    return res.json({
      message: 'Open enquiries processed successfully',
      processed
    });

  } catch (err) {
    console.error('ERROR:', err);
    console.error('MYSQL:', err?.parent?.sqlMessage);
    return res.status(500).json({ error: err.message });
  }
};
