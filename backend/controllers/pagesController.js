const { Op } = require('sequelize');
const Pages = require('../models/Pages');

exports.getPagesById = async (req, res) => {
  try {
    const subSubCategories = await Pages.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Pages not found' });
    res.json(subSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePages = async (req, res) => {
  try {
    const { title, description } = req.body;
    const subSubCategories = await Pages.findByPk(req.params.id);
    if (!subSubCategories) return res.status(404).json({ message: 'Pages not found' });

    subSubCategories.title = title;
    subSubCategories.description = description;
    subSubCategories.updated_at = new Date();
    await subSubCategories.save();

    res.json({ message: 'Pages updated', subSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};