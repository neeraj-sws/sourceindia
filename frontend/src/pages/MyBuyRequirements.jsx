import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { formatDateTime } from "../utils/formatDate";
import { renderAssignedSeller as ownerCell } from "../utils/assignedSeller";
import { Link } from "react-router-dom";

const DataTable = lazy(() => import("../admin/common/DataTable"));

const reqStatusMap = {
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const MyBuyRequirements = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [feedbackReq, setFeedbackReq] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const getRangeText = () => {
    if (totalRecords === 0) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);
    return `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/my`, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching my requirements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search]);

  const handleSubmitFeedback = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setFeedbackMsg("Please select a rating between 1 and 5");
      return;
    }
    if (!feedbackText || feedbackText.trim().length < 3) {
      setFeedbackMsg("Feedback must be at least 3 characters long");
      return;
    }
    setIsSubmitting(true);
    setFeedbackMsg("");
    try {
      await axios.post(
        `${API_BASE_URL}/buyer-requirements/${feedbackReq.id}/feedback`,
        { rating, feedback: feedbackText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` } }
      );
      setFeedbackMsg("Feedback submitted successfully");
      setTimeout(() => {
        setFeedbackReq(null);
        setRating(0);
        setFeedbackText("");
        setFeedbackMsg("");
        fetchData();
      }, 1200);
    } catch (err) {
      setFeedbackMsg(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">My Buy Requirements</h4>
            <Link className="btn btn-primary" to="/post-buy-requirement">+ New Requirement</Link>
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "ID", sortable: true },
                  { key: "product", label: "Product", sortable: false },
                  { key: "category", label: "Category", sortable: false },
                  { key: "quantity", label: "Quantity", sortable: false },
                  { key: "created_at", label: "Posted", sortable: true },
                  { key: "status", label: "Status", sortable: false },
                  { key: "assignments", label: "Assigned Sellers", sortable: false },
                  { key: "actions", label: "Rating & Feedback", sortable: false },
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
                renderRow={(row) => {
                  const st = reqStatusMap[row.status] || { label: "Unknown", class: "secondary" };
                  return (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.product_name_snapshot}</td>
                      <td>{row.category?.name || "-"}</td>
                      <td>{row.quantity || "-"}{row.quantity_unit ? ` ${row.quantity_unit}` : ""}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                      <td><span className={`badge bg-${st.class}`}>{st.label}</span></td>
                      <td>{ownerCell(row)}</td>
                      <td>
                        {row.status === 3 ? (
                          row.buyer_rating
                            ? <span className="badge bg-success">Rated {row.buyer_rating}/5</span>
                            : <button className="btn btn-sm btn-outline-primary" onClick={() => { setFeedbackReq(row); setRating(0); setFeedbackText(""); setFeedbackMsg(""); }}>
                                Rate & Feedback
                              </button>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {feedbackReq && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: 500 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rate & Feedback</h5>
                <button type="button" className="btn-close" onClick={() => setFeedbackReq(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small mb-2">{feedbackReq.product_name_snapshot}</p>
                <label className="form-label">Your Rating</label>
                <div className="mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn btn-sm me-1 ${rating >= n ? "btn-warning" : "btn-outline-secondary"}`}
                      onClick={() => setRating(n)}
                    >
                      {n}★
                    </button>
                  ))}
                </div>
                <label className="form-label">Feedback</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Share your experience with the seller..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                {feedbackMsg && <div className="mt-2 small text-info">{feedbackMsg}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFeedbackReq(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSubmitFeedback} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Suspense>
  );
};

export default MyBuyRequirements;
