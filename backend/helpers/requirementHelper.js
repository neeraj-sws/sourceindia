const { Op, literal } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Products = require('../models/Products');
const SellerCategory = require('../models/SellerCategory');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const RequirementActivityLog = require('../models/RequirementActivityLog');
const SellerPerformance = require('../models/SellerPerformance');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');
const { sendMail } = require('./mailHelper');

const DEFAULT_LEAD_LIMIT = 6;
const DEFAULT_SLA_MINUTES = 120;
const DEFAULT_CANDIDATE_POOL_SIZE = 15;

async function getSystemConfig() {
  const SiteSettings = require('../models/SiteSettings');
  const settings = await SiteSettings.findAll({
    where: { meta_key: { [Op.in]: ['lead_sla_minutes', 'lead_monthly_limit', 'lead_candidate_pool_size'] } },
    attributes: ['meta_key', 'meta_value'],
    raw: true,
  });
  const config = {};
  settings.forEach(s => { config[s.meta_key] = s.meta_value; });
  return {
    sla_minutes: parseInt(config.lead_sla_minutes) || DEFAULT_SLA_MINUTES,
    monthly_limit: parseInt(config.lead_monthly_limit) || DEFAULT_LEAD_LIMIT,
    candidate_pool_size: parseInt(config.lead_candidate_pool_size) || DEFAULT_CANDIDATE_POOL_SIZE,
  };
}

async function logActivity(requirementId, action, details, sellerId = null, assignmentId = null, ipAddress = null, transaction = null) {
  await RequirementActivityLog.create({
    requirement_id: requirementId,
    assignment_id: assignmentId,
    seller_id: sellerId,
    action,
    details,
    ip_address: ipAddress,
  }, transaction ? { transaction } : {});
}

async function ensureSellerPerformance(sellerId) {
  let perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
  if (!perf) {
    perf = await SellerPerformance.create({ seller_id: sellerId });
  }
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  if (perf.monthly_leads_reset_at) {
    const resetDate = new Date(perf.monthly_leads_reset_at);
    if (resetDate.getMonth() !== currentMonth || resetDate.getFullYear() !== currentYear) {
      await perf.update({ monthly_leads_used: 0, monthly_leads_reset_at: now });
    }
  } else {
    await perf.update({ monthly_leads_reset_at: now });
  }
  return perf;
}

async function recalculateSellerPerformance(sellerId) {
  const perf = await ensureSellerPerformance(sellerId);
  const avgResponseTime = perf.responded_leads > 0
    ? Math.round(perf.total_response_time_seconds / perf.responded_leads)
    : 0;
  const onTimePct = perf.responded_leads > 0
    ? (perf.on_time_response_count / perf.responded_leads * 100)
    : 0;
  const acceptancePct = perf.total_leads > 0
    ? (perf.accepted_leads / perf.total_leads * 100)
    : 0;
  const rejectionRate = perf.total_leads > 0 ? (perf.rejected_leads / perf.total_leads) : 0;
  const baseScore = perf.total_leads > 0
    ? ((perf.completed_leads / perf.total_leads) * 40 +
       (onTimePct / 100) * 30 +
       (acceptancePct / 100) * 30)
    : 0;
  const performanceScore = baseScore > 0 ? baseScore * (1 - rejectionRate) : 0;
  await perf.update({
    average_response_time_seconds: avgResponseTime,
    on_time_response_percentage: Math.round(onTimePct * 100) / 100,
    acceptance_percentage: Math.round(acceptancePct * 100) / 100,
    overall_performance_score: Math.round(performanceScore * 100) / 100,
  });
  return perf;
}

async function detectRequirementCategories(productText) {
  if (!productText || !productText.trim()) return {};
  const text = productText.trim().replace(/\s+/g, ' ');
  const likeClauses = [];
  const pushLike = (value) => {
    const esc = value.replace(/[%_]/g, (m) => `\\${m}`);
    if (esc) likeClauses.push({ name: { [Op.like]: `%${esc}%` } });
  };

  pushLike(text);
  text.split(' ').filter((w) => w.length >= 3).forEach(pushLike);

  const keyword = await ProductKeyword.findOne({
    where: { status: 1, [Op.or]: likeClauses },
    include: [{ model: ItemSubCategory, as: 'ItemSubCategory' }],
    order: [[literal('CHAR_LENGTH(ProductKeyword.name)'), 'DESC'], ['id', 'ASC']],
  });
  if (!keyword) return {};

  const its = keyword.ItemSubCategory || null;
  return {
    product_keyword_id: keyword.id,
    item_subcategory_id: keyword.item_subcategory_id || null,
    item_category_id: its ? its.item_category_id : null,
    subcategory_id: its ? its.subcategory_id : null,
    category_id: its ? its.category_id : null,
  };
}

let _geocodeCache = {};

// Geocode a city/state to lat/lon using Open-Meteo (free, no API key, works for India).
async function geocodeCity(city, state = null) {
  if (!city) return null;
  const key = `${String(city).trim()}|${state ? String(state).trim() : ''}`.toLowerCase();
  if (_geocodeCache[key]) return _geocodeCache[key];
  try {
    const https = require('https');
    const q = encodeURIComponent(`${city}${state ? ', ' + state : ''}, India`);
    return new Promise((resolve) => {
      const req = https.get(`https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          let result = null;
          try {
            const parsed = JSON.parse(data);
            if (parsed.results && parsed.results[0]) {
              const loc = parsed.results[0];
              result = { latitude: loc.latitude, longitude: loc.longitude, city: loc.name, state: loc.admin1 };
            }
          } catch (e) { result = null; }
          _geocodeCache[key] = result;
          resolve(result);
        });
      });
      req.on('error', () => { resolve(null); });
      req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    });
  } catch (e) {
    return null;
  }
}

async function getBuyerLocation(ipAddress) {
  if (!ipAddress) return {};
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const req = https.get(`https://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,lat,lon`, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.status === 'success') {
              resolve({
                buyer_city: parsed.city || null,
                buyer_state: parsed.regionName || null,
                buyer_country: parsed.country || 'India',
                buyer_latitude: parsed.lat || null,
                buyer_longitude: parsed.lon || null,
                location_source: 'ip_geolocation',
              });
            } else {
              resolve({});
            }
          } catch (e) { resolve({}); }
        });
      });
      req.on('error', () => { clearTimeout(timeout); resolve({}); });
      req.setTimeout(3000, () => { clearTimeout(timeout); req.destroy(); resolve({}); });
      const timeout = setTimeout(() => { req.destroy(); resolve({}); }, 3000);
    });
  } catch (e) {
    return {};
  }
}

module.exports = {
  getSystemConfig,
  logActivity,
  ensureSellerPerformance,
  recalculateSellerPerformance,
  detectRequirementCategories,
  getBuyerLocation,
  geocodeCity,
  DEFAULT_LEAD_LIMIT,
  DEFAULT_SLA_MINUTES,
  DEFAULT_CANDIDATE_POOL_SIZE,
};
