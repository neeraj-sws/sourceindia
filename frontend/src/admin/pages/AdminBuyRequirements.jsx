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
  // 4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

// Source of the requirement's product field, as saved at creation time.
// Rows created before this was recorded have no value and render as "-".
const reqTypeMap = {
  admin: { label: "Admin", class: "primary" },
  other: { label: "Other", class: "info" },
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

const ALREADY_POSTED_REASON = "Requirement already posted for the same product and city today";

// Display-only. One specific "No Seller Found" entry is labelled "Already Posted"
// so the buyer sees why no seller was assigned. Every other entry keeps showing
// its raw action, and the stored reason/details are never altered.
const isAlreadyPostedLog = (log) =>
  log?.action === "no_seller_found" && log?.details === ALREADY_POSTED_REASON;

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
    // { label: "Closed", value: counts.closed, icon: "bx bx-lock" },
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
        <Breadcrumb mainhead="Buy Requirements" maincount={totalRecords} page="Post Buy Requirement" title="Buy Requirement" />

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
              {/* <div className="col-md-3 ms-auto">
                <Link className="btn btn-outline-primary w-100" to="/admin/unit-master">
                  <i className="bx bx-slider me-1"></i> Unit Master
                </Link>
              </div> */}
            </div>
            <DataTable
              columns={[
                { key: "id", label: "Req ID", sortable: true },
                { key: "product", label: "Product", sortable: false },
                { key: "type", label: "Type", sortable: false },
                { key: "category", label: "Category", sortable: false },
                { key: "buyer", label: "Requested by", sortable: false },
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
                const ty = reqTypeMap[row.type] || null;
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td className="text-capitalize">{row.product_name_snapshot}</td>
                    <td>{ty ? <span className={`badge bg-${ty.class}`}>{ty.label}</span> : "-"}</td>
                    <td>{row.category?.name || "-"}</td>
                    <td className="text-capitalize">{row.buyer_name || row.buyer_email || row.buyer_company || "-"}</td>
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

  const showAssignedTo = [1, 2, 3].includes(req.status);
  const liveAssignments = showAssignedTo
    ? assignments.filter((a) => [0, 1, 2, 3, 6].includes(Number(a.status)))
    : [];
  const ownerAssign =
    liveAssignments.find((a) => Number(a.status) === 6) ||
    liveAssignments.find((a) => Number(a.status) === 3);
  const assignedSellerNames = [
    ...new Set(
      (ownerAssign ? [ownerAssign] : liveAssignments)
        .map((a) => (a.seller ? `${a.seller.fname || ""} ${a.seller.lname || ""}`.trim() : ""))
        .filter(Boolean)
    ),
  ];
  const assignedSellerName = assignedSellerNames.length ? assignedSellerNames.join(", ") : "";

  const asgStatusClass = {
    0: "badge bg-secondary", 1: "badge bg-info", 2: "badge bg-primary",
    3: "badge bg-success", 4: "badge bg-danger", 5: "badge bg-dark", 6: "badge bg-success",
  };

  const categoryChain = [
    { label: "Category", value: req.category?.name },
    { label: "Sub Category", value: req.subCategory?.name },
    { label: "Item Category", value: req.itemCategory?.name },
    { label: "Item Sub Category", value: req.itemSubCategory?.name },
  ].filter((c) => c.value);

  const statItems = [
    { label: "Assigned To", value: `assignedSellerName`, names: assignedSellerNames },
    { label: "Quantity", value: req.quantity ? `${req.quantity}${req.quantity_unit || ""}` : "-" },
    { label: "Preference", value: req.supplier_preference || "-" },
    // { label: "Assignments", value: assignments.length },
    // { label: "Buyer", value: req.buyer_name || "Guest" },
    // { label: "Location", value: [req.buyer_city, req.buyer_state].filter(Boolean).join(", ") || "-" },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Workflow" title={`Requirement #${req.id}`} actions={
          <button className="btn btn-sm btn-light mb-2" onClick={() => navigate("/admin/buy-requirements")}>← Back</button>
        } />

        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div>
            <h4 className="mb-1 fw-semibold text-capitalize">{req.product_name_snapshot}</h4>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              
              {/* <span className="text-muted small">Req #{req.id} · Posted {formatDateTime(req.created_at)}</span> */}
              {/* {req.keyword?.name ? <span className="badge bg-light border text-dark">{req.keyword.name}</span> : null} */}
              {/* <span className={`badge bg-${st.class}`}>{st.label}</span>
              {reqTypeMap[req.type] ? <span className={`badge bg-${reqTypeMap[req.type].class}`}>{reqTypeMap[req.type].label}</span> : null} */}
            </div>
          </div>
          <button className="btn btn-primary" onClick={openAssign} style={{ display: "none" }}>
            <i className="bx bx-plus me-1 "></i> Assign Seller
          </button>
        </div>

        <div className="row row-cols-2 row-cols-md-3 row-cols-xl-6 g-3 mb-3">
          {statItems.map((s, i) => {
            if (s.label === "Assigned To" && !assignedSellerName) return null;
            return (
              <div className="col" key={i}>
                <div className="card card-border radius-2 h-100 mb-0">
                  <div className="card-body py-3">
                    <p className="text-muted small mb-0">{s.label}</p>
                    {s.names && s.names.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1 mt-1" title={s.value}>
                        {s.names.map((n, ni) => (
                          <span
                            key={ni}
                            className="badge bg-light border text-dark fw-semibold small text-wrap"
                            style={{ maxWidth: "100%", overflowWrap: "anywhere" }}
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0 fw-semibold text-truncate" title={s.value}>{s.value}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="row g-3 mb-3">
          <div className="col-lg-7">
            <div className="card card-border radius-2">
              <div className="card-header py-3 d-flex align-items-center justify-content-between">
                <h6 className="mb-0"><i className="bx bx-info-circle me-1"></i> Sourcing Details</h6>
                <div className="d-flex align-items-center justify-content-between" >
                    <span className={`badge bg-${st.class} me-2`}>{st.label}</span>
                    <br />
                    {reqTypeMap[req.type] ? <span className={`badge bg-${reqTypeMap[req.type].class}`}>{reqTypeMap[req.type].label}</span> : null}
                  </div>
              </div>
              <div className="card-body">
                {categoryChain.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {categoryChain.map((c) => (
                      <span key={c.label} className="badge bg-light border text-dark px-3 py-2">
                        {c.label}: <strong>{c.value}</strong>
                      </span>
                    ))}
                  </div>
                )}
                <div className="row g-3">
                  {/* "Buy Type" block removed: reads product_type, column dropped from buyer_requirements */}
                  <div className="col-md-6">
                    <div className="text-muted small mb-1"><i className="bx bx-cube me-1"></i>Quantity</div>
                    <div>{req.quantity ? `${req.quantity}${req.quantity_unit ? ` ${req.quantity_unit}` : ""}` : "-"}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1"><i className="bx bx-globe me-1"></i>Supplier Preference</div>
                    <div>{req.supplier_preference || "-"}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1"><i className="bx bx-calendar me-1"></i>Last Updated</div>
                    <div>{formatDateTime(req.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-border radius-2">
              <div className="card-header py-3">
                {/* <h6 className="mb-0"><i className="bx bxs-user-pin me-1"></i> Buyer Details</h6> */}
                {!req?.buyer_id ? (
                  <h6 className="mb-0"><i className="bx bxs-user-pin me-1"></i> Guest Details</h6>
                ) : (req?.buyer?.is_seller === 1) ? (
                  <h6 className="mb-0"><i className="bx bxs-user-pin me-1"></i> Seller Details</h6>
                ) : (
                  <h6 className="mb-0"><i className="bx bxs-user-pin me-1"></i> Buyer Details</h6>
                )}
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div>
                    <div className="fw-semibold text-capitalize">{req.buyer_name || "Guest Buyer"}
                      {/* {!req.buyer_id ? <span className="badge bg-warning ms-2">Guest</span> : null} */}
                    </div>
                    <div className="text-muted small">{req.buyer_email || "-"}</div>
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="text-muted small mb-1"><i className="bx bx-phone me-1"></i>Phone</div>
                    <div>{req.buyer_phone || "-"}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-1"><i className="bx bx-map-pin me-1"></i>City / State</div>
                    <div>{[req.buyer_city, req.buyer_state].filter(Boolean).join(", ") || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card card-border radius-2">
              <div className="card-header py-3">
                <h6 className="mb-0"><i className="bx bx-time-five me-1"></i> Activity Log</h6>
              </div>
              <div className="card-body p-0 thin-scroll" style={{ maxHeight: "47  0px" }}>
                {logs.length === 0 ? (
                  <p className="text-muted small p-3 mb-0">No activity yet</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {logs.map((l, idx) => (
                      <li key={l.id} className="list-group-item d-flex gap-3 py-3">
                        <div className="rounded-circle bg-light text-muted d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 28, height: 28 }}>
                          {/* <i className={idx === 0 ? "bx bxs-check-circle" : "bx bx-dots-vertical-rounded"}></i> */}
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </div>
                        <div className="min-w-0">
                          <div><code className="text-primary">{isAlreadyPostedLog(l) ? "Already Posted" : l.action}</code></div>
                          <div className="text-muted small">{l.details || "-"}</div>
                          <div className="text-muted small">{formatDateTime(l.created_at)}{l.seller ? ` · ${l.seller.fname} ${l.seller.lname}` : ""}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card card-border radius-2">
          <div className="card-header py-3 d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="bx bx-transfer-alt me-1"></i> Seller Assignment History</h6>
            <span className="badge bg-light text-dark">{assignments.length} total</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>S.No.</th><th>Seller</th><th>Company</th>
                    {/* <th>Match</th> */}
                    {/* <th>Status</th> */}
                    {/* <th>Assigned At</th><th>Responded At</th><th>Note</th> */}
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 && <tr><td colSpan="8" className="text-center py-4">No assignments yet</td></tr>}
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.assignment_number}</td>
                      <td><div className="fw-semibold">{a.seller?.fname} {a.seller?.lname}</div>{a.seller?.email ? <div className="text-muted small">{a.seller.email}</div> : null}</td>
                      <td>{a.seller?.company_info?.organization_name || "-"}</td>
                      {/* <td>
                        {a.product_match_level || "-"}
                        {a.product_match_score ? <div className="text-muted small">score: {a.product_match_score}</div> : null}
                      </td> */}
                      {/* <td>
                        <span className={asgStatusClass[a.status] || "badge bg-secondary"}>{assignStatusMap[a.status] || a.status}</span>
                        {a.is_reassigned === 1 ? <span className="badge bg-warning text-dark ms-1">Reassigned</span> : null}
                      </td>
                      <td>{formatDateTime(a.assigned_at)}</td> */}
                      {/* <td>{a.responded_at ? formatDateTime(a.responded_at) : "-"}</td> */}
                      {/* <td>{a.assignment_note ? <span className="text-muted small">{a.assignment_note}</span> : "-"}</td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showAssign && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title"><i className="bx bx-user-plus me-1"></i>Assign Seller</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAssign(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="input-group mb-3">
                    <span className="input-group-text bg-transparent"><i className="bx bx-search"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name / email / company..."
                      value={sellerSearch}
                      onChange={(e) => { setSellerSearch(e.target.value); fetchSellers(e.target.value); }}
                    />
                  </div>
                  <p className="text-muted small mb-2"><i className="bx bx-info-circle me-1"></i>Tap a seller to select them for assignment.</p>
                  {sellerLoading && <p className="text-muted small">Loading sellers...</p>}
                  {!sellerLoading && sellers.length === 0 && <p className="text-muted small">{assignMessage || "No sellers found"}</p>}
                  {!sellerLoading && sellers.length > 0 && (
                    <ul className="list-group" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {sellers.map((s) => (
                        <li
                          key={s.id}
                          className={`list-group-item list-group-item-action ${selectedSeller?.id === s.id ? "active" : ""}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedSeller(s)}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="min-w-0">
                              <div className="fw-semibold">
                                {s.fname} {s.lname}
                                {s.same_city ? <span className="badge bg-success ms-2">Same City</span> : null}
                                {selectedSeller?.id === s.id ? <i className="bx bxs-check-circle ms-1"></i> : null}
                              </div>
                              <div className="small text-truncate">
                                {s.company_info?.organization_name || "-"}
                              </div>
                              <div className="small text-muted">
                                {s.city_data?.name || "-"}
                                {(s.city_data?.States?.name || s.state_data?.name) ? `, ${s.city_data?.States?.name || s.state_data?.name}` : ""}
                                {s.distance_km != null ? ` · ~${s.distance_km} km` : ""}
                              </div>
                            </div>
                            {s.match_score != null && (
                              <div className="text-end flex-shrink-0">
                                <div className={`badge ${s.match_level === "Exact" ? "bg-success" : s.match_level === "Similar" ? "bg-primary" : "bg-light text-dark border"}`}>{s.match_level || "Match"}</div>
                                <div className={`small fw-semibold ${selectedSeller?.id === s.id ? "" : "text-primary"}`}>{s.match_score}%</div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {productUnavailable && !sellerLoading && (
                    <p className="text-danger small mb-0 mt-2"><i className="bx bx-x-circle me-1"></i>Product is not available in the system.</p>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowAssign(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleAssign} disabled={assigning || !selectedSeller || productUnavailable}>
                    {assigning ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span> Assigning...</>
                    ) : ("Assign Seller")}
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
