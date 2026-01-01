const { Op, fn, col, literal } = require('sequelize');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');
const UploadImage = require('../models/UploadImage');
const BuyerSourcingInterests = require('../models/BuyerSourcingInterests');
const getMulterUpload = require('../utils/upload');
const ItemSubCategory = require('../models/ItemSubCategory');

exports.createItemCategory = async (req, res) => {
  const upload = getMulterUpload('item_category');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, category_id, subcategory_id, status } = req.body;
      /*if (!name || !category_id || !subcategory_id || status === undefined) {
        return res.status(400).json({ message: 'All fields (name, category_id, subcategory_id, status) are required' });
      }*/
      const uploadImage = await UploadImage.create({
        file: `upload/item_category/${req.file.filename}`,
      });
      const itemCategory = await ItemCategory.create({
        name,
        category_id,
        subcategory_id,
        status,
        file_id: uploadImage.id,
      });
      const category = await Categories.findByPk(category_id);
      const subCategory = await SubCategories.findByPk(subcategory_id);
      const itemCategoryWithNames = {
        ...itemCategory.toJSON(),
        category_name: category ? category.name : '',
        subcategory_name: subCategory ? subCategory.name : '',
        file_name: uploadImage.file
      };
      res.status(201).json({
        message: 'Item Category created',
        itemCategory: itemCategoryWithNames
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllItemCategory = async (req, res) => {
  try {
    // Build the "where" clause dynamically
    const where = {};

    // Exclude item categories that are already linked to products
    if (req.query.excludeItemCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_category_id
          FROM products
          WHERE item_category_id IS NOT NULL
        )`)
      };
    }

    const itemCategories = await ItemCategory.findAll({
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
      ],
    });

    // Map and format the result for frontend
    const modifiedItemCategories = itemCategories.map(item => {
      const itemData = item.toJSON();
      return {
        ...itemData,
        getStatus: itemData.status === 1 ? 'Active' : 'Inactive',
        category_name: itemData.Categories?.name || null,
        subcategory_name: itemData.SubCategories?.name || null,
        // Remove nested objects as frontend only needs flat structure
        Categories: undefined,
        SubCategories: undefined,
      };
    });

    res.json(modifiedItemCategories);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoryById = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
    const response = {
      ...itemCategory.toJSON(),
      file_name: itemCategory.UploadImage ? itemCategory.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemCategory = async (req, res) => {
  const upload = getMulterUpload('item_category');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    try {
      const { name, category_id, subcategory_id, status } = req.body;
      const itemCategory = await ItemCategory.findByPk(req.params.id);
      if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
      const uploadDir = path.resolve('upload/item_category');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = itemCategory.file_id;
      if (req.file) {
        if (file_id) {
          const existingImage = await UploadImage.findByPk(file_id);
          if (existingImage) {
            const oldImagePath = path.resolve(existingImage.file);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
            existingImage.file = `upload/item_category/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/item_category/${req.file.filename}`,
            });
            itemCategory.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/item_category/${req.file.filename}`,
          });
          itemCategory.file_id = newImage.id;
        }
      }
      itemCategory.name = name;
      itemCategory.category_id = category_id;
      itemCategory.subcategory_id = subcategory_id;
      itemCategory.status = status;
      itemCategory.updated_at = new Date();
      await itemCategory.save();

      res.json({ message: 'Item Category updated', itemCategory });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};




exports.getAllItemCategories = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const status = req.query.status;

    const whereCondition = {};

    if (typeof status !== 'undefined') {
      whereCondition.status = parseInt(status);
    }

    const categories = await ItemCategory.findAll({
      order: [['id', 'ASC']],
      where: whereCondition,
      ...(limit && { limit }),
    });

    // product count per category
    const sourcingCounts = await BuyerSourcingInterests.findAll({
      attributes: ['item_category_id', [fn('COUNT', col('user_id')), 'count']],
      group: ['item_category_id'],
      raw: true,
    });

    const sourcingCountMap = {};
    sourcingCounts.forEach(item => {
      sourcingCountMap[item.item_category_id] = parseInt(item.count);
    });

    const modifiedCategories = categories.map(category => {
      const cd = category.toJSON();
      const { CategoryImage, ...rest } = cd;
      return {
        ...rest,
        company_count: sourcingCountMap[category.id] || 0, // ✅ fixed
      };
    });

    res.json(modifiedCategories);
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoryByItemType = async (req, res) => {
  try {
    const { category_id } = req.params;

    const categoryId = Number(category_id);

    const whereCondition = {};
    if (!isNaN(categoryId)) {
      whereCondition.item_category_id = categoryId;
    }

    const categories = await ItemSubCategory.findAll({
      where: whereCondition,
      order: [['id', 'ASC']],
    });

    const sourcingCounts = await BuyerSourcingInterests.findAll({
      attributes: [
        'item_subcategory_id',
        [fn('COUNT', col('user_id')), 'count'],
      ],
      where: {
        ...(!isNaN(categoryId) && { item_category_id: categoryId }),

      },
      group: ['item_subcategory_id'],
      raw: true,
    });

    const sourcingCountMap = {};
    sourcingCounts.forEach(item => {
      sourcingCountMap[item.item_subcategory_id] = Number(item.count);
    });

    const modifiedCategories = categories.map(cat => ({
      ...cat.toJSON(),
      company_count: sourcingCountMap[cat.id] || 0,
    }));

    res.json(modifiedCategories);
  } catch (err) {
    console.error('getAllItemSubCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.deleteItemCategory = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findByPk(req.params.id);
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
    if (itemCategory.file_id && itemCategory.file_id !== 0) {
      const uploadImage = await UploadImage.findByPk(itemCategory.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await itemCategory.destroy();
    res.json({ message: 'Item Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedItemCategory = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10));

    // Find all item categories with the given IDs
    const itemCategories = await ItemCategory.findAll({
      where: { id: { [Op.in]: parsedIds } },
    });

    if (itemCategories.length === 0) {
      return res.status(404).json({ message: 'No Item Category found with the given IDs.' });
    }

    // Loop through each item category to delete associated files
    for (const itemCategory of itemCategories) {
      if (itemCategory.file_id) {
        const uploadImage = await UploadImage.findByPk(itemCategory.file_id);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await uploadImage.destroy();
        }
      }
    }

    // Delete all item categories
    await ItemCategory.destroy({
      where: { id: { [Op.in]: parsedIds } },
    });

    res.json({ message: `${itemCategories.length} Item Category(s) deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    const itemCategory = await ItemCategory.findByPk(req.params.id);
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });

    itemCategory.status = status;
    await itemCategory.save();

    res.json({ message: 'Status updated', itemCategory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoriesByCategoryAndSubCategory = async (req, res) => {
  try {
    const { category_id, subcategory_id } = req.params;
    if (!category_id || !subcategory_id) {
      return res.status(400).json({
        error: 'Both category_id and subcategory_id are required.',
      });
    }
    const itemCategories = await ItemCategory.findAll({
      where: { category_id, subcategory_id },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });
    if (itemCategories.length === 0) {
      return res.status(404).json({ message: 'No item categories found for the given category and subcategory.' });
    }
    res.json(itemCategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoriesBySelectedCategoryAndSubCategory = async (req, res) => {
  try {
    const { categories, subcategories } = req.body;

    if (
      !categories || !Array.isArray(categories) || categories.length === 0 ||
      !subcategories || !Array.isArray(subcategories) || subcategories.length === 0
    ) {
      return res.status(400).json({
        error: 'Both categories[] and subcategories[] arrays are required and cannot be empty.',
      });
    }

    // 🟢 Fetch matching item categories
    const itemCategories = await ItemCategory.findAll({
      where: {
        category_id: { [Op.in]: categories },
        subcategory_id: { [Op.in]: subcategories },
        status: 1
      },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });

    // 🟢 Get Product Counts for each Item Category
    const productCounts = await Products.findAll({
      attributes: ['item_category_id', [fn('COUNT', col('product_id')), 'count']],
      where: {
        is_delete: 0,
        is_approve: 1,
        status: 1,
      },
      group: ['item_category_id'],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.item_category_id] = parseInt(item.count);
    });

    // 🟢 Format Output (without company count)
    const modifiedItemCategories = itemCategories.map(cat => {
      const catData = cat.toJSON();
      return {
        ...catData,
        getStatus: catData.status === 1 ? 'Active' : 'Inactive',
        category_name: catData.Categories?.name || null,
        subcategory_name: catData.SubCategories?.name || null,
        product_count: productCountMap[catData.id] || 0
      };
    });

    if (modifiedItemCategories.length === 0) {
      return res.status(404).json({
        message: 'No item categories found for the given categories and subcategories.'
      });
    }

    res.json(modifiedItemCategories);

  } catch (err) {
    console.error('getItemCategoriesBySelectedCategoryAndSubCategory error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllItemCategoryServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'category_id', 'subcategory_id', 'category_name', 'subcategory_name', 'created_at', 'updated_at'];
    const sortDirection = sort === 'DESC' || sort === 'ASC' ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'category_name') {
      order = [[{ model: Categories, as: 'Categories' }, 'name', sortDirection]];
    } else if (sortBy === 'subcategory_name') {
      order = [[{ model: SubCategories, as: 'SubCategories' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (req.query.excludeItemCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT item_category_id
          FROM products
          WHERE item_category_id IS NOT NULL
        )`)
      };
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Categories.name$': { [Op.like]: `%${search}%` } },
        { '$SubCategories.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await ItemCategory.count({ where });
    const { count: filteredRecords, rows } = await ItemCategory.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
        { model: SubCategories, attributes: ['name'], as: 'SubCategories' },
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

exports.getItemCategoryCount = async (req, res) => {
  try {
    const total = await ItemCategory.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategoryBarGraph = async (req, res) => {
  try {
    const categories = await ItemCategory.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    const counts = await Products.findAll({
      attributes: [
        'item_category_id',
        'is_approve',
        [fn('COUNT', col('product_id')), 'count'],
      ],
      where: { is_delete: 0 },
      group: ['item_category_id', 'is_approve'],
      raw: true,
    });

    const approvedMap = {};
    const unapprovedMap = {};

    counts.forEach(r => {
      if (r.is_approve === 1) approvedMap[r.item_category_id] = Number(r.count);
      else unapprovedMap[r.item_category_id] = Number(r.count);
    });

    res.json({
      labels: categories.map(c => c.name),
      datasets: [
        {
          label: 'Approved',
          backgroundColor: '#4CAF50',
          data: categories.map(c => approvedMap[c.id] || 0),
        },
        {
          label: 'Unapproved',
          backgroundColor: '#FF5722',
          data: categories.map(c => unapprovedMap[c.id] || 0),
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBuyerSourcingInterestsBarGraph = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findAll({
      attributes: ['id', 'name'],
      where: { status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    // count DISTINCT users per category
    const counts = await BuyerSourcingInterests.findAll({
      attributes: [
        'item_category_id',
        [fn('COUNT', literal('DISTINCT user_id')), 'count'],
      ],
      group: ['item_category_id'],
      raw: true,
    });

    const countMap = {};
    counts.forEach(c => {
      countMap[c.item_category_id] = Number(c.count);
    });

    res.json({
      labels: itemCategory.map(c => c.name),
      datasets: [
        {
          label: 'Sourcing Interests',
          data: itemCategory.map(c => countMap[c.id] || 0),
          backgroundColor: '#0d6efd',
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};