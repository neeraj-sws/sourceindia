const { Op } = require('sequelize');
const Units = require('../models/Units');
const BuyerRequirements = require('../models/BuyerRequirements');

// Columns the admin grid is allowed to sort on. Anything else falls back to id
// so a crafted query string cannot be passed through to the ORDER BY clause.
const SORTABLE_COLUMNS = ['id', 'name', 'is_active', 'created_at', 'updated_at'];

const escapeLike = (value) => value.replace(/[%_]/g, (m) => `\\${m}`);

function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Unit name is required' };
  }
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length > 50) {
    return { error: 'Unit name must be 50 characters or fewer' };
  }
  return { name: trimmed };
}

// A unit name is unique case-insensitively. Sequelize's unique index is
// collation dependent, so the check is done explicitly before insert/update to
// return a clean 400 instead of a database error.
async function findDuplicateName(name, excludeId = null) {
  const candidates = await Units.findAll({ attributes: ['id', 'name'] });
  const target = name.trim().replace(/\s+/g, ' ').toLowerCase();
  return (
    candidates.find(
      (u) =>
        u.id !== excludeId &&
        String(u.name).trim().replace(/\s+/g, ' ').toLowerCase() === target
    ) || null
  );
}

exports.getAllUnitsServerSide = async (req, res) => {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'id', sort = 'ASC' } = req.query;
    const sortDirection = sort === 'DESC' ? 'DESC' : 'ASC';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitValue = parseInt(limit, 10) || 25;
    const order = [[SORTABLE_COLUMNS.includes(sortBy) ? sortBy : 'id', sortDirection]];

    const where = {};
    if (search && search.trim()) {
      where.name = { [Op.like]: `%${escapeLike(search.trim())}%` };
    }

    const totalRecords = await Units.count();
    const { count: filteredRecords, rows } = await Units.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
    });

    return res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      totalRecords,
      filteredRecords,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    // ?all=1 includes the disabled rows so the admin master can show them;
    // the public dropdown only ever receives the active ones.
    const where = req.query.all ? {} : { is_active: 1 };
    const units = await Units.findAll({
      attributes: ['id', 'name', 'is_active'],
      where,
      order: [['name', 'ASC']],
    });
    return res.json(units);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const unit = await Units.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    return res.json(unit);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const validated = validateName(name);
    if (validated.error) return res.status(400).json({ message: validated.error });

    if (is_active !== undefined && ![0, 1, '0', '1'].includes(is_active)) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Inactive).' });
    }

    const duplicate = await findDuplicateName(validated.name);
    if (duplicate) {
      return res.status(400).json({ message: `Unit "${validated.name}" already exists` });
    }

    const unit = await Units.create({
      name: validated.name,
      is_active: is_active === undefined ? 1 : Number(is_active),
    });
    return res.status(201).json({ message: 'Unit created', unit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const unit = await Units.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const { name, is_active } = req.body;
    if (name !== undefined) {
      const validated = validateName(name);
      if (validated.error) return res.status(400).json({ message: validated.error });
      const duplicate = await findDuplicateName(validated.name, unit.id);
      if (duplicate) {
        return res.status(400).json({ message: `Unit "${validated.name}" already exists` });
      }
      unit.name = validated.name;
    }

    if (is_active !== undefined) {
      if (![0, 1, '0', '1'].includes(is_active)) {
        return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Inactive).' });
      }
      unit.is_active = Number(is_active);
    }

    await unit.save();
    return res.json({ message: 'Unit updated', unit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateUnitStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (![0, 1, '0', '1'].includes(is_active)) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Inactive).' });
    }
    const unit = await Units.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    unit.is_active = Number(is_active);
    await unit.save();
    return res.json({ message: 'Status updated', unit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Units.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    // Historical requirements store the unit as plain text, so a delete would
    // not corrupt them - but removing a unit still in active use would silently
    // change what the dropdown means. Warn the admin instead of allowing it.
    const inUse = await BuyerRequirements.count({
      where: { quantity_unit: unit.name },
    });
    if (inUse > 0) {
      return res.status(400).json({
        message: `This unit is used by ${inUse} requirement(s). Deactivate it instead of deleting.`,
      });
    }

    await unit.destroy();
    return res.json({ message: 'Unit deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};