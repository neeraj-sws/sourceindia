const Sequelize = require('sequelize');
const { Op, fn, col } = Sequelize;
const FrontMenu = require('../models/FrontMenu');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const { ItemCategory, ItemSubCategory } = require('../models');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const SellerCategory = require('../models/SellerCategory');
const BuyerSourcingInterests = require('../models/BuyerSourcingInterests');
const { fetchWeightedProductKeywordSuggestions } = require('../utils/productSuggest');
const { prepareSearchQuery, normalize } = require('../utils/searchEngine');
const sequelize = require('../config/database');

exports.createFrontMenu = async (req, res) => {
  try {
    const { parent_id, name, link, is_show, status, type, position } = req.body;
    const frontMenu = await FrontMenu.create({ parent_id, name, link, is_show, status, type, position });
    res.status(201).json({ message: 'Front menu created', frontMenu });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Keyword suggestions for every way of reading the query (as typed, spelling-corrected, synonyms),
// the typed query's own results first; then products matched by title, part number or brand.
const searchProducts = async (q, type) => {
  const prepared = await prepareSearchQuery(q);
  const typed = [];
  const fromVariants = [];
  const seenKeywordIds = new Set();
  for (const [index, variant] of prepared.variants.entries()) {
    if (fromVariants.length >= 6) break;
    const { suggestions } = await fetchWeightedProductKeywordSuggestions({
      query: variant,
      only_with_products: true,
      header_strict: true,
      limit: 6,
    });
    suggestions.forEach((item) => {
      if (seenKeywordIds.has(item.id)) return;
      // A spelling fix or synonym must match all its words, or it only adds noise.
      if (index > 0 && !item.full_query_match) return;
      seenKeywordIds.add(item.id);
      (index === 0 ? typed : fromVariants).push(item);
    });
  }
  // When the typed text has no full match ("switch mode power supply"), the synonym's full
  // matches ("SMPS") lead; otherwise the typed results keep their place first.
  const typedHasFullMatch = typed.some((item) => item.full_query_match);
  const keywords = (typedHasFullMatch || !fromVariants.length ? [...typed, ...fromVariants] : [...fromVariants, ...typed]).slice(0, 6);

  const keywordItems = keywords.map((item) => ({
    id: item.id,
    keyword_id: item.id,
    category_id: item.category || 0,
    subcategory_id: item.sub_category || 0,
    item_category_id: item.item_category_id || 0,
    item_subcategory_id: item.item_subcategory_id || 0,
    name: item.title,
    type: 'keyword',
    search_type: type,
  }));

  const productItems = await searchProductMatches(prepared, keywordItems.length, type);
  return [...keywordItems, ...productItems];
};

const LIVE_PRODUCT_SQL = `p.is_delete = 0 AND p.status = 1 AND p.is_approve = 1
  AND EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.user_id AND u.status = 1 AND u.is_approve = 1 AND u.is_delete = 0)`;

// Products whose title, part number (code / article number) or brand (company) matches.
// Shown for part-number searches, or when few keywords matched.
const searchProductMatches = async (prepared, keywordCount, type) => {
  const partNumbers = prepared.tokens.filter((token) => /\d/.test(token) && token.length >= 3);
  if (!partNumbers.length && keywordCount >= 3) return [];
  const limit = partNumbers.length ? 6 : Math.max(2, 6 - keywordCount);

  const phrases = prepared.variants.map(normalize).filter((phrase) => phrase.length >= 3);
  const replacements = {};
  const titleOr = [];
  phrases.forEach((phrase, i) => {
    replacements[`ph${i}`] = `%${phrase}%`;
    titleOr.push(`p.title LIKE :ph${i}`);
  });
  partNumbers.forEach((token, i) => {
    replacements[`pn${i}`] = `%${token}%`;
    titleOr.push(`p.title LIKE :pn${i}`, `p.code LIKE :pn${i}`, `p.article_number LIKE :pn${i}`);
  });
  if (!titleOr.length) return [];

  const run = (conditions, extraReplacements = {}) => sequelize.query(
    `SELECT p.product_id AS id, p.title, p.slug FROM products p
     WHERE ${LIVE_PRODUCT_SQL} AND (${conditions.join(' OR ')})
     ORDER BY (p.title LIKE :prefix) DESC, CHAR_LENGTH(p.title) ASC
     LIMIT ${limit}`,
    {
      replacements: { ...replacements, ...extraReplacements, prefix: `${phrases[0] || ''}%` },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  let rows = await run(titleOr);
  // Nothing by title: try the brand (company name) and the short description.
  if (!rows.length && !keywordCount) {
    const extra = [];
    const extraReplacements = {};
    phrases.filter((phrase) => phrase.length >= 4).forEach((phrase, i) => {
      extraReplacements[`bd${i}`] = `%${phrase}%`;
      extra.push(
        `p.short_description LIKE :bd${i}`,
        `p.company_id IN (SELECT ci.company_id FROM company_info ci WHERE ci.is_delete = 0 AND ci.organization_name LIKE :bd${i})`
      );
    });
    if (extra.length) rows = await run(extra, extraReplacements);
  }

  return rows.map((row) => ({
    id: row.id,
    product_id: row.id,
    category_id: 0,
    subcategory_id: 0,
    item_category_id: 0,
    item_subcategory_id: 0,
    name: row.title,
    slug: row.slug,
    type: 'product',
    search_type: type,
  }));
};

const searchSellers = async (q, type) => {

  const companyMatches = await Users.findAll({
    where: { is_seller: 1, status: 1, is_delete: 0, is_approve: 1 },
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
    category_id: 0,
    subcategory_id: 0,
    item_category_id: 0,
    item_subcategory_id: 0,
    name: u.company_info.organization_name,
    slug: u.company_info.organization_slug,
    type: "seller",
    search_type: type
  }));

  const categoryMatches = await SellerCategory.findAll({
    include: [
      {
        model: Categories,
        as: "category",
        where: {
          name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "name", "category_id"],
      },
    ],
    attributes: [],
    group: ["category.category_id"],
    limit: 5,
    raw: true,
  });

  const categories = categoryMatches.map((c) => ({
    id: c["category.id"],
    name: c["category.name"],
    type: "category",
    search_type: type,
    category_id: c["category.category_id"],
    subcategory_id: 0,
    item_category_id: 0,
    item_subcategory_id: 0,
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
        attributes: ["id", "name", "category"],
      },
    ],
    attributes: [],
    group: ["subcategory.sub_category_id"],
    limit: 5,
    raw: true,
  });

  const subcategories = subCategoryMatches.map((s) => ({
    id: s["subcategory.id"],
    name: s["subcategory.name"],
    type: "subcategory",
    search_type: type,
    category_id: s["subcategory.category"],
    subcategory_id: s["subcategory.id"],
    item_category_id: 0,
    item_subcategory_id: 0,
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

const searchBuyers = async (q, type) => {

  const companyMatches = await Users.findAll({
    where: { is_seller: 0, status: 1, is_delete: 0 },
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
    search_type: type,
    category_id: 0,
    subcategory_id: 0,
    item_category_id: 0,
    item_subcategory_id: 0,
  }));

  const categoryMatches = await BuyerSourcingInterests.findAll({
    include: [
      {
        model: ItemCategory,
        as: "category",
        where: {
          name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "name", "category_id", "subcategory_id"],
      },
    ],
    attributes: [],
    group: ["category.item_category_id"],
    limit: 5,
    raw: true,
  });

  const categories = categoryMatches.map((c) => ({
    id: c["category.id"],
    name: c["category.name"],
    type: "category",
    search_type: type,
    category_id: c["category.category_id"],
    subcategory_id: c["category.subcategory_id"],
    item_category_id: c["category.id"],
    item_subcategory_id: 0,
  }));


  /* -------------------------------
   3️⃣ SUBCATEGORY MATCH
  --------------------------------*/
  const subCategoryMatches = await BuyerSourcingInterests.findAll({
    include: [
      {
        model: ItemSubCategory,
        as: "subcategory",
        where: {
          name: { [Op.like]: `%${q}%` },
        },
        attributes: ["id", "name", "category_id", "subcategory_id", 'item_category_id'],
      },
    ],
    attributes: [],
    group: ["subcategory.item_subcategory_id"],
    limit: 5,
    raw: true,
  });

  const subcategories = subCategoryMatches.map((s) => ({
    id: s["subcategory.id"],
    name: s["subcategory.name"],
    type: "subcategory",
    search_type: type,
    category_id: s["subcategory.category_id"],
    subcategory_id: s["subcategory.subcategory_id"],
    item_category_id: s["subcategory.item_category_id"],
    item_subcategory_id: s["subcategory.id"],
  }));


  /* -------------------------------
   4️⃣ FINAL MERGED RESPONSE
  --------------------------------*/
  return [
    ...companies,      // 🔹 buyers first
    // ...categories,     // 🔹 categories
    // ...subcategories,  // 🔹 subcategories
  ];
};

const buildUrlParams = (item) => {
  return Object.entries({
    category_id: item.category_id,
    subcategory_id: item.subcategory_id,
    item_category_id: item.item_category_id,
  })
    .filter(([_, v]) => v && v !== 0)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
};

exports.searchMulti = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.length < 2) return res.json([]);

    let results = [];

    switch (type) {
      case "product":
        results = await searchProducts(q, type);
        break;

      case "seller":
        results = await searchSellers(q, type);
        break;

      case "buyer":
        results = await searchBuyers(q, type);
        break;

      default:
        results = [];
    }


    const finalResults = results.map(item => {
      let url = "";

      if (item.search_type === "product") {
        if (item.type === "product") {
          url = `/products/${item.slug}`;
        } else {
          const qs = buildUrlParams(item);
          url = qs ? `/products?${qs}` : `/products`;
        }
      }

      if (item.search_type === "seller" || item.search_type === "buyer") {
        if (item.type === "buyer" || item.type === "seller") {
          url = `/companies/${item.slug}`;
        } else {
          const qs = buildUrlParams(item);
          url = qs ? `/company-list?${qs}` : `/company-list`;
        }
      }

      return {
        ...item,
        url,
      };
    });

    res.json(finalResults);

  } catch (err) {
    console.error("searchMulti error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFrontMenu = async (req, res) => {
  try {
    // 1. Fetch ALL menus
    const menus = await FrontMenu.findAll({
      order: [
        ['type', 'ASC'],
        ['position', 'ASC'],
      ],
      raw: true,
    });
    // 2. Create a map for quick lookup
    const menuMap = {};
    menus.forEach(menu => {
      menu.sub_menu = [];
      menuMap[menu.id] = menu;
    });

    // 3. Build hierarchy
    const finalMenu = [];
    menus.forEach(menu => {
      if (menu.parent_id === 0) {
        finalMenu.push(menu);
      } else if (menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].sub_menu.push(menu);
      }
    });

    res.json(finalMenu);
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


