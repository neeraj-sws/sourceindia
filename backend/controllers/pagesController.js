const { Op } = require('sequelize');
const Pages = require('../models/Pages');

exports.getPagesById = async (req, res) => {
  try {
    const pages = await Pages.findByPk(req.params.id);
    if (!pages) return res.status(404).json({ message: 'Pages not found' });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePages = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pages = await Pages.findByPk(req.params.id);
    if (!pages) return res.status(404).json({ message: 'Pages not found' });

    pages.title = title;
    pages.description = description;
    pages.updated_at = new Date();
    await pages.save();

    res.json({ message: 'Pages updated', pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};