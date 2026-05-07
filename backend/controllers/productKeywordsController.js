const { Op, fn, col, literal } = require('sequelize');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');
const BuyerSourcingInterests = require('../models/BuyerSourcingInterests');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createItemSubCategory = async (req, res) => {
  try {
    const inputNames = Array.isArray(req.body.names) ? req.body.names : [req.body.name];
    const sanitizedNames = inputNames
      .map((name) => (name || '').toString().trim())
      .filter(Boolean);
    const itemSubCategoryId = Number(req.body.item_subcategory_id);
    const status = req.body.status === undefined ? 1 : Number(req.body.status);

    if (sanitizedNames.length === 0) {
      return res.status(400).json({ message: 'At least one name is required.' });
    }

    if (!Number.isInteger(itemSubCategoryId) || itemSubCategoryId <= 0) {
      return res.status(400).json({ message: 'item_subcategory_id is required.' });
    }

    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use 1 or 0.' });
    }

    const createPayload = sanitizedNames.map((name) => ({
      name,
      item_subcategory_id: itemSubCategoryId,
      status,
    }));

    const createdKeywords = await ProductKeyword.bulkCreate(createPayload);
    const createdRows = createdKeywords.map((keyword) => keyword.toJSON());

    res.status(201).json({
      message: createdRows.length > 1 ? 'Product keywords created' : 'Product keyword created',
      itemSubCategories: createdRows,
      itemSubCategory: createdRows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllItemSubCategory = async (req, res) => {
  try {
    const where = {};

    // Exclude item subcategories that are linked to products
    if (req.query.excludeItemSubCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_subcategory_id
          FROM products
          WHERE item_subcategory_id IS NOT NULL
        )`)
      };
    }

    const itemSubCategories = await ItemSubCategory.findAll({
      where,
      order: [['id', 'ASC']],
      include: [
        {
          model: Categories,
          as: 'Categories',
          attributes: ['id', 'name'],
        },
        {
          model: SubCategories,
          as: 'SubCategories',
          attributes: ['id', 'name'],
        },
        {
          model: ItemCategory,
          as: 'ItemCategory',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Flatten nested relations and map status
    const modifiedItemSubCategories = itemSubCategories.map(sub => {
      const data = sub.toJSON();
      return {
        ...data,
        getStatus: data.status === 1 ? 'Active' : 'Inactive',
        category_name: data.Categories?.name || null,
        subcategory_name: data.SubCategories?.name || null,
        itemcategory_name: data.ItemCategory?.name || null,
        Categories: undefined,
        SubCategories: undefined,
        ItemCategory: undefined,
      };
    });

    res.json(modifiedItemSubCategories);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoryById = async (req, res) => {
  try {
    const itemSubCategory = await ItemSubCategory.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!itemSubCategory) return res.status(404).json({ message: 'Item Sub Category not found' });
    const response = {
      ...itemSubCategory.toJSON(),
      file_name: itemSubCategory.UploadImage ? itemSubCategory.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateKeyword = async (req, res) => {
  try {
    const keyword = await ProductKeyword.findByPk(req.params.id);
   
    if (!keyword) return res.status(404).json({ message: 'Keyword not found' });
    const name = (req.body.name || '').toString().trim();
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    keyword.name = name;
    if (req.body.status !== undefined) keyword.status = Number(req.body.status);
    keyword.updated_at = new Date();
    await keyword.save({ fields: ['name', 'status', 'updated_at'] });
    res.json({ message: 'Keyword updated', keyword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteItemSubCategory = async (req, res) => {
  try {
    const keyword = await ProductKeyword.findByPk(req.params.id);
    if (!keyword) return res.status(404).json({ message: 'Keyword not found' });
    await keyword.destroy();
    res.json({ message: 'Keyword deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedItemSubCategory = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10));

    // Find all subcategories
    const itemSubCategories = await ItemSubCategory.findAll({
      where: { id: { [Op.in]: parsedIds } },
    });

    if (itemSubCategories.length === 0) {
      return res.status(404).json({ message: 'No Item Sub Category found with the given IDs.' });
    }

    // Delete associated files
    for (const subCategory of itemSubCategories) {
      if (subCategory.file_id) {
        const uploadImage = await UploadImage.findByPk(subCategory.file_id);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await uploadImage.destroy();
        }
      }
    }

    // Delete all subcategories
    await ItemSubCategory.destroy({
      where: { id: { [Op.in]: parsedIds } },
    });

    res.json({ message: `${itemSubCategories.length} Item Sub Category(s) deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemSubCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const itemSubCategory = await ItemSubCategory.findByPk(req.params.id);
    if (!itemSubCategory) return res.status(404).json({ message: 'Item Sub Category not found' });

    itemSubCategory.status = status;
    await itemSubCategory.save();

    res.json({ message: 'Status updated', itemSubCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoriesByCategorySubCategoryItemCategory = async (req, res) => {
  try {
    const { category_id, subcategory_id, item_category_id } = req.params;
    if (!category_id || !subcategory_id || !item_category_id) {
      return res.status(400).json({
        error: 'Both category_id, subcategory_id, item_category_id are required.',
      });
    }
    const itemSubCategory = await ItemSubCategory.findAll({
      where: { category_id, subcategory_id, item_category_id, status: 1 },
      include: [
        {
          model: Categories, as: 'Categories', attributes: ['id', 'name'], where: {
            status: 1, is_delete: 0,
          }
        },
        {
          model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'], where: {
            status: 1, is_delete: 0,
          }
        },
        {
          model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'], where: {
            status: 1,
          }
        },
      ],
      order: [['id', 'ASC']],
    });
    if (itemSubCategory.length === 0) {
      return res.status(404).json({ message: 'No item sub categories found for the given category, subcategory, itemcategory.' });
    }
    res.json(itemSubCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoriesByCategorySubCategoryItemCategoryAll = async (req, res) => {
  try {
    const { category_id, subcategory_id, item_category_id } = req.params;
    if (!category_id || !subcategory_id || !item_category_id) {
      return res.status(400).json({
        error: 'Both category_id, subcategory_id, item_category_id are required.',
      });
    }
    const itemSubCategory = await ItemSubCategory.findAll({
      where: { category_id, subcategory_id, item_category_id },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });
    if (itemSubCategory.length === 0) {
      return res.status(404).json({ message: 'No item sub categories found for the given category, subcategory, itemcategory.' });
    }
    res.json(itemSubCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoriesBySelectedCategorySubCategoryItemCategory = async (req, res) => {
  try {
    const { categories, subcategories, itemCategories } = req.body;

    // Validate input arrays
    if (
      !categories || !Array.isArray(categories) || categories.length === 0 ||
      !subcategories || !Array.isArray(subcategories) || subcategories.length === 0 ||
      !itemCategories || !Array.isArray(itemCategories) || itemCategories.length === 0
    ) {
      return res.status(400).json({
        error: 'categories[], subcategories[], and itemCategories[] arrays are required and cannot be empty.'
      });
    }

    // 🟢 Fetch matching item subcategories
    const itemSubCategories = await ItemSubCategory.findAll({
      where: {
        category_id: { [Op.in]: categories },
        subcategory_id: { [Op.in]: subcategories },
        item_category_id: { [Op.in]: itemCategories },
        status: 1
      },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });

    // 🟢 Product count for each Item SubCategory
    const productCounts = await Products.findAll({
      attributes: ['item_subcategory_id', [fn('COUNT', col('product_id')), 'count']],
      where: {
        is_delete: 0,
        // is_approve: 1,
        status: 1,
        category: { [Op.in]: categories },
        sub_category: { [Op.in]: subcategories },
        item_category_id: { [Op.in]: itemCategories },
      },
      group: ['item_subcategory_id'],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.item_subcategory_id] = parseInt(item.count);
    });

    // 🟢 Final response (no company count)
    const modifiedItemSubCategories = itemSubCategories.map(sub => {
      const data = sub.toJSON();
      return {
        ...data,
        getStatus: data.status === 1 ? 'Active' : 'Inactive',
        category_name: data.Categories?.name || null,
        subcategory_name: data.SubCategories?.name || null,
        item_category_name: data.ItemCategory?.name || null,
        product_count: productCountMap[data.id] || 0
      };
    });

    if (modifiedItemSubCategories.length === 0) {
      return res.status(404).json({
        message: 'No item subcategories found for the given categories, subcategories, and item categories.'
      });
    }

    res.json(modifiedItemSubCategories);

  } catch (err) {
    console.error('getItemSubCategoriesBySelectedCategorySubCategoryItemCategory error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllItemSubCategoryServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'category_id', 'subcategory_id', 'category_name', 'subcategory_name', 'itemcategory_name', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (sortBy === 'subcategory_name') {
      order = [[{ model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (sortBy === 'itemcategory_name') {
      order = [[{ model: ItemCategory, as: 'ItemCategory' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (req.query.excludeItemSubCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_subcategory_id
          FROM products
          WHERE item_subcategory_id IS NOT NULL
        )`)
      };
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        /*{ '$Categories.name$': { [Op.like]: `%${search}%` } },
        { '$SubCategories.name$': { [Op.like]: `%${search}%` } },*/
        { '$ItemCategory.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await ItemSubCategory.count({ where });
    const { count: filteredRecords, rows } = await ItemSubCategory.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
        { model: SubCategories, attributes: ['name'], as: 'SubCategories' },
        { model: ItemCategory, attributes: ['name'], as: 'ItemCategory' },
        { model: UploadImage, attributes: ['file'] },
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      category_id: row.category_id,
      subcategory_id: row.subcategory_id,
      category_name: row.Categories ? row.Categories.name : null,
      subcategory_name: row.SubCategories ? row.SubCategories.name : null,
      itemcategory_name: row.ItemCategory ? row.ItemCategory.name : null,
      file_id: row.file_id,
      file_name: row.UploadImage ? row.UploadImage.file : null,
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

exports.getItemSubCategoryCount = async (req, res) => {
  try {
    const total = await ItemSubCategory.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoryBarGraph = async (req, res) => {
  try {
    const subCategories = await ItemSubCategory.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    const counts = await Products.findAll({
      attributes: [
        'item_subcategory_id',
        'is_approve',
        [fn('COUNT', col('product_id')), 'count'],
      ],
      where: { is_delete: 0 },
      group: ['item_subcategory_id', 'is_approve'],
      raw: true,
    });

    const approvedMap = {};
    const unapprovedMap = {};

    counts.forEach(r => {
      if (r.is_approve === 1) approvedMap[r.item_subcategory_id] = Number(r.count);
      else unapprovedMap[r.item_subcategory_id] = Number(r.count);
    });

    res.json({
      labels: subCategories.map(s => s.name),
      datasets: [
        {
          label: 'Approved',
          backgroundColor: '#4CAF50',
          data: subCategories.map(s => approvedMap[s.id] || 0),
        },
        {
          label: 'Unapproved',
          backgroundColor: '#FF5722',
          data: subCategories.map(s => unapprovedMap[s.id] || 0),
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getKeywordsBySubcategoryId = async (req, res) => {
  try {
    const item_subcategory_id = Number(req.params.id);
    if (!Number.isInteger(item_subcategory_id) || item_subcategory_id <= 0) {
      return res.status(400).json({ message: 'Invalid item_subcategory_id' });
    }
    const keywords = await ProductKeyword.findAll({
      where: { item_subcategory_id },
      attributes: ['id', 'name', 'status', 'created_at', 'updated_at'],
      order: [['id', 'ASC']],
      raw: true,
    });
    res.json(keywords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerSourcingInterestsBarGraph = async (req, res) => {
  try {
    const itemSubCategory = await ItemSubCategory.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    // count DISTINCT users per category
    const counts = await BuyerSourcingInterests.findAll({
      attributes: [
        'item_subcategory_id',
        [fn('COUNT', literal('DISTINCT user_id')), 'count'],
      ],
      group: ['item_subcategory_id'],
      raw: true,
    });

    const countMap = {};
    counts.forEach(c => {
      countMap[c.item_subcategory_id] = Number(c.count);
    });

    res.json({
      labels: itemSubCategory.map(c => c.name),
      datasets: [
        {
          label: 'Sourcing Interests',
          data: itemSubCategory.map(c => countMap[c.id] || 0),
          backgroundColor: '#0d6efd',
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};