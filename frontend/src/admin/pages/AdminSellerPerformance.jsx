import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";

export function AdminSellerPerformance() {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { showNotification } = useAlert();

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

  const toggleLeadReceiving = async (sellerId, current) => {
    const next = current ? 0 : 1;
    try {
      await axios.put(`${API_BASE_URL}/admin/buyer-requirements/seller-performance/${sellerId}`,
        { lead_receiving_enabled: next },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showNotification("Updated", "success");
      fetchData();
    } catch (err) { showNotification("Update failed", "error"); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Seller Performance" maincount={totalRecords} page="Reporting" title="Seller Performance" />
        <div className="card">
          <div className="card-body">
            <DataTable
              columns={[
                { key: "id", label: "S.No", sortable: false },
                { key: "seller", label: "Seller", sortable: false },
                { key: "company", label: "Company", sortable: false },
                { key: "score", label: "Overall Score", sortable: false },
                { key: "leads", label: "Monthly Used", sortable: false },
                { key: "response", label: "Avg Response (min)", sortable: false },
                { key: "receiving", label: "Receive Leads", sortable: false },
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
                  <td>{row.id}</td>
                  <td>{row.seller?.fname} {row.seller?.lname}<div className="text-muted small">{row.seller?.email}</div></td>
                  <td>{row.seller?.company_info?.organization_name || "-"}</td>
                  <td>{row.overall_performance_score ?? "-"}</td>
                  <td>{row.monthly_leads_used || 0}</td>
                  <td>{row.avg_response_minutes ?? "-"}</td>
                  <td>
                    <button className={`btn btn-sm ${row.lead_receiving_enabled ? "btn-success" : "btn-secondary"}`}
                      onClick={() => toggleLeadReceiving(row.seller_id, row.lead_receiving_enabled)}>
                      {row.lead_receiving_enabled ? "On" : "Off"}
                    </button>
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

  const handleChange = (e) => setConfig((prev) => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/admin/buyer-requirements/config`, config, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      showNotification("Configuration saved", "success");
    } catch (err) { showNotification("Save failed", "error"); } finally { setSaving(false); }
  };

  if (loading) return <p>Loading...</p>;

  const fields = [
    { key: "lead_sla_minutes", label: "SLA (minutes) - default 120 (2 hrs)", help: "If the seller does not respond within this time, the lead is auto-reassigned to the next best seller." },
    { key: "lead_monthly_limit", label: "Monthly Lead Limit per Seller", help: "Counts on assignment; never decreases." },
    { key: "lead_candidate_pool_size", label: "Candidate Pool Size", help: "Number of sellers evaluated per requirement." },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Buy Requirement Config" page="Workflow" title="System Configuration" />
        <div className="card">
          <div className="card-body">
            <div className="row">
              {fields.map((f) => (
                <div className="col-md-6 mb-3" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input type="number" className="form-control" name={f.key} value={config[f.key]} onChange={handleChange} />
                  <div className="form-text">{f.help}</div>
                </div>
              ))}
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
