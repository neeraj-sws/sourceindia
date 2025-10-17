const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');
const Products = require('../models/Products');
const Users = require('../models/Users');

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
    const states = await States.findAll({
      where: { country_id },
      order: [['id', 'ASC']],
    });
    const productCounts = await Products.findAll({
      attributes: [
        [sequelize.col('users.state'), 'state'],
        [sequelize.fn('COUNT', sequelize.col('Products.id')), 'count']
      ],
      include: [
        {
          model: Users,
          as: 'Users',
          attributes: [],
          where: {
            country: country_id
          }
        }
      ],
      where: {
        is_delete: 0,
        is_approve: 1,
        status: 1,
      },
      group: ['users.state'],
      raw: true,
    });
    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.state] = parseInt(item.count);
    });
    const modifiedStates = states.map(state => {
      const stateData = state.toJSON();
      return {
        ...stateData,
        product_count: countMap[state.id] || 0,
      };
    });
    res.json(modifiedStates);
  } catch (err) {
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