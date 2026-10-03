import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import { useAlert } from "../../context/AlertContext";
import API_BASE_URL from "../../config";

export function AdminSellerPerformance() {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const getRangeText = () => {
    if (totalRecords === 0) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);
    return `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/seller-performance`, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, limit, search]);

  // Kept for the commented-out Conversion column below; restore it with that cell.
  // eslint-disable-next-line no-unused-vars
  const conversionOf = (row) => {
    const total = Number(row.total_leads) || 0;
    const completed = Number(row.completed_leads) || 0;
    return total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Seller Performance" maincount={totalRecords} page="Post Buy Requirement" title="Seller Performance" />
        <div className="card">
          <div className="card-body">
            <DataTable
              columns={[
                { key: "id", label: "S.No", sortable: false },
                { key: "seller", label: "Seller Name", sortable: false },
                { key: "company", label: "Company", sortable: false },
                { key: "leads", label: "Receive Leads", sortable: false },
                { key: "response", label: "Response & Visibility", sortable: false },
                // Hidden from display (UI only) - uncomment to restore:
                // { key: "conversion", label: "Conversion", sortable: false },
                // { key: "priority", label: "Lead Priority", sortable: false },
                // { key: "status", label: "Status", sortable: false },
                { key: "report", label: "Report", sortable: false },
              ]}
              data={data}
              loading={isLoading}
              page={page}
              totalRecords={totalRecords}
              filteredRecords={totalRecords}
              limit={limit}
              sortBy="overall_performance_score"
              sortDirection="DESC"
              onPageChange={(p) => setPage(p)}
              onSearchChange={(val) => { setSearch(val); setPage(1); }}
              search={search}
              onLimitChange={(val) => { setLimit(val); setPage(1); }}
              getRangeText={getRangeText}
              renderRow={(row, index) => (
                <tr key={row.id}>
                  <td>{row.sno ?? ((page - 1) * limit + index + 1)}</td>
                  <td>
                    <div className="fw-semibold">{row.seller?.fname} {row.seller?.lname}</div>
                    <div className="text-muted small">{row.seller?.email}</div>
                  </td>
                  <td>{row.seller?.company_info?.organization_name || "-"}</td>
                  <td><span className="fw-semibold">{row.total_leads ?? 0}</span>
                    {/* Period usage line hidden from display (UI only) - uncomment to restore:
                    <div className="text-muted small">
                      Period: {row.lead_used ?? 0} / {row.lead_limit ?? "-"} used ({row.lead_remaining ?? 0} left)
                    </div>
                    */}
                  </td>
                  <td>
                    <span className="fw-semibold">{row.on_time_response_count ?? 0}</span> on time ({row.on_time_response_percentage ?? 0}%)
                    <div className="text-muted small">
                      {row.late_response_count ?? 0} late · {row.auto_cancelled_leads ?? 0} auto-cancelled
                    </div>
                    <div className="text-muted small">
                      {row.search_appearance_count ?? 0} search appearance{(row.search_appearance_count ?? 0) === 1 ? "" : "s"}
                    </div>
                  </td>
                  {/* Conversion / Lead Priority / Status cells hidden from display (UI only)
                      - uncomment together with the matching column defs above to restore:
                  <td>
                    <span
                      className={`badge ${conversionOf(row) >= 50 ? "bg-success" : conversionOf(row) > 0 ? "bg-warning" : "bg-secondary"}`}
                      title={`Overall Score: ${row.overall_performance_score ?? "0.00"} / 100 · Avg Response: ${row.avg_response_minutes ?? "-"} min`}
                    >
                      {conversionOf(row)}%
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge bg-${row.lead_priority?.class || "secondary"}`}
                      title={`Overall Score: ${row.overall_performance_score ?? "0.00"} / 100`}
                    >
                      {row.lead_priority?.label || "Standard"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${row.seller_status?.class || "secondary"}`}>
                      {row.seller_status?.label || "-"}
                    </span>
                  </td>
                  */}
                  <td>
                    <Link className="btn btn-sm btn-primary" to={`/admin/seller-performance/${row.seller_id}`}>View</Link>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminBuyRequirementConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useAlert();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/config`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setConfig(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === '') return setConfig((prev) => ({ ...prev, [name]: '' }));
    if (name === 'lead_period_type') return setConfig((prev) => ({ ...prev, [name]: value }));
    const num = name.startsWith('performance_weight_') ? parseFloat(value) : parseInt(value, 10);
    setConfig((prev) => ({ ...prev, [name]: Number.isNaN(num) ? 0 : num }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/admin/buyer-requirements/config`, config, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      showNotification("Configuration saved", "success");
    } catch {
      showNotification("Save failed", "error");
    } finally { setSaving(false); }
  };

  if (loading) return <p>Loading...</p>;

  const slaFields = [
    { key: "lead_sla_minutes", label: "SLA (Service Level Agreement) in minutes - default 120 (2 hrs)", help: "SLA = the deadline for a seller to respond to a lead." },
    { key: "lead_monthly_limit", label: "Monthly Lead Limit per Seller" },
    // { key: "max_reassignment_attempts", label: "Max Reassignment Attempts per Requirement", help: "Caps how many times one requirement can be reassigned to the next seller." },
    // { key: "lead_candidate_pool_size", label: "Candidate Pool Size", help: "Number of sellers evaluated per requirement." },
  ];

  const weightFields = [
    { key: "performance_weight_leads", label: "Lead Performance Weight", help: "Default 0.60" },
    { key: "performance_weight_products", label: "Product Listing Weight", help: "Default 0.30" },
    { key: "performance_weight_buyer_rating", label: "Buyer Rating Weight", help: "Default 0.10" },
  ];

  const renderFields = (fields) =>
    fields.map((f) => (
      <div className="col-md-6 mb-3" key={f.key}>
        <label className="form-label">{f.label}</label>
        <input
          type="number"
          className="form-control"
          name={f.key}
          step={f.key.startsWith("performance_weight_") ? "0.01" : "1"}
          value={config[f.key]}
          onChange={handleChange}
        />
        {f.help && <div className="form-text">{f.help}</div>}
      </div>
    ));

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Buy Requirement Config" page="Post Buy Requirement" title="Workflow Config" />
        <div className="card">
          <div className="card-body">
            <h6 className="mb-3 fw-semibold">Lead Handling & Reassignment</h6>
            <div className="row">
              {renderFields(slaFields)}
              <div className="col-md-6 mb-3" key="lead_period_type">
                <label className="form-label">Lead Limit Period</label>
                <select
                  className="form-select"
                  name="lead_period_type"
                  value={config.lead_period_type}
                  onChange={handleChange}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="6-monthly">6-Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div className="form-text">Each seller's remaining lead count resets to the global limit at the start of every period.</div>
              </div>
            </div>
            <hr />
            <h6 className="mb-3 fw-semibold">Priority Weights</h6>
            <div className="row">
              {renderFields(weightFields)}
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBuyRequirementsPages() {
  return null;
}