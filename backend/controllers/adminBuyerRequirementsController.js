const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const RequirementActivityLog = require('../models/RequirementActivityLog');
const SellerPerformance = require('../models/SellerPerformance');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');
const Cities = require('../models/Cities');
const States = require('../models/States');
const SiteSettings = require('../models/SiteSettings');
const SellerLeadCount = require('../models/SellerLeadCount');
const { logActivity, getSystemConfig, hasLeadPriority, getLeadPriorityTag } = require('../helpers/requirementHelper');
const { getCurrentPeriod } = require('../helpers/leadLimitHelper');
const { manualAssignSellerToRequirement, adminChangeRequirementStatus, adminCloseRequirement } = require('../helpers/assignmentHelper');
const { findEligibleSellers, enrichSellers, normalizeText, evaluateSellerEligibility, matchesSupplierPreference, isProductAvailableForKeyword } = require('../helpers/sellerEligibilityHelper');
const { rankCandidates } = require('../helpers/rankingHelper');

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip || '';
};

async function getAllRequirements(req, res) {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'created_at', sort = 'DESC', status, category_id, seller_id, city } = req.query;

    const where = { is_delete: 0 };
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (category_id) where.category_id = parseInt(category_id);
    if (city) where.buyer_city = { [Op.like]: `%${city}%` };
    if (search) {
      where[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { buyer_name: { [Op.like]: `%${search}%` } },
        { buyer_email: { [Op.like]: `%${search}%` } },
        { buyer_company: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    // `distinct` is required because of the `assignments` hasMany include below.
    // The data query paginates distinct requirement rows (Sequelize wraps it in a
    // subquery), but the count query LEFT JOINs requirement_assignments, so a plain
    // COUNT emits one count per (requirement x assignment) pair and every extra
    // seller attempt inflates the total. That made the footer claim "of 28" while
    // only 6 requirements exist and 6 rows render.
    const { count, rows } = await BuyerRequirements.findAndCountAll({
      where,
      distinct: true,
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        {
          model: RequirementAssignments, as: 'assignments',
          required: false,
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
        },
      ],
      order: [[sortBy, sort.toUpperCase()]],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      data: rows,
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getAllRequirements error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementDetailAdmin(req, res) {
  try {
    const { id } = req.params;
    const requirement = await BuyerRequirements.findByPk(id, {
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        {
          model: RequirementAssignments, as: 'assignments',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname', 'email'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
          order: [['assignment_number', 'ASC']],
        },
        {
          model: RequirementActivityLog, as: 'activity_logs',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'] }],
          order: [['created_at', 'ASC']],
        },
      ],
    });
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });
    return res.json(requirement);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementCounts(req, res) {
  try {
    const counts = await BuyerRequirements.findAll({
      where: { is_delete: 0 },
      attributes: [
        'status',
        [fn('COUNT', col('requirement_id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const total = await BuyerRequirements.count({ where: { is_delete: 0 } });
    const result = { total, assigned: 0, accepted: 0, completed: 0, closed: 0, no_seller_found: 0, product_not_available: 0 };
    const statusMap = { 1: 'assigned', 2: 'accepted', 3: 'completed', 4: 'closed', 5: 'no_seller_found', 6: 'product_not_available' };
    counts.forEach(c => {
      if (statusMap[c.status]) result[statusMap[c.status]] = parseInt(c.count);
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerPerformanceAdmin(req, res) {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const where = {};
    const perfFilters = [];
    if (search) {
      const matchingUsers = await Users.findAll({
        where: {
          [Op.or]: [
            { fname: { [Op.like]: `%${search}%` } },
            { lname: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
        raw: true,
      });
      perfFilters.push({ seller_id: { [Op.in]: matchingUsers.map(u => u.id) } });
    }
    const assignedSellerIds = sequelize.literal('(SELECT seller_id FROM requirement_assignments WHERE seller_id IS NOT NULL)');
    perfFilters.push({ seller_id: { [Op.in]: assignedSellerIds } });
    where[Op.and] = perfFilters;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await SellerPerformance.findAndCountAll({
      where,
      include: [{
        model: Users, as: 'seller',
        attributes: ['id', 'fname', 'lname', 'email'],
        include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
      }],
      order: [['overall_performance_score', 'DESC'], ['seller_id', 'ASC']],
      limit: parseInt(limit),
      offset,
    });

    const data = rows.map((row, idx) => {
      const perf = row.toJSON ? row.toJSON() : row;
      const avgSeconds = Number(perf.average_response_time_seconds) || 0;
      const totalLeads = Number(perf.total_leads) || 0;
      const completedLeads = Number(perf.completed_leads) || 0;
      const respondedLeads = Number(perf.responded_leads) || 0;
      const acceptedLeads = Number(perf.accepted_leads) || 0;
      const rejectedLeads = Number(perf.rejected_leads) || 0;
      const autoCancelledLeads = Number(perf.auto_cancelled_leads) || 0;
      const onTimePct = respondedLeads > 0 ? ((Number(perf.on_time_response_count) || 0) / respondedLeads * 100) : 0;
      const acceptancePct = totalLeads > 0 ? (acceptedLeads / totalLeads * 100) : 0;
      const rejectionRate = totalLeads > 0 ? (rejectedLeads / totalLeads) : 0;
      const autoCancelRate = totalLeads > 0 ? (autoCancelledLeads / totalLeads) : 0;
      const penaltyRate = totalLeads > 0 ? ((rejectedLeads + autoCancelledLeads) / totalLeads) : 0;
      const baseScore = totalLeads > 0
        ? ((completedLeads / totalLeads) * 40 + (onTimePct / 100) * 30 + (acceptancePct / 100) * 30)
        : 0;
      return {
        ...perf,
        sno: offset + idx + 1,
        base_score: Math.round(baseScore * 100) / 100,
        on_time_response_percentage: Math.round(onTimePct * 100) / 100,
        late_response_count: Math.max(0, respondedLeads - (Number(perf.on_time_response_count) || 0)),
        search_appearance_count: Number(perf.search_appearance_count) || 0,
        has_lead_priority: hasLeadPriority(perf.overall_performance_score),
        lead_priority: getLeadPriorityTag(perf.overall_performance_score),
        avg_response_seconds: avgSeconds,
        avg_response_minutes: avgSeconds > 0 ? Math.round((avgSeconds / 60) * 10) / 10 : 0,
        rejection_rate_pct: Math.round(rejectionRate * 10000) / 100,
        auto_cancel_rate_pct: Math.round(autoCancelRate * 10000) / 100,
        rejection_penalty: Math.round(baseScore * penaltyRate * 100) / 100,
        product_quality_score: perf.product_quality_score !== null && perf.product_quality_score !== undefined
          ? Math.round(Number(perf.product_quality_score) * 100) / 100
          : null,
        score_breakdown: perf.score_breakdown ? (() => { try { return JSON.parse(perf.score_breakdown); } catch (e) { return null; } })() : null,
      };
    });

    const config = await getSystemConfig();
    const activeIds = new Set();
    const sellerIds = data.map((d) => Number(d.seller_id)).filter(Boolean);
    if (sellerIds.length > 0) {
      const active = await RequirementAssignments.findAll({
        where: { seller_id: { [Op.in]: sellerIds }, status: { [Op.in]: [0, 1, 2, 3] } },
        attributes: ['seller_id'],
        raw: true,
      });
      active.forEach((a) => activeIds.add(Number(a.seller_id)));
    }

    const period = getCurrentPeriod(config);
    const leadRowMap = new Map();
    if (sellerIds.length > 0) {
      const leadRows = await SellerLeadCount.findAll({
        where: { seller_id: { [Op.in]: sellerIds }, period_start: period.start },
        raw: true,
      });
      leadRows.forEach((r) => leadRowMap.set(Number(r.seller_id), r));
    }

    for (const d of data) {
      const limit = config.monthly_limit;
      const leadRow = leadRowMap.get(Number(d.seller_id));
      const leadUsed = leadRow ? Number(leadRow.leads_received) : 0;
      const leadLimit = leadRow ? Number(leadRow.limit_at_period_start) : config.monthly_limit;
      const leadRemaining = Math.max(0, leadLimit - leadUsed);
      d.lead_used = leadUsed;
      d.lead_limit = leadLimit;
      d.lead_remaining = leadRemaining;
      d.period_start = period.start;
      d.period_end = period.end;
      d.period_type = period.period_type;
      if (d.lead_receiving_enabled === false) {
        d.seller_status = { label: 'Lead Receiving Off', class: 'secondary' };
      } else if (activeIds.has(Number(d.seller_id))) {
        d.seller_status = { label: 'On Active Lead', class: 'warning' };
      } else if (leadRemaining <= 0) {
        d.seller_status = { label: 'Monthly Limit Reached', class: 'danger' };
      } else {
        d.seller_status = { label: 'Accepting Leads', class: 'success' };
      }
      d.monthly_limit = limit;
    }

    return res.json({
      data,
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerPerformanceDetail(req, res) {
  try {
    const sellerId = parseInt(req.params.id);
    const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
    if (!perf) return res.status(404).json({ message: 'Seller performance record not found' });

    const user = await Users.findByPk(sellerId, {
      attributes: ['id', 'fname', 'lname', 'email', 'mobile', 'created_at'],
      include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
    });
    if (!user) return res.status(404).json({ message: 'Seller not found' });

    const config = await getSystemConfig();
    const leadPeriod = getCurrentPeriod(config);
    const leadRow = await SellerLeadCount.findOne({
      where: { seller_id: sellerId, period_start: leadPeriod.start },
      raw: true,
    });
    const leadUsed = leadRow ? Number(leadRow.leads_received) : 0;
    const leadLimit = leadRow ? Number(leadRow.limit_at_period_start) : config.monthly_limit;
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const joined = user.created_at ? new Date(user.created_at) : now;
    const signupMonth = joined.getMonth() + 1;
    const signupYear = joined.getFullYear();

    let selMonth = parseInt(req.query.month);
    let selYear = parseInt(req.query.year);
    if (!selMonth || selMonth < 1 || selMonth > 12) selMonth = curMonth;
    if (!selYear || selYear < signupYear || selYear > curYear) selYear = curYear;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthExpr = fn('DATE_FORMAT', col('assigned_at'), '%Y-%m');
    const dayExpr = fn('DATE_FORMAT', col('assigned_at'), '%d');
    const sumStmt = (expr) => fn('SUM', literal(`status ${expr}`));
    const sumCase = (cond) => fn('SUM', literal(`CASE WHEN ${cond} THEN 1 ELSE 0 END`));

    // "On time" is always judged against the SLA currently configured, matching
    // the live counter written in assignmentHelper. Responded/on-time are keyed
    // off event timestamps rather than the assignment's current status, because a
    // completed lead is no longer status 2/3 and would drop out of those buckets.
    const slaMinutes = Number.parseInt(config.sla_minutes, 10);
    const onTimeSlaSeconds = (Number.isFinite(slaMinutes) && slaMinutes > 0 ? slaMinutes : 120) * 60;
    const RESPONDED_COND = 'responded_at IS NOT NULL';
    const ON_TIME_COND = `responded_at IS NOT NULL AND response_time_seconds IS NOT NULL AND response_time_seconds <= ${onTimeSlaSeconds}`;

    const perfAttrs = [
      [fn('COUNT', col('assignment_id')), 'total'],
      [sumStmt('= 0'), 'assigned'],
      [sumStmt('= 1'), 'viewed'],
      [sumStmt('= 2'), 'responded'],
      [sumStmt('= 3'), 'accepted'],
      [sumStmt('= 4'), 'rejected'],
      [sumStmt('= 5'), 'auto_cancelled'],
      [sumStmt('= 6'), 'completed'],
      [sumCase(RESPONDED_COND), 'responded_total'],
      [sumCase(ON_TIME_COND), 'on_time'],
    ];

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setHours(0, 0, 0, 0);

    // ---- Lead History chart scope ------------------------------------------
    // `chart_month` / `chart_year` are deliberately kept separate from the
    // report-period `month` / `year` params above: picking a month on the chart
    // must never re-scope the single-month counters or the PDF export.
    const chartMonthReq = parseInt(req.query.chart_month, 10);
    const chartYearReq = parseInt(req.query.chart_year, 10);
    const wantsSingleMonth = Number.isInteger(chartMonthReq) && chartMonthReq >= 1 && chartMonthReq <= 12
      && Number.isInteger(chartYearReq) && chartYearReq >= signupYear && chartYearReq <= curYear;

    let chartMonth = curMonth;
    let chartYear = curYear;
    if (wantsSingleMonth) {
      chartYear = chartYearReq;
      const lo = chartYear === signupYear ? signupMonth : 1;
      const hi = chartYear === curYear ? curMonth : 12;
      chartMonth = Math.min(Math.max(chartMonthReq, lo), hi);
    }

    const [breakdownRows, monthlyRows, periodRows, chartDayRows] = await Promise.all([
      RequirementAssignments.findAll({
        where: { seller_id: sellerId },
        attributes: perfAttrs,
        raw: true,
      }),
      RequirementAssignments.findAll({
        where: { seller_id: sellerId, assigned_at: { [Op.gte]: startDate } },
        attributes: [
          [monthExpr, 'month'],
          ...perfAttrs,
        ],
        group: [monthExpr],
        order: [[monthExpr, 'ASC']],
        raw: true,
      }),
      RequirementAssignments.findAll({
        where: {
          seller_id: sellerId,
          assigned_at: {
            [Op.gte]: new Date(selYear, selMonth - 1, 1),
            [Op.lt]: new Date(selYear, selMonth, 1),
          },
        },
        attributes: [
          [fn('COUNT', col('assignment_id')), 'total'],
          [sumStmt('= 6'), 'completed'],
          [sumStmt('= 5'), 'auto_cancelled'],
          [sumStmt('= 4'), 'rejected'],
          [sumCase(RESPONDED_COND), 'responded_total'],
          [sumCase(ON_TIME_COND), 'on_time'],
        ],
        raw: true,
      }),
      wantsSingleMonth
        ? RequirementAssignments.findAll({
          where: {
            seller_id: sellerId,
            assigned_at: {
              [Op.gte]: new Date(chartYear, chartMonth - 1, 1),
              [Op.lt]: new Date(chartYear, chartMonth, 1),
            },
          },
          attributes: [
            [dayExpr, 'day'],
            [fn('COUNT', col('assignment_id')), 'total'],
            [sumStmt('= 6'), 'completed'],
            [sumStmt('= 5'), 'auto_cancelled'],
            [sumCase(RESPONDED_COND), 'responded_total'],
            [sumCase(ON_TIME_COND), 'on_time'],
          ],
          group: [dayExpr],
          order: [[dayExpr, 'ASC']],
          raw: true,
        })
        : Promise.resolve([]),
    ]);

    const num = (v) => Number(v) || 0;
    const b = breakdownRows[0] || {};
    const p = periodRows[0] || {};
    const received = num(p.total);
    const completed = num(p.completed);
    const allTimeCompleted = num(b.completed);

    const feedbackRows = await RequirementAssignments.findAll({
      where: { seller_id: sellerId, status: 6 },
      attributes: ['assignment_id'],
      include: [{
        model: BuyerRequirements,
        as: 'requirement',
        required: true,
        where: { is_delete: 0, buyer_rating: { [Op.not]: null } },
        attributes: ['id', 'buyer_id', 'buyer_name', 'buyer_email', 'buyer_rating', 'buyer_feedback', 'product_name_snapshot', 'created_at'],
      }],
      order: [[{ model: BuyerRequirements, as: 'requirement' }, 'created_at', 'DESC']],
      raw: true,
      nest: true,
    });

    const feedback = (feedbackRows || []).map((r) => ({
      requirement_id: r.requirement.id,
      buyer_id: r.requirement.buyer_id,
      buyer_name: r.requirement.buyer_name,
      buyer_email: r.requirement.buyer_email,
      rating: r.requirement.buyer_rating,
      feedback: r.requirement.buyer_feedback,
      product_name: r.requirement.product_name_snapshot,
      created_at: r.requirement.created_at,
    }));

    // score_breakdown stores penalty_rate as a 0-1 fraction; the UI labels this
    // field "%", so normalise to a 0-100 percentage on both the primary and the
    // fallback path (they previously disagreed by a factor of 100).
    let penaltyRate = null;
    if (perf.score_breakdown) {
      try {
        const sb = JSON.parse(perf.score_breakdown);
        const stored = sb && sb.lead_metrics && sb.lead_metrics.penalty_rate;
        if (stored !== null && stored !== undefined && Number.isFinite(Number(stored))) {
          penaltyRate = Math.round(Number(stored) * 10000) / 100;
        }
      } catch (e) { penaltyRate = null; }
    }
    if (penaltyRate === null) {
      penaltyRate = num(b.total) > 0
        ? Math.round(((num(b.rejected) + num(b.auto_cancelled)) / num(b.total)) * 10000) / 100
        : 0;
    }

    const total_received = num(b.total);
    const conversion_rate = total_received > 0
      ? Math.round((allTimeCompleted / total_received) * 10000) / 100
      : 0;

    const allTimeResponded = num(b.responded_total);
    const allTimeOnTime = num(b.on_time);
    const allTimeAutoCancelled = num(b.auto_cancelled);
    const onTimePct = allTimeResponded > 0
      ? Math.round((allTimeOnTime / allTimeResponded) * 10000) / 100
      : 0;

    const monthly = (monthlyRows || []).map((r) => {
      const [y, m] = String(r.month).split('-').map(Number);
      const monthResponded = num(r.responded_total);
      return {
        month: String(r.month),
        label: `${monthNames[(m || 1) - 1]} ${String(y).slice(2)}`,
        received: num(r.total),
        completed: num(r.completed),
        responded: monthResponded,
        on_time: num(r.on_time),
        late: Math.max(0, monthResponded - num(r.on_time)),
        auto_cancelled: num(r.auto_cancelled),
        on_time_percentage: monthResponded > 0
          ? Math.round((num(r.on_time) / monthResponded) * 10000) / 100
          : 0,
      };
    });

    // A GROUP BY only returns the months/days that actually have assignments, so
    // the chart series is re-expanded over a fixed slot list: every month of the
    // rolling 12-month window (or every day of the selected month) is emitted, and
    // the empty ones become real zeros instead of missing axis labels.
    const emptyChartPoint = (key, label) => ({
      key,
      label,
      received: 0,
      responded: 0,
      on_time: 0,
      late: 0,
      auto_cancelled: 0,
      completed: 0,
      on_time_percentage: 0,
    });

    const toChartPoint = (key, label, row) => {
      const responded = num(row.responded_total);
      const onTime = num(row.on_time);
      return {
        key,
        label,
        received: num(row.total),
        responded,
        on_time: onTime,
        late: Math.max(0, responded - onTime),
        auto_cancelled: num(row.auto_cancelled),
        completed: num(row.completed),
        on_time_percentage: responded > 0
          ? Math.round((onTime / responded) * 10000) / 100
          : 0,
      };
    };

    let chartPoints;
    if (wantsSingleMonth) {
      const daysInMonth = new Date(chartYear, chartMonth, 0).getDate();
      const byDay = new Map((chartDayRows || []).map((r) => [String(r.day).padStart(2, '0'), r]));
      chartPoints = Array.from({ length: daysInMonth }, (_, i) => {
        const key = String(i + 1).padStart(2, '0');
        const label = String(i + 1);
        const row = byDay.get(key);
        return row ? toChartPoint(key, label, row) : emptyChartPoint(key, label);
      });
    } else {
      const byMonth = new Map((monthlyRows || []).map((r) => [String(r.month), r]));
      chartPoints = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(curYear, curMonth - 12 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        const row = byMonth.get(key);
        return row ? toChartPoint(key, label, row) : emptyChartPoint(key, label);
      });
    }

    const score = Number(perf.overall_performance_score) || 0;
    const avgSeconds = Number(perf.average_response_time_seconds) || 0;
    return res.json({
      seller: user,
      period: {
        month: selMonth,
        year: selYear,
        label: `${monthNames[selMonth - 1]} ${selYear}`,
      },
      guard: { cur_month: curMonth, cur_year: curYear, signup_month: signupMonth, signup_year: signupYear },
      overall_performance_score: score,
      has_lead_priority: hasLeadPriority(score),
      lead_priority: getLeadPriorityTag(score),
      sla_minutes: config.sla_minutes,
      penalty_rate: penaltyRate,
      conversion_rate,
      avg_response_minutes: avgSeconds ? Math.round((avgSeconds / 60) * 10) / 10 : 0,
      search_appearance_count: num(perf.search_appearance_count),
      monthly_limit: config.monthly_limit,
      selected: { received, completed, remaining: Math.max(0, config.monthly_limit - received) },
      lead_usage: {
        period_start: leadPeriod.start,
        period_end: leadPeriod.end,
        period_type: leadPeriod.period_type,
        used: leadUsed,
        limit: leadLimit,
        remaining: Math.max(0, leadLimit - leadUsed),
      },
      aggregate: {
        total_received,
        completed: allTimeCompleted,
        responded: allTimeResponded,
        on_time: allTimeOnTime,
        late: Math.max(0, allTimeResponded - allTimeOnTime),
        on_time_percentage: onTimePct,
        rejected: num(b.rejected),
        auto_cancelled: allTimeAutoCancelled,
      },
      period_metrics: {
        received,
        responded: num(p.responded_total),
        on_time: num(p.on_time),
        late: Math.max(0, num(p.responded_total) - num(p.on_time)),
        auto_cancelled: num(p.auto_cancelled),
        rejected: num(p.rejected),
        completed,
      },
      feedback,
      lead_receiving_enabled: perf.lead_receiving_enabled === false ? 0 : 1,
      monthly,
      // Only the Lead History chart reads this. Same columns as `monthly`, but
      // zero-filled and day-granular when chart_month/chart_year are supplied.
      chart: {
        mode: wantsSingleMonth ? 'month' : '12_months',
        granularity: wantsSingleMonth ? 'day' : 'month',
        month: chartMonth,
        year: chartYear,
        label: wantsSingleMonth ? `${monthNames[chartMonth - 1]} ${chartYear}` : 'Last 12 Months',
        points: chartPoints,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateSellerPerformanceSettings(req, res) {
  try {
    const { id } = req.params;
    const { lead_receiving_enabled, monthly_leads_limit } = req.body;

    const perf = await SellerPerformance.findOne({ where: { seller_id: parseInt(id) } });
    if (!perf) return res.status(404).json({ message: 'Seller performance record not found' });

    const updates = {};
    if (lead_receiving_enabled !== undefined) updates.lead_receiving_enabled = lead_receiving_enabled ? 1 : 0;
    await perf.update(updates);

    return res.json({ message: 'Settings updated', data: perf });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateSystemConfig(req, res) {
  try {
    const {
      lead_sla_minutes, lead_monthly_limit, lead_period_type,
      max_reassignment_attempts,
      performance_weight_leads, performance_weight_products, performance_weight_buyer_rating,
    } = req.body;

    if (max_reassignment_attempts !== undefined) {
      const n = Number(max_reassignment_attempts);
      if (!Number.isInteger(n) || n <= 0) {
        return res.status(400).json({ message: 'max_reassignment_attempts must be a positive integer' });
      }
    }

    const PERIOD_TYPES = ['weekly', 'monthly', '6-monthly', 'yearly'];
    if (lead_period_type !== undefined && !PERIOD_TYPES.includes(lead_period_type)) {
      return res.status(400).json({ message: 'lead_period_type must be one of: weekly, monthly, 6-monthly, yearly' });
    }

    const weightKeys = ['performance_weight_leads', 'performance_weight_products', 'performance_weight_buyer_rating'];
    const weightInputs = { performance_weight_leads, performance_weight_products, performance_weight_buyer_rating };
    const weightValues = weightKeys.filter((k) => weightInputs[k] !== undefined);
    if (weightValues.length > 0) {
      if (weightValues.length !== weightKeys.length) {
        return res.status(400).json({ message: 'All three performance weights must be provided together' });
      }
      for (const k of weightKeys) {
        const v = Number(weightInputs[k]);
        if (Number.isNaN(v) || v < 0) {
          return res.status(400).json({ message: `${k} must be a non-negative number` });
        }
        weightInputs[k] = v;
      }
      const sum = weightKeys.reduce((acc, k) => acc + weightInputs[k], 0);
      if (Math.abs(sum - 1) > 1e-4) {
        return res.status(400).json({ message: 'Performance weights must sum to 1.0' });
      }
    }

    const updates = {};
    const fields = {
      lead_sla_minutes, lead_monthly_limit, lead_period_type,
      max_reassignment_attempts,
      performance_weight_leads, performance_weight_products, performance_weight_buyer_rating,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
        const existing = await SiteSettings.findOne({ where: { meta_key: key } });
        if (existing) {
          await existing.update({ meta_value: String(value) });
        } else {
          await SiteSettings.create({ meta_key: key, meta_value: String(value) });
        }
      }
    }

    return res.json({ message: 'Configuration updated', data: updates });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSystemConfigAdmin(req, res) {
  try {
    const settings = await SiteSettings.findAll({
      where: {
        meta_key: { [Op.in]: ['lead_sla_minutes', 'lead_monthly_limit', 'lead_period_type', 'lead_candidate_pool_size', 'max_reassignment_attempts', 'performance_weight_leads', 'performance_weight_products', 'performance_weight_buyer_rating'] },
      },
      raw: true,
    });
    const config = {};
    settings.forEach(s => { config[s.meta_key] = s.meta_value; });
    return res.json({
      lead_sla_minutes: parseInt(config.lead_sla_minutes) || 120,
      lead_monthly_limit: parseInt(config.lead_monthly_limit) || 6,
      lead_period_type: config.lead_period_type || 'monthly',
      // lead_candidate_pool_size: parseInt(config.lead_candidate_pool_size) || 15,
      lead_candidate_pool_size: 15,
      max_reassignment_attempts: parseInt(config.max_reassignment_attempts) || 15,
      performance_weight_leads: parseFloat(config.performance_weight_leads) || 0.60,
      performance_weight_products: parseFloat(config.performance_weight_products) || 0.30,
      performance_weight_buyer_rating: parseFloat(config.performance_weight_buyer_rating) || 0.10,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementChartData(req, res) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const data = await BuyerRequirements.findAll({
      where: {
        is_delete: 0,
        created_at: { [Op.gte]: startDate },
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('requirement_id')), 'count'],
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellersForAssign(req, res) {
  try {
    const { search = '', requirementId } = req.query;
    const requirement = requirementId
      ? await BuyerRequirements.findByPk(parseInt(requirementId))
      : null;
    const useRequirement = requirement && !requirement.is_delete;

    const attrs = ['id', 'fname', 'lname', 'email', 'mobile'];
    const baseInclude = [
      { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
      {
        model: Cities, as: 'city_data',
        attributes: ['id', 'name'],
        include: [{ model: States, as: 'States', attributes: ['name'] }],
      },
      { model: States, as: 'state_data', attributes: ['name'] },
    ];

    if (!useRequirement || !requirement.product_keyword_id) {
      const where = { is_seller: 1, status: 1, is_delete: 0, is_approve: 1 };
      if (search && search.trim()) {
        const like = `%${search.trim()}%`;
        where[Op.or] = [
          { fname: { [Op.like]: like } },
          { lname: { [Op.like]: like } },
          { email: { [Op.like]: like } },
          { user_company: { [Op.like]: like } },
        ];
      }
      const sellers = await Users.findAll({
        where,
        attributes: attrs,
        include: baseInclude,
        limit: 50,
      });
      return res.json({ sellers, message: '' });
    }

    // Only sellers who actually have the required product are allowed in the list.
    const config = await getSystemConfig();
    // No product with this keyword exists anywhere in the system -> block assignment.
    if (!(await isProductAvailableForKeyword(requirement.product_keyword_id))) {
      const hadSeller = (await RequirementAssignments.count({ where: { requirement_id: requirement.id } })) > 0;
      return res.json({
        sellers: [],
        message: hadSeller ? 'No Seller Found' : 'Product is not available in the system.',
        productAvailable: false,
      });
    }
    const candidates = await findEligibleSellers(requirement, config.candidate_pool_size);
    if (candidates.length === 0) {
      return res.json({ sellers: [], message: 'No Seller Found', productAvailable: true });
    }

    const enriched = await enrichSellers(candidates, requirement);

    // Same eligibility + supplier-preference rules as the auto-assignment, so the
    // list only contains sellers the system could actually assign.
    const evaluated = await evaluateSellerEligibility(enriched, requirement);
    for (const s of evaluated) {
      const chk = matchesSupplierPreference({ city: s.city, state: s.state_name }, requirement);
      if (!chk.matches) {
        s.is_eligible = false;
        s.reasons.push(chk.reason);
      }
    }
    const eligibleSellers = evaluated.filter((s) => s.is_eligible);

    const rankByTotal = async (list) => {
      if (list.length === 0) return [];
      const ranked = await rankCandidates(
        list.map((s) => ({ seller_id: s.seller_id, match_level: s.match_level, match_score: s.match_score })),
        requirement
      );
      const score = new Map(ranked.map((r) => [r.seller_id, r.total_score]));
      return [...list].sort((a, b) => (score.get(b.seller_id) || 0) - (score.get(a.seller_id) || 0));
    };

    // Same ordering the actual assignment uses: eligible same-city sellers (ranked)
    // first; otherwise the nearest-distance group (ranked), then the rest by distance.
    let ordered = [];
    if (eligibleSellers.length > 0) {
      const sameCityEligible = eligibleSellers.filter((s) => s.same_city);
      if (sameCityEligible.length > 0) {
        ordered = [...await rankByTotal(sameCityEligible.slice(0, 10))];
        const others = eligibleSellers
          .filter((s) => !s.same_city)
          .sort((a, b) => ((a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)));
        ordered = [...ordered, ...others];
      } else {
        const withDist = eligibleSellers
          .filter((s) => s.distance_km != null)
          .sort((a, b) => a.distance_km - b.distance_km);
        const minKm = withDist.length ? Math.round(withDist[0].distance_km) : null;
        const nearestGroup = minKm == null
          ? []
          : withDist.filter((s) => Math.round(s.distance_km) === minKm);
        const rest = eligibleSellers
          .filter((s) => !nearestGroup.includes(s))
          .sort((a, b) => ((a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)));
        const rankedNearest = await rankByTotal(nearestGroup.slice(0, 10));
        const rankedRest = await rankByTotal(rest.slice(0, 20));
        ordered = [...rankedNearest, ...rankedRest];
      }
    } else {
      ordered = evaluated.filter((s) => s.same_city);
    }

    if (search && search.trim()) {
      const q = normalizeText(search);
      ordered = ordered.filter((e) => normalizeText(e.name).includes(q) || normalizeText(e.company).includes(q));
    }

    if (ordered.length === 0) {
      const msg = search && search.trim()
        ? 'No seller found matching the search for this product.'
        : 'No Seller Found';
      return res.json({ sellers: [], message: msg, productAvailable: true });
    }

    const hasSameCity = eligibleSellers.some((e) => e.same_city);

    const userRows = await Users.findAll({
      where: { id: { [Op.in]: ordered.map((t) => t.seller_id) } },
      attributes: attrs,
      include: baseInclude,
    });
    const byId = new Map(userRows.map((u) => [Number(u.id), u]));
    const sellers = ordered
      .map((t) => {
        const u = byId.get(Number(t.seller_id));
        if (!u) return null;
        return {
          ...u.get({ plain: true }),
          match_level: t.match_level ?? null,
          match_score: t.match_score !== undefined && t.match_score !== null ? Math.round(Number(t.match_score) * 100) / 100 : null,
          distance_km: t.distance_km != null ? Math.round(Number(t.distance_km)) : null,
          same_city: !!t.same_city,
        };
      })
      .filter(Boolean);

    let message = '';
    if (!hasSameCity && !search.trim()) {
      message = 'No seller found for this product in the same city.';
    }

    return res.json({ sellers, message, productAvailable: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminAssignSeller(req, res) {
  try {
    const { id } = req.params;
    const { seller_id } = req.body;
    if (!seller_id) return res.status(400).json({ message: 'seller_id is required' });
    const ipAddress = getClientIp(req);
    const result = await manualAssignSellerToRequirement(parseInt(id), parseInt(seller_id), ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Seller assigned successfully', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminUpdateRequirementStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status === undefined) return res.status(400).json({ message: 'status is required' });
    const ipAddress = getClientIp(req);
    const result = await adminChangeRequirementStatus(parseInt(id), status, ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Status updated successfully', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminCloseRequirementAction(req, res) {
  try {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const result = await adminCloseRequirement(parseInt(id), ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Requirement closed successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAllAssignmentsHistory(req, res) {
  try {
    const { page = 1, limit = 25, search = '', status: statusFilter, from, to } = req.query;
    const conditions = ['1 = 1'];
    const replacements = {};

    if (statusFilter !== undefined && statusFilter !== '') {
      conditions.push('r.status = :status');
      replacements.status = parseInt(statusFilter);
    }
    if (from) {
      conditions.push('r.created_at >= :from');
      replacements.from = new Date(from);
    }
    if (to) {
      conditions.push('r.created_at <= :to');
      replacements.to = new Date(to);
    }
    if (search) {
      replacements.searchProduct = `%${search}%`;
      replacements.searchBuyerName = `%${search}%`;
      replacements.searchBuyerEmail = `%${search}%`;
      replacements.searchBuyerCompany = `%${search}%`;
      conditions.push('(r.product_name_snapshot LIKE :searchProduct OR r.buyer_name LIKE :searchBuyerName OR r.buyer_email LIKE :searchBuyerEmail OR r.buyer_company LIKE :searchBuyerCompany)');
    }

    const fromSql = 'FROM requirement_activity_log AS activity INNER JOIN buyer_requirements AS r ON r.requirement_id = activity.requirement_id';
    const whereSql = `WHERE ${conditions.join(' AND ')}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const idRows = await sequelize.query(
      `SELECT DISTINCT r.requirement_id, r.created_at ${fromSql} ${whereSql} ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit: parseInt(limit), offset },
        type: QueryTypes.SELECT,
      },
    );
    const countRows = await sequelize.query(
      `SELECT COUNT(DISTINCT activity.requirement_id) AS count ${fromSql} ${whereSql}`,
      { replacements, type: QueryTypes.SELECT },
    );

    const ids = idRows.map((row) => row.requirement_id);
    const rows = ids.length
      ? await BuyerRequirements.findAll({
          where: { id: { [Op.in]: ids } },
          include: [
            { model: Categories, as: 'category', attributes: ['name'] },
            {
              model: RequirementAssignments,
              as: 'assignments',
              include: [{
                model: Users,
                as: 'seller',
                attributes: ['id', 'fname', 'lname', 'email', 'mobile'],
                include: [{ model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] }],
              }],
              order: [['assignment_number', 'ASC']],
            },
          ],
        })
      : [];
    const rowsById = new Map(rows.map((row) => [Number(row.id), row]));
    const data = ids
      .map((id) => rowsById.get(Number(id)))
      .filter(Boolean)
      .map((r) => ({
        id: r.id,
        created_at: r.created_at,
        status: r.status,
        product_name_snapshot: r.product_name_snapshot,
        quantity: r.quantity,
        quantity_unit: r.quantity_unit,
        category: r.category?.name ? { id: null, name: r.category.name } : null,
        buyer_id: r.buyer_id,
        buyer_name: r.buyer_name,
        buyer_email: r.buyer_email,
        buyer_company: r.buyer_company,
        buyer_city: r.buyer_city,
        buyer_state: r.buyer_state,
        assignments: (r.assignments || []).map((a) => ({
          id: a.id,
          status: a.status,
          product_match_score: a.product_match_score,
          product_match_level: a.product_match_level,
          reassignment_reason: a.reassignment_reason,
          is_reassigned: a.is_reassigned,
          assignment_note: a.assignment_note,
          assigned_at: a.assigned_at,
          seller: a.seller
            ? {
                id: a.seller.id,
                fname: a.seller.fname,
                lname: a.seller.lname,
                email: a.seller.email,
                mobile: a.seller.mobile,
                company_info: a.seller.company_info
                  ? { organization_name: a.seller.company_info.organization_name || null }
                  : null,
              }
            : null,
        })),
      }));
    const count = Number(countRows[0]?.count || 0);

    return res.json({
      data,
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getAllAssignmentsHistory error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAllRequirements,
  getRequirementDetailAdmin,
  getRequirementCounts,
  getSellersForAssign,
  adminAssignSeller,
  adminUpdateRequirementStatus,
  adminCloseRequirementAction,
  getAllAssignmentsHistory,
  getSellerPerformanceAdmin,
  getSellerPerformanceDetail,
  updateSellerPerformanceSettings,
  updateSystemConfig,
  getSystemConfigAdmin,
  getRequirementChartData,
};
