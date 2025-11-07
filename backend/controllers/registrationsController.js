const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Registrations = require('../models/Registrations');
const States = require('../models/States');
const Cities = require('../models/Cities');

exports.getAllRegistrations = async (req, res) => {
  try {
    const contacts = await Registrations.findAll({
      include: [
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });

    // Map the response to include state_name and city_name
    const mappedContacts = contacts.map(row => ({
      id: row.id,
      category: row.category,
      name: row.name,
      designation: row.designation,
      organization: row.organization,
      email: row.email,
      mobile: row.mobile,
      state_name: row.state_data ? row.state_data.name : null,
      city_name: row.city_data ? row.city_data.name : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    res.json(mappedContacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRegistrations = async (req, res) => {
  try {
    const contacts = await Registrations.findByPk(req.params.id);
    if (!contacts) return res.status(404).json({ message: 'Registration not found' });
    await contacts.destroy();
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedRegistrations = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const contacts = await Registrations.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
        is_delete: 0
      }
    });
    if (contacts.length === 0) {
      return res.status(404).json({ message: 'No contacts found with the given IDs.' });
    }
    await Registrations.update(
      { is_delete: 1 },
      {
        where: {
          id: {
            [Op.in]: parsedIds,
          }
        }
      }
    );
    res.json({ message: `${contacts.length} contacts marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateRegistrationsDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const contacts = await Registrations.findByPk(req.params.id);
    if (!contacts) return res.status(404).json({ message: 'Registrations not found' });
    contacts.is_delete = is_delete;
    await contacts.save();
    res.json({ message: 'Registrations is removed', contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRegistrationsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      dateRange,
      startDate,
      endDate,
      state,
      city,
      registrationCategory,
      registrationEmail,
      registrationMobile,
      registrationName,
    } = req.query;

    // Allowed sortable columns
    const validColumns = [
      'id', 'category', 'name', 'designation', 'organization',
      'email', 'mobile', 'state_name', 'city_name', 'created_at', 'updated_at'
    ];

    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Sorting logic
    let order = [];
    if (sortBy === 'state_name') {
      order = [[{ model: States, as: 'state_data' }, 'name', sortDirection]];
    } else if (sortBy === 'city_name') {
      order = [[{ model: Cities, as: 'city_data' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }

    // Base where condition
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    const searchWhere = { ...where };
    if (state) {
      searchWhere.state = state;
    }
    if (city) {
      searchWhere.city = city;
    }
    if (registrationCategory) {
      searchWhere.category = registrationCategory;
    }
    // Search logic
    if (search) {
      searchWhere[Op.or] = [
        { category: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { organization: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { designation: { [Op.like]: `%${search}%` } },
        { '$state_data.name$': { [Op.like]: `%${search}%` } },
        { '$city_data.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    if (registrationName) {
      searchWhere.name = {
        [Op.like]: `%${registrationName}%`
      };
    }
    if (registrationEmail) {
      searchWhere.email = {
        [Op.like]: `%${registrationEmail}%`
      };
    }
    if (registrationMobile) {
      searchWhere.mobile = {
        [Op.like]: `%${registrationMobile}%`
      };
    }
    // Date filtering logic
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();

      const dateRanges = {
        today: [today, now],
        yesterday: [moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day')],
        last7days: [moment().subtract(6, 'days').startOf('day'), now],
        last30days: [moment().subtract(29, 'days').startOf('day'), now],
        thismonth: [moment().startOf('month'), now],
        lastmonth: [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      };

      if (dateRanges[range]) {
        const [start, end] = dateRanges[range];
        dateCondition = { [Op.gte]: start.toDate(), [Op.lte]: end.toDate() };
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

    // Query with joins
    const { count: filteredRecords, rows } = await Registrations.findAndCountAll({
      where: searchWhere,
      include: [
        { model: States, as: 'state_data', attributes: ['id', 'name'] },
        { model: Cities, as: 'city_data', attributes: ['id', 'name'] },
      ],
      order,
      limit: limitValue,
      offset,
    });

    const totalRecords = await Registrations.count({ where });

    // Map results
    const mappedRows = rows.map(row => ({
      id: row.id,
      category: row.category,
      name: row.name,
      designation: row.designation,
      organization: row.organization,
      email: row.email,
      mobile: row.mobile,
      state_name: row.state_data ? row.state_data.name : null,
      city_name: row.city_data ? row.city_data.name : null,
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

exports.getRegistrationsCount = async (req, res) => {
  try {
    const [total, deleted] = await Promise.all([
      Registrations.count({ where: { is_delete: 0 } }),
      Registrations.count({ where: {is_delete: 1} }),
    ]);
    res.json({
      total, deleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};