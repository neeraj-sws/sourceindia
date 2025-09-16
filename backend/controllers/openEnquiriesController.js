const { Op } = require('sequelize');
const OpenEnquiries = require('../models/OpenEnquiries');
const Categories = require('../models/Categories');

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

exports.getAllOpenEnquiriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
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
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await OpenEnquiries.count();
    const { count: filteredRecords, rows } = await OpenEnquiries.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      title: row.title,
      name: row.name,
      email: row.email,
      phone: row.phone,
      description: row.description,
      company: row.company,
      is_home: row.is_home,
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