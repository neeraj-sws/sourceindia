const { Op, fn, col } = require('sequelize');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createItemCategory = async (req, res) => {
  const upload = getMulterUpload('items');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
  try {
    const { name, category_id, subcategory_id, status } = req.body;
    /*if (!name || !category_id || !subcategory_id || status === undefined) {
      return res.status(400).json({ message: 'All fields (name, category_id, subcategory_id, status) are required' });
    }*/
    const uploadImage = await UploadImage.create({
      file: `upload/items/${req.file.filename}`,
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
    const itemCategory = await ItemCategory.findAll({ order: [['id', 'ASC']],
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
      ], });
    const modifiedItemCategories = itemCategory.map(item_categories => {
      const itemCategoryData = item_categories.toJSON();
      itemCategoryData.getStatus = itemCategoryData.status === 1 ? 'Active' : 'Inactive';
      itemCategoryData.category_name = itemCategoryData.Categories?.name || null;
      itemCategoryData.subcategory_name = itemCategoryData.SubCategories?.name || null;
      delete itemCategoryData.Categories;
      delete itemCategoryData.SubCategories;
      return itemCategoryData;
    });
    res.json(modifiedItemCategories);
  } catch (err) {
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
  const upload = getMulterUpload('items');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
  try {
    const { name, category_id, subcategory_id, status } = req.body;
    const itemCategory = await ItemCategory.findByPk(req.params.id);
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
    const uploadDir = path.resolve('upload/items');
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
            existingImage.file = `upload/items/${req.file.filename}`;
            existingImage.updated_at = new Date();
            await existingImage.save();
          } else {
            const newImage = await UploadImage.create({
              file: `upload/items/${req.file.filename}`,
            });
            itemCategory.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/items/${req.file.filename}`,
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

exports.deleteItemCategory = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findByPk(req.params.id);
    if (!itemCategory) return res.status(404).json({ message: 'Item Category not found' });
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
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { '$Categories.name$': { [Op.like]: `%${search}%` } },
        { '$SubCategories.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await ItemCategory.count();
    const { count: filteredRecords, rows } = await ItemCategory.findAndCountAll({
      where,
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