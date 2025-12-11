const { Op, fn, col } = require('sequelize');
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const Items = require('../models/Items');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');
const UploadImage = require('../models/UploadImage');
const getMulterUpload = require('../utils/upload');

exports.createItems = async (req, res) => {
  const upload = getMulterUpload('items');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
  try {
    const { name, category_id, subcategory_id, item_category_id, item_sub_category_id, status } = req.body;
    /*if (!name || !category_id || !subcategory_id || !item_category_id || !item_sub_category_id || status === undefined) {
      return res.status(400).json({ message: 'All fields (name, category_id, subcategory_id, item_category_id, item_sub_category_id, status) are required' });
    }*/
    const uploadImage = await UploadImage.create({
      file: `upload/items/${req.file.filename}`,
    });
    const items = await Items.create({
      name, category_id, subcategory_id, item_category_id, item_sub_category_id, status, file_id: uploadImage.id,
    });
    const category = await Categories.findByPk(category_id);
    const subCategory = await SubCategories.findByPk(subcategory_id);
    const itemCategory = await ItemCategory.findByPk(item_category_id);
    const itemSubCategory = await ItemSubCategory.findByPk(item_sub_category_id);
    const itemsWithNames = {
      ...items.toJSON(),
      category_name: category ? category.name : '',
      subcategory_name: subCategory ? subCategory.name : '',
      itemcategory_name: itemCategory ? itemCategory.name : '',
      item_subcategory_name: itemSubCategory ? itemSubCategory.name : ''
    };
    res.status(201).json({
      message: 'Item created',
      items: itemsWithNames
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
  });
};

exports.getAllItems = async (req, res) => {
  try {
    const items = await Items.findAll({ order: [['id', 'ASC']],
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
      ], });
    const modifiedItems = items.map(item => {
      const itemsData = item.toJSON();
      itemsData.getStatus = itemsData.status === 1 ? 'Active' : 'Inactive';
      itemsData.category_name = itemsData.Categories?.name || null;
      itemsData.subcategory_name = itemsData.SubCategories?.name || null;
      itemsData.itemcategory_name = itemsData.ItemCategory?.name || null;
      itemsData.item_subcategory_name = itemsData.ItemSubCategory?.name || null;
      delete itemsData.Categories;
      delete itemsData.SubCategories;
      delete itemsData.ItemCategory;
      delete itemsData.ItemSubCategory;
      return itemsData;
    });
    res.json(modifiedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemsById = async (req, res) => {
  try {
    const items = await Items.findByPk(req.params.id, {
      include: [{
        model: UploadImage,
        attributes: ['file'],
      }],
    });
    if (!items) return res.status(404).json({ message: 'Item not found' });
    const response = {
      ...items.toJSON(),
      file_name: items.UploadImage ? items.UploadImage.file : null,
    };
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateItems = async (req, res) => {
  const upload = getMulterUpload('items');
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
  try {
    const { name, category_id, subcategory_id, item_category_id, item_sub_category_id, status } = req.body;
    const items = await Items.findByPk(req.params.id);
    if (!items) return res.status(404).json({ message: 'Item not found' });
    const uploadDir = path.resolve('upload/items');
      if (!fs.existsSync(uploadDir)) {
        console.log("Directory does not exist, creating:", uploadDir);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const file_id = items.file_id;
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
            items.file_id = newImage.id;
          }
        } else {
          const newImage = await UploadImage.create({
            file: `upload/items/${req.file.filename}`,
          });
          items.file_id = newImage.id;
        }
      }
    items.name = name;
    items.category_id = category_id;
    items.subcategory_id = subcategory_id;
    items.item_category_id = item_category_id;
    items.item_sub_category_id = item_sub_category_id;
    items.status = status;
    items.updated_at = new Date();
    await items.save();

    res.json({ message: 'Item updated', items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
};

exports.deleteItems = async (req, res) => {
  try {
    const items = await Items.findByPk(req.params.id);
    if (!items) return res.status(404).json({ message: 'Item not found' });
    if (items.file_id && items.file_id !== 0) {
      const uploadImage = await UploadImage.findByPk(items.file_id);
      if (uploadImage) {
        const oldImagePath = path.resolve(uploadImage.file);        
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        await uploadImage.destroy();
      }
    }
    await items.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedItems = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to delete.' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10));

    // Find all items
    const items = await Items.findAll({
      where: { id: { [Op.in]: parsedIds } },
    });

    if (items.length === 0) {
      return res.status(404).json({ message: 'No Item found with the given IDs.' });
    }

    // Delete associated files
    for (const item of items) {
      if (item.file_id) {
        const uploadImage = await UploadImage.findByPk(item.file_id);
        if (uploadImage) {
          const oldImagePath = path.resolve(uploadImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
          await uploadImage.destroy();
        }
      }
    }

    // Delete all items
    await Items.destroy({
      where: { id: { [Op.in]: parsedIds } },
    });

    res.json({ message: `${items.length} Item(s) deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateItemsStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const items = await Items.findByPk(req.params.id);
    if (!items) return res.status(404).json({ message: 'Item not found' });
    items.status = status;
    await items.save();
    res.json({ message: 'Status updated', items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubCategoriesByCategorySubCategoryItemCategoryItemSubCategory = async (req, res) => {
  try {
    const { category_id, subcategory_id, item_category_id, item_sub_category_id } = req.params;
    if (!category_id || !subcategory_id || !item_category_id || !item_sub_category_id) {
      return res.status(400).json({
        error: 'Both category_id, subcategory_id, item_category_id, item_sub_category_id are required.',
      });
    }
    const items = await Items.findAll({
      where: { category_id, subcategory_id, item_category_id, item_sub_category_id },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });
    if (items.length === 0) {
      return res.status(404).json({ message: 'No item sub categories found for the given category, subcategory, itemcategory, itemsubcategory.' });
    }
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemsBySelectedCategorySubCategoryItemCategoryItemSubCategory = async (req, res) => {
  try {
    const { categories, subcategories, itemCategories, itemSubCategories } = req.body;

    // 🧩 Validate request body
    if (
      !categories || !Array.isArray(categories) || categories.length === 0 ||
      !subcategories || !Array.isArray(subcategories) || subcategories.length === 0 ||
      !itemCategories || !Array.isArray(itemCategories) || itemCategories.length === 0 ||
      !itemSubCategories || !Array.isArray(itemSubCategories) || itemSubCategories.length === 0
    ) {
      return res.status(400).json({
        error: 'categories[], subcategories[], itemCategories[], and itemSubCategories[] arrays are required and cannot be empty.'
      });
    }

    // 🟢 Fetch Items matching all filters
    const items = await Items.findAll({
      where: {
        category_id: { [Op.in]: categories },
        subcategory_id: { [Op.in]: subcategories },
        item_category_id: { [Op.in]: itemCategories },
        item_sub_category_id: { [Op.in]: itemSubCategories },
        status: 1
      },
      include: [
        { model: Categories, as: 'Categories', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'SubCategories', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'ItemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'ItemSubCategory', attributes: ['id', 'name'] },
      ],
      order: [['id', 'ASC']],
    });

    // 🟢 Count how many Products use each Item (via item_id)
    const productCounts = await Products.findAll({
      attributes: ['item_id', [fn('COUNT', col('product_id')), 'count']],
      where: {
        is_delete: 0,
        is_approve: 1,
        status: 1,
      },
      group: ['item_id'],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.item_id] = parseInt(item.count);
    });

    // 🧩 Format final output
    const modifiedItems = items.map(item => {
      const itemData = item.toJSON();
      return {
        ...itemData,
        getStatus: itemData.status === 1 ? 'Active' : 'Inactive',
        category_name: itemData.Categories?.name || null,
        subcategory_name: itemData.SubCategories?.name || null,
        item_category_name: itemData.ItemCategory?.name || null,
        item_subcategory_name: itemData.ItemSubCategory?.name || null,
        product_count: productCountMap[itemData.id] || 0
      };
    });

    if (modifiedItems.length === 0) {
      return res.status(404).json({
        message: 'No items found for the given category, subcategory, item category, and item subcategory filters.'
      });
    }

    res.json(modifiedItems);

  } catch (err) {
    console.error('getItemsBySelectedCategorySubCategoryItemCategoryItemSubCategory error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllItemsServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'name', 'category_id', 'subcategory_id', 'item_category_id', 'item_sub_category_id',
      'category_name', 'subcategory_name', 'itemcategory_name', 'item_subcategory_name', 'created_at', 'updated_at'];
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
    } else if (sortBy === 'item_subcategory_name') {
      order = [[{ model: ItemSubCategory, as: 'ItemSubCategory' }, 'name', sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        /*{ '$Categories.name$': { [Op.like]: `%${search}%` } },
        { '$SubCategories.name$': { [Op.like]: `%${search}%` } },*/
        { '$ItemCategory.name$': { [Op.like]: `%${search}%` } },
        { '$ItemSubCategory.name$': { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await Items.count();
    const { count: filteredRecords, rows } = await Items.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [
        { model: Categories, attributes: ['name'], as: 'Categories' },
        { model: SubCategories, attributes: ['name'], as: 'SubCategories' },
        { model: ItemCategory, attributes: ['name'], as: 'ItemCategory' },
        { model: ItemSubCategory, attributes: ['name'], as: 'ItemSubCategory' },
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
      item_subcategory_name: row.ItemSubCategory ? row.ItemSubCategory.name : null,
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

exports.getItemsCount = async (req, res) => {
  try {
    const total = await Items.count();
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};