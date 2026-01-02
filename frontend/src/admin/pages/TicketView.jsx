import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from '../../config'; // Assuming you have ROOT_URL for images
import { useAlert } from "../../context/AlertContext";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import JoditEditor from "jodit-react";
import TicketModals from "./modal/TicketModals";
import Breadcrumb from "../common/Breadcrumb";

const TicketView = () => {
  const { showNotification } = useAlert();
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formloading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const editor = useRef(null);
  // Extract token from query string
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const [nextTicket, setNextTicket] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({
    id: null,
    newStatus: null, // 2 = resolve, 3 = cancel
  });
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tickets/${ticketId}`);

        setTicketData(res.data);
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Error fetching ticket details",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) fetchTicket();
  }, [ticketId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData();
    formData.append("id", ticket.ticket_id);
    formData.append("message", message);
    formData.append("added_by", "Admin");
    if (attachment) formData.append("attachment", attachment);
    formData.append("type", "reply");

    try {
      const res = await axios.post(`${API_BASE_URL}/tickets/store-support-ticket-reply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification(res.data.message, "success");
      setMessage("");
      setAttachment(null);
      setShowButton(false);
      setFormLoading(false);
      const updatedRes = await axios.get(`${API_BASE_URL}/tickets/${ticketId}`);
      setTicketData(updatedRes.data);
    } catch (error) {
      setFormLoading(false);
      showNotification(error.response?.data?.message || "Error submitting reply", "error");
    }
  };

  useEffect(() => {
    const fetchNextTicket = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tickets/id/${ticketId}/next`);
        setNextTicket(res.data);
      } catch (error) {
        console.error("Error fetching next ticket:", error);
      }
    };

    if (ticketId) fetchNextTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <section className="my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </section>
    );
  }

  if (!ticketData) {
    return (
      <section className="my-5 text-center">
        <p className="text-danger">Ticket not found or unauthorized.</p>
      </section>
    );
  }

  const { ticket, replies, lastReply } = ticketData;

  const handleStatusConfirm = async () => {
    const { id, newStatus } = statusToggleInfo;

    const statusMessage = newStatus === 2 ? "Ticket has been resolved successfully." : "Ticket has been cancelled.";

    setStatusLoading(true);
    try {
      // 1. Send system reply
      const formData = new FormData();
      formData.append("id", ticket.ticket_id);
      formData.append("message", statusMessage);
      formData.append("added_by", "Admin");
      formData.append("type", "reply");

      const replyRes = await axios.post(
        `${API_BASE_URL}/tickets/store-support-ticket-reply`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // 2. Update ticket status
      await axios.patch(`${API_BASE_URL}/tickets/${id}/status`, { status: newStatus });

      // 3. Update state locally and prepend the system reply
      setTicketData(prev => ({
        ...prev,
        ticket: { ...prev.ticket, status: newStatus },
        replies: [
          {
            id: replyRes.data.reply_id || new Date().getTime(), // fallback id
            description: statusMessage,
            added_by: "Admin",
            sender_type: "Admin",
            created_at: new Date().toISOString()
          },
          ...prev.replies
        ]
      }));

      setShowStatusModal(false);
      showNotification("Ticket status updated successfully.", "success");

    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to update ticket status",
        "error"
      );
    } finally {
      setStatusLoading(false); // STOP LOADER
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Tickets" page="Tickets" title={ticket.ticket_id} />
          <div className="row">
            {/* Ticket Information */}
            <div className="col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="headinginfo">Ticket Information</h5>
                  <div className="border-bottom mb-3 pb-3 mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Date Created</p>
                      <p className="mb-0 text-dark">
                        {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Ticket ID #</p>
                      <p className="mb-0 text-dark">{ticket.ticket_id}</p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Title</p>
                      <p className="mb-0 text-dark">{ticket.title}</p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Category</p>
                      <p className="mb-0 text-dark">
                        <span className="badge bg-info">{ticket.TicketCategory?.name || "N/A"}</span>
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Email</p>
                      <p className="mb-0 text-dark">{ticket.email}</p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Name</p>
                      <p className="mb-0 text-dark">
                        {ticket.fname} {ticket.lname}
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Phone</p>
                      <p className="mb-0 text-dark">{ticket.phone}</p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Last Reply</p>
                      <p className="mb-0 text-dark">
                        {lastReply
                          ? new Date(lastReply.created_at).toLocaleString()
                          : "No replies yet"}
                      </p>
                    </div>
                  </div>
                  {(ticket.status == 0 || ticket.status == 1) && (
                    <div className="border-bottom mb-3 pb-3 mt-3">
                      <h5>Issue Resolved/Cancel</h5>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setStatusToggleInfo({ id: ticketId, newStatus: 2 });
                            setShowStatusModal(true);
                          }}
                        >
                          Resolve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setStatusToggleInfo({ id: ticketId, newStatus: 3 });
                            setShowStatusModal(true);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {nextTicket && nextTicket.id != null && (
                    <div className="border-bottom mb-3 pb-3 mt-3">
                      <h5>My Previous Tickets</h5>
                      <Link
                        to={`/admin/ticket/view/${nextTicket.id}`}
                        className="text-decoration-none"
                      >
                        {nextTicket.next}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Replies */}
            <div className="col-lg-8">
              <div className="">
                <div className="">
                  {/* Reply Form */}
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5 className="headinginfo mb-3">Add Reply</h5>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <JoditEditor
                            value={message} // Bind to the message state
                            config={{
                              readonly: false,
                              height: 300,
                              toolbarSticky: false,
                              buttons: [
                                'source', '|', 'bold', 'italic', 'underline', '|',
                                'ul', 'ol', '|', 'outdent', 'indent', '|',
                                'image', 'link', '|', 'undo', 'redo'
                              ]
                            }}
                            onChange={newContent => {
                              setMessage(newContent); // Update the message state with the new content
                              setShowButton(newContent.replace(/<[^>]*>/g, "").trim() !== ""); // Update button visibility
                            }}
                          />

                        </div>
                        <div className="mb-3">
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => setAttachment(e.target.files[0])}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={formloading}>
                          {formloading ? "Postting..." : "Post"}
                        </button>

                      </form>
                    </div>
                  </div>
                  <h5 className="headinginfo text-dark mb-3">Conversation</h5>
                  <div className="conversationSection">

                    {replies && replies.length > 0 ? (
                      replies.map((reply) => (
                        <div key={reply.id} className="card mb-4">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center gap-4">
                              <div>
                                <div className="mb-1 text-secondary">
                                  <p>{ticket.fname} {ticket.lname} <strong className="badge bg-primary me-2 py-1 small">{reply.sender_type || reply.added_by}</strong></p>
                                  <p>replied on {new Date(reply.createdAt || reply.created_at).toLocaleString()}</p>
                                </div>

                                <div className="mb-2"
                                  dangerouslySetInnerHTML={{ __html: reply.description || reply.reply }}
                                />
                              </div>
                              <div>
                                {reply.attachment && (
                                  (() => {
                                    const fileExtension = reply.attachment.split('.').pop().toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png'].includes(fileExtension);

                                    if (isImage) {
                                      return (
                                        <a
                                          href={`${ROOT_URL}/upload/tickets/${reply.attachment}`}
                                          target="_blank"
                                          className="d-inline-block border p-2 rounded-1 shadow-sm"
                                          rel="noopener noreferrer"
                                          download="download"
                                        >
                                          <img
                                            src={`${ROOT_URL}/upload/tickets/${reply.attachment}`}
                                            alt="Attachment"
                                            className="img-fluid" loading="lazy"
                                            decoding="async"
                                            style={{ maxWidth: '150px', maxHeight: '100px' }} // Adjust size as needed
                                          />
                                          <p className="mt-2 mb-0"> <small>{reply.attachment}</small></p>
                                        </a>
                                      );
                                    } else {
                                      return (
                                        <a
                                          href={`${ROOT_URL}/upload/tickets/${reply.attachment}`}
                                          target="_blank"
                                          className="d-block text-center btn btn-outline-dark"
                                          rel="noopener noreferrer"
                                          download="download"
                                        >
                                          <p className="mb-0 text-nowrap"><i className="fadeIn animated bx bx-file pe-1"></i>View Attachment</p>
                                        </a>
                                      );
                                    }
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No replies yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TicketModals
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={() => setShowStatusModal(false)}
        handleStatusConfirm={handleStatusConfirm}
        statusLoading={statusLoading}
      />
    </>
  );
};

export default TicketView;