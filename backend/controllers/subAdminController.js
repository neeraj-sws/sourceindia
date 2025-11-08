const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const Roles = require('../models/Roles');
const validator = require('validator');
const bcrypt = require('bcryptjs');

exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, mobile, role, status, postcode, address, state, is_seller, about } = req.body;
    /*if (!name || !email || !password || !mobile || !role || !status) {
        return res.status(400).json({ message: 'All fields (name, email, password, mobile, role, status) are required' });
      }else if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }*/
    const hashedPassword = await bcrypt.hash(password, 10);
    const subAdmin = await Admin.create({ name, email, password: hashedPassword, mobile, role, status,
    postcode: postcode || "", address: address || "", state: state || 0, 
    is_seller: is_seller || 0, about: about || "" });
    res.status(201).json({ 
      message: 'Sub Admin created', 
      subAdmin: { id: subAdmin._id, name, email, mobile, role, status },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubAdmin = async (req, res) => {
  try {
    const subAdmin = await Admin.findAll({ order: [['id', 'ASC']] });
    const modifiedSubAdmin = subAdmin.map(sub_admin => {
      const subAdminData = sub_admin.toJSON();
      subAdminData.getStatus = subAdminData.status === 1 ? 'Active' : 'Inactive';
      return subAdminData;
    });

    res.json(modifiedSubAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubAdminById = async (req, res) => {
  try {
    const subAdmin = await Admin.findByPk(req.params.id);
    if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found' });
    res.json(subAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password, role, status } = req.body;
    const subAdmin = await Admin.findByPk(req.params.id);
    if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found' });

    subAdmin.name = name;
    subAdmin.email = email;
    subAdmin.mobile = mobile;
    if (password) { const hashedPassword = await bcrypt.hash(password, 10); subAdmin.password = hashedPassword; }
    subAdmin.role = role;
    subAdmin.status = status;
    subAdmin.updated_at = new Date();
    await subAdmin.save();

    res.json({ message: 'Sub Admin updated', subAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubAdmin = async (req, res) => {
  try {
    const subAdmin = await Admin.findByPk(req.params.id);
    if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found' });

    await subAdmin.destroy();
    res.json({ message: 'Sub Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedSubAdmin = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const subAdmin = await Admin.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    if (subAdmin.length === 0) {
      return res.status(404).json({ message: 'No sub admin found with the given IDs.' });
    }
    await Admin.destroy({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    res.json({ message: `${subAdmin.length} sub admin deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubAdminStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const subAdmin = await Admin.findByPk(req.params.id);
    if (!subAdmin) return res.status(404).json({ message: 'Sub Admin not found' });

    subAdmin.status = status;
    await subAdmin.save();

    res.json({ message: 'Status updated', subAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSubAdminServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'email', 'mobile', 'created_at', 'updated_at', 'role_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'role_name') {
      order = [[{ model: Roles, as: 'Roles' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Roles.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Admin.count();
    const { count: filteredRecords, rows } = await Admin.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Roles, attributes: ['name'], as: 'Roles' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      role: row.role,
      role_name: row.Roles ? row.Roles.name : null,
      status: row.status,
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