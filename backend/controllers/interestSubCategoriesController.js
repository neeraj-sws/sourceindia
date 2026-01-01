const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database'); // your sequelize instance
const { QueryTypes } = require('sequelize');
const InterestSubCategories = require('../models/InterestSubCategories');
const InterestCategories = require('../models/InterestCategories');
const Users = require('../models/Users');
const BuyerInterests = require('../models/BuyerInterests');
const CompanyInfo = require('../models/CompanyInfo');
const UploadImage = require('../models/UploadImage');
const Cities = require('../models/Cities');
const States = require('../models/States');
const Countries = require('../models/Countries');

exports.createInterestSubCategories = async (req, res) => {
  try {
    const { name, interest_category_id, status } = req.body;
    /*if (!name || !interest_category_id || !status) {
      return res.status(400).json({ message: 'All fields (name, interest_category_id, status) are required' });
    }*/
    const interestSubCategories = await InterestSubCategories.create({ name, interest_category_id, status });
    res.status(201).json({ message: 'Interest sub category created', interestSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllInterestSubCategories = async (req, res) => {
  try {
    const interestSubCategories = await InterestSubCategories.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: InterestCategories,
          as: 'InterestCategories',
          attributes: ['id', 'name'],
        },
      ],
    });
    const modifiedInterestSubCategories = interestSubCategories.map(sub_categories => {
      const interestSubCategoriesData = sub_categories.toJSON();
      interestSubCategoriesData.getStatus = interestSubCategoriesData.status === 1 ? 'Active' : 'Inactive';
      interestSubCategoriesData.category_name = interestSubCategoriesData.InterestCategories?.name || null;
      delete interestSubCategoriesData.InterestCategories;
      return interestSubCategoriesData;
    });
    res.json(modifiedInterestSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerInterestsWithProductCount = async (req, res) => {
  try {
    const sql = `SELECT buyerinterests.*,
          interest_sub_categories.name as name,
          interest_sub_categories.interest_sub_category_id AS id,
          COUNT(buyerinterests.buyer_id) AS company_count
          FROM buyerinterests
          LEFT JOIN interest_sub_categories 
          ON buyerinterests.activity_id = interest_sub_categories.interest_sub_category_id
          LEFT JOIN company_info 
          ON buyerinterests.buyer_id = company_info.company_id
          WHERE buyerinterests.buyer_id IN (
          SELECT users.user_id AS u_id
          FROM company_info
          JOIN users ON users.company_id = company_info.company_id
          JOIN cities ON users.city = cities.city_id
          JOIN states ON users.state = states.state_id
          JOIN countries ON users.country = countries.country_id
          LEFT JOIN upload_images ON upload_images.upload_image_id = users.company_file_id
          JOIN buyerinterests ON buyerinterests.buyer_id = users.user_id
          WHERE users.status = 1
          AND users.is_approve = 1
          AND users.is_seller = 0
          AND company_info.is_delete = 0
      )
      GROUP BY interest_sub_categories.name`;

    const results = await sequelize.query(sql, { type: QueryTypes.SELECT });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getInterestSubCategoriesById = async (req, res) => {
  try {
    const interestSubCategories = await InterestSubCategories.findByPk(req.params.id);
    if (!interestSubCategories) return res.status(404).json({ message: 'Interest sub category not found' });
    res.json(interestSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInterestSubCategoriesByCategory = async (req, res) => {
  try {
    const { interest_category_id } = req.params;
    /*if (!interest_category_id) {
      return res.status(400).json({ error: 'interest_category_id is required' });
    }*/
    const interestSubCategories = await InterestSubCategories.findAll({
      where: { interest_category_id },
      order: [['id', 'ASC']],
    });
    res.json(interestSubCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInterestSubCategories = async (req, res) => {
  try {
    const { name, interest_category_id, status } = req.body;
    const interestSubCategories = await InterestSubCategories.findByPk(req.params.id);
    if (!interestSubCategories) return res.status(404).json({ message: 'Interest sub category not found' });

    interestSubCategories.name = name;
    interestSubCategories.interest_category_id = interest_category_id;
    interestSubCategories.status = status;
    interestSubCategories.updated_at = new Date();
    await interestSubCategories.save();

    res.json({ message: 'Interest sub category updated', interestSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInterestSubCategories = async (req, res) => {
  try {
    const interestSubCategories = await InterestSubCategories.findByPk(req.params.id);
    if (!interestSubCategories) return res.status(404).json({ message: 'Interest sub category not found' });

    await interestSubCategories.destroy();
    res.json({ message: 'Interest sub category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedInterestSubCategories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }
    const parsedIds = ids.map(id => parseInt(id, 10));
    const interestSubCategories = await InterestSubCategories.findAll({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    if (interestSubCategories.length === 0) {
      return res.status(404).json({ message: 'No sub admin found with the given IDs.' });
    }
    await InterestSubCategories.destroy({
      where: {
        id: {
          [Op.in]: parsedIds,
        },
      },
    });
    res.json({ message: `${interestSubCategories.length} sub admin deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateInterestSubCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const interestSubCategories = await InterestSubCategories.findByPk(req.params.id);
    if (!interestSubCategories) return res.status(404).json({ message: 'Interest sub category not found' });

    interestSubCategories.status = status;
    await interestSubCategories.save();

    res.json({ message: 'Status updated', interestSubCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllInterestSubCategoriesServerSide = async (req, res) => {
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
      order = [[{ model: InterestCategories, as: 'InterestCategories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$InterestCategories.name$': { [Op.like]: `%${search}%` } }
      ];
    }
    const totalRecords = await InterestSubCategories.count();
    const { count: filteredRecords, rows } = await InterestSubCategories.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: InterestCategories, attributes: ['name'], as: 'InterestCategories' },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      interest_category_id: row.interest_category_id,
      category_name: row.InterestCategories ? row.InterestCategories.name : null,
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

exports.getInterestSubCategoriesCount = async (req, res) => {
  try {
    const total = await InterestSubCategories.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};