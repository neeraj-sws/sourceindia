const {
  Op, literal,
} = require('sequelize');
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
const Units = require('../models/Units');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');
const { sendMail } = require('./mailHelper');
const { computeProductQualityScore } = require('./productQualityHelper');

const DEFAULT_LEAD_LIMIT = 6;
const DEFAULT_SLA_MINUTES = 120;
const DEFAULT_CANDIDATE_POOL_SIZE = 15;
const DEFAULT_MAX_REASSIGNMENT_ATTEMPTS = 15;
const DEFAULT_WEIGHT_LEADS = 0.60;
const DEFAULT_WEIGHT_PRODUCTS = 0.30;
const DEFAULT_WEIGHT_BUYER_RATING = 0.10;
const DEFAULT_PERIOD_TYPE = 'monthly';
const LEAD_PRIORITY_SCORE_THRESHOLD = 70;

const SELLER_PERFORMANCE_COUNTERS = new Set([
  'total_leads',
  'responded_leads',
  'accepted_leads',
  'rejected_leads',
  'auto_cancelled_leads',
  'completed_leads',
  'total_response_time_seconds',
  'monthly_leads_used',
  'on_time_response_count',
  'search_appearance_count',
]);

if (!Object.prototype.hasOwnProperty.call(BuyerRequirements.associations || {}, 'assignments')) {
  BuyerRequirements.hasMany(RequirementAssignments, {
    foreignKey: 'requirement_id',
    as: 'assignments',
    constraints: false,
  });
}

async function getSystemConfig() {
  const SiteSettings = require('../models/SiteSettings');
  const settings = await SiteSettings.findAll({
    where: { meta_key: { [Op.in]: ['lead_sla_minutes', 'lead_monthly_limit', 'lead_period_type', 'lead_candidate_pool_size', 'max_reassignment_attempts', 'performance_weight_leads', 'performance_weight_products', 'performance_weight_buyer_rating'] } },
    attributes: ['meta_key', 'meta_value'],
    raw: true,
  });
  const config = {};
  settings.forEach(s => { config[s.meta_key] = s.meta_value; });
  return {
    sla_minutes: parseInt(config.lead_sla_minutes) || DEFAULT_SLA_MINUTES,
    monthly_limit: parseInt(config.lead_monthly_limit) || DEFAULT_LEAD_LIMIT,
    period_type: config.lead_period_type || DEFAULT_PERIOD_TYPE,
    // candidate_pool_size: parseInt(config.lead_candidate_pool_size) || DEFAULT_CANDIDATE_POOL_SIZE,
    candidate_pool_size: DEFAULT_CANDIDATE_POOL_SIZE,
    max_reassignment_attempts: parseInt(config.max_reassignment_attempts) || DEFAULT_MAX_REASSIGNMENT_ATTEMPTS,
    performance_weight_leads: parseFloat(config.performance_weight_leads) || DEFAULT_WEIGHT_LEADS,
    performance_weight_products: parseFloat(config.performance_weight_products) || DEFAULT_WEIGHT_PRODUCTS,
    performance_weight_buyer_rating: parseFloat(config.performance_weight_buyer_rating) || DEFAULT_WEIGHT_BUYER_RATING,
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

// Atomic counter bump for one seller. The parallel-assignment model writes these
// counters from several concurrent requests (one per buyer requirement per
// seller), so a read-modify-write on a model instance silently loses updates.
// Uses a single `col = col + n` UPDATE instead. Returns true when a row matched.
async function incrementSellerPerformance(sellerId, deltas, transaction = null) {
  const id = parseInt(sellerId, 10);
  if (!Number.isInteger(id) || id <= 0) return false;

  const sets = [];
  for (const [column, rawDelta] of Object.entries(deltas || {})) {
    if (!SELLER_PERFORMANCE_COUNTERS.has(column)) continue;
    const delta = Number(rawDelta);
    if (!Number.isFinite(delta) || delta === 0) continue;
    sets.push(`\`${column}\` = \`${column}\` + ${delta}`);
  }
  if (sets.length === 0) return false;

  const [result] = await sequelize.query(
    `UPDATE seller_performance SET ${sets.join(', ')}, updated_at = NOW() WHERE seller_id = :sellerId`,
    { replacements: { sellerId: id }, transaction }
  );
  return !!result;
}

// Explicit "Lead Priority" flag, derived from the existing overall performance
// score. Visibility only - it is not a ranking factor and does not feed the score.
function hasLeadPriority(score) {
  const value = Number(score);
  return Number.isFinite(value) && value >= LEAD_PRIORITY_SCORE_THRESHOLD;
}

function getLeadPriorityTag(score) {
  return hasLeadPriority(score)
    ? { label: 'Lead Priority', class: 'success' }
    : { label: 'Standard', class: 'secondary' };
}

async function recalculateSellerPerformance(sellerId) {
  const config = await getSystemConfig();
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
  const penaltyRate = perf.total_leads > 0
    ? ((perf.rejected_leads + perf.auto_cancelled_leads) / perf.total_leads)
    : 0;
  const baseScore = perf.total_leads > 0
    ? ((perf.completed_leads / perf.total_leads) * 40 +
       (onTimePct / 100) * 30 +
       (acceptancePct / 100) * 30)
    : 0;
  const leadScore = baseScore > 0 ? baseScore * (1 - penaltyRate) : 0;

  const productQuality = await computeProductQualityScore(sellerId);
  const productScore = productQuality.score;

  // Buyer feedback (rating 1-5) as an additional credibility signal.
  // When the seller has been rated by buyers, it is blended into the final
  // score: lead performance 60%, product listing quality 30%, buyer rating 10%.
  // Without buyer feedback, the original weights (70% lead / 30% product) are
  // kept so a seller is never penalized for having no feedback yet.
  const hasBuyerRating = (perf.buyer_rating_count || 0) > 0 && perf.buyer_rating_avg != null;
  const ratingScore = hasBuyerRating
    ? Math.round(Math.min((perf.buyer_rating_avg / 5) * 100, 100) * 100) / 100
    : null;

  let finalScore;
  let qualityBreakdown;
  if (productScore === null) {
    if (ratingScore === null) {
      finalScore = Math.round(leadScore * 100) / 100;
    } else {
      finalScore = Math.round((leadScore * 0.90 + ratingScore * 0.10) * 100) / 100;
    }
    qualityBreakdown = {
      ...productQuality,
      buyer_rating_component: ratingScore,
      buyer_rating_level: hasBuyerRating
        ? perf.buyer_rating_avg >= 4.5 ? 'Excellent' : perf.buyer_rating_avg >= 3.5 ? 'Good' : perf.buyer_rating_avg >= 2.5 ? 'Average' : 'Poor'
        : null,
      weights: ratingScore === null ? { lead_weight: 1, rating_weight: 0 } : { lead_weight: 0.9, rating_weight: 0.1 },
    };
  } else {
    if (ratingScore === null) {
      finalScore = Math.round((leadScore * 0.70 + productScore * 0.30) * 100) / 100;
    } else {
      finalScore = Math.round((leadScore * config.performance_weight_leads + productScore * config.performance_weight_products + ratingScore * config.performance_weight_buyer_rating) * 100) / 100;
    }
    qualityBreakdown = {
      level: productQuality.level,
      score: productScore,
      product_count: productQuality.product_count,
      reviewed_count: productQuality.reviewed_count,
      breakdown: productQuality.breakdown,
      reasons: productQuality.reasons,
      weights: ratingScore === null
        ? { lead_weight: 0.7, product_weight: 0.3 }
        : { lead_weight: config.performance_weight_leads, product_weight: config.performance_weight_products, rating_weight: config.performance_weight_buyer_rating },
      lead_component: Math.round(leadScore * 100) / 100,
      product_component: Math.round(productScore * 100) / 100,
      buyer_rating_component: ratingScore,
      buyer_rating_avg: perf.buyer_rating_avg,
      buyer_rating_count: perf.buyer_rating_count,
      buyer_rating_level: hasBuyerRating
        ? perf.buyer_rating_avg >= 4.5 ? 'Excellent' : perf.buyer_rating_avg >= 3.5 ? 'Good' : perf.buyer_rating_avg >= 2.5 ? 'Average' : 'Poor'
        : null,
      lead_metrics: {
        total_leads: perf.total_leads,
        completed_leads: perf.completed_leads,
        on_time_response_percentage: Math.round(onTimePct * 100) / 100,
        acceptance_percentage: Math.round(acceptancePct * 100) / 100,
        penalty_rate: Math.round(penaltyRate * 100) / 100,
      },
    };
  }

  await perf.update({
    average_response_time_seconds: avgResponseTime,
    on_time_response_percentage: Math.round(onTimePct * 100) / 100,
    acceptance_percentage: Math.round(acceptancePct * 100) / 100,
    product_quality_score: productScore === null ? null : Math.round(productScore * 100) / 100,
    score_breakdown: JSON.stringify(qualityBreakdown),
    overall_performance_score: finalScore,
  });
  return perf;
}

// Normalization used whenever a free-text value has to be compared against an
// existing master list (units, product keywords). Trims, collapses repeated
// whitespace and lowercases, so "  Capacitor   Array " and "capacitor array"
// are treated as the same entry.
function normalizeMasterValue(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

// Resolve a typed quantity unit to an existing row in the `units` table.
// Returns the canonical row (with its id) on an exact normalized match, or
// null when the buyer typed something that is not in the list - the caller
// then keeps the custom/"other" behaviour untouched.
async function findUnitByName(unitName) {
  const normalized = normalizeMasterValue(unitName);
  if (!normalized) return null;
  return Units.findOne({
    where: { name: { [Op.eq]: unitName.trim().replace(/\s+/g, ' ') } },
    order: [['id', 'ASC']],
  }).catch(() => null).then(async (exact) => {
    if (exact) return exact;
    // Fall back to a case-insensitive exact comparison, done in JS because a
    // case-insensitive collation is not guaranteed across MySQL installs.
    const candidates = await Units.findAll({
      attributes: ['id', 'name'],
      where: { is_active: 1 },
    });
    return candidates.find((u) => normalizeMasterValue(u.name) === normalized) || null;
  });
}

// Same idea for the product field: an exact (normalized) match against the
// product keyword list means the buyer typed a name that already exists, so it
// should be recorded as a list ("admin") entry instead of their own ("other").
async function findExactProductKeyword(productText) {
  const normalized = normalizeMasterValue(productText);
  if (!normalized) return null;
  // Narrow with a LIKE on the trimmed text first so only plausible rows are
  // loaded; the authoritative comparison is still done in JS, since a
  // case-insensitive collation is not guaranteed across MySQL installs.
  const candidates = await ProductKeyword.findAll({
    where: {
      status: 1,
      name: { [Op.like]: `%${productText.trim().replace(/[%_]/g, (m) => `\\${m}`)}%` },
    },
    include: [{ model: ItemSubCategory, as: 'ItemSubCategory' }],
  });
  const match = candidates.find((k) => normalizeMasterValue(k.name) === normalized);
  if (!match) return null;
  const its = match.ItemSubCategory || null;
  return {
    product_keyword_id: match.id,
    item_subcategory_id: match.item_subcategory_id || null,
    item_category_id: its ? its.item_category_id : null,
    subcategory_id: its ? its.subcategory_id : null,
    category_id: its ? its.category_id : null,
  };
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

let _postcodeCache = {};

// Resolve a pincode for coordinates we already have. Photon (komoot.io) is free,
// HTTPS, no API key, and deterministic for a fixed coordinate. Returns the
// postcode covering that exact point, which may differ from the buyer's own
// pincode but is accurate enough for proximity matching. Best-effort: any
// failure resolves to null so submission is never blocked.
function reverseGeocodePostcode(latitude, longitude) {
  if (!latitude || !longitude) return Promise.resolve(null);
  const key = `${Number(latitude).toFixed(3)}|${Number(longitude).toFixed(3)}`;
  if (Object.prototype.hasOwnProperty.call(_postcodeCache, key)) {
    return Promise.resolve(_postcodeCache[key]);
  }
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => {
      if (settled) return;
      settled = true;
      _postcodeCache[key] = val;
      resolve(val);
    };
    try {
      const https = require('https');
      const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
      const req = https.get(url, { headers: { 'User-Agent': 'SourceIndiaB2B/1.0' } }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const raw = parsed && parsed.features && parsed.features[0]
              ? parsed.features[0].properties && parsed.features[0].properties.postcode
              : null;
            const clean = raw == null ? '' : String(raw).trim().replace(/\D/g, '').slice(0, 10);
            done(clean || null);
          } catch (e) { done(null); }
        });
      });
      req.on('error', () => done(null));
      req.setTimeout(2000, () => { req.destroy(); done(null); });
    } catch (e) {
      done(null);
    }
  });
}

module.exports = {
  getSystemConfig,
  logActivity,
  ensureSellerPerformance,
  incrementSellerPerformance,
  hasLeadPriority,
  getLeadPriorityTag,
  recalculateSellerPerformance,
  detectRequirementCategories,
  normalizeMasterValue,
  findUnitByName,
  findExactProductKeyword,
  getBuyerLocation,
  geocodeCity,
  reverseGeocodePostcode,
  DEFAULT_LEAD_LIMIT,
  DEFAULT_SLA_MINUTES,
  DEFAULT_CANDIDATE_POOL_SIZE,
  DEFAULT_MAX_REASSIGNMENT_ATTEMPTS,
  DEFAULT_WEIGHT_LEADS,
  DEFAULT_WEIGHT_PRODUCTS,
  DEFAULT_WEIGHT_BUYER_RATING,
  DEFAULT_PERIOD_TYPE,
  LEAD_PRIORITY_SCORE_THRESHOLD,
};
