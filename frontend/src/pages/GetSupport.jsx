import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";

const GetSupport = () => {

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
  const timer = setTimeout(() => {
    setShowSkeleton(false);
  }, 1000); // ⏱️ 1 second

  return () => clearTimeout(timer);
}, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg("");

    try {
      // Example API endpoint
      const res = await axios.post(`${API_BASE_URL}/contactStore`, formData);
      setResponseMsg("Your message has been sent successfully!");
      setFormData({
        fname: "",
        lname: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error(err);
      setResponseMsg("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const Skeleton = ({ width = "100%", height = "16px", style = {} }) => (
  <div
    style={{
      width,
      height,
      background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 37%,#e0e0e0 63%)",
      backgroundSize: "400% 100%",
      animation: "skeleton-loading 1.4s ease infinite",
      borderRadius: "6px",
      ...style,
    }}
  />
);

const GetSupportSkeleton = () => (
  <>
    <style>
      {`
        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}
    </style>

    <section className="my-5">
      <div className="container">

        {/* Header */}
        <div className="card mb-5">
          <div className="card-body py-5 d-flex justify-content-center">
            <Skeleton width="250px" height="36px" />
          </div>
        </div>

        <div className="card">
          <div className="card-body py-md-4 pe-lg-5">
            <div className="row">

              {/* Left Info */}
              <div className="col-lg-4">
                <Skeleton height="22px" width="120px" style={{ marginBottom: 20 }} />

                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <Skeleton height="16px" width="140px" />
                    <Skeleton height="14px" style={{ marginTop: 8 }} />
                    <Skeleton height="14px" width="80%" style={{ marginTop: 6 }} />
                  </div>
                ))}
              </div>

              {/* Right Content */}
              <div className="col-lg-8">
                <Skeleton height="22px" width="300px" style={{ marginBottom: 25 }} />

                <div className="row">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="col-md-6">
                      <div className="card p-4 text-center">
                        <Skeleton height="40px" width="40px" style={{ margin: "0 auto" }} />
                        <Skeleton height="18px" width="120px" style={{ margin: "12px auto" }} />
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  </>
);

if (showSkeleton) return <GetSupportSkeleton />;

  return (
    <section className="my-5">
      <div className="container">
        <div className="card mb-5 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">GET SUPPORT</h1>
            </div>
          </div>
        </div>
        <div className="knowledgeBox">
          <div className="card">
            <div className="card-body py-md-4 pe-lg-5">
              <div className="row">
                <div className="col-lg-4">
                  <div className="contact-info ps-lg-4 pe-lg-3 border-end h-100">
                    <h4>MEET US</h4>
                    <div className="info-item d-flex align-items-start mt-4">
                      <i className="bi bi-telephone-fill"></i>
                      <div>
                        <h6 className="text-orange">Call Us Now</h6>
                        <p className="d-flex align-items-center gap-2"><i className="lni lni-phone"></i> <a href="tel:+91-11-41615985" className="nav-link">
                          +91-11-41615985, </a>
                          <a href="tel:+91-11-41615985" className="nav-link">
                            +91-11-41011291</a>
                        </p>
                      </div>
                    </div>

                    <div className="info-item d-flex align-items-start">
                      <i className="bi bi-geo-alt-fill"></i>
                      <div>
                        <h6 className="text-orange">Our Location</h6>
                        <p className="d-flex align-items-center gap-2"><i className="lni lni-map-marker"></i> Elcina House, 422, Okhla Industrial Estate, Phase-III, New Delhi, Delhi 110020</p>
                      </div>
                    </div>

                    <div className="info-item d-flex align-items-start">
                      <i className="bi bi-envelope-fill"></i>
                      <div>
                        <h6 className="text-orange">Write Us Now</h6>
                        <p className="d-flex align-items-center gap-2"><i className="fadeIn animated bx bx-comment-detail"></i> support@sourceindia-electronics.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="contact-form">
                    <h4 className="mb-4">Please Create Your Support Ticket</h4>
                    <div className="row pt-lg-1">
                      <div className="col-md-6">
                        <div className="card supportTicket">
                          <div className="card-body">
                            <Link to="/get-support/createticket" className="d-block">
                              <div className="text-center ticketicon">
                                <i className="fadeIn animated bx bx-envelope-open"></i>
                                <h6>Create Ticket</h6>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card supportTicket">
                          <div className="card-body">
                            <Link to="/get-support/trackticket" className="d-block">
                              <div className="text-center ticketicon">
                                <i className="fadeIn animated bx bx-envelope-open"></i>
                                <h6>Track a Ticket</h6>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetSupport;
