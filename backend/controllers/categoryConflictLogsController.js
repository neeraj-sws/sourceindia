const { Op } = require('sequelize');
const CategoryConflictLog = require('../models/CategoryConflictLog');

exports.getAllCategoryConflictLogsServerSide = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { source_module: { [Op.like]: `%${search}%` } },
        { conflict_module: { [Op.like]: `%${search}%` } },
        { conflict_flow: { [Op.like]: `%${search}%` } },
        { conflict_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const totalRecords = await CategoryConflictLog.count({ where: {} });
    const { count: filteredRecords, rows } = await CategoryConflictLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      limit,
      offset,
    });

    res.json({ data: rows, totalRecords, filteredRecords });
  } catch (error) {
    console.error('getAllCategoryConflictLogsServerSide error:', error);
    res.status(500).json({ error: error.message });
  }
};
