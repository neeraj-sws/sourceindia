const Sequelize = require('sequelize');
const { Op, fn, col } = Sequelize;
const fs = require('fs');
const path = require('path');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const UploadImage = require('../models/UploadImage');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const getMulterUpload = require('../utils/upload');
const validator = require('validator');
const bcrypt = require('bcryptjs');

function createSlug(inputString) {
  return inputString.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

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
    const buyers = await Users.findAll({ where: { is_seller: 0 }, order: [['id', 'ASC']] });
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerById = async (req, res) => {
  try {
    const buyers = await Users.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        as: 'file',
        attributes: ['file'],
      },
      {
        model: UploadImage,
        as: 'company_file',
        attributes: ['file'],
      }],
    });    
    if (!buyers) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    let companyInfo = null;
    if (buyers.company_id) {
      companyInfo = await CompanyInfo.findByPk(buyers.company_id);
    }
    const response = {
      ...buyers.toJSON(),
      ...(companyInfo ? companyInfo.toJSON() : {}),
      file_name: buyers.file ? buyers.file.file : null,
      company_file_name: buyers.company_file ? buyers.company_file.file : null,
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
    if (search) {
      searchWhere[Op.or] = [
        Sequelize.where(fn('concat', col('fname'), ' ', col('lname')), { [Op.like]: `%${search}%` }),
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { user_company: { [Op.like]: `%${search}%` } },
      ];
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