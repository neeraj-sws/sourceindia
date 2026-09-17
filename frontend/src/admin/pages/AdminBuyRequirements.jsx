import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from "../../utils/formatDate";

const reqStatusMap = {
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const assignStatusMap = {
  0: "Assigned",
  1: "Viewed",
  2: "Responded",
  3: "Accepted",
  4: "Rejected",
  5: "Auto Cancelled",
  6: "Completed",
};

export function AdminBuyRequirements() {
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const getRangeText = () => {
    if (totalRecords === 0) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);
    return `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const fetchCounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/requirements/counts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCounts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/requirements`, {
        params: { page, limit, search, status: status || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchData(); }, [page, limit, search, status]);

  const statCards = counts ? [
    { label: "Total", value: counts.total, icon: "bx bx-list-ul" },
    { label: "Assigned", value: counts.assigned, icon: "bx bxs-group" },
    { label: "Accepted", value: counts.accepted, icon: "bx bx-check-double" },
    { label: "Completed", value: counts.completed, icon: "bx bx-check-circle" },
    { label: "Closed", value: counts.closed, icon: "bx bx-lock" },
    { label: "No Seller Found", value: counts.no_seller_found, icon: "bx bx-x-circle" },
    { label: "Product Not Available", value: counts.product_not_available, icon: "bx bxs-package" },
  ] : [];

  const colorMap = {
    1: "bg-soft-primary border border-primary text-primary",
    2: "bg-soft-success border border-success text-success",
    3: "bg-soft-purple border border-purple text-purple",
    4: "bg-soft-warning border border-warning text-warning",
  };

  const CountData = ({ label, value, icon }) => {
    const randomNum = Math.floor(Math.random() * 4) + 1;
    const imgSrc = `/element-0${randomNum}.svg`;
    const colorClass = colorMap[randomNum];

    return (
      <div className="col mb-4">
        <div className="card radius-2 overflow-hidden position-relative h-100 card-border">
          <div className="card-body ps-4 py-4">
            <div className="d-flex align-items-center">
              <div className="labeltitle">
                <p className="mb-2">{label}</p>
                <h2 className="mb-0">{value}</h2>
              </div>
              <div className={`ms-auto dashicon avatar avatar-md rounded-circle ${colorClass}`}>
                <i className={`${icon}`}></i>
              </div>
            </div>
          </div>
          <img
            src={imgSrc}
            className="img-fluid position-absolute top-0 start-0"
            alt="logo icon"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Buy Requirements" maincount={totalRecords} page="Workflow" title="Buyer Requirements" />

        {statCards.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
            {statCards.map((s, i) => (
              <CountData key={i} label={s.label} value={s.value || 0} icon={s.icon} />
            ))}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-3">
                <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="">All Status</option>
                  {Object.entries(reqStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Req ID", sortable: true },
                { key: "product", label: "Product", sortable: false },
                { key: "category", label: "Category", sortable: false },
                { key: "buyer", label: "Buyer", sortable: false },
                { key: "location", label: "Location", sortable: false },
                { key: "qty", label: "Quantity", sortable: false },
                { key: "created_at", label: "Created", sortable: true },
                { key: "status", label: "Status", sortable: false },
                { key: "action", label: "Action", sortable: false },
              ]}
              data={data}
              loading={isLoading}
              page={page}
              totalRecords={totalRecords}
              filteredRecords={totalRecords}
              limit={limit}
              sortBy="created_at"
              sortDirection="DESC"
              onPageChange={(p) => setPage(p)}
              onSearchChange={(val) => { setSearch(val); setPage(1); }}
              search={search}
              onLimitChange={(val) => { setLimit(val); setPage(1); }}
              getRangeText={getRangeText}
              renderRow={(row, index) => {
                const st = reqStatusMap[row.status] || { label: "Unknown", class: "secondary" };
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.product_name_snapshot}</td>
                    <td>{row.category?.name || "-"}</td>
                    <td>{row.buyer_name || row.buyer_email || row.buyer_company || "-"}</td>
                    <td>{row.buyer_city || "-"}{row.buyer_state ? <div className="text-muted small">{row.buyer_state}</div> : null}</td>
                    <td>{row.quantity || "-"}{row.quantity_unit ? ` ${row.quantity_unit}` : ""}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td><span className={`badge bg-${st.class}`}>{st.label}</span></td>
                    <td><Link className="btn btn-sm btn-primary" to={`/admin/buy-requirements/${row.id}`}>View</Link></td>
                  </tr>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminBuyRequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useAlert();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellers, setSellers] = useState([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState("");
  const [productUnavailable, setProductUnavailable] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [changeStatus, setChangeStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/requirements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setReq(res.data);
      setChangeStatus(String(res.data.status));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchSellers = async (q = "") => {
    setSellerLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/sellers`, {
        params: { search: q, requirementId: id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const payload = res.data || {};
      setSellers(Array.isArray(payload.sellers) ? payload.sellers : []);
      setAssignMessage(payload.message || "");
      setProductUnavailable(payload.productAvailable === false);
      const noSellersFound =
        payload.productAvailable === false ||
        (Array.isArray(payload.sellers) && payload.sellers.length === 0 && !!payload.message);
      const hasAnySellerHistory = (req.assignments || []).length > 0;
      if (!q && noSellersFound && !hasAnySellerHistory && req && Number(req.status) !== 5 && Number(req.status) !== 6) {
        await autoSetRequirementStatus(payload.productAvailable === false ? 6 : 5);
      }
    } catch (err) { console.error(err); setSellers([]); setAssignMessage(""); setProductUnavailable(false); } finally { setSellerLoading(false); }
  };

  const autoSetRequirementStatus = async (status) => {
    const labels = { 5: "No Seller Found", 6: "Product Not Available" };
    try {
      await axios.put(
        `${API_BASE_URL}/admin/buyer-requirements/requirements/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      showNotification(`Requirement marked as ${labels[status] || status}`, "success");
      fetchDetail();
    } catch (err) {
      console.error("Failed to auto-set requirement status:", err);
    }
  };

  const openAssign = () => {
    setSellerSearch("");
    setSelectedSeller(null);
    setShowAssign(true);
    setAssignMessage("");
    setProductUnavailable(false);
    fetchSellers("");
  };

  const handleAssign = async () => {
    if (!selectedSeller) {
      showNotification("Please select a seller", "error");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/buyer-requirements/requirements/${id}/assign`,
        { seller_id: selectedSeller.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      showNotification(res.data.message || "Seller assigned", "success");
      setShowAssign(false);
      fetchDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to assign seller", "error");
    } finally { setAssigning(false); }
  };

  const handleStatusChange = async () => {
    if (changeStatus === "" || String(changeStatus) === String(req.status)) {
      showNotification("Select a new status", "error");
      return;
    }
    setStatusSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/buyer-requirements/requirements/${id}/status`,
        { status: parseInt(changeStatus) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      showNotification(res.data.message || "Status updated", "success");
      fetchDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status", "error");
    } finally { setStatusSaving(false); }
  };

  const handleClose = async () => {
    if (!window.confirm("Are you sure you want to close this requirement?")) return;
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/buyer-requirements/requirements/${id}/close`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      showNotification(res.data.message || "Requirement closed", "success");
      fetchDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to close", "error");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!req) return <p>Not found</p>;

  const st = reqStatusMap[req.status] || { label: "Unknown", class: "secondary" };
  const assignments = req.assignments || [];
  const logs = req.activity_logs || [];

  const activeAssign = assignments.find((a) => a.status !== 6 && a.status !== 5 && a.status !== 4);
  const showAssignedTo = [1, 2, 3].includes(req.status);
  const displayedAssign = showAssignedTo ? (activeAssign || assignments[assignments.length - 1]) : null;
  const assignedSellerName = displayedAssign?.seller
    ? `${displayedAssign.seller.fname || ""} ${displayedAssign.seller.lname || ""}`.trim()
    : "-";

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Workflow" title={`Requirement #${req.id}`} actions={
          <button className="btn btn-sm btn-light mb-2" onClick={() => navigate("/admin/buy-requirements")}>← Back</button>
        } />

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-sm btn-primary" onClick={openAssign}>＋ Assign Seller</button>
          <div className="d-inline-flex align-items-center gap-2">
            <select className="form-select form-select-sm w-auto" value={changeStatus} onChange={(e) => setChangeStatus(e.target.value)}>
              {Object.entries(reqStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-sm btn-outline-primary" onClick={handleStatusChange} disabled={statusSaving}>Update Status</button>
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={handleClose}>Close</button>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{req.product_name_snapshot}</h5>
            <div className="d-flex gap-2">
              <span className={`badge bg-${st.class}`}>{st.label}</span>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4"><strong>Assigned To (Seller):</strong> {assignments.length ? assignedSellerName : "-"}</div>
              <div className="col-md-4"><strong>Category:</strong> {req.category?.name || "-"}</div>
              <div className="col-md-4"><strong>Sub Category:</strong> {req.subCategory?.name || "-"}</div>
              <div className="col-md-4"><strong>Item Category:</strong> {req.itemCategory?.name || "-"}</div>
              <div className="col-md-4"><strong>Item Sub Category:</strong> {req.itemSubCategory?.name || "-"}</div>
              <div className="col-md-4"><strong>Quantity:</strong> {req.quantity || "-"}{req.quantity_unit ? ` ${req.quantity_unit}` : ""}</div>
              <div className="col-md-4"><strong>Supplier Preference:</strong> {req.supplier_preference || "-"}</div>
              <div className="col-md-4"><strong>Posted:</strong> {formatDateTime(req.created_at)}</div>
              <div className="col-md-4"><strong>Buyer:</strong> {req.buyer_name || "-"}</div>
              <div className="col-md-4"><strong>Email:</strong> {req.buyer_email || "-"}</div>
              <div className="col-md-4"><strong>Phone:</strong> {req.buyer_phone || "-"}</div>
              <div className="col-md-4"><strong>Company:</strong> {req.buyer_company || "-"}</div>
              <div className="col-md-4"><strong>City:</strong> {req.buyer_city || "-"}</div>
              <div className="col-md-4"><strong>State:</strong> {req.buyer_state || "-"}</div>
              <div className="col-12 mt-2"><strong>Description:</strong> {req.description || "-"}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h6 className="mb-0">Seller Assignment History</h6></div>
          <div className="card-body p-0">
            <table className="table table-striped mb-0">
              <thead><tr><th>No</th><th>Seller</th><th>Company</th><th>Status</th><th>Assigned At</th><th>Responded At</th></tr></thead>
              <tbody>
                {assignments.length === 0 && <tr><td colSpan="6" className="text-center">No assignments yet</td></tr>}
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.assignment_number}</td>
                    <td>{a.seller?.fname} {a.seller?.lname}</td>
                    <td>{a.seller?.company_info?.organization_name || "-"}</td>
                    <td><span className="badge bg-secondary">{assignStatusMap[a.status] || a.status}</span></td>
                    <td>{formatDateTime(a.assigned_at)}</td>
                    <td>{a.responded_at ? formatDateTime(a.responded_at) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h6 className="mb-0">Activity Log</h6></div>
          <div className="card-body p-0">
            <table className="table table-striped mb-0">
              <thead><tr><th>Time</th><th>Action</th><th>Details</th><th>Seller</th></tr></thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan="4" className="text-center">No activity</td></tr>}
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.created_at)}</td>
                    <td><code>{l.action}</code></td>
                    <td>{l.details || "-"}</td>
                    <td>{l.seller ? `${l.seller.fname} ${l.seller.lname}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAssign && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Seller to Requirement</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssign(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Search seller by name / email / company..."
                    value={sellerSearch}
                    onChange={(e) => { setSellerSearch(e.target.value); fetchSellers(e.target.value); }}
                  />
                  {sellerLoading && <p className="text-muted small">Loading sellers...</p>}
                  {!sellerLoading && sellers.length === 0 && <p className="text-muted small">{assignMessage || "No sellers found"}</p>}
                  {!sellerLoading && sellers.length > 0 && (
                    <ul className="list-group" style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {sellers.map((s) => (
                        <li
                          key={s.id}
                          className={`list-group-item list-group-item-action ${selectedSeller?.id === s.id ? "active" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedSeller(s)}
                        >
                          <strong>{s.fname} {s.lname}</strong>
                          <div className="small">{s.company_info?.organization_name || "-"} {s.email ? `· ${s.email}` : ""}</div>
                          <div className="small text-muted">
                            {(s.city_data?.name || "-")}
                            {(s.city_data?.States?.name || s.state_data?.name) ? `, ${s.city_data?.States?.name || s.state_data?.name}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAssign(false)}>Close</button>
                  <button type="button" className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedSeller || productUnavailable}>
                    {assigning ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
