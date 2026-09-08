const { Op, literal } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Products = require('../models/Products');
const SellerCategory = require('../models/SellerCategory');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const SellerPerformance = require('../models/SellerPerformance');
const { ensureSellerPerformance } = require('./requirementHelper');

const PRODUCT_MATCH_SCORES = {
  product_keyword: 100,
  item_subcategory: 80,
  item_category: 60,
  subcategory: 40,
  category: 20,
};

// EXACT product match only: a seller enters the candidate pool ONLY if they have an
// approved, active product for the requirement's exact product_keyword_id.
async function findEligibleSellers(requirement, candidatePoolSize) {
  if (!requirement.product_keyword_id) return [];

  const assignedSellerIds = await RequirementAssignments.findAll({
    where: {
      requirement_id: requirement.id,
      status: { [Op.in]: [0, 1, 2, 3, 6] },
    },
    attributes: ['seller_id'],
    raw: true,
  }).then(rows => rows.map(r => r.seller_id));

  const matchingProducts = await Products.findAll({
    where: {
      keyword_id: requirement.product_keyword_id,
      status: 1,
      is_approve: 1,
      is_delete: 0,
    },
    attributes: ['user_id'],
    raw: true,
  });
  const productUserIds = [...new Set(matchingProducts.map(p => p.user_id))];
  if (productUserIds.length === 0) return [];

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
        match_level: 'product_keyword',
        match_score: PRODUCT_MATCH_SCORES.product_keyword,
      });
    }
  }

  return allCandidates;
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
  getSellerActiveProductCount,
  PRODUCT_MATCH_SCORES,
};
