const Products = require('../models/Products');
const ItemCategory = require('../models/ItemCategory');
const ItemSubCategory = require('../models/ItemSubCategory');
const Items = require('../models/Items');
const ProductKeyword = require('../models/ProductKeyword');

const COMPLETENESS_WEIGHT = 0.35;
const TAXONOMY_WEIGHT = 0.40;
const ACCURACY_WEIGHT = 0.25;

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

async function loadTaxonomy() {
  const [itemCategories, itemSubCategories, items, keywords] = await Promise.all([
    ItemCategory.findAll({ where: { is_delete: 0 }, attributes: ['id'], raw: true }),
    ItemSubCategory.findAll({ where: { is_delete: 0 }, attributes: ['id', 'item_category_id'], raw: true }),
    Items.findAll({ where: { is_delete: 0 }, attributes: ['id', 'item_category_id', 'item_sub_category_id'], raw: true }),
    ProductKeyword.findAll({ where: { status: 1 }, attributes: ['product_keyword_id', 'item_subcategory_id'], raw: true }),
  ]);

  const subToCat = {};
  itemSubCategories.forEach(s => { subToCat[s.id] = s.item_category_id; });
  const itemCatOfSub = {}; itemSubCategories.forEach(s => { itemCatOfSub[s.id] = s.item_category_id; });
  const itemToItemCat = {}; items.forEach(i => { itemToItemCat[i.id] = i.item_category_id; });
  const itemToItemSub = {}; items.forEach(i => { itemToItemSub[i.id] = i.item_sub_category_id; });
  const kwToSub = {}; keywords.forEach(k => { kwToSub[k.product_keyword_id] = k.item_subcategory_id; });

  return { subToCat, itemToItemCat, itemToItemSub, kwToSub };
}

function scoreCompleteness(p) {
  const checks = [
    { pass: hasValue(p.title) && String(p.title).trim().length >= 3, name: 'title' },
    { pass: hasValue(p.short_description) && String(p.short_description).trim().length >= 15, name: 'short_description' },
    { pass: !hasValue(p.description) || String(p.description).trim().length >= 15, name: 'description' },
    { pass: hasValue(p.file_ids) && String(p.file_ids).trim().length > 0, name: 'images' },
    { pass: p.quantity === null || p.quantity === undefined || parseInt(p.quantity) > 0, name: 'quantity' },
    { pass: hasValue(p.code) || hasValue(p.article_number), name: 'code_or_article_number' },
  ];
  const passed = checks.filter(c => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100), checks, passed, total: checks.length };
}

function scoreTaxonomy(p, tax) {
  const checks = [
    {
      pass: p.category !== null && p.category !== undefined && parseInt(p.category) !== 0,
      name: 'category',
    },
    { pass: p.item_category_id !== null && p.item_category_id !== undefined, name: 'item_category' },
    { pass: p.item_subcategory_id !== null && p.item_subcategory_id !== undefined, name: 'item_subcategory' },
    { pass: p.keyword_id !== null && p.keyword_id !== undefined && tax.kwToSub[p.keyword_id], name: 'keyword' },
    {
      pass: hasValue(p.item_subcategory_id) && tax.subToCat[p.item_subcategory_id] === p.item_category_id,
      name: 'subcategory_matches_item_category',
    },
    {
      pass: hasValue(p.keyword_id) && hasValue(p.item_subcategory_id) && tax.kwToSub[p.keyword_id] === p.item_subcategory_id,
      name: 'keyword_matches_subcategory',
    },
    {
      pass: !hasValue(p.item_id) || (tax.itemToItemCat[p.item_id] === p.item_category_id && tax.itemToItemSub[p.item_id] === p.item_subcategory_id),
      name: 'item_matches_taxonomy',
    },
  ];
  const passed = checks.filter(c => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100), checks, passed, total: checks.length };
}

function scoreAccuracy(p) {
  const title = hasValue(p.title) ? String(p.title).trim() : '';
  const shortDesc = hasValue(p.short_description) ? String(p.short_description).trim() : '';
  const checks = [
    { pass: parseInt(p.status) === 1, name: 'public' },
    { pass: parseInt(p.is_approve) === 1, name: 'admin_approved' },
    { pass: title.length >= 5, name: 'title_meaningful' },
    { pass: shortDesc !== title && shortDesc.length > 0, name: 'description_not_duplicate' },
  ];
  const passed = checks.filter(c => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100), checks, passed, total: checks.length };
}

async function computeProductQualityScore(sellerId) {
  const products = await Products.findAll({
    where: { user_id: sellerId, is_delete: 0, status: 1 },
    raw: true,
  });

  if (!products.length) {
    return {
      level: 'insufficient',
      score: null,
      product_count: 0,
      reviewed_count: 0,
      breakdown: { completeness: null, taxonomy: null, accuracy: null },
      reasons: ['No public product listing found — insufficient data to evaluate product listing quality'],
    };
  }

  const tax = await loadTaxonomy();
  let completenessSum = 0, taxonomySum = 0, accuracySum = 0;
  const reviewed = [];

  products.forEach(p => {
    const c = scoreCompleteness(p);
    const t = scoreTaxonomy(p, tax);
    const a = scoreAccuracy(p);
    completenessSum += c.score;
    taxonomySum += t.score;
    accuracySum += a.score;
    reviewed.push({ product_id: p.product_id, title: p.title, completeness: c.score, taxonomy: t.score, accuracy: a.score });
  });

  const completeness = Math.round(completenessSum / products.length);
  const taxonomy = Math.round(taxonomySum / products.length);
  const accuracy = Math.round(accuracySum / products.length);
  const score = Math.round(
    (completeness * COMPLETENESS_WEIGHT + taxonomy * TAXONOMY_WEIGHT + accuracy * ACCURACY_WEIGHT) * 100
  ) / 100;

  const reasons = [];
  if (completeness < 100) reasons.push(`Some listings miss required details (title/short description/images/quantity)`);
  if (taxonomy < 100) reasons.push(`One or more listings have incomplete/wrong category or item taxonomy links`);
  if (accuracy < 100) reasons.push(`One or more listings are not admin-approved or have duplicate/placeholder text`);
  if (!reasons.length) reasons.push('All reviewed listings are complete, correctly categorized and approved');

  return {
    level: 'complete',
    score,
    product_count: products.length,
    reviewed_count: products.length,
    breakdown: { completeness, taxonomy, accuracy },
    reasons,
    reviewed,
  };
}

module.exports = { computeProductQualityScore };