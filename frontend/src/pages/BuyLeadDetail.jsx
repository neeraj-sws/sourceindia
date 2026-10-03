import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import useAuth from "../sections/UseAuth";
import { formatDateTime } from "../utils/formatDate";
import ConfirmActionModal from "../components/ConfirmActionModal";

const MAX_REJECTION_WORDS = 500;
const REJECTION_MIN_ROWS = 2;
const REJECTION_MAX_ROWS = 5;

const statusMap = {
  0: { label: "Assigned", class: "secondary" },
  1: { label: "Viewed", class: "info" },
  2: { label: "Responded", class: "primary" },
  3: { label: "Accepted", class: "success" },
  4: { label: "Rejected", class: "danger" },
  5: { label: "Auto Cancelled", class: "dark" },
  6: { label: "Completed", class: "success" },
};

const BuyLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useAlert();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  // Which action is awaiting confirmation in the modal: null | "accept" |
  // "reject" | "complete". Null means the modal is closed and nothing pending.
  const [pendingAction, setPendingAction] = useState(null);
  const rejectionReasonRef = useRef(null);

  // Keeps the textarea between its original 2 rows and a 5-row ceiling, then
  // scrolls past that. Height is driven inline so the rendered size never
  // depends on how many words are present.
  const resizeRejectionReason = () => {
    const el = rejectionReasonRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const minHeight = lineHeight * REJECTION_MIN_ROWS;
    const maxHeight = lineHeight * REJECTION_MAX_ROWS;

    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  // 500-word cap counted on whitespace-separated words. A word already in
  // progress (a trailing space) does not count, so typing space on word 500 is
  // still allowed while the 501st word can never start.
  const handleRejectionReasonChange = (e) => {
    const value = e.target.value;
    const words = value.trim() === "" ? [] : value.trim().split(/\s+/);
    if (words.length <= MAX_REJECTION_WORDS) {
      setRejectionReason(value);
      if (rejectionError) setRejectionError("");
    }
  };

  useEffect(resizeRejectionReason, [rejectionReason]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/seller/lead/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setLead(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Lead not found";
      showNotification(msg, "error");
      navigate("/buy-leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchDetail(); /* eslint-disable-next-line */ }, [user, id]);

  const doRespond = async (action) => {
    if (action === "reject" && !rejectionReason.trim()) {
      setRejectionError("Rejection reason is required.");
      return;
    }
    // Only the confirmation UI moved from window.confirm to ConfirmActionModal.
    // Cancelling sets pendingAction back to null, which runs none of the code
    // below: no API call, no setBusy, no state change.
    setPendingAction(action === "accept" ? "accept" : "reject");
  };

  const doComplete = async () => {
    setPendingAction("complete");
  };

  // Runs the real action once the seller confirms in the modal. Identical to the
  // code that used to sit after the `if (!window.confirm(...)) return;` guard.
  const performPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;

    if (action === "complete") {
      setBusy(true);
      try {
        await axios.post(`${API_BASE_URL}/buyer-requirements/seller/lead/${id}/complete`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` } });
        showNotification("Lead marked as completed", "success");
        fetchDetail();
      } catch (err) {
        showNotification(err.response?.data?.message || "Action failed", "error");
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      await axios.post(`${API_BASE_URL}/buyer-requirements/seller/lead/${id}/respond`,
        { action, rejection_reason: action === "reject" ? rejectionReason : undefined },
        { headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` } });
      showNotification(action === "accept" ? "Lead accepted" : "Lead rejected", "success");
      fetchDetail();
    } catch (err) {
      showNotification(err.response?.data?.message || "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!lead) return <p>Lead not found</p>;

  const st = statusMap[lead.status] || { label: "Unknown", class: "secondary" };
  const req = lead.requirement || {};

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <button className="btn btn-sm btn-light mb-3" onClick={() => navigate("/buy-leads")}>← Back to Leads</button>
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="mb-0">Buy Lead {lead.assignment_number}</h5>
                <div>
                  <span className={`badge bg-${st.class}`}>{st.label}</span>
                </div>
              </div>
              <div className="card-body">
                <h4>{req.product_name_snapshot}</h4>
                <div className="row">
                  <div className="col-md-6"><strong>Category:</strong> {req.category?.name || "-"}</div>
                  <div className="col-md-6"><strong>Sub Category:</strong> {req.subCategory?.name || "-"}</div>
                  <div className="col-md-6"><strong>Item Category:</strong> {req.itemCategory?.name || "-"}</div>
                  <div className="col-md-6"><strong>Item Sub Category:</strong> {req.itemSubCategory?.name || "-"}</div>
                  <div className="col-md-6"><strong>Quantity:</strong> {req.quantity || "-"}{req.quantity_unit ? ` ${req.quantity_unit}` : ""}</div>
                  {/* "Requirement Type" removed: reads product_type, column dropped from buyer_requirements */}
                  <div className="col-md-6"><strong>Supplier Preference:</strong> {req.supplier_preference || "-"}</div>
                  <div className="col-md-6"><strong>Posted:</strong> {formatDateTime(req.created_at)}</div>
                  <div className="col-12 mt-2"><strong>Description:</strong> {req.description || "-"}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h6 className="mb-0">Buyer Details</h6></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6"><strong>Name:</strong> {req.buyer_name || "-"}</div>
                  <div className="col-md-6"><strong>Company:</strong> {req.buyer_company || "-"}</div>
                  <div className="col-md-6"><strong>City:</strong> {req.buyer_city || "-"}</div>
                  <div className="col-md-6"><strong>State:</strong> {req.buyer_state || "-"}</div>
                  <div className="col-md-6"><strong>Email:</strong> {req.buyer_email || "-"}</div>
                  <div className="col-md-6"><strong>Phone:</strong> {req.buyer_phone || "-"}</div>
                </div>
              </div>
            </div>

            {req.buyer_rating ? (
              <div className="card">
                <div className="card-header"><h6 className="mb-0">Buyer Feedback</h6></div>
                <div className="card-body">
                  <div className="mb-2">
                    <strong>Rating:</strong>{" "}
                    <span className="badge bg-warning text-dark">{req.buyer_rating}/5</span>
                  </div>
                  <div>
                    <strong>Feedback:</strong>
                    <p className="mb-0 mt-1" style={{ whiteSpace: "pre-wrap" }}>{req.buyer_feedback || "-"}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Actions</h6></div>
              <div className="card-body">
                {lead.status === 6 ? (
                  <div className="alert alert-success mb-0">This lead has been completed.</div>
                ) : lead.status === 3 ? (
                  <>
                    <div className="alert alert-success mb-2">You have accepted this lead.</div>
                    <button className="btn btn-info w-100 mb-2" disabled={busy} onClick={() => doComplete()}>
                      Mark as Completed
                    </button>
                  </>
                ) : lead.status === 4 || lead.status === 5 ? (
                  <div className="alert alert-secondary mb-0">This lead is no longer active for you.</div>
                ) : (
                  <>
                    <button className="btn btn-success w-100 mb-2" disabled={busy} onClick={() => doRespond("accept")}>
                      Accept Lead
                    </button>
                    <textarea
                      ref={rejectionReasonRef}
                      className="form-control mb-2"
                      rows="2"
                      placeholder="Rejection reason (required to reject)"
                      value={rejectionReason}
                      onChange={handleRejectionReasonChange}
                    />
                    {rejectionError && <div className="text-danger small">{rejectionError}</div>}
                    <button
                      className="btn btn-danger w-100"
                      title="Reject and reassign to other seller"
                      disabled={busy}
                      onClick={() => doRespond("reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <ConfirmActionModal
          show={pendingAction === "accept"}
          icon="bx bx-check-circle"
          iconClass="text-success"
          title="Accept this lead?"
          description={`You are accepting Buy Lead ${lead.assignment_number} for ${req.product_name_snapshot || "this product"}.`}
          confirmLabel="Yes, Accept"
          confirmClass="btn-success"
          confirmDisabled={busy}
          onConfirm={performPendingAction}
          onCancel={() => setPendingAction(null)}
        />

        <ConfirmActionModal
          show={pendingAction === "reject"}
          icon="bx bx-x-circle"
          iconClass="text-danger"
          title="Reject this lead?"
          description="The lead will be rejected and reassigned to another seller. This cannot be undone."
          confirmLabel="Yes, Reject"
          confirmClass="btn-danger"
          confirmDisabled={busy}
          onConfirm={performPendingAction}
          onCancel={() => setPendingAction(null)}
        />

        <ConfirmActionModal
          show={pendingAction === "complete"}
          icon="bx bx-check-double"
          iconClass="text-info"
          title="Mark this lead as completed?"
          description={`This marks Buy Lead ${lead.assignment_number} as completed and closes the requirement.`}
          confirmLabel="Yes, Mark Completed"
          confirmClass="btn-info"
          confirmDisabled={busy}
          onConfirm={performPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      </div>
    </div>
  );
};

export default BuyLeadDetail;
