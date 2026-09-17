const { Op, literal } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Products = require('../models/Products');
const SellerCategory = require('../models/SellerCategory');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const SellerPerformance = require('../models/SellerPerformance');

const PRODUCT_MATCH_SCORES = {
  product_keyword: 100,
  item_subcategory: 80,
  item_category: 60,
  subcategory: 40,
  category: 20,
};

// Candidate pool: ONLY sellers who actually have the required product.
// A seller is a candidate only when they hold an active/approved product tagged
// with the requirement's product_keyword_id. Subcategory/category members are
// NOT considered "having the product" - the system must never suggest or assign
// a seller who does not have the particular required product.
async function findEligibleSellers(requirement, candidatePoolSize) {
  if (!requirement.product_keyword_id) return [];

  const assignedSellerIds = await RequirementAssignments.findAll({
    where: {
      requirement_id: requirement.id,
      status: { [Op.in]: [0, 1, 2, 3, 4, 5, 6] },
    },
    attributes: ['seller_id'],
    raw: true,
  }).then(rows => rows.map(r => r.seller_id));

  const levelChain = [
    { level: 'product_keyword', score: 100, field: 'keyword_id', value: requirement.product_keyword_id },
  ].filter((l) => l.value != null);

  for (const level of levelChain) {
    const matchingProducts = await Products.findAll({
      where: {
        [level.field]: level.value,
        status: 1,
        is_approve: 1,
        is_delete: 0,
      },
      attributes: ['user_id'],
      raw: true,
    });
    const productUserIds = [...new Set(matchingProducts.map(p => p.user_id))];
    if (productUserIds.length === 0) continue;

    const sellers = await Users.findAll({
      where: {
        id: { [Op.in]: productUserIds },
        is_seller: 1,
        status: 1,
        is_approve: 1,
        is_delete: 0,
        is_complete: 1,
      },
      attributes: ['id'],
      raw: true,
    });

    const allCandidates = [];
    const seenSellerIds = new Set();
    for (const seller of sellers) {
      if (!seenSellerIds.has(seller.id) && !assignedSellerIds.includes(seller.id)) {
        seenSellerIds.add(seller.id);
        allCandidates.push({
          seller_id: seller.id,
          match_level: level.level,
          match_score: level.score,
        });
      }
    }
    if (allCandidates.length > 0) return allCandidates;
  }

  return [];
}

// Does this seller actually stock the required product (active/approved product
// tagged with keywordId)?
async function hasSellerProductMatch(sellerId, keywordId) {
  if (!sellerId || !keywordId) return false;
  const count = await Products.count({
    where: {
      user_id: sellerId,
      keyword_id: keywordId,
      status: 1,
      is_approve: 1,
      is_delete: 0,
    },
  });
  return count > 0;
}

// Is the required product available anywhere in the system (any active/approved product
// tagged with this keyword)? Distinct from seller eligibility - false means the product
// itself does not exist, so assignment must be blocked.
async function isProductAvailableForKeyword(keywordId) {
  if (!keywordId) return false;
  const count = await Products.count({
    where: { keyword_id: keywordId, status: 1, is_approve: 1, is_delete: 0 },
  });
  return count > 0;
}

// How many distinct sellers in the whole system hold the required product?
async function getProductKeywordSellerCount(keywordId) {
  if (!keywordId) return 0;
  const rows = await Products.findAll({
    where: { keyword_id: keywordId, status: 1, is_approve: 1, is_delete: 0 },
    attributes: ['user_id'],
    raw: true,
  });
  return new Set(rows.map(r => r.user_id)).size;
}

async function getSellerActiveProductCount(sellerId) {
  const count = await Products.count({
    where: {
      user_id: sellerId,
      status: 1,
      is_approve: 1,
      is_delete: 0,
    },
  });
  return count;
}

module.exports = {
  findEligibleSellers,
  hasSellerProductMatch,
  getProductKeywordSellerCount,
  getSellerActiveProductCount,
  isProductAvailableForKeyword,
  PRODUCT_MATCH_SCORES,
};
