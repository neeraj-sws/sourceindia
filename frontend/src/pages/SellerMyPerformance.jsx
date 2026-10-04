import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import useAuth from "../sections/UseAuth";
import API_BASE_URL from "../config";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, ChartDataLabels);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SellerMyPerformance = () => {
  const { user, loading } = useAuth();
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // Lead History chart scope. chartMonth === 0 means the default 12-month
  // overview; any other value drills into that single month of chartYear.
  const [chartMonth, setChartMonth] = useState(0);
  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  const fetchDetail = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const params = {};
      if (chartMonth) {
        params.chart_month = chartMonth;
        params.chart_year = chartYear;
      }
      // No seller id is sent: the backend scopes this to the signed-in seller
      // via their token, so there is nothing to tamper with.
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/seller/my-performance`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setDetail(res.data);
      setError("");
    } catch (err) {
      setDetail(null);
      setError(err.response?.data?.message || "Failed to load your performance report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user, chartMonth, chartYear]);

  // Same tooltip lifecycle fix as the admin report: chart.js' built-in mouseout
  // handling can leave the tooltip painted over the chart.
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

  if (loading || !user) return <p>Loading...</p>;

  if (isLoading && !detail) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
        </div>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h4 className="mb-3">My Performance</h4>
          <div className="alert alert-warning mb-0">{error}</div>
        </div>
      </div>
    );
  }

  if (!detail) return <p>Report not found</p>;

  const {
    seller, guard, overall_performance_score, aggregate, lead_priority,
    search_appearance_count, sla_minutes,
  } = detail;

  const sellerName = `${seller?.fname || ""} ${seller?.lname || ""}`.trim() || "-";
  const company = seller?.company_info?.organization_name || "-";
  const priority = lead_priority || { label: "Standard", class: "secondary" };

  const years = [];
  for (let y = guard.signup_year; y <= guard.cur_year; y++) years.push(y);

  // Months outside the seller's own tenure can never have data, so they are
  // disabled rather than silently returning an empty day-by-day chart.
  const enabledRange = (y) => {
    let min = y === guard.signup_year ? guard.signup_month : 1;
    let max = y === guard.cur_year ? guard.cur_month : 12;
    if (min > max) min = max;
    return { min, max };
  };

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

  const metricCards = [
    {
      label: "Total Leads Received",
      value: aggregate?.total_received ?? 0,
      sub: "all-time assignments",
      cls: "text-primary",
    },
    {
      label: "On-Time Response",
      value: `${aggregate?.on_time_percentage ?? 0}%`,
      sub: `${aggregate?.on_time ?? 0} of ${aggregate?.responded ?? 0} responses · SLA ${sla_minutes ?? "-"} min`,
      cls: "text-success",
    },
    {
      label: "Auto-Cancelled",
      value: aggregate?.auto_cancelled ?? 0,
      sub: "no action taken in SLA",
      cls: "text-dark",
    },
    {
      label: "Search Appearances",
      value: search_appearance_count ?? 0,
      sub: "matched in buyer requirement searches",
      cls: "text-info",
    },
  ];

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
        // Hover-only, matching the admin report: an explicit mode/interact pair
        // tracks the pointer instead of latching onto the nearest index.
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
        // allows all 12 while the day view is capped to stay legible.
        ticks: chartIsDaily
          ? { autoSkip: true, maxTicksLimit: 16, maxRotation: 0, minRotation: 0, padding: 4 }
          : { autoSkip: true, maxTicksLimit: 12, maxRotation: 0, minRotation: 0, padding: 4 },
      },
    },
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h4 className="mb-3 d-flex flex-wrap align-items-center gap-2">
          My Performance
          {/* <span
            className={`badge bg-${priority.class}`}
            title={`Overall performance score: ${overall_performance_score ?? 0} / 100`}
          >
            {priority.label}
          </span> */}
        </h4>

        {error && (
          <div className="alert alert-warning">{error}</div>
        )}

        <div className="card card-border radius-2 mb-3">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="btn-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48, fontSize: 17, fontWeight: 600, color: "#5b6b79" }}
                >
                  {sellerName.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                    || <i className="bx bxs-user" />}
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold">{sellerName}</h5>
                  <div className="text-muted small">{company}</div>
                </div>
              </div>
              <span className="badge bg-light text-dark border">
                Overall Score: {overall_performance_score ?? 0} / 100
              </span>
            </div>
          </div>
        </div>

        <div className="card card-border radius-2 mb-3">
          <div className="card-header py-3">
            <h6 className="mb-0">Lead Performance &amp; Visibility (all-time)</h6>
            <span className="text-muted small">
              On time is measured against the current SLA of {sla_minutes ?? "-"} minutes.
            </span>
          </div>
          <div className="card-body">
            <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-3">
              {metricCards.map((m) => (
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
              <span className="text-muted small">
                Leads received vs responded, responded on time, and auto-cancelled (no action).
              </span>
            </div>
            <div className="d-flex flex-wrap align-items-end gap-2">
              <div>
                <label className="form-label mb-1 small text-muted">Month</label>
                <select
                  className="form-select form-select-sm"
                  value={chartMonth}
                  onChange={handleChartMonthChange}
                >
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
                <select
                  className="form-select form-select-sm"
                  value={chartYear}
                  onChange={handleChartYearChange}
                  disabled={chartMonth === 0}
                >
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
      </div>
    </div>
  );
};

export default SellerMyPerformance;