const { Op } = require('sequelize');
const MembershipPlan = require('../models/MembershipPlan');

exports.createMembershipPlan = async (req, res) => {
  try {
    const { name, sub_title, price, user, category, product, 
    expire_days, status, is_default, free, elcina_plan, enquiries } = req.body;
    const membershipPlan = await MembershipPlan.create({ name, sub_title, price, user, category, product, 
      expire_days, status, is_default, free, elcina_plan, enquiries: enquiries || 0 });
    res.status(201).json({ message: 'Membership Plan created', membershipPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMembershipPlan = async (req, res) => {
  try {
    const membershipPlan = await MembershipPlan.findAll({ order: [['id', 'ASC']] });
    res.json(membershipPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembershipPlanById = async (req, res) => {
  try {
    const membershipPlan = await MembershipPlan.findByPk(req.params.id);
    if (!membershipPlan) return res.status(404).json({ message: 'Membership Plan not found' });
    res.json(membershipPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMembershipPlan = async (req, res) => {
  try {
    const { name, sub_title, price, user, category, product, 
    expire_days, status, is_default, free, elcina_plan } = req.body;
    const membershipPlan = await MembershipPlan.findByPk(req.params.id);
    if (!membershipPlan) return res.status(404).json({ message: 'Membership Plan not found' });

    membershipPlan.name = name;
    membershipPlan.sub_title = sub_title;
    membershipPlan.price = price;
    membershipPlan.user = user;
    membershipPlan.category = category;
    membershipPlan.product = product;
    membershipPlan.expire_days = expire_days;
    membershipPlan.status = status;
    membershipPlan.is_default = is_default;
    membershipPlan.free = free;
    membershipPlan.elcina_plan = elcina_plan;
    membershipPlan.updated_at = new Date();
    await membershipPlan.save();

    res.json({ message: 'Membership Plan updated', membershipPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMembershipPlan = async (req, res) => {
  try {
    const membershipPlan = await MembershipPlan.findByPk(req.params.id);
    if (!membershipPlan) return res.status(404).json({ message: 'Membership Plan not found' });

    await membershipPlan.destroy();
    res.json({ message: 'Membership Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMembershipPlanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const membershipPlan = await MembershipPlan.findByPk(req.params.id);
    if (!membershipPlan) return res.status(404).json({ message: 'Membership Plan not found' });

    membershipPlan.status = status;
    await membershipPlan.save();

    res.json({ message: 'Status updated', membershipPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMembershipPlanServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'sub_title', 'price', 'user', 'category', 'product', 'created_at', 'updated_at'];
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
        { name: { [Op.like]: `%${search}%` } },
        { price: { [Op.like]: `%${search}%` } },
        { user: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { product: { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await MembershipPlan.count();
    const { count: filteredRecords, rows } = await MembershipPlan.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      sub_title: row.sub_title,
      price: row.price,
      user: row.user,
      category: row.category,
      product: row.product,
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