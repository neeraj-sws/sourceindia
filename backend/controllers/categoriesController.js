const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const ItemCategory = require('../models/ItemCategory');
const Items = require('../models/Items');
const ItemSubCategory = require('../models/ItemSubCategory');
const UploadImage = require('../models/UploadImage');
const Products = require('../models/Products');
const CompanyInfo = require('../models/CompanyInfo');
const SellerCategory = require('../models/SellerCategory');
const getMulterUpload = require('../utils/upload');

exports.createCategories = async (req, res) => {
  const upload = getMulterUpload('category');
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    try {
      const { name, top_category, status } = req.body;
      /*if (!name || !top_category || !status || !req.file) {
        return res.status(400).json({ message: 'All fields (name, top_category, status, file) are required' });
      }*/
      const uploadImage = await UploadImage.create({
        file: `upload/category/${req.file.filename}`,
      });
      const categories = await Categories.create({
        name,
        top_category,
        status,
        cat_file_id: uploadImage.id,
      });
      res.status(201).json({ message: 'Categories created', categories });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

exports.getAllCategories = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const isDeleted = req.query.is_delete;
    const status = req.query.status;

    const whereCondition = {};
    if (typeof isDeleted !== 'undefined') {
      whereCondition.is_delete = parseInt(isDeleted);
    }
    if (typeof status !== 'undefined') {
      whereCondition.status = parseInt(status);
    }
    if (req.query.excludeSellerCategories === 'true') {
      whereCondition.id = {
        [Op.notIn]: literal(`(
      SELECT DISTINCT category_id
      FROM seller_categories
      WHERE category_id IS NOT NULL
    )`)
      };
    }

    // ✅ NEW: exclude product categories
    if (req.query.excludeProductCategories === 'true') {
      whereCondition.id = {
        [Op.notIn]: literal(`(
      SELECT DISTINCT category
      FROM products
      WHERE category IS NOT NULL
    )`)
      };
    }

    const categories = await Categories.findAll({
      order: [['id', 'ASC']], // ✅ fixed
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage',
          attributes: ['file'],
        },
      ],
      where: whereCondition,
      ...(limit && { limit }),
    });

    // product count per category
    const productCounts = await Products.findAll({
      attributes: ['category', [fn('COUNT', col('product_id')), 'count']],
      where: { is_delete: 0, is_approve: 1, status: 1 },
      group: ['category'],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item.category] = parseInt(item.count);
    });

    // company count per category (simplified for now)
    const companyCountsRaw = await sequelize.query(
      `SELECT 
    sc.category_id AS category_id,
    COUNT(DISTINCT u.company_id) AS count
  FROM seller_categories sc
  INNER JOIN users u 
    ON u.user_id = sc.user_id
   AND u.is_delete = 0
   AND u.status = 1
   AND u.is_approve = 1
  WHERE u.company_id IS NOT NULL
  GROUP BY sc.category_id`, { type: QueryTypes.SELECT });

    const companyCountMap = {};
    companyCountsRaw.forEach(item => {
      companyCountMap[item.category_id] = parseInt(item.count) || 0;
    });

    const modifiedCategories = categories.map(category => {
      const cd = category.toJSON();
      const { CategoryImage, ...rest } = cd;
      return {
        ...rest,
        file_name: CategoryImage?.file || null,
        product_count: productCountMap[category.id] || 0, // ✅ fixed
        company_count: companyCountMap[category.id] || 0, // ✅ fixed
      };
    });

    res.json(modifiedCategories);
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriesById = async (req, res) => {
  try {
    const categories = await Categories.findByPk(req.params.id, {
      attributes: { exclude: ['file_id'] },
      include: [{
        model: UploadImage,
        as: 'CategoryImage',
        attributes: ['file'],
      }],
    });
    if (!categories) {
      return res.status(404).json({ message: 'Categories not found' });
    }
    const response = {
      ...categories.toJSON(),
      file_name: categories.CategoryImage ? categories.CategoryImage.file : null,
    };
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriesCount = async (req, res) => {
  try {
    const total = await Categories.count({ where: { is_delete: 0 } });
    res.json({ total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategories = async (req, res) => {
  const upload = getMulterUpload('category');

  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      const { name, top_category, status } = req.body;

      // ✅ Include UploadImage with correct alias
      const categories = await Categories.findByPk(req.params.id, {
        attributes: { exclude: ['file_id'] },
        include: [
          {
            model: UploadImage,
            as: 'CategoryImage', // must match the association alias
            attributes: ['id', 'file'],
          },
        ],
      });

      if (!categories) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Ensure upload directory exists
      const uploadDir = path.resolve('upload/category');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const currentImage = categories.CategoryImage;

      // ------------------------------
      // IMAGE UPDATE LOGIC
      // ------------------------------
      if (req.file) {
        // CASE 1: Update existing image
        if (currentImage) {
          const oldImagePath = path.resolve(currentImage.file);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }

          currentImage.file = `upload/category/${req.file.filename}`;
          currentImage.updated_at = new Date();
          await currentImage.save();
        }
        // CASE 2: Create a new image record
        else {
          const newImage = await UploadImage.create({
            file: `upload/category/${req.file.filename}`,
          });
          categories.cat_file_id = newImage.id;
        }
      }

      // ------------------------------
      // UPDATE CATEGORY FIELDS
      // ------------------------------
      if (name !== undefined) categories.name = name;
      if (top_category !== undefined) categories.top_category = top_category;
      if (status !== undefined) categories.status = status;

      categories.updated_at = new Date();
      await categories.save();

      // Reload with updated image
      const updatedCategory = await Categories.findByPk(req.params.id, {
        attributes: { exclude: ['file_id'] },
        include: [
          {
            model: UploadImage,
            as: 'CategoryImage', // ✅ alias must match model association
            attributes: ['file'],
          },
        ],
      });

      res.json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};

exports.deleteCategories = async (req, res) => {
  try {
    // Fetch category with the associated image
    const category = await Categories.findByPk(req.params.id, {
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage', // match the association alias
          attributes: ['id', 'file'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete associated image file if exists
    if (category.cat_file_id && category.CategoryImage) {
      const imagePath = path.resolve(category.CategoryImage.file);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      await category.CategoryImage.destroy();
    }

    // Delete the category
    await category.destroy();

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSelectedCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of IDs to update.' });
    }

    const parsedIds = ids.map(id => parseInt(id, 10));

    // Fetch categories while excluding the nonexistent file_id column
    const categories = await Categories.findAll({
      where: {
        id: { [Op.in]: parsedIds },
        is_delete: 0
      },
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage', // consistent alias
          attributes: ['file'],
        },
      ],
    });

    if (categories.length === 0) {
      return res.status(404).json({ message: 'No categories found with the given IDs.' });
    }

    // Mark selected categories as deleted
    await Categories.update(
      { is_delete: 1, updated_at: new Date() },
      { where: { id: { [Op.in]: parsedIds } } }
    );

    res.json({ message: `${categories.length} categories marked as deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }

    // Fetch category while excluding the nonexistent file_id column
    const categories = await Categories.findByPk(req.params.id, {
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage', // in case you want to return the image
          attributes: ['file'],
        },
      ],
    });

    if (!categories) {
      return res.status(404).json({ message: 'Categories not found' });
    }

    // Update status
    categories.status = status;
    categories.updated_at = new Date();
    await categories.save();

    res.json({ message: 'Status updated', categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesTopCategory = async (req, res) => {
  try {
    const { top_category } = req.body;
    if (top_category !== 0 && top_category !== 1) {
      return res.status(400).json({ message: 'Invalid category status. Use 1 (Active) or 0 (Deactive).' });
    }
    const categories = await Categories.findByPk(req.params.id, {
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage', // in case you want to return the image
          attributes: ['file'],
        },
      ],
    });
    if (!categories) return res.status(404).json({ message: 'Categories not found' });
    categories.top_category = top_category;
    await categories.save();
    res.json({ message: 'Category status updated', categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoriesDeleteStatus = async (req, res) => {
  try {
    const { is_delete } = req.body;
    if (is_delete !== 0 && is_delete !== 1) {
      return res.status(400).json({ message: 'Invalid delete status. Use 1 (Active) or 0 (Deactive).' });
    }
    const categories = await Categories.findByPk(req.params.id, {
      attributes: { exclude: ['file_id'] },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage', // in case you want to return the image
          attributes: ['file'],
        },
      ],
    });
    if (!categories) return res.status(404).json({ message: 'Categories not found' });
    categories.is_delete = is_delete;
    await categories.save();
    res.json({ message: 'Categories is removed', categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategoriesServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
      dateRange = '',
      startDate,
      endDate,
    } = req.query;
    const validColumns = ['id', 'name', 'top_category', 'created_at', 'updated_at', 'product_count'];
    const sortDirection = (sort === 'DESC' || sort === 'ASC') ? sort : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);
    let order = [];
    if (sortBy === 'product_count') {
      order = [[literal('product_count'), sortDirection]];
    } else if (validColumns.includes(sortBy)) {
      order = [[sortBy, sortDirection]];
    } else {
      order = [['id', 'DESC']];
    }
    const where = { is_delete: 0 };
    if (req.query.getDeleted === 'true') {
      where.is_delete = 1;
    }
    if (req.query.excludeSellerCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT category_id
          FROM seller_categories
          WHERE category_id IS NOT NULL
        )`)
      };
    }
    if (req.query.excludeProductCategories === 'true') {
      where.id = {
        [Op.notIn]: literal(`(
          SELECT DISTINCT category
          FROM products
          WHERE category IS NOT NULL
        )`)
      };
    }
    const searchWhere = { ...where };
    if (search) {
      searchWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
      ];
    }
    let dateCondition = null;
    if (dateRange) {
      const range = dateRange.toString().toLowerCase().replace(/\s+/g, '');
      const today = moment().startOf('day');
      const now = moment();
      if (range === 'today') {
        dateCondition = {
          [Op.gte]: today.toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'yesterday') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'day').startOf('day').toDate(),
          [Op.lte]: moment().subtract(1, 'day').endOf('day').toDate(),
        };
      } else if (range === 'last7days') {
        dateCondition = {
          [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'last30days') {
        dateCondition = {
          [Op.gte]: moment().subtract(29, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'thismonth') {
        dateCondition = {
          [Op.gte]: moment().startOf('month').toDate(),
          [Op.lte]: now.toDate(),
        };
      } else if (range === 'lastmonth') {
        dateCondition = {
          [Op.gte]: moment().subtract(1, 'month').startOf('month').toDate(),
          [Op.lte]: moment().subtract(1, 'month').endOf('month').toDate(),
        };
      } else if (range === 'customrange' && startDate && endDate) {
        dateCondition = {
          [Op.gte]: moment(startDate).startOf('day').toDate(),
          [Op.lte]: moment(endDate).endOf('day').toDate(),
        };
      } else if (!isNaN(range)) {
        const days = parseInt(range);
        dateCondition = {
          [Op.gte]: moment().subtract(days - 1, 'days').startOf('day').toDate(),
          [Op.lte]: now.toDate(),
        };
      }
    }
    if (dateCondition) {
      searchWhere.created_at = dateCondition;
    }
    const totalRecords = await Categories.count({ where });
    const { count: filteredRecords, rows } = await Categories.findAndCountAll({
      where: searchWhere,
      order,
      limit: limitValue,
      offset,
      attributes: {
        exclude: ['file_id'],
        include: [
          [literal(`(SELECT COUNT(*) FROM products WHERE products.category = Categories.category_id AND products.is_delete = 0)`), 'product_count']
        ]
      },
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage',
          attributes: ['file']
        }
      ],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      top_category: row.top_category,
      cat_file_id: row.cat_file_id,
      file_name: row.CategoryImage ? row.CategoryImage.file : null,
      status: row.status,
      is_delete: row.is_delete,
      product_count: row.get('product_count') || 0,
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

exports.getItemCategories = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    // 1️⃣ Fetch all top-level categories with image
    const categories = await Categories.findAll({
      where: { top_category: 1, is_delete: 0, status: 1 },
      attributes: ['id', 'name', 'cat_file_id', 'slug'],
      order: [['id', 'ASC']],
      ...(limit && { limit }),
      include: [
        {
          model: UploadImage,
          as: 'CategoryImage',
          attributes: ['file']
        }
      ]
    });

    // 2️⃣ Fetch all subcategories
    const subcategories = await SubCategories.findAll({
      where: { is_delete: 0, status: 1 },
      attributes: [
        'id',
        'sub_category_id',
        'file_id',
        'name',
        'category',
        'slug'
      ],
      order: [['id', 'ASC']],
      raw: true
    });

    // 3️⃣ Fetch all item categories
    const itemcategories = await ItemCategory.findAll({
      where: { status: 1 },
      attributes: ['id', ['item_category_id', 'id'], 'name', 'category_id', 'subcategory_id', 'slug'],
      raw: true
    });

    // 4️⃣ Fetch all images (optional)
    const uploadImages = await UploadImage.findAll({
      attributes: ['id', 'file'],
      raw: true
    });

    // ✅ Image map
    const imageMap = {};
    uploadImages.forEach(img => {
      imageMap[img.id] = img.file;
    });

    const productCounts = await Products.findAll({
      attributes: [
        'category',
        'sub_category',
        'item_category_id',
        [sequelize.fn('COUNT', sequelize.col('product_id')), 'product_count']
      ],
      where: {
        status: 1,
        is_delete: 0
      },
      group: ['category', 'sub_category', 'item_category_id'],
      raw: true
    });
    const productCountMap = {};
    productCounts.forEach(p => {
      const key = `${p.category}_${p.sub_category}_${p.item_category_id}`;
      productCountMap[key] = Number(p.product_count);
    });

    // ✅ Item categories grouped by subcategory_id
    const itemBySubcategory = {};
    itemcategories.forEach(item => {
      if (!itemBySubcategory[item.subcategory_id]) itemBySubcategory[item.subcategory_id] = [];
      const key = `${item.category_id}_${item.subcategory_id}_${item.id}`;
      itemBySubcategory[item.subcategory_id].push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        file_name: imageMap[item.cat_file_id] || null,
        product_count: productCountMap[key] || 0
      });
    });

    // ✅ Subcategories grouped by category_id
    const subByCategory = {};
    subcategories.forEach(sub => {
      if (!subByCategory[sub.category]) subByCategory[sub.category] = [];
      subByCategory[sub.category].push({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        item_categories: itemBySubcategory[sub.id] || [],
        file_name: imageMap[sub.file_id] || null
      });
    });

    // ✅ Final merge with subcategory limit
    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      file_name: imageMap[cat.cat_file_id] || null,
      subcategories: 6
        ? (subByCategory[cat.id] || []).slice(0, 6)
        : (subByCategory[cat.id] || [])
    }));

    res.json(result);
  } catch (err) {
    console.error('getItemCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};


exports.getItemSubCategories = async (req, res) => {
  try {
    const slug = req.query.slug || null;
    const limit = parseInt(req.query.limit) || 8; // how many subcategories per page
    const page = parseInt(req.query.page) || 1;   // which page
    const offset = (page - 1) * limit;

    // 1️⃣ Fetch category by slug
    const categories = await Categories.findAll({
      where: { slug: slug },
      attributes: ['id', 'name', 'cat_file_id', 'slug'],
      order: [['id', 'ASC']],
      raw: true
    });

    if (!categories.length) {
      return res.json({ message: "Category not found", data: [] });
    }

    const categoryIds = categories.map(c => c.id);

    // 2️⃣ Fetch subcategories (pagination applied)
    const subcategories = await SubCategories.findAll({
      where: { category: categoryIds, is_delete: 0, status: 1 },
      attributes: ['id', 'name', 'category', 'slug', 'file_id'],
      order: [['id', 'ASC']],
      offset: offset,
      limit: limit,
      raw: true
    });

    // 3️⃣ Fetch item categories linked to these subcategories
    const subIds = subcategories.map(s => s.id);

    const itemcategories = await ItemCategory.findAll({
      where: { status: 1, subcategory_id: subIds },
      attributes: ['id', 'name', 'subcategory_id', 'slug', 'file_id'],
      raw: true
    });

    // 4️⃣ Fetch all images
    const uploadImages = await UploadImage.findAll({
      attributes: ['id', 'file'],
      raw: true
    });

    const imageMap = {};
    uploadImages.forEach(img => {
      imageMap[img.id] = img.file;
    });

    // ✅ Item categories grouped by subcategory
    const itemBySubcategory = {};
    itemcategories.forEach(item => {
      if (!itemBySubcategory[item.subcategory_id])
        itemBySubcategory[item.subcategory_id] = [];
      itemBySubcategory[item.subcategory_id].push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        file_name: imageMap[item.file_id] || null
      });
    });

    // ✅ Subcategories grouped by category
    const subByCategory = {};
    subcategories.forEach(sub => {
      if (!subByCategory[sub.category])
        subByCategory[sub.category] = [];
      subByCategory[sub.category].push({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        item_categories: itemBySubcategory[sub.id] || [],
        file_name: imageMap[sub.file_id] || null
      });
    });

    // ✅ Final response
    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      file_name: imageMap[cat.cat_file_id] || null,
      subcategories: subByCategory[cat.id] || []
    }));

    // ✅ Total subcategory count for frontend “Load More” logic
    const totalSubcategories = await SubCategories.count({
      where: { category: categoryIds, is_delete: 0, status: 1 }
    });

    res.json({
      category: result[0],
      pagination: {
        total: totalSubcategories,
        page,
        limit,
        hasMore: offset + limit < totalSubcategories
      }
    });

  } catch (err) {
    console.error('getItemCategories error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCategory = async (req, res) => {
  try {
    const slug = req.query.slug || null;
    const limit = parseInt(req.query.limit) || 8;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // 1️⃣ Find subcategory
    const subcategory = await SubCategories.findOne({
      where: { slug, is_delete: 0, status: 1 },
      attributes: ["id", "name", "category", "slug"],
      include: [
        {
          model: Categories,
          as: "Categories",
          attributes: ["id", "name", "slug"],
        },
      ],
      raw: true,
      nest: true,
    });

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // 2️⃣ Fetch paginated item categories
    const { count: totalItems, rows: itemcategories } =
      await ItemCategory.findAndCountAll({
        where: { status: 1, subcategory_id: subcategory.id },
        attributes: ["id", "name", "subcategory_id", "slug", "file_id"],
        offset,
        limit,
        raw: true,
      });

    // 3️⃣ Fetch all images
    const uploadImages = await UploadImage.findAll({
      attributes: ["id", "file"],
      raw: true,
    });

    const imageMap = {};
    uploadImages.forEach((img) => {
      imageMap[img.id] = img.file;
    });

    // 4️⃣ Fetch item subcategories
    const itemData = await ItemSubCategory.findAll({
      attributes: ["id", "name", "slug", "file_id", "item_category_id"],
      where: { status: 1 },
      raw: true,
    });

    // ✅ 5️⃣ CORRECT product count query (SCOPED)
    const productCounts = await Products.findAll({
      attributes: [
        "item_category_id",
        "item_subcategory_id",
        [sequelize.fn("COUNT", sequelize.col("product_id")), "count"],
      ],
      where: {
        status: 1,
        is_delete: 0,
        category: subcategory.category,   // 🔥 IMPORTANT
        sub_category: subcategory.id,     // 🔥 IMPORTANT
      },
      group: ["item_category_id", "item_subcategory_id"],
      raw: true,
    });

    // 6️⃣ Build count maps
    const itemCategoryCountMap = {};
    const itemSubcategoryCountMap = {};

    productCounts.forEach((row) => {
      const count = Number(row.count);

      itemCategoryCountMap[row.item_category_id] =
        (itemCategoryCountMap[row.item_category_id] || 0) + count;

      itemSubcategoryCountMap[row.item_subcategory_id] = count;
    });

    // 7️⃣ Group items by item_category_id
    const itemsByCategory = {};
    itemData.forEach((itm) => {
      if (!itemsByCategory[itm.item_category_id]) {
        itemsByCategory[itm.item_category_id] = [];
      }

      itemsByCategory[itm.item_category_id].push({
        id: itm.id,
        name: itm.name,
        slug: itm.slug,
        file_name: imageMap[itm.file_id] || null,
        product_count: itemSubcategoryCountMap[itm.id] || 0, // ✅ EXACT COUNT
      });
    });

    // 8️⃣ Build final response
    const items = itemcategories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      file_name: imageMap[item.file_id] || null,
      product_count: itemCategoryCountMap[item.id] || 0,
      items: itemsByCategory[item.id] || [],
    }));

    // 9️⃣ Send response
    res.json({
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        product_count:
          Object.values(itemCategoryCountMap).reduce((a, b) => a + b, 0),
        category: {
          id: subcategory.Categories.id,
          name: subcategory.Categories.name,
          slug: subcategory.Categories.slug,
        },
        item_categories: items,
      },
      pagination: {
        total: totalItems,
        page,
        limit,
        hasMore: offset + limit < totalItems,
      },
    });
  } catch (err) {
    console.error("getItemCategory error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItemSubcategory = async (req, res) => {
  try {
    const slug = req.query.slug || null;
    const limit = parseInt(req.query.limit) || 8;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // 1️⃣ Find subcategory
    const subcategory = await ItemCategory.findOne({
      where: { slug: slug, status: 1 },
      attributes: ["id", "name", "slug"],
      include: [
        {
          model: Categories,
          as: "Categories",
          attributes: ["id", "name", "slug"],
        },
        {
          model: SubCategories,
          as: "SubCategories",
          attributes: ["id", "name", "slug"],
        }
      ],
      raw: true,
      nest: true
    });

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // 2️⃣ Fetch paginated item categories
    const { count: totalItems, rows: itemcategories } = await ItemSubCategory.findAndCountAll({
      where: { status: 1, item_category_id: subcategory.id },
      attributes: ["id", "name", "subcategory_id", "slug", "file_id"],
      offset,
      limit,
      raw: true,
    });

    // 3️⃣ Fetch all images
    const uploadImages = await UploadImage.findAll({
      attributes: ["id", "file"],
      raw: true,
    });
    const imageMap = {};
    uploadImages.forEach((img) => (imageMap[img.id] = img.file));

    // 4️⃣ Fetch items
    const itemData = await Items.findAll({
      attributes: ["id", "name", "slug", "file_id", "item_category_id"],
      where: { status: 1 },
      raw: true,
    });

    // 5️⃣ Fetch real product count from products table
    const productCounts = await Products.findAll({
      attributes: [
        "item_id",
        [sequelize.fn("COUNT", sequelize.col("product_id")), "product_count"],
      ],
      where: { status: 1 },
      group: ["item_id"],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach((row) => {
      productCountMap[row.item_id] = row.product_count;
    });

    // 6️⃣ Group items by item_category_id
    const itemsByCategory = {};
    itemData.forEach((itm) => {
      if (!itemsByCategory[itm.item_category_id]) {
        itemsByCategory[itm.item_category_id] = [];
      }
      itemsByCategory[itm.item_category_id].push({
        id: itm.id,
        name: itm.name,
        slug: itm.slug,
        file_name: imageMap[itm.file_id] || null,
        product_count: productCountMap[itm.id] || 0, // ✅ Real product count
      });
    });

    // 7️⃣ Final list
    const items = itemcategories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      file_name: imageMap[item.file_id] || null,
      product_count: (itemsByCategory[item.id] || []).length,
      items: itemsByCategory[item.id] || [],
    }));

    // 8️⃣ Response
    res.json({
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        category: {
          id: subcategory.Categories.id,
          name: subcategory.Categories.name,
          slug: subcategory.Categories.slug
        },

        sub_category: {
          id: subcategory.SubCategories.id,
          name: subcategory.SubCategories.name,
          slug: subcategory.SubCategories.slug
        },
        item_categories: items,
      },
      pagination: {
        total: totalItems,
        page,
        limit,
        hasMore: offset + limit < totalItems,
      },
    });
  } catch (err) {
    console.error("getItemCategory error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getItem = async (req, res) => {
  try {
    const slug = req.query.slug || null;
    const limit = parseInt(req.query.limit) || 8;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // 1️⃣ Find subcategory
    const subcategory = await SubCategories.findOne({
      where: { slug: slug, is_delete: 0, status: 1 },
      attributes: ["id", "name", "category", "slug"],
      raw: true,
    });

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // 2️⃣ Fetch paginated item categories
    const { count: totalItems, rows: itemcategories } = await ItemCategory.findAndCountAll({
      where: { status: 1, subcategory_id: subcategory.id },
      attributes: ["id", "name", "subcategory_id", "slug", "file_id"],
      offset,
      limit,
      raw: true,
    });

    // 3️⃣ Fetch all images
    const uploadImages = await UploadImage.findAll({
      attributes: ["id", "file"],
      raw: true,
    });
    const imageMap = {};
    uploadImages.forEach((img) => (imageMap[img.id] = img.file));

    // 4️⃣ Fetch items
    const itemData = await Items.findAll({
      attributes: ["id", "name", "slug", "file_id", "item_category_id"],
      where: { status: 1 },
      raw: true,
    });

    // 5️⃣ Fetch real product count from products table
    const productCounts = await Products.findAll({
      attributes: [
        "item_id",
        [sequelize.fn("COUNT", sequelize.col("product_id")), "product_count"],
      ],
      where: { status: 1 },
      group: ["item_id"],
      raw: true,
    });

    const productCountMap = {};
    productCounts.forEach((row) => {
      productCountMap[row.item_id] = row.product_count;
    });

    // 6️⃣ Group items by item_category_id
    const itemsByCategory = {};
    itemData.forEach((itm) => {
      if (!itemsByCategory[itm.item_category_id]) {
        itemsByCategory[itm.item_category_id] = [];
      }
      itemsByCategory[itm.item_category_id].push({
        id: itm.id,
        name: itm.name,
        slug: itm.slug,
        file_name: imageMap[itm.file_id] || null,
        product_count: productCountMap[itm.id] || 0, // ✅ Real product count
      });
    });

    // 7️⃣ Final list
    const items = itemcategories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      file_name: imageMap[item.file_id] || null,
      product_count: (itemsByCategory[item.id] || []).length,
      items: itemsByCategory[item.id] || [],
    }));

    // 8️⃣ Response
    res.json({
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        item_categories: items,
      },
      pagination: {
        total: totalItems,
        page,
        limit,
        hasMore: offset + limit < totalItems,
      },
    });
  } catch (err) {
    console.error("getItemCategory error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoryProductGraph = async (req, res) => {
  try {
    // Fetch active categories
    const categories = await Categories.findAll({
      attributes: ['id', 'name'],
      where: { is_delete: 0, status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    if (!categories.length) return res.json({ labels: [], datasets: [] });

    // Product counts for approved products
    const approvedCounts = await Products.findAll({
      attributes: ['category', [fn('COUNT', col('product_id')), 'count']],
      where: { is_delete: 0, is_approve: 1 },
      group: ['category'],
      raw: true,
    });

    // Product counts for unapproved products
    const unapprovedCounts = await Products.findAll({
      attributes: ['category', [fn('COUNT', col('product_id')), 'count']],
      where: { is_delete: 0, is_approve: 0 },
      group: ['category'],
      raw: true,
    });

    // Map counts
    const approvedMap = {};
    approvedCounts.forEach(p => {
      approvedMap[p.category] = Number(p.count);
    });

    const unapprovedMap = {};
    unapprovedCounts.forEach(p => {
      unapprovedMap[p.category] = Number(p.count);
    });

    // Prepare bar graph data
    const barGraph = {
      labels: [],
      datasets: [
        {
          label: 'Approved',
          data: [],
          backgroundColor: '#4CAF50', // Green
        },
        {
          label: 'Unapproved',
          data: [],
          backgroundColor: '#FF5722', // Orange
        },
      ],
    };

    categories.forEach(cat => {
      barGraph.labels.push(cat.name);
      barGraph.datasets[0].data.push(approvedMap[cat.id] || 0);
      barGraph.datasets[1].data.push(unapprovedMap[cat.id] || 0);
    });

    res.json(barGraph);
  } catch (error) {
    console.error('getCategoryProductGraph error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSellerCategoryBarGraph = async (req, res) => {
  try {
    const categories = await Categories.findAll({
      attributes: ['id', 'name'],
      where: { is_delete: 0, status: 1 },
      order: [['id', 'ASC']],
      raw: true,
    });

    // count DISTINCT users per category
    const counts = await SellerCategory.findAll({
      attributes: [
        'category_id',
        [fn('COUNT', literal('DISTINCT user_id')), 'count'],
      ],
      group: ['category_id'],
      raw: true,
    });

    const countMap = {};
    counts.forEach(c => {
      countMap[c.category_id] = Number(c.count);
    });

    res.json({
      labels: categories.map(c => c.name),
      datasets: [
        {
          label: 'Sellers',
          data: categories.map(c => countMap[c.id] || 0),
          backgroundColor: '#0d6efd',
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};