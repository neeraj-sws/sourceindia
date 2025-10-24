const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const Products = require('../models/Products');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');

exports.getAllCountries = async (req, res) => {
  try {
    const countries = await Countries.findAll({ order: [['id', 'ASC']] });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStates = async (req, res) => {
  try {
    const states = await States.findAll({ order: [['id', 'ASC']] });
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await Cities.findAll({ order: [['id', 'ASC']] });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStatesByCountry = async (req, res) => {
  try {
    const { country_id } = req.params;
    if (!country_id) {
      return res.status(400).json({ error: 'country_id is required' });
    }

    // Fetch all states of the country
    const states = await States.findAll({
      where: { country_id },
      order: [['id', 'ASC']],
    });

    // Product counts grouped by users.state
    const productCounts = await Products.findAll({
      attributes: [
        [col('Users.state'), 'state_id'],
        [fn('COUNT', col('Products.id')), 'count'],
      ],
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: [],
          where: { country: country_id },
        },
      ],
      where: {
        is_delete: 0,
        is_approve: 1,
        status: 1,
      },
      group: ['Users.state'],
      raw: true,
    });

    // Map product counts by state_id
    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.state_id] = parseInt(item.count);
    });

    // Company counts grouped by users.state (distinct company_id count)
    // Here, count distinct companies (CompanyInfo.id) whose users are in each state
    const companyCounts = await Users.findAll({
      attributes: [
        'state',
        [fn('COUNT', fn('DISTINCT', col('company_id'))), 'count'],
      ],
      where: {
        country: country_id,
        company_id: { [Op.ne]: null },
        is_delete: 0,
        is_approve: 1,
        status: 1,
      },
      group: ['state'],
      raw: true,
    });

    // Map company counts by state
    const companyCountMap = {};
    companyCounts.forEach(item => {
      companyCountMap[item.state] = parseInt(item.count);
    });

    // Compose final response with counts
    const modifiedStates = states.map(state => {
      const stateData = state.toJSON();
      return {
        ...stateData,
        product_count: productCountMap[stateData.id] || 0,
        company_count: companyCountMap[stateData.id] || 0,
      };
    });

    res.json(modifiedStates);
  } catch (err) {
    console.error('getStatesByCountry error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCitiesByState = async (req, res) => {
  try {
    const { state_id } = req.params;
    if (!state_id) {
      return res.status(400).json({ error: 'state_id is required' });
    }
    const cities = await Cities.findAll({
      where: { state_id },
      order: [['id', 'ASC']],
    });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};