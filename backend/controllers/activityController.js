const { Op } = require('sequelize');
const Activity = require('../models/Activity');
const CoreActivity = require('../models/CoreActivity');

exports.createActivity = async (req, res) => {
  try {
    const { name, coreactivity, status } = req.body;
    const activity = await Activity.create({ name, coreactivity, status });
    res.status(201).json({ message: 'Activity created', activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({ order: [['id', 'ASC']] });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivityByCoreActivity = async (req, res) => {
  try {
    const { coreactivity } = req.params;
    if (!coreactivity) {
      return res.status(400).json({ error: 'coreactivity is required' });
    }
    const activity = await Activity.findAll({
      where: { coreactivity },
      order: [['id', 'ASC']],
    });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const { name, coreactivity, status } = req.body;
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    activity.name = name;
    activity.coreactivity = coreactivity;
    activity.status = status;
    activity.updated_at = new Date();
    await activity.save();

    res.json({ message: 'Activity updated', activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    await activity.destroy();
    res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateActivityStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    activity.status = status;
    await activity.save();

    res.json({ message: 'Status updated', activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllActivitiesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at', 'coreactivity_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'coreactivity_name') {
      order = [[{ model: CoreActivity, as: 'CoreActivity' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$CoreActivity.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Activity.count();
    const { count: filteredRecords, rows } = await Activity.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: CoreActivity, attributes: ['name'], as: 'CoreActivity' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      coreactivity: row.coreactivity,
      coreactivity_name: row.CoreActivity ? row.CoreActivity.name : null,
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