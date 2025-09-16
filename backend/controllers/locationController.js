const { Op } = require('sequelize');
const Countries = require('../models/Countries');
const States = require('../models/States');
const Cities = require('../models/Cities');

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
    res.json(states);
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