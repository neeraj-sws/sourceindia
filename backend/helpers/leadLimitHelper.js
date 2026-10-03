const { Op } = require('sequelize');
const sequelize = require('../config/database');
const SellerLeadCount = require('../models/SellerLeadCount');
const { getSystemConfig, ensureSellerPerformance, incrementSellerPerformance } = require('./requirementHelper');

const LEAD_PERIOD_TYPES = ['weekly', 'monthly', '6-monthly', 'yearly'];
const DEFAULT_PERIOD_TYPE = 'monthly';

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Return the inclusive [start, end] date range for the period containing `date`.
// `period_end` is the last day of the period (inclusive), so a rollover check of
// `period_end < today` fires exactly on the first day of the next period.
function getPeriodRange(date, periodType) {
  const d = toDateOnly(date || new Date());
  const y = d.getFullYear();
  switch (periodType) {
    case 'weekly': {
      const dow = (d.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
      const start = new Date(d);
      start.setDate(d.getDate() - dow);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: fmtDate(start), end: fmtDate(end) };
    }
    case 'yearly':
      return { start: fmtDate(new Date(y, 0, 1)), end: fmtDate(new Date(y, 11, 31)) };
    case '6-monthly': {
      const half = d.getMonth() < 6 ? 0 : 6;
      return { start: fmtDate(new Date(y, half, 1)), end: fmtDate(new Date(y, half + 6, 0)) };
    }
    case 'monthly':
    default:
      return { start: fmtDate(new Date(y, d.getMonth(), 1)), end: fmtDate(new Date(y, d.getMonth() + 1, 0)) };
  }
}

// Current period based on the global period-type setting (default: monthly).
function getCurrentPeriod(config) {
  const periodType = LEAD_PERIOD_TYPES.includes(config.period_type) ? config.period_type : DEFAULT_PERIOD_TYPE;
  return { ...getPeriodRange(new Date(), periodType), period_type: periodType };
}

// Look up (or auto-create on first lead) the seller's current-period row.
// A seller with no row yet is treated as having the full current global limit.
async function getOrCreateSellerLeadCount(sellerId, config) {
  const cfg = config || await getSystemConfig();
  const period = getCurrentPeriod(cfg);
  let row = await SellerLeadCount.findOne({
    where: { seller_id: sellerId, period_start: period.start },
  });
  if (!row) {
    row = await SellerLeadCount.create({
      seller_id: sellerId,
      period_start: period.start,
      period_end: period.end,
      limit_at_period_start: cfg.monthly_limit,
      leads_received: 0,
    });
  }
  return row;
}

// Read-only usage for the seller's current period (does NOT create a row).
// remaining = limit_at_period_start - leads_received.
async function getLeadUsage(sellerId, config) {
  const cfg = config || await getSystemConfig();
  const period = getCurrentPeriod(cfg);
  const row = await SellerLeadCount.findOne({
    where: { seller_id: sellerId, period_start: period.start },
  });
  const limit = row ? Number(row.limit_at_period_start) : cfg.monthly_limit;
  const used = row ? Number(row.leads_received) : 0;
  return {
    seller_id: sellerId,
    period_start: period.start,
    period_end: period.end,
    period_type: period.period_type,
    limit_at_period_start: limit,
    leads_received: used,
    remaining: Math.max(0, limit - used),
  };
}

// Atomic, guarded increment. Succeeds only if the seller still has room
// (leads_received < limit_at_period_start). Returns true when consumed.
async function consumeSellerLeadCount(rowId) {
  if (!rowId) return false;
  const [result] = await sequelize.query(
    'UPDATE seller_lead_count SET leads_received = leads_received + 1, updated_at = NOW() WHERE id = :id AND leads_received < limit_at_period_start',
    { replacements: { id: rowId } }
  );
  return result && result.affectedRows === 1;
}

// ============================================================
// WHEN "Monthly Used" IS CONSUMED
// ============================================================
// The quota is consumed by a seller ACTION on a lead, not by being handed one:
//
//   accept      -> +1   the seller took the lead on
//   reject      -> +1   the seller spent the opportunity deciding not to
//   assignment  -> +0   an offer nobody has answered yet costs nothing
//   auto-cancel -> +0   the seller took no action at all (SLA expiry)
//
// This function is the ONLY place either counter is bumped, so every "Monthly
// Used" surface - the quota enforced during seller selection and every admin /
// seller UI reading it - moves together and cannot drift apart.
//
// Both tracked counters advance here:
//   seller_lead_count.leads_received      - the enforced quota (period aware:
//                                          weekly / monthly / 6-monthly / yearly)
//   seller_performance.monthly_leads_used - the "Monthly Used" figure shown in
//                                          the seller UI
// Returns true when the enforced quota (leads_received) actually moved.
async function consumeSellerLeadQuota(sellerId, config) {
  const id = parseInt(sellerId, 10);
  if (!Number.isInteger(id) || id <= 0) return false;

  const cfg = config || await getSystemConfig();

  try {
    await ensureSellerPerformance(id);
    await incrementSellerPerformance(id, { monthly_leads_used: 1 });
  } catch (err) {
    console.error(`[leadQuota] ERROR bumping Monthly Used for seller #${id}:`, err.message);
  }

  let row;
  try {
    row = await getOrCreateSellerLeadCount(id, cfg);
  } catch (err) {
    console.error(`[leadQuota] ERROR resolving lead-count row for seller #${id}:`, err.message);
    return false;
  }

  try {
    const consumed = await consumeSellerLeadCount(row.id);
    if (!consumed) {
      // The seller was already at their limit for this period when they acted.
      // The limit stays a hard cap: the action still counts towards Monthly Used
      // but the enforced quota is not pushed past the cap.
      console.log(`[leadQuota] seller #${id} is at their lead limit for this period; enforced quota not incremented`);
    }
    return consumed;
  } catch (err) {
    console.error(`[leadQuota] ERROR consuming lead count for seller #${id}:`, err.message);
    return false;
  }
}

// Daily rollover: for every seller whose last period has ended, create the
// current period's fresh row snapshotting whatever the global limit is now.
// Sellers with no row at all get one lazily on their first lead of the period.
async function rolloverSellerLeadCounts() {
  const config = await getSystemConfig();
  const period = getCurrentPeriod(config);
  const today = fmtDate(new Date());

  const stale = await SellerLeadCount.findAll({
    where: { period_end: { [Op.lt]: today } },
    attributes: ['seller_id'],
    group: ['seller_id'],
    raw: true,
  });

  const sellerIds = [...new Set(stale.map((s) => s.seller_id))];
  let created = 0;
  for (const sid of sellerIds) {
    if (!sid) continue;
    const exists = await SellerLeadCount.findOne({
      where: { seller_id: sid, period_start: period.start },
    });
    if (!exists) {
      await SellerLeadCount.create({
        seller_id: sid,
        period_start: period.start,
        period_end: period.end,
        limit_at_period_start: config.monthly_limit,
        leads_received: 0,
      });
      created++;
    }
  }
  return created;
}

module.exports = {
  LEAD_PERIOD_TYPES,
  DEFAULT_PERIOD_TYPE,
  getPeriodRange,
  getCurrentPeriod,
  getOrCreateSellerLeadCount,
  getLeadUsage,
  consumeSellerLeadQuota,
  rolloverSellerLeadCounts,
  fmtDate,
};