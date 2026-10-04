const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const Cities = require('../models/Cities');
const States = require('../models/States');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const SellerPerformance = require('../models/SellerPerformance');
const { getSystemConfig, geocodeCity } = require('./requirementHelper');
const { findEligibleSellers, getSellerActiveProductCount, getProductKeywordSellerCount, isProductAvailableForKeyword } = require('./matchingHelper');
const { rankCandidates, haversineDistance } = require('./rankingHelper');
const { getLeadUsage } = require('./leadLimitHelper');

// Exclusion reason pushed by evaluateSellerEligibility when the same-day +
// same-city + same-product rule is what disqualified a seller. Named (not
// inlined) so callers can recognise that specific exclusion without matching
// on the wording. The eligibility decision itself is unchanged.
const SAME_DAY_CITY_PRODUCT_REASON = 'Already assigned for same date + same city + same product';

// Base city name (strip state suffix like "Faridabad, Haryana" -> "faridabad")
const normalizeCity = (city) => {
  const base = String(city || '').split(',')[0] || '';
  return base.trim().toLowerCase().replace(/\s+/g, ' ');
};

const normalizeText = (text) => String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Does the seller's city/state satisfy the requirement's Supplier Preference?
function matchesSupplierPreference(seller, requirement) {
  const { supplier_preference: pref } = requirement;
  if (!pref || pref === 'Anywhere in India') return { matches: true, reason: '' };
  const reqCity = normalizeText(requirement.buyer_city);
  const reqState = normalizeText(requirement.buyer_state);
  const selCity = normalizeText(seller.city);
  const selState = normalizeText(seller.state);

  if (pref === 'Within My City') {
    if (reqCity && selCity && selCity === reqCity) return { matches: true, reason: '' };
    return { matches: false, reason: 'Outside requirement city (Supplier Preference: Within My City)' };
  }
  if (pref === 'Within My State') {
    if (reqState && selState && selState === reqState) return { matches: true, reason: '' };
    if (!reqState) return { matches: true, reason: '' }; // requirement state unknown -> no restriction
    return { matches: false, reason: 'Outside requirement state (Supplier Preference: Within My State)' };
  }
  return { matches: true, reason: '' };
}

function toDateKey(date) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Same Date + Same City + Same Product already assigned to this seller?
async function isSameDayCityProductAssigned(sellerId, requirement) {
  const reqDate = toDateKey(requirement.created_at);
  if (!reqDate || !requirement.buyer_city) return false;

  const rows = await sequelize.query(
    `SELECT r.product_name_snapshot, r.product_keyword_id, r.buyer_city
       FROM requirement_assignments a
       INNER JOIN buyer_requirements r ON r.requirement_id = a.requirement_id
      WHERE a.seller_id = :sellerId
        AND DATE(r.created_at) = :reqDate
        AND a.status IN (0,1,2,3,4,5,6)`,
    { type: 'SELECT', replacements: { sellerId, reqDate } }
  );

  for (const row of rows) {
    const sameCity = normalizeCity(row.buyer_city) === normalizeCity(requirement.buyer_city);
    if (!sameCity) continue;
    const sameProd = (row.product_keyword_id && requirement.product_keyword_id && row.product_keyword_id === requirement.product_keyword_id)
      || (String(row.product_name_snapshot || '').trim().toLowerCase() === String(requirement.product_name_snapshot || '').trim().toLowerCase() && String(requirement.product_name_snapshot || '').trim().length > 0);
    if (sameProd) return true;
  }
  return false;
}

async function getCityIdsByName(cityName) {
  if (!cityName || !String(cityName).trim()) return [];
  const rows = await Cities.findAll({
    where: { name: { [Op.like]: String(cityName).trim() } },
    attributes: ['id'],
    raw: true,
  });
  return rows.map((r) => r.id);
}

async function enrichSellers(candidates, requirement) {
  const enriched = [];
  const reqCityName = normalizeCity(requirement.buyer_city);
  let reqCityIds = [];
  if (requirement.buyer_city) reqCityIds = await getCityIdsByName(requirement.buyer_city);

  for (const c of candidates) {
    const seller = await Users.findByPk(c.seller_id, {
      include: [
        {
          model: CompanyInfo, as: 'company_info',
          attributes: ['id', 'organization_name', 'company_location'],
        },
        {
          model: Cities, as: 'city_data',
          attributes: ['id', 'name', 'state_id'],
          include: [{ model: States, as: 'States', attributes: ['name'] }],
        },
        { model: States, as: 'state_data', attributes: ['name'] },
      ],
      attributes: ['id', 'fname', 'lname', 'email', 'mobile', 'city', 'state'],
    });
    if (!seller) continue;

    const perf = await SellerPerformance.findOne({ where: { seller_id: c.seller_id } })
      || { overall_performance_score: 0, monthly_leads_used: 0, lead_receiving_enabled: 1 };
    const sellerCity = seller.city_data?.name || (seller.city ? String(seller.city) : '');
    const sellerCityId = Number(seller.city) || (seller.city_data?.id ? Number(seller.city_data.id) : null);
    const stateName = (seller.city_data && seller.city_data.States && seller.city_data.States.name)
      || (seller.state_data && seller.state_data.name)
      || '';
    const isSameCity = reqCityName
      ? (normalizeCity(sellerCity) === reqCityName || (sellerCityId && reqCityIds.includes(sellerCityId)))
      : false;

    let lat = null, lon = null;
    if (seller.company_info && seller.company_info.company_location) {
      try {
        const loc = typeof seller.company_info.company_location === 'string'
          ? JSON.parse(seller.company_info.company_location)
          : seller.company_info.company_location;
        lat = loc.latitude || loc.lat || null;
        lon = loc.longitude || loc.lon || null;
      } catch (e) { /* ignore */ }
    }

    // Fallback: seller's company_location has no coords -> geocode seller city
    if ((lat == null || lon == null) && sellerCity && !/^\d+$/.test(String(sellerCity))) {
      try {
        // pass only city name; seller.state is an ID (e.g. "21"), not a name -> would break geocoding
        const geo = await geocodeCity(sellerCity);
        if (geo) { lat = geo.latitude; lon = geo.longitude; }
      } catch (e) { /* ignore */ }
    }

    const distanceKm = haversineDistance(
      requirement.buyer_latitude ? parseFloat(requirement.buyer_latitude) : null,
      requirement.buyer_longitude ? parseFloat(requirement.buyer_longitude) : null,
      lat,
      lon
    );

    const productCount = await getSellerActiveProductCount(c.seller_id);
    const config = await getSystemConfig();

    enriched.push({
      seller_id: c.seller_id,
      match_level: c.match_level,
      match_score: c.match_score,
      name: `${seller.fname || ''} ${seller.lname || ''}`.trim(),
      company: seller.company_info?.organization_name || '',
      city: sellerCity || '',
      state: seller.state || '',
      state_name: stateName,
      distance_km: distanceKm,
      product_count: productCount,
      performance_score: parseFloat(perf.overall_performance_score) || 0,
      monthly_leads_used: perf.monthly_leads_used,
      lead_receiving_enabled: perf.lead_receiving_enabled === 1,
      same_city: isSameCity,
    });
  }
  return enriched;
}

// Compute eligibility + exclusion reasons for a set of seller candidates
// The remaining lead count comes from the per-seller seller_lead_count tracker
// (remaining = limit_at_period_start - leads_received). Sellers who have used
// all of this period's shared global limit are excluded from candidacy; the
// final assignment additionally revalidates the count at assign time.
//
// "Used" means leads the seller ACCEPTED or REJECTED. Unanswered pending
// assignments are deliberately not counted, so holding several offers never
// makes a seller look exhausted.
async function evaluateSellerEligibility(sellers, requirement) {
  const config = await getSystemConfig();
  const results = [];
  for (const s of sellers) {
    let eligible = true;
    const reasons = [];

    if (s.lead_receiving_enabled === false) {
      eligible = false;
      reasons.push('Lead receiving disabled');
    }
    const usage = await getLeadUsage(s.seller_id, config);
    if (usage.remaining <= 0) {
      eligible = false;
      reasons.push('Monthly lead limit reached');
    }
    if (s.product_count <= 0) {
      eligible = false;
      reasons.push('No active products');
    }
    if (await isSameDayCityProductAssigned(s.seller_id, requirement)) {
      eligible = false;
      reasons.push(SAME_DAY_CITY_PRODUCT_REASON);
    }

    results.push({ ...s, lead_used: usage.leads_received, lead_limit: usage.limit_at_period_start, lead_remaining: usage.remaining, is_eligible: eligible, reasons });
  }
  return results;
}

// Build the complete seller preview shown to admin before approval
async function buildSellerPreview(requirement) {
  const config = await getSystemConfig();
  const pool = await findEligibleSellers(requirement, config.candidate_pool_size);
  const enriched = await enrichSellers(pool, requirement);
  const evaluated = await evaluateSellerEligibility(enriched, requirement);

  // Apply the requirement's Supplier Preference (Within My City / Within My State)
  for (const s of evaluated) {
    const chk = matchesSupplierPreference({ city: s.city, state: s.state_name }, requirement);
    if (!chk.matches) {
      s.is_eligible = false;
      s.reasons.push(chk.reason);
      s._preference_blocked = true;
    }
  }

  const sameCity = evaluated.filter((s) => s.same_city);
  const eligibleSameCity = sameCity.filter((s) => s.is_eligible);

  if (eligibleSameCity.length > 0) {
    const ranked = await rankCandidates(eligibleSameCity.map((s) => ({
      seller_id: s.seller_id, match_level: s.match_level, match_score: s.match_score,
    })), requirement);
    const orderedCandidates = ranked
      .map((r) => ({ ...eligibleSameCity.find((s) => s.seller_id === r.seller_id), total_score: r.total_score }))
      .filter((s) => s && s.seller_id);
    const recommended = orderedCandidates[0] || null;
    return {
      same_city_eligible_count: eligibleSameCity.length,
      same_city_sellers: evaluated.filter((s) => s.same_city),
      excluded_sellers: evaluated.filter((s) => !s.is_eligible),
      nearest_city_sellers: [],
      recommended_seller: recommended,
      ordered_candidates: orderedCandidates,
      recommendation_reason: recommended
        ? 'Same city + eligible + not already assigned for the same date/city/product'
        : '',
      strategy: 'same_city',
    };
  }

  // No eligible same-city seller -> nearest city fallback.
  // Nearest-distance group first; ranking runs only inside that group so a farther
  // city can never displace the nearest one. Unknown-distance sellers rank last.
  const sameCityAll = evaluated.filter((s) => s.same_city);
  const nearest = evaluated
    .filter((s) => !s.same_city && s.is_eligible)
    .sort((a, b) => ((a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)));

  if (nearest.length > 0) {
    const withDistance = nearest.filter((s) => s.distance_km != null);
    const nearestGroup = withDistance.length > 0
      ? (() => {
          const minKm = Math.min(...withDistance.map((s) => s.distance_km));
          return withDistance.filter((s) => Math.round(s.distance_km) === Math.round(minKm));
        })()
      : nearest;

    const ranked = await rankCandidates(nearestGroup.slice(0, 10).map((s) => ({
      seller_id: s.seller_id, match_level: s.match_level, match_score: s.match_score,
    })), requirement);
    const recommended = ranked[0] ? { ...nearestGroup.find((s) => s.seller_id === ranked[0].seller_id), total_score: ranked[0].total_score } : null;
    // Ordered assignment order: nearest group ranked first, then remaining
    // nearest-city sellers by distance; no duplicates.
    const scoreMap = new Map(ranked.map((r) => [r.seller_id, r.total_score]));
    const orderedCandidates = [];
    for (const r of ranked) {
      const s = nearestGroup.find((x) => x.seller_id === r.seller_id);
      if (s) orderedCandidates.push({ ...s, total_score: r.total_score });
    }
    for (const s of nearest) {
      if (orderedCandidates.some((o) => o.seller_id === s.seller_id)) continue;
      orderedCandidates.push({ ...s, total_score: scoreMap.get(s.seller_id) ?? null });
    }
    // group nearest by city name for display
    const byCity = {};
    nearest.forEach((s) => {
      const key = s.city || 'Unknown';
      byCity[key] = byCity[key] || [];
      byCity[key].push(s);
    });
    return {
      same_city_eligible_count: 0,
      same_city_sellers: sameCityAll,
      excluded_sellers: evaluated.filter((s) => !s.is_eligible),
      nearest_city_sellers: Object.keys(byCity).map((city) => ({
        city,
        count: byCity[city].filter((s) => s.is_eligible).length,
        sellers: byCity[city],
      })),
      recommended_seller: recommended,
      ordered_candidates: orderedCandidates,
      recommendation_reason: recommended
        ? `No eligible seller in requirement city; nearest city selected (${recommended.city || 'n/a'}${recommended.distance_km != null ? ', ' + Math.round(recommended.distance_km) + ' km' : ''})`
        : '',
      strategy: 'nearest_city',
    };
  }

  let recommendationReason = 'No eligible seller available anywhere';
  if (requirement.product_keyword_id) {
    const anySellerCount = await getProductKeywordSellerCount(requirement.product_keyword_id);
    if (anySellerCount === 0) recommendationReason = 'This product is not available with any seller.';
  }
  return {
    same_city_eligible_count: 0,
    same_city_sellers: evaluated.filter((s) => s.same_city),
    excluded_sellers: evaluated.filter((s) => !s.is_eligible),
    nearest_city_sellers: [],
    recommended_seller: null,
    ordered_candidates: [],
    recommendation_reason: recommendationReason,
    strategy: 'none',
  };
}

// Final, revalidated seller pick used at approval/assign time
async function selectFinalSeller(requirement) {
  const preview = await buildSellerPreview(requirement);
  if (preview.recommended_seller && preview.recommended_seller.is_eligible) {
    return { success: true, preview, seller: preview.recommended_seller, ordered: preview.ordered_candidates || [] };
  }
  return { success: false, preview, seller: null, ordered: preview.ordered_candidates || [], message: preview.recommendation_reason || 'No eligible seller' };
}

module.exports = {
  normalizeCity,
  normalizeText,
  toDateKey,
  SAME_DAY_CITY_PRODUCT_REASON,
  isSameDayCityProductAssigned,
  getCityIdsByName,
  enrichSellers,
  evaluateSellerEligibility,
  buildSellerPreview,
  selectFinalSeller,
  findEligibleSellers,
  haversineDistance,
  matchesSupplierPreference,
  isProductAvailableForKeyword,
};
