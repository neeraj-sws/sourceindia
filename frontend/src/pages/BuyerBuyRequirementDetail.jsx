import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import useAuth from "../sections/UseAuth";
import { formatDateTime } from "../utils/formatDate";

const statusMap = {
  0: { label: "Pending", class: "warning" },
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const assignStatusMap = {
  0: { label: "Assigned", class: "secondary" },
  1: { label: "Viewed", class: "info" },
  2: { label: "Responded", class: "primary" },
  3: { label: "Accepted", class: "success" },
  4: { label: "Rejected", class: "danger" },
  5: { label: "Auto Cancelled", class: "dark" },
  6: { label: "Completed", class: "success" },
};

const ALREADY_POSTED_REASON = "Requirement already posted for the same product and city today";

// Display-only. One specific "No Seller Found" entry is labelled "Already Posted"
// so the buyer sees why no seller was assigned. Every other entry keeps showing
// its raw action, and the stored reason/details are never altered.
const isAlreadyPostedLog = (log) =>
  log?.action === "no_seller_found" && log?.details === ALREADY_POSTED_REASON;

const BuyerBuyRequirementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useAlert();
  const [req, setReq] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setReq(res.data);
      try {
        const logRes = await axios.get(`${API_BASE_URL}/buyer-requirements/${id}/activity-log`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
        });
        setLogs(logRes.data || []);
      } catch (e) {
        setLogs([]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Requirement not found";
      showNotification(msg, "error");
      navigate("/my-buy-requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDetail();
  }, [user, id]);

  if (loading) return <p>Loading...</p>;
  if (!req) return <p>Requirement not found</p>;

  const st = statusMap[req.status] || { label: "Unknown", class: "secondary" };
  const assignments = req.assignments || [];

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <button className="btn btn-sm btn-light mb-3" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Buy Requirement #{req.id}</h5>
                <span className={`badge bg-${st.class}`}>{st.label}</span>
              </div>
              <div className="card-body">
                <h4 className="text-capitalize">{req.product_name_snapshot}</h4>
                <div className="row">
                  <div className="col-md-6">
                    <strong>Category:</strong> {req.category?.name || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Sub Category:</strong> {req.subCategory?.name || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Item Category:</strong> {req.itemCategory?.name || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Item Sub Category:</strong> {req.itemSubCategory?.name || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Quantity:</strong> {req.quantity || "-"}
                    {req.quantity_unit ? ` ${req.quantity_unit}` : ""}
                  </div>
                  <div className="col-md-6">
                    <strong>Supplier Preference:</strong> {req.supplier_preference || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Posted:</strong> {formatDateTime(req.created_at)}
                  </div>
                  <div className="col-12 mt-2">
                    <strong>Description:</strong> {req.description || "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Your Details</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <strong>Name:</strong> {req.buyer_name || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Company:</strong> {req.buyer_company || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>City:</strong> {req.buyer_city || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>State:</strong> {req.buyer_state || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong> {req.buyer_email || "-"}
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong> {req.buyer_phone || "-"}
                  </div>
                </div>
              </div>
            </div>
            {req.buyer_rating ? (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Your Feedback</h6>
                </div>
                <div className="card-body">
                  <div className="mb-2">
                    <strong>Rating:</strong>{" "}
                    <span className="badge bg-warning text-dark">{req.buyer_rating}/5</span>
                  </div>
                  <div>
                    <strong>Feedback:</strong>
                    <p className="mb-0 mt-1" style={{ whiteSpace: "pre-wrap" }}>
                      {req.buyer_feedback || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Seller Assignments</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.No.</th>
                        <th>Seller</th>
                        <th>Company</th>
                        <th>Status</th>
                        <th>Assigned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4">
                            No assignments yet
                          </td>
                        </tr>
                      ) : (
                        assignments.map((a, idx) => {
                          const ast = assignStatusMap[a.status] || { label: `Status ${a.status}`, class: "secondary" };
                          return (
                            <tr key={a.id}>
                              <td>{idx + 1}</td>
                              <td>
                                <div className="fw-semibold">
                                  {a.seller ? `${a.seller.fname || ""} ${a.seller.lname || ""}`.trim() : "-"}
                                </div>
                              </td>
                              <td>{a.seller?.company_info?.organization_name || "-"}</td>
                              <td>
                                <span className={`badge bg-${ast.class}`}>{ast.label}</span>
                              </td>
                              <td>{formatDateTime(a.assigned_at)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card card-border radius-2">
              <div className="card-header py-3">
                <h6 className="mb-0">
                  <i className="bx bx-time-five me-1"></i> Activity Log
                </h6>
              </div>
              <div className="card-body p-0 thin-scroll" style={{ maxHeight: 470 }}>
                {logs.length === 0 ? (
                  <p className="text-muted small p-3 mb-0">No activity yet</p>
                ) : (
                  <ul className="list-group list-group-flush">
                    {logs.map((l) => (
                      <li key={l.id} className="list-group-item d-flex gap-3 py-3">
                        <div
                          className="rounded-circle bg-light text-muted d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 28, height: 28 }}
                        >
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </div>
                        <div className="min-w-0">
                          <div>
                            <code className="text-primary">{isAlreadyPostedLog(l) ? "Already Posted" : l.action}</code>
                          </div>
                          <div className="text-muted small">{l.details || "-"}</div>
                          <div className="text-muted small">
                            {formatDateTime(l.created_at)}
                              {l.seller ? ` • ${l.seller.fname} ${l.seller.lname}` : ""}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerBuyRequirementDetail;
