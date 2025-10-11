const { Op } = require('sequelize');
const validator = require('validator');
const Inventories = require('../models/Inventories');

exports.deleteInventories = async (req, res) => {
  try {
    const inventories = await Inventories.findByPk(req.params.id);
    if (!inventories) return res.status(404).json({ message: 'Inventory not found' });

    await inventories.destroy();
    res.json({ message: 'Inventory deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedInventories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const inventories = await Inventories.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    if (inventories.length === 0) {
      return res.status(404).json({ message: 'No inventories found with the given IDs.' });
    }
    await Inventories.destroy({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    res.json({ message: `${inventories.length} inventories deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllInventoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'pno', 'brand', 'qty', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { pno: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { qty: { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Inventories.count();
    const { count: filteredRecords, rows } = await Inventories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      pno: row.pno,
      brand: row.brand,
      qty: row.qty,
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