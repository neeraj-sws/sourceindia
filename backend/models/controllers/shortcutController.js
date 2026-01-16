const { Op } = require('sequelize');
const moment = require('moment');
const Shortcut = require('../models/Shortcut');

exports.AllshortcutMenus = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const { status = '' } = req.query;

    const whereClause = {
      is_delete: 0,
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { link: { [Op.like]: `%${search}%` } }
      ]
    };

    // ✅ Optional status filter
    if (status !== '') {
      whereClause.status = parseInt(status);
    }

    const shortcuts = await Shortcut.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });
    res.status(200).json(shortcuts);
  } catch (error) {
    console.error('Error fetching shortcuts:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// ✅ Add new shortcut menu
exports.createShortcut = async (req, res) => {
  try {
    const { name, link, status } = req.body;
    if (!name || !link) {
      return res.status(400).json({ message: 'Name and Link are required' });
    }

    const newShortcut = await Shortcut.create({ name, link, status });
    res.status(201).json({ message: 'Shortcut added successfully', data: newShortcut });
  } catch (error) {
    console.error('Error creating shortcut:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// ✅ Update shortcut inline (name / link / status)
exports.updateShortcut = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, status } = req.body;

    const shortcut = await Shortcut.findByPk(id);
    if (!shortcut) {
      return res.status(404).json({ message: 'Shortcut not found' });
    }

    await shortcut.update({ name, link, status });
    res.status(200).json({ message: 'Shortcut updated successfully', data: shortcut });
  } catch (error) {
    console.error('Error updating shortcut:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.deleteShortcut = async (req, res) => {
  try {
    const { id } = req.params;
    const shortcut = await Shortcut.findByPk(id);
    if (!shortcut || shortcut.is_delete === 1) {
      return res.status(404).json({ message: 'Shortcut not found' });
    }

    await shortcut.update({ is_delete: 1 });
    res.status(200).json({ message: 'Shortcut deleted successfully' });
  } catch (error) {
    console.error('Error deleting shortcut:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};