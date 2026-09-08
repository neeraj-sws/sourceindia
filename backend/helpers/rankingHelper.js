const { Op } = require('sequelize');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const SellerPerformance = require('../models/SellerPerformance');
const { ensureSellerPerformance, getSystemConfig } = require('./requirementHelper');

const LOCATION_WEIGHT = 0.20;
const PRODUCT_MATCH_WEIGHT = 0.40;
const PERFORMANCE_WEIGHT = 0.20;
const RESPONSE_TIME_WEIGHT = 0.10;
const PRODUCT_QUALITY_WEIGHT = 0.10;

const LOCATION_RANGES = [
  { max_km: 25, score: 100 },
  { max_km: 50, score: 80 },
  { max_km: 100, score: 60 },
  { max_km: 250, score: 40 },
  { max_km: Infinity, score: 20 },
];

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getLocationScore(distanceKm) {
  if (distanceKm === null) return 50;
  for (const range of LOCATION_RANGES) {
    if (distanceKm <= range.max_km) return range.score;
  }
  return 20;
}

function getResponseTimeScore(responseTimeSeconds) {
  if (!responseTimeSeconds || responseTimeSeconds === 0) return 50;
  if (responseTimeSeconds <= 300) return 100;
  if (responseTimeSeconds <= 900) return 80;
  if (responseTimeSeconds <= 1800) return 60;
  if (responseTimeSeconds <= 3600) return 40;
  return 20;
}

function getProductQualityScore(activeProductCount) {
  if (activeProductCount >= 50) return 100;
  if (activeProductCount >= 20) return 80;
  if (activeProductCount >= 10) return 60;
  if (activeProductCount >= 5) return 40;
  return 20;
}

async function rankCandidates(candidates, requirement) {
  const config = await getSystemConfig();
  const buyerLat = requirement.buyer_latitude ? parseFloat(requirement.buyer_latitude) : null;
  const buyerLon = requirement.buyer_longitude ? parseFloat(requirement.buyer_longitude) : null;

  const ranked = [];

  for (const candidate of candidates) {
    const seller = await Users.findByPk(candidate.seller_id, {
      include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
      attributes: ['id', 'fname', 'lname', 'city', 'state', 'country'],
    });

    if (!seller) continue;

    const perf = await ensureSellerPerformance(candidate.seller_id);

    let sellerLat = null, sellerLon = null;
    if (seller.company_info && seller.company_info.company_location) {
      try {
        const loc = typeof seller.company_info.company_location === 'string'
          ? JSON.parse(seller.company_info.company_location)
          : seller.company_info.company_location;
        sellerLat = loc.latitude || loc.lat || null;
        sellerLon = loc.longitude || loc.lon || null;
      } catch (e) {}
    }

    const distance = haversineDistance(buyerLat, buyerLon, sellerLat, sellerLon);
    const locationScore = getLocationScore(distance);

    const categoryPerfScore = parseFloat(perf.overall_performance_score);

    const productQualityCount = await require('./matchingHelper').getSellerActiveProductCount(candidate.seller_id);
    const productQualityScore = getProductQualityScore(productQualityCount);

    const responseTimeScore = getResponseTimeScore(perf.average_response_time_seconds);

    const totalScore =
      (candidate.match_score / 100) * PRODUCT_MATCH_WEIGHT * 100 +
      (locationScore / 100) * LOCATION_WEIGHT * 100 +
      (categoryPerfScore / 100) * PERFORMANCE_WEIGHT * 100 +
      (responseTimeScore / 100) * RESPONSE_TIME_WEIGHT * 100 +
      (productQualityScore / 100) * PRODUCT_QUALITY_WEIGHT * 100;

    ranked.push({
      seller_id: candidate.seller_id,
      match_level: candidate.match_level,
      match_score: candidate.match_score,
      location_score: locationScore,
      distance_km: distance,
      performance_score: categoryPerfScore,
      response_time_score: responseTimeScore,
      product_quality_score: productQualityScore,
      total_score: Math.round(totalScore * 100) / 100,
      seller,
      perf,
    });
  }

  ranked.sort((a, b) => b.total_score - a.total_score);
  return ranked;
}

module.exports = {
  rankCandidates,
  haversineDistance,
  getLocationScore,
  PRODUCT_MATCH_WEIGHT,
  LOCATION_WEIGHT,
  PERFORMANCE_WEIGHT,
  RESPONSE_TIME_WEIGHT,
  PRODUCT_QUALITY_WEIGHT,
};
