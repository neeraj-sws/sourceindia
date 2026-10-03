import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import Breadcrumb from "../common/Breadcrumb";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, ChartDataLabels);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SellerPerformanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useAlert();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selMonth, setSelMonth] = useState(null);
  const [selYear, setSelYear] = useState(null);
  // Lead History chart scope. chartMonth === 0 means the default 12-month
  // overview; any other value drills into that single month of chartYear.
  const [chartMonth, setChartMonth] = useState(0);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selMonth) params.month = selMonth;
      if (selYear) params.year = selYear;
      if (chartMonth) {
        params.chart_month = chartMonth;
        params.chart_year = chartYear;
      }
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/seller-performance/${id}/details`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDetail(res.data);
      if (selMonth === null) {
        setSelMonth(res.data.guard.cur_month);
        setSelYear(res.data.guard.cur_year);
      }
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load report", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDetail(); }, [id, selMonth, selYear, chartMonth, chartYear]);

  const toggleLeadReceiving = async (sellerId, current) => {
    const next = current ? 0 : 1;
    try {
      await axios.put(`${API_BASE_URL}/admin/buyer-requirements/seller-performance/${sellerId}`,
        { lead_receiving_enabled: next },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showNotification("Updated", "success");
      setDetail((d) => ({ ...d, lead_receiving_enabled: next }));
    } catch {
      showNotification("Update failed", "error");
    }
  };

  const downloadPDF = () => {
    if (!detail) return;
    const {
      seller, period, selected, overall_performance_score, penalty_rate, avg_response_minutes,
      monthly, conversion_rate, lead_priority, sla_minutes, search_appearance_count, aggregate,
    } = detail;
    const name = `${seller?.fname || ""} ${seller?.lname || ""}`.trim() || "-";
    const joined = seller?.created_at ? format(new Date(seller.created_at), "dd MMM yyyy") : "-";
    const meRow = (m) =>
      `<tr><td>${m.label}</td><td>${m.received}</td><td>${m.responded ?? 0}</td><td>${m.on_time ?? 0}</td><td>${m.auto_cancelled ?? 0}</td><td>${m.completed}</td></tr>`;
    const html = `<html><head><title>Seller Report</title><style>
      body{font-family:Arial,Helvetica,sans-serif;color:#333;padding:24px}
      h2{margin:0 0 2px} .muted{color:#777;margin-bottom:14px}
      .meta{margin:4px 0 14px;color:#555;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
      th,td{border:1px solid #ddd;padding:7px 9px;text-align:left}
      th{background:#f1f1f1}
      tr:last-child td{font-weight:700;background:#f7f7f7}
      .badge-print{display:inline-block;background:#198754;color:#fff;border-radius:999px;padding:3px 10px;font-size:12px}
      .grid-print{display:flex;gap:12px;margin:14px 0;flex-wrap:wrap}
      .box{flex:1;min-width:130px;border:1px solid #eee;border-radius:8px;padding:10px}
      .box b{display:block;font-size:18px} .box span{color:#777;font-size:12px}
    </style></head><body>
      <h2>Seller Performance Report</h2>
      <div class="muted">${name} ${seller?.company_info?.organization_name ? "&middot; " + seller.company_info.organization_name : ""} &middot; Joined ${joined}</div>
      <div>Period: <b>${period.label}</b> &nbsp;&nbsp; Conversion Efficiency: <span class="badge-print">${conversion_rate}%</span>
        &nbsp;&nbsp; Lead Priority: <span class="badge-print">${lead_priority?.label || "Standard"}</span></div>
      <div class="grid-print">
        <div class="box"><b>${overall_performance_score} / 100</b><span>Overall Score</span></div>
        <div class="box"><b>${penalty_rate}%</b><span>Penalty Rate</span></div>
        <div class="box"><b>${avg_response_minutes} min</b><span>Avg Response</span></div>
        <div class="box"><b>${aggregate?.total_received ?? 0}</b><span>Total Leads (all-time)</span></div>
        <div class="box"><b>${aggregate?.on_time ?? 0} (${aggregate?.on_time_percentage ?? 0}%)</b><span>Responded On Time</span></div>
        <div class="box"><b>${aggregate?.late ?? 0}</b><span>Late Responses</span></div>
        <div class="box"><b>${aggregate?.auto_cancelled ?? 0}</b><span>Auto-Cancelled</span></div>
        <div class="box"><b>${search_appearance_count ?? 0}</b><span>Search Appearances</span></div>
        <div class="box"><b>${selected.received}</b><span>Leads This Month</span></div>
        <div class="box"><b>${selected.completed}</b><span>Completed</span></div>
        <div class="box"><b>${selected.remaining}</b><span>Leads Remaining</span></div>
      </div>
      <div class="muted">On time is measured against the current SLA of ${sla_minutes ?? "-"} minutes.</div>
      <table><thead><tr><th>Month</th><th>Received</th><th>Responded</th><th>On Time</th><th>Auto Cancelled</th><th>Completed</th></tr></thead>
        <tbody>${monthly.map(meRow).join("")}
        </tbody></table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (!win) { showNotification("Please allow pop-ups to download PDF", "error"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  // Callback ref for the chart instance. Besides holding the instance, it wires up
  // an explicit mouseleave handler: chart.js' built-in `mouseout` handling could
  // leave the tooltip painted over the chart, and clearing the active/tooltip
  // element lists guarantees the tooltip is hover-only.
  const chartCanvasCleanup = useRef(null);
  const attachChart = useCallback((instance) => {
    if (chartCanvasCleanup.current) {
      chartCanvasCleanup.current.canvas.removeEventListener("mouseleave", chartCanvasCleanup.current.hide);
      chartCanvasCleanup.current = null;
    }
    if (!instance?.canvas) return;
    const hide = () => {
      instance.setActiveElements([]);
      instance.tooltip?.setActiveElements([], { x: 0, y: 0 });
      instance.update();
    };
    instance.canvas.addEventListener("mouseleave", hide);
    chartCanvasCleanup.current = { canvas: instance.canvas, hide };
  }, []);

  useEffect(() => () => {
    if (chartCanvasCleanup.current) {
      chartCanvasCleanup.current.canvas.removeEventListener("mouseleave", chartCanvasCleanup.current.hide);
      chartCanvasCleanup.current = null;
    }
  }, []);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
        </div>
      </div>
    );
  }
  if (!detail) return <p>Report not found</p>;

  // lead_usage and monthly_limit are still destructured (not removed) for the commented-out
  // "Period Limit Used" card in statCards; restore them there.
  // eslint-disable-next-line no-unused-vars
  const { seller, guard, period, monthly, selected, lead_usage, overall_performance_score, penalty_rate, avg_response_minutes, monthly_limit, lead_priority, aggregate, period_metrics, search_appearance_count, sla_minutes } = detail;
  const sellerName = `${seller?.fname || ""} ${seller?.lname || ""}`.trim() || "-";
  const company = seller?.company_info?.organization_name || "-";
  const joinedText = seller?.created_at ? format(new Date(seller.created_at), "dd MMM yyyy") : "-";
  const initials = sellerName.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const years = [];
  for (let y = guard.signup_year; y <= guard.cur_year; y++) years.push(y);

  const enabledRange = (y) => {
    let min = y === guard.signup_year ? guard.signup_month : 1;
    let max = y === guard.cur_year ? guard.cur_month : 12;
    if (min > max) min = max;
    return { min, max };
  };

  const handleYearChange = (e) => {
    const y = Number(e.target.value);
    const { min, max } = enabledRange(y);
    setSelYear(y);
    setSelMonth((m) => Math.min(Math.max(m, min), max));
  };

  const handleMonthChange = (e) => setSelMonth(Number(e.target.value));

  const { min: yearMin, max: yearMax } = enabledRange(selYear);

  // Lead History chart dropdowns. 0 = "Last 12 Months"; any other value is a real
  // month that is clamped into the seller's selectable range (see the backend,
  // which clamps independently).
  const { min: chartYearMin, max: chartYearMax } = enabledRange(chartYear);

  const handleChartMonthChange = (e) => {
    const v = Number(e.target.value);
    if (!v) {
      setChartMonth(0);
      return;
    }
    const clamped = Math.min(Math.max(v, chartYearMin), chartYearMax);
    if (chartYear < guard.signup_year || chartYear > guard.cur_year) setChartYear(guard.cur_year);
    setChartMonth(clamped);
  };

  const handleChartYearChange = (e) => {
    const y = Number(e.target.value);
    setChartYear(y);
    setChartMonth((m) => {
      if (!m) return m;
      const lo = y === guard.signup_year ? guard.signup_month : 1;
      const hi = y === guard.cur_year ? guard.cur_month : 12;
      return Math.min(Math.max(m, lo), hi);
    });
  };

  const statCards = [
    { label: "Overall Score", value: `${overall_performance_score} / 100`, sub: "performance score", cls: "text-primary", icon: "bx-line-chart" },
    { label: "Avg Response", value: `${avg_response_minutes} min`, sub: "response time", cls: "text-warning", icon: "bx-time-five" },
    { label: "Total Completed", value: aggregate?.completed ?? 0, sub: "leads completed", cls: "text-success", icon: "bx-check-circle" },
    // "Period Limit Used" card hidden from display (UI only) - uncomment to restore:
    // { label: "Period Limit Used", value: `${lead_usage?.used ?? 0} / ${lead_usage?.limit ?? "-"}`, sub: `${lead_usage?.remaining ?? 0} remaining this ${lead_usage?.period_type ?? "period"}`, cls: "text-info", icon: "bx-calendar-check" },
  ];

  const leadMetricCards = [
    { label: "Total Leads Received", value: aggregate?.total_received ?? 0, sub: "all-time assignments", cls: "text-primary" },
    // { label: "Responded On Time", value: aggregate?.on_time ?? 0, sub: `${aggregate?.on_time_percentage ?? 0}% of responses · SLA ${sla_minutes ?? "-"} min`, cls: "text-success" },
    {
  label: "On-Time Response",
  value: `${aggregate?.on_time_percentage ?? 0}%`,
  sub: `${aggregate?.on_time ?? 0} of ${aggregate?.responded ?? 0} responses · SLA ${sla_minutes ?? "-"} min`,
  cls: "text-success",
},
    // { label: "Late Responses", value: aggregate?.late ?? 0, sub: "responded after the SLA", cls: "text-danger" },
    { label: "Auto-Cancelled", value: aggregate?.auto_cancelled ?? 0, sub: "no action taken in SLA", cls: "text-dark" },
    { label: "Search Appearances", value: search_appearance_count ?? 0, sub: "matched in buyer requirement searches", cls: "text-info" },
    // { label: "Penalty Rate", value: `${penalty_rate ?? 0}%`, sub: "rejected + auto-cancelled", cls: "text-warning" },
    // { label: `${period.label} Leads`, value: period_metrics?.received ?? 0, sub: `${period_metrics?.on_time ?? 0} on time · ${period_metrics?.auto_cancelled ?? 0} auto-cancelled`, cls: "text-secondary" },
  ];

  // The Monthly Breakdown table and the PDF export keep using the original sparse
  // `monthly` payload; only the chart below reads the zero-filled `chart` series.
  const monthlySeries = (monthly || []).slice(-12);

  const chart = detail.chart || null;
  const chartSeries = chart?.points || [];
  const chartIsDaily = chart?.granularity === "day";
  const chartLabel = chart?.label || "Last 12 Months";
  const chartEmptyText = chartIsDaily
    ? `No lead history for ${chartLabel}.`
    : "No lead history in the last 12 months.";
  const hasChartData = chartSeries.some((p) => (p.received || 0) > 0);

  // Auto-scale with headroom so a seller whose best month is 2-3 leads still gets
  // a readable y-axis instead of a dead-flat line pinned between 0 and 2.
  const chartPeak = chartSeries.reduce(
    (peak, p) => Math.max(peak, p.received || 0, p.responded || 0, p.on_time || 0, p.auto_cancelled || 0),
    0
  );
  const chartYMax = chartPeak > 0 ? Math.max(4, Math.ceil(chartPeak * 1.25)) : 4;

  const historyChartData = hasChartData ? {
    labels: chartSeries.map((p) => p.label),
    datasets: [
      {
        type: "line",
        label: "Leads Received",
        data: chartSeries.map((p) => p.received || 0),
        borderColor: "#17a2b8",
        backgroundColor: "rgba(23,162,184,0.15)",
        pointBackgroundColor: "#17a2b8",
        tension: 0.3,
        fill: true,
      },
      {
        type: "line",
        label: "Responded",
        data: chartSeries.map((p) => p.responded || 0),
        borderColor: "#0d6efd",
        backgroundColor: "transparent",
        pointBackgroundColor: "#0d6efd",
        tension: 0.3,
      },
      {
        type: "line",
        label: "Responded On Time",
        data: chartSeries.map((p) => p.on_time || 0),
        borderColor: "#198754",
        backgroundColor: "transparent",
        pointBackgroundColor: "#198754",
        tension: 0.3,
      },
      {
        type: "line",
        label: "Auto-Cancelled",
        data: chartSeries.map((p) => p.auto_cancelled || 0),
        borderColor: "#dc3545",
        backgroundColor: "transparent",
        borderDash: [6, 4],
        pointBackgroundColor: "#dc3545",
        tension: 0.3,
      },
    ],
  } : null;

  const historyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
    plugins: {
      legend: { position: "top" },
      tooltip: {
        // Hover-only: no `external` handler that could leave the tooltip painted,
        // and an explicit mode/interact pair so it tracks the pointer rather than
        // latching onto the nearest index.
        enabled: true,
        mode: "index",
        intersect: false,
        external: false,
        animation: { duration: 0 },
        callbacks: {
          afterBody: (items) => {
            const p = chartSeries[items[0]?.dataIndex];
            return p ? `On-time rate: ${p.on_time_percentage ?? 0}%` : "";
          },
        },
      },
      datalabels: { display: false },
    },
    scales: {
      y: { beginAtZero: true, suggestedMax: chartYMax, ticks: { precision: 0 } },
      x: {
        grid: { display: false },
        // Pin the tick budget to the real point count: chart.js measures label
        // widths and silently thins ticks that would overlap, so the month view
        // allows all 12 (and falls back to autoSkip on narrow screens rather than
        // clipping), while the day view is capped at 16 to stay legible.
        ticks: chartIsDaily
          ? { autoSkip: true, maxTicksLimit: 16, maxRotation: 0, minRotation: 0, padding: 4 }
          : { autoSkip: true, maxTicksLimit: 12, maxRotation: 0, minRotation: 0, padding: 4 },
      },
    },
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Seller Performance" page="Reporting" title="Seller Performance Report" actions={
          <button className="btn btn-sm btn-light mb-2" onClick={() => navigate("/admin/seller-performance")}>← Back</button>
        } />

        <div className="card card-border radius-2 mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="btn-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48, fontSize: 17, fontWeight: 600, color: "#5b6b79" }}>
                  {initials || <i className="bx bxs-user" />}
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                    {sellerName}
                    <span className={`badge bg-${lead_priority?.class || "secondary"}`}>
                      {lead_priority?.label || "Standard"}
                    </span>
                  </h5>
                  <div className="text-muted small">{company} · {seller?.email || "-"}</div>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="badge bg-light text-dark border">Joined: {joinedText}</span>
                <button type="button" className={`btn btn-sm ${detail.lead_receiving_enabled ? "btn-success" : "btn-secondary"}`}
                  onClick={() => toggleLeadReceiving(seller.id, detail.lead_receiving_enabled)}>
                  <i className="bx bxs-phone me-1"></i> Receive Leads: {detail.lead_receiving_enabled ? "On" : "Off"}
                </button>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={downloadPDF}>
                  <i className="bx bxs-file-pdf me-1"></i> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="card card-border radius-2 mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
              <div>
                <h6 className="mb-1 fw-semibold">Report Period</h6>
                <p className="text-muted small mb-0">Months before the seller signed up and months after the current month are disabled.</p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <div>
                  <label className="form-label mb-1 small text-muted">Month</label>
                  <select className="form-select form-select-sm" value={selMonth} onChange={handleMonthChange}>
                    {MONTH_NAMES.map((m, i) => {
                      const v = i + 1;
                      const disabled = v < yearMin || v > yearMax;
                      return <option key={v} value={v} disabled={disabled}>{m}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="form-label mb-1 small text-muted">Year</label>
                  <select className="form-select form-select-sm" value={selYear} onChange={handleYearChange}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <span className="badge bg-primary bg-opacity-10 text-primary fs-6 align-self-center px-3 py-2">
                  {period.label}
                </span>
              </div>
            </div>
          </div>
        </div> */}

        <div className="card card-border radius-2 mb-3">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap justify-content-around gap-3">
              {statCards.map((s) => (
                <div className="text-center" key={s.label} style={{ minWidth: 130 }}>
                  <i className={`bx ${s.icon} fs-5 text-muted d-block mb-1`}></i>
                  <p className={`mb-0 fs-4 fw-semibold ${s.cls}`}>{s.value}</p>
                  <p className="text-muted small mb-0">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-border radius-2 mb-3">
          <div className="card-header py-3">
            <h6 className="mb-0">Lead Performance &amp; Visibility (all-time)</h6>
            <span className="text-muted small">On time is measured against the current SLA of {sla_minutes ?? "-"} minutes.</span>
          </div>
          <div className="card-body">
            <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3">
              {leadMetricCards.map((m) => (
                <div className="col" key={m.label}>
                  <div className="border rounded-2 p-3 h-100">
                    <p className="text-muted small mb-1">{m.label}</p>
                    <p className={`mb-1 fs-4 fw-semibold ${m.cls}`}>{m.value}</p>
                    <p className="text-muted small mb-0">{m.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-border radius-2">
          <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <h6 className="mb-1">{chartLabel} — Lead History</h6>
              <span className="text-muted small">Leads received vs responded, responded on time, and auto-cancelled (no action).</span>
            </div>
            <div className="d-flex flex-wrap align-items-end gap-2">
              <div>
                <label className="form-label mb-1 small text-muted">Month</label>
                <select className="form-select form-select-sm" value={chartMonth} onChange={handleChartMonthChange}>
                  <option value={0}>Last 12 Months</option>
                  {MONTH_NAMES.map((m, i) => {
                    const v = i + 1;
                    const disabled = v < chartYearMin || v > chartYearMax;
                    return <option key={v} value={v} disabled={disabled}>{m}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="form-label mb-1 small text-muted">Year</label>
                <select className="form-select form-select-sm" value={chartYear} onChange={handleChartYearChange} disabled={chartMonth === 0}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span className="badge bg-primary bg-opacity-10 text-primary fs-6 align-self-center px-3 py-2">
                {chartLabel}
              </span>
            </div>
          </div>
          <div className="card-body">
            {historyChartData ? (
              <div style={{ height: "340px" }}>
                <Line ref={attachChart} data={historyChartData} options={historyChartOptions} />
              </div>
            ) : (
              <p className="text-muted mb-0">{chartEmptyText}</p>
            )}
          </div>
        </div>

        <div className="card card-border radius-2 mt-3">
          <div className="card-header py-3"><h6 className="mb-0">Monthly Breakdown</h6></div>
          <div className="card-body">
            {monthlySeries.length === 0 ? (
              <p className="text-muted mb-0">No lead data for this period.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Received</th>
                      <th>Responded</th>
                      <th>On Time</th>
                      <th>On-Time %</th>
                      <th>Auto-Cancelled</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySeries.map((m) => (
                      <tr key={m.month}>
                        <td>{m.label}</td>
                        <td>{m.received}</td>
                        <td>{m.responded}</td>
                        <td>{m.on_time}</td>
                        <td>{m.on_time_percentage}%</td>
                        <td>{m.auto_cancelled}</td>
                        <td>{m.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card card-border radius-2 mt-3">
          <div className="card-header py-3">
            <h6 className="mb-0">Buyer Feedback</h6>
          </div>
          <div className="card-body">
            {(detail.feedback || []).length === 0 ? (
              <p className="text-muted mb-0">No feedback received yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Buyer</th>
                      <th>Product</th>
                      <th>Rating</th>
                      <th>Feedback</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.feedback.map((f, i) => (
                      <tr key={f.requirement_id || i}>
                        <td>
                          <div className="fw-semibold">{f.buyer_name || "Buyer"}</div>
                          {f.buyer_email ? <div className="text-muted small">{f.buyer_email}</div> : null}
                        </td>
                        <td>{f.product_name || "-"}</td>
                        <td>
                          <span className="badge bg-warning text-dark">
                            {f.rating}/5
                          </span>
                        </td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{f.feedback || "-"}</td>
                        <td className="text-muted small">{f.created_at ? format(new Date(f.created_at), "dd MMM yyyy") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerPerformanceDetail;