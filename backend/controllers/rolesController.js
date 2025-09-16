const { Op } = require('sequelize');
const Roles = require('../models/Roles');
const TicketCategory = require('../models/TicketCategory');

exports.createRoles = async (req, res) => {
  try {
    const { name, ticket_category, status } = req.body;
    if (!name || !ticket_category || !status) {
        return res.status(400).json({ message: 'All fields (name, ticket_category, status) are required' });
      }
    const roles = await Roles.create({ name, ticket_category, status });
    res.status(201).json({ message: 'Roles created', roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Roles.findAll({ order: [['id', 'ASC']] });

    const modifiedRoles = roles.map(role => {
      const roleData = role.toJSON();
      roleData.getStatus = roleData.status === 1 ? 'Active' : 'Inactive';
      return roleData;
    });

    res.json(modifiedRoles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRolesById = async (req, res) => {
  try {
    const roles = await Roles.findByPk(req.params.id);
    if (!roles) return res.status(404).json({ message: 'Roles not found' });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoles = async (req, res) => {
  try {
    const { name, ticket_category, status } = req.body;
    const roles = await Roles.findByPk(req.params.id);
    if (!roles) return res.status(404).json({ message: 'Roles not found' });

    roles.name = name;
    roles.ticket_category = ticket_category;
    roles.status = status;
    roles.updated_at = new Date();
    await roles.save();

    res.json({ message: 'Roles updated', roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRoles = async (req, res) => {
  try {
    const roles = await Roles.findByPk(req.params.id);
    if (!roles) return res.status(404).json({ message: 'Roles not found' });

    await roles.destroy();
    res.json({ message: 'Roles deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedRoles = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const roles = await Roles.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    if (roles.length === 0) {
      return res.status(404).json({ message: 'No roles found with the given IDs.' });
    }
    await Roles.destroy({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    res.json({ message: `${roles.length} roles deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateRolesStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const roles = await Roles.findByPk(req.params.id);
    if (!roles) return res.status(404).json({ message: 'Roles not found' });

    roles.status = status;
    await roles.save();

    res.json({ message: 'Status updated', roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRolesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'created_at', 'updated_at', 'category_name'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: TicketCategory, as: 'TicketCategory' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$TicketCategory.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await Roles.count();
    const { count: filteredRecords, rows } = await Roles.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: TicketCategory, attributes: ['name'], as: 'TicketCategory' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      ticket_category: row.ticket_category,
      category_name: row.TicketCategory ? row.TicketCategory.name : null,
      status: row.status,
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