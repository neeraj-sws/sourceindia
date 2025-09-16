const UploadImage = require('../models/UploadImage');

exports.getAllFiles = async (req, res) => {
  try {
    const files = await UploadImage.findAll({ order: [['id', 'ASC']] });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const file = await UploadImage.findByPk(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};