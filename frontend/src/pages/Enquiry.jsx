import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link, useNavigate } from "react-router-dom";
import AddEnquiryModal from "./AddEnquiryModal";
import UseAuth from "../sections/UseAuth";

// Axios instance with CSRF
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
if (csrfToken) {
  api.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
}

const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = UseAuth();
  const navigate = useNavigate();

  // Fetch Enquiries
  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        is_home: "1",
        is_delete: "0",
      });

      if (activeTab === "my" && user?.id) {
        params.append("user_id", user.id);
      }

      const url = `${API_BASE_URL}/open_enquiries/front-enquiry?${params.toString()}`;
      const response = await axios.get(url);
      setEnquiries(response.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // cheakUserchats ka React version
  const cheakUserchats = async (enquiryId) => {
    if (!user) {
      sessionStorage.setItem("backUrl", window.location.href);
      navigate("/login"); // Apna login route
      return;
    }

    try {

      const res = await api.post(`${API_BASE_URL}/open_enquiries/cheak-chats`, {
        id: enquiryId,
        user: user
      });

      const { success, enquiry_id } = res.data;

      if (success === 1 || success === 2) {
        navigate(`/inbox/${enquiry_id}`);
      }
    } catch (err) {
      console.error("cheakUserchats failed:", err);
    }
  };

  // Modal Handlers
  const handleOpenModal = (e) => {
    e.preventDefault();
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);
  const handleEnquiryAdded = () => {
    fetchEnquiries();
  };

  return (
    <>
      <section className="enquirySection">
        <div className="container my-5">
          {/* Header */}
          <div className="card mb-5 commonHead border shadow-none">
            <div className="card-body py-5 text-center">
              <h1 className="text-white">Open Enquiry</h1>
            </div>
          </div>

          {/* Tabs + Add Button */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex gap-3">
                  <button
                    className={`btn ${activeTab === "all" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Enquiry
                  </button>

                  {user && (
                    <button
                      className={`btn ${activeTab === "my" ? "btn-primary" : "btn-outline-primary"}`}
                      onClick={() => setActiveTab("my")}
                    >
                      My Enquiry
                    </button>
                  )}
                </div>

                <a href="#" className="btn btn-outline-primary" onClick={handleOpenModal}>
                  Add Enquiry
                </a>
              </div>
            </div>
          </div>

          {/* Loading or List */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-5">
              <p>No enquiries found.</p>
            </div>
          ) : (
            <div className="row">
              {enquiries.map((enquiry) => (
                <div key={enquiry.id} className="col-lg-4 col-md-6 mb-4">
                  <div className="card h-100 border shadow-sm">
                    {/* Header */}
                    <div className="card-header bg-white">
                      <div className="d-flex gap-2 align-items-center">
                        <div className="compnaylogo">
                          {enquiry.company_logo && (
                            <ImageFront
                              src={`${ROOT_URL}/${enquiry.company_logo}`}
                              alt={enquiry.organization_name || "Company"}
                              style={{
                                maxWidth: "90px",
                                height: "auto",
                                objectFit: "cover",
                                cursor: "pointer",
                              }}
                              showFallback={true}
                              defaultimg="/company.png"
                            />
                          )}
                        </div>
                        <h5 className="card-title lh-sm" style={{ fontSize: "18px" }}>
                          {enquiry.title}
                        </h5>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="card-body p-0">
                      <div className="row gx-0">
                        <div className="col-lg-12 p-0">
                          <p className="card-text px-3 py-2 bg-light mb-0">
                            <b className="fw-semibold">Description:</b> {enquiry.description}
                          </p>
                          <div className="px-3 py-2">
                            <p className="card-text mb-1">
                              <b className="fw-semibold">Quantity:</b> {enquiry.quantity || "N/A"}
                            </p>
                            <p className="card-text mb-1">
                              <b className="fw-semibold">Name:</b> {enquiry.fname} {enquiry.lname}
                            </p>

                            {(enquiry.organization_name || enquiry.company) && (
                              <p className="card-text mb-1">
                                <b className="fw-semibold">Company Name:</b>{" "}
                                {enquiry.organization_slug ? (
                                  <Link to={`/companies/${enquiry.organization_slug}`}>
                                    {enquiry.organization_name}
                                  </Link>
                                ) : (
                                  enquiry.company
                                )}
                              </p>
                            )}

                            <p className="card-text mb-1">
                              <b className="fw-semibold">Date:</b>{" "}
                              {new Date(enquiry.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: View / Reply */}
                    <div className="card-footer text-center">
                      {enquiry.user_id === user?.id ? (
                        <Link
                          to={`/Inbox/${enquiry.id}`}
                          className="btn btn-sm btn-primary w-50 text-nowrap py-1 fw-medium d-inline-block pt-2"
                        >
                          View
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => cheakUserchats(enquiry.id)}
                          className="btn btn-sm btn-primary w-50 text-nowrap py-1 fw-medium orange-hoverbtn d-inline-block pt-2"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AddEnquiryModal
        show={showModal}
        handleClose={handleCloseModal}
        onEnquiryAdded={handleEnquiryAdded}
      />
    </>
  );
};

export default Enquiry;