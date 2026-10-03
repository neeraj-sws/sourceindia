const { Op, fn, col, literal } = require('sequelize');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const SellerPerformance = require('../models/SellerPerformance');
const SellerLeadCount = require('../models/SellerLeadCount');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const { getSystemConfig, hasLeadPriority, getLeadPriorityTag } = require('../helpers/requirementHelper');
const { getCurrentPeriod } = require('../helpers/leadLimitHelper');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Builds the single-seller performance report.
 *
 * This is the one and only implementation of the report calculation. The admin
 * detail endpoint and the seller-facing "my performance" endpoint both call it;
 * the only thing that differs between the two callers is where `sellerId` comes
 * from (an admin-supplied path param vs. the authenticated seller's own token).
 *
 * Callers must resolve `sellerId` themselves and must never take it from an
 * untrusted request body/query on the seller-facing path.
 *
 * @param {number} sellerId  Seller whose report is built.
 * @param {object} [query]   Optional report-period params: month, year,
 *                           chart_month, chart_year.
 * @param {object} [options]
 * @param {boolean} [options.includeFeedback=true]
 *   Whether to load the buyer feedback rows. Left off for the seller-facing
 *   endpoint, which does not render them, so the extra query is skipped and the
 *   payload stays limited to the seller's own metrics.
 * @returns {Promise<{status: number, body: object}>} Ready-to-send response.
 */
async function getSellerPerformanceDetailData(sellerId, query = {}, options = {}) {
  const { includeFeedback = true } = options;
  const q = query || {};

  const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
  if (!perf) return { status: 404, body: { message: 'Seller performance record not found' } };

  const user = await Users.findByPk(sellerId, {
    attributes: ['id', 'fname', 'lname', 'email', 'mobile', 'created_at'],
    include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
  });
  if (!user) return { status: 404, body: { message: 'Seller not found' } };

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

  let selMonth = parseInt(q.month);
  let selYear = parseInt(q.year);
  if (!selMonth || selMonth < 1 || selMonth > 12) selMonth = curMonth;
  if (!selYear || selYear < signupYear || selYear > curYear) selYear = curYear;

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
  const chartMonthReq = parseInt(q.chart_month, 10);
  const chartYearReq = parseInt(q.chart_year, 10);
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
      label: `${MONTH_NAMES[(m || 1) - 1]} ${String(y).slice(2)}`,
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
      const label = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      const row = byMonth.get(key);
      return row ? toChartPoint(key, label, row) : emptyChartPoint(key, label);
    });
  }

  let feedback = [];
  if (includeFeedback) {
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

    feedback = (feedbackRows || []).map((r) => ({
      requirement_id: r.requirement.id,
      buyer_id: r.requirement.buyer_id,
      buyer_name: r.requirement.buyer_name,
      buyer_email: r.requirement.buyer_email,
      rating: r.requirement.buyer_rating,
      feedback: r.requirement.buyer_feedback,
      product_name: r.requirement.product_name_snapshot,
      created_at: r.requirement.created_at,
    }));
  }

  const score = Number(perf.overall_performance_score) || 0;
  const avgSeconds = Number(perf.average_response_time_seconds) || 0;

  return {
    status: 200,
    body: {
      seller: user,
      period: {
        month: selMonth,
        year: selYear,
        label: `${MONTH_NAMES[selMonth - 1]} ${selYear}`,
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
        label: wantsSingleMonth ? `${MONTH_NAMES[chartMonth - 1]} ${chartYear}` : 'Last 12 Months',
        points: chartPoints,
      },
    },
  };
}

module.exports = { getSellerPerformanceDetailData };