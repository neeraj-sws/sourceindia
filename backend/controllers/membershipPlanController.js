const { Op } = require('sequelize');
const moment = require('moment');
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
    const modifiedMembershipPlan = membershipPlan.map(membership_plan => {
      const membershipPlanData = membership_plan.toJSON();
      membershipPlanData.getStatus = membershipPlanData.status === 1 ? 'Active' : 'Inactive';
      return membershipPlanData;
    });
    res.json(modifiedMembershipPlan);
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

exports.deleteSelectedMembershipPlan = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const membershipPlan = await MembershipPlan.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    if (membershipPlan.length === 0) {
      return res.status(404).json({ message: 'No membership plan found with the given IDs.' });
    }
    await MembershipPlan.destroy({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    res.json({ message: `${membershipPlan.length} membership plan deleted successfully.` });
  } catch (err) {
    console.error(err);
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

exports.updateMembershipPlanDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const membershipPlan = await MembershipPlan.findByPk(req.params.id);
    if (!membershipPlan) return res.status(404).json({ message: 'Membership Plan not found' });
    membershipPlan.is_delete = is_delete;
    await membershipPlan.save();
    res.json({ message: 'Membership Plan is removed', membershipPlan });
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
      dateRange = '',
      startDate,
      endDate,
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { price: { [Op.like]: `%${search}%` } },
        { user: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { product: { [Op.like]: `%${search}%` } },
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
    const totalRecords = await MembershipPlan.count({ where });
    const { count: filteredRecords, rows } = await MembershipPlan.findAndCountAll({
      where: searchWhere,
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