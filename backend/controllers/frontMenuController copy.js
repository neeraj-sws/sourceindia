const Sequelize = require('sequelize');
const { Op, fn, col } = Sequelize;
const FrontMenu = require('../models/FrontMenu');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Products = require('../models/Products');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const SellerCategory = require('../models/SellerCategory');

exports.createFrontMenu = async (req, res) => {
  try {
    const { parent_id, name, link, is_show, status, type, position } = req.body;
    const frontMenu = await FrontMenu.create({ parent_id, name, link, is_show, status, type, position });
    res.status(201).json({ message: 'Front menu created', frontMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchProducts = async (q) => {
  /* -------------------------------
   1️⃣ PRODUCT NAME MATCH (MAX 3)
  --------------------------------*/
  const productMatches = await Products.findAll({
    where: {
      title: { [Op.like]: `%${q}%` },
    },
    attributes: [
      "id",
      ["title", "name"],
      "slug",
    ],
    limit: 3,
    raw: true,
  });

  const excludeIds = productMatches.map((p) => p.id);

  /* -------------------------------
   2️⃣ UNIQUE CATEGORY MATCH
  --------------------------------*/
  const categoryMatches = await ItemCategory.findAll({
    where: {
      name: { [Op.like]: `%${q}%` },
    },
    attributes: ["id", "name"],
    group: ["item_category_id"],
    limit: 5,
    raw: true,
  });

  /* -------------------------------
   3️⃣ UNIQUE SUBCATEGORY MATCH
  --------------------------------*/
  const subCategoryMatches = await ItemSubCategory.findAll({
    where: {
      name: { [Op.like]: `%${q}%` },
    },
    attributes: ["id", "name"],
    group: ["item_subcategory_id"],
    limit: 5,
    raw: true,
  });

  /* -------------------------------
   4️⃣ MERGED RESPONSE (ORDER FIXED)
  --------------------------------*/
  return [
    // 🔹 Products first
    ...productMatches.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: "product",
    })),

    // 🔹 Categories
    ...categoryMatches.map((c) => ({
      id: c.id,
      name: c.name,
      type: "category",
    })),

    // 🔹 Subcategories
    ...subCategoryMatches.map((s) => ({
      id: s.id,
      name: s.name,
      type: "subcategory",
    })),
  ];
};

const searchSellers = async (q) => {
  const users = await Users.findAll({
    attributes: ["id"],

    include: [
      {
        model: CompanyInfo,
        as: "company_info",
        required: true,
        attributes: ["id", "organization_name", "organization_slug"],
      },
    ],

    where: {
      is_seller: 1,
      [Op.or]: [
        // 🔹 company name
        { "$company_info.organization_name$": { [Op.like]: `%${q}%` } },

        // 🔹 category match (CSV)
        Sequelize.literal(`
          EXISTS (
            SELECT 1
            FROM categories c
            WHERE
              c.name LIKE '%${q}%'
              AND FIND_IN_SET(c.category_id, company_info.category_sell)
          )
        `),

        // 🔹 subcategory match (CSV)
        Sequelize.literal(`
          EXISTS (
            SELECT 1
            FROM sub_categories sc
            WHERE
              sc.name LIKE '%${q}%'
              AND FIND_IN_SET(sc.sub_category_id, company_info.sub_category)
          )
        `),
      ],
    },

    order: [
      [
        Sequelize.literal(`
          CASE
            WHEN company_info.organization_name LIKE '%${q}%' THEN 1
            WHEN EXISTS (
              SELECT 1 FROM categories c
              WHERE c.name LIKE '%${q}%'
              AND FIND_IN_SET(c.category_id, company_info.category_sell)
            ) THEN 2
            WHEN EXISTS (
              SELECT 1 FROM sub_categories sc
              WHERE sc.name LIKE '%${q}%'
              AND FIND_IN_SET(sc.sub_category_id, company_info.sub_category)
            ) THEN 3
            ELSE 4
          END
        `),
        "ASC",
      ],
    ],

    limit: 20,
    subQuery: false,
  });

  /* ---------- RESULT SHAPING ---------- */

  const companies = [];

  for (const u of users) {
    const company = u.company_info;

    if (
      company.organization_name
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      companies.length < 3
    ) {
      companies.push({
        id: company.id,
        name: company.organization_name,
        slug: company.organization_slug,
        type: "company",
      });
    }
  }

  /* ---------- CATEGORY (MODEL ONLY) ---------- */
  const matchedCategories = await Categories.findAll({
    where: { name: { [Op.like]: `%${q}%` } },
    attributes: [["category_id", "id"], "name"],
    limit: 5,
    raw: true,
  });

  /* ---------- SUBCATEGORY (MODEL ONLY) ---------- */
  const matchedSubCategories = await SubCategories.findAll({
    where: { name: { [Op.like]: `%${q}%` } },
    attributes: [["sub_category_id", "id"], "name"],
    limit: 5,
    raw: true,
  });

  return [
    ...companies,
    ...matchedCategories.map((c) => ({ ...c, type: "category" })),
    ...matchedSubCategories.map((s) => ({ ...s, type: "subcategory" })),
  ];
};

const searchBuyers = async (q) => {

  /* -------------------------------
   1️⃣ BUYER COMPANY NAME (MAX 3)
  --------------------------------*/
  const companyMatches = await Users.findAll({
    where: { is_seller: 0 },
    include: [
      {
        model: CompanyInfo,
        as: "company_info",
        required: true,
        where: {
          organization_name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "organization_name", "organization_slug"],
      },
    ],
    limit: 3,
  });

  const companies = companyMatches.map((u) => ({
    id: u.company_info.id,
    name: u.company_info.organization_name,
    slug: u.company_info.organization_slug,
    type: "buyer",
  }));


  /* -------------------------------
   2️⃣ CATEGORY MATCH (Buyer → SellerCategory)
  --------------------------------*/
  const categoryMatches = await SellerCategory.findAll({
    include: [
      {
        model: Categories,
        as: "category",
        where: {
          name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "name"],
      },
    ],
    attributes: [],
    group: ["category.id"],
    limit: 5,
    raw: true,
  });

  const categories = categoryMatches.map((c) => ({
    id: c["category.id"],
    name: c["category.name"],
    type: "category",
  }));


  /* -------------------------------
   3️⃣ SUBCATEGORY MATCH
  --------------------------------*/
  const subCategoryMatches = await SellerCategory.findAll({
    include: [
      {
        model: SubCategories,
        as: "subcategory",
        where: {
          name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "name"],
      },
    ],
    attributes: [],
    group: ["subcategory.id"],
    limit: 5,
    raw: true,
  });

  const subcategories = subCategoryMatches.map((s) => ({
    id: s["subcategory.id"],
    name: s["subcategory.name"],
    type: "subcategory",
  }));


  /* -------------------------------
   4️⃣ FINAL MERGED RESPONSE
  --------------------------------*/
  return [
    ...companies,      // 🔹 buyers first
    ...categories,     // 🔹 categories
    ...subcategories,  // 🔹 subcategories
  ];
};


exports.searchMulti = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.length < 2) return res.json([]);

    let results = [];

    switch (type) {
      case "product":
        results = await searchProducts(q);
        break;

      case "seller":
        results = await searchSellers(q);
        break;

      case "buyer":
        results = await searchBuyers(q);
        break;

      default:
        results = [];
    }

    res.json(results);
  } catch (err) {
    console.error("searchMulti error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getAllFrontMenu = async (req, res) => {
  try {
    const { parent_id } = req.query;
    const query = {};
    if (parent_id) {
      query.parent_id = parent_id;
    } else {
      query.parent_id = 0;
    }
    const frontMenu = await FrontMenu.findAll({
      where: query,
      order: [['type', 'ASC'], ['position', 'ASC'],]
    });
    res.json(frontMenu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFrontMenuById = async (req, res) => {
  try {
    const frontMenu = await FrontMenu.findByPk(req.params.id);
    if (!frontMenu) return res.status(404).json({ message: 'Front menu not found' });
    res.json(frontMenu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFrontMenu = async (req, res) => {
  try {
    const { parent_id, name, link, is_show, status, type, position } = req.body;
    const frontMenu = await FrontMenu.findByPk(req.params.id);
    if (!frontMenu) return res.status(404).json({ message: 'Front menu not found' });
    frontMenu.parent_id = parent_id;
    frontMenu.name = name;
    frontMenu.link = link;
    frontMenu.is_show = is_show;
    frontMenu.status = status;
    frontMenu.type = type;
    frontMenu.position = position;
    frontMenu.updated_at = new Date();
    await frontMenu.save();
    res.json({ message: 'Front menu updated', frontMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFrontMenu = async (req, res) => {
  try {
    const frontMenu = await FrontMenu.findByPk(req.params.id);
    if (!frontMenu) return res.status(404).json({ message: 'Front menu not found' });

    await frontMenu.destroy();
    res.json({ message: 'Front menu deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFrontMenuShowStatus = async (req, res) => {
  try {
    const { is_show } = req.body;
    if (is_show !== 0 && is_show !== 1) {
      return res.status(400).json({ message: 'Invalid is_show. Use 1 (yes) or 0 (No).' });
    }
    const frontMenu = await FrontMenu.findByPk(req.params.id);
    if (!frontMenu) return res.status(404).json({ message: 'Faq Category not found' });
    frontMenu.is_show = is_show;
    await frontMenu.save();
    res.json({ message: 'Show status updated', frontMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFrontMenuStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: 'Invalid status. Use 1 (Active) or 0 (Deactive).' });
    }
    const frontMenu = await FrontMenu.findByPk(req.params.id);
    if (!frontMenu) return res.status(404).json({ message: 'Faq Category not found' });
    frontMenu.status = status;
    await frontMenu.save();
    res.json({ message: 'Status updated', frontMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChildMenus = async (req, res) => {
  try {
    const { parentId } = req.params;
    const childMenus = await FrontMenu.findAll({ where: { parent_id: parentId } });
    res.status(200).json(childMenus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFrontMenuServerSide = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sort = 'DESC',
    } = req.query;
    const validColumns = ['id', 'parent_id', 'name', 'link', 'is_show', 'status', 'type', 'created_at', 'updated_at'];
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
        { name: { [Op.like]: `%${search}%` } },
        { link: { [Op.like]: `%${search}%` } },
      ];
    }
    const totalRecords = await FrontMenu.count();
    const { count: filteredRecords, rows } = await FrontMenu.findAndCountAll({
      where,
      order,
      limit: limitValue,
      offset,
      include: [],
    });
    const mappedRows = rows.map(row => ({
      id: row.id,
      parent_id: row.parent_id,
      name: row.name,
      link: row.link,
      is_show: row.is_show,
      status: row.status,
      type: row.type,
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

exports.getFrontMenuCount = async (req, res) => {
  try {
    const headerCount = await FrontMenu.count({
      where: { type: 1, parent_id: 0 }
    });
    const footerCount = await FrontMenu.count({
      where: { type: 2, parent_id: 0 }
    });
    res.json({ headerCount, footerCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

