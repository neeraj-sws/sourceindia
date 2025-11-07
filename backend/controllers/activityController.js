const { Op } = require('sequelize');
const moment = require('moment');
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
    const activities = await Activity.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: CoreActivity,
          as: 'CoreActivity',
          attributes: ['id', 'name'],
        },
      ],
    });
    const modifiedActivity = activities.map(activity => {
      const activitiesData = activity.toJSON();
      activitiesData.getStatus = activitiesData.status === 1 ? 'Active' : 'Inactive';
      activitiesData.coreactivity_name = activitiesData.CoreActivity?.name || null;
      delete activitiesData.CoreActivity;
      return activitiesData;
    });
    res.json(modifiedActivity);
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

exports.deleteSelectedActivity = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const activities = await Activity.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (activities.length === 0) {
      return res.status(404).json({ message: 'No activities found with the given IDs.' });
    }
    await Activity.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${activities.length} activities marked as deleted.` });
  } catch (err) {
    console.error(err);
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

exports.updateActivityDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const activities = await Activity.findByPk(req.params.id);
    if (!activities) return res.status(404).json({ message: 'Activity not found' });
    activities.is_delete = is_delete;
    await activities.save();
    res.json({ message: 'Activity is removed', activities });
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
      dateRange = '',
      startDate,
      endDate,
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
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$CoreActivity.name$': { [Op.like]: `%${search}%` } }
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
    const totalRecords = await Activity.count({ where });
    const { count: filteredRecords, rows } = await Activity.findAndCountAll({
      where: searchWhere,
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

exports.getActivityCount = async (req, res) => {
  try {
    const total = await Activity.count({where: { is_delete: 0 }});
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};