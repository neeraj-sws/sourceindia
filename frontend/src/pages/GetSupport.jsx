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
                        <p className="d-flex align-items-center gap-2"><i class="lni lni-phone"></i> <a href="tel:+91-11-41615985" className="nav-link">
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
                        <p className="d-flex align-items-center gap-2"><i class="lni lni-map-marker"></i> Elcina House, 422, Okhla Industrial Estate, Phase-III, New Delhi, Delhi 110020</p>
                      </div>
                    </div>

                    <div className="info-item d-flex align-items-start">
                      <i className="bi bi-envelope-fill"></i>
                      <div>
                        <h6 className="text-orange">Write Us Now</h6>
                        <p className="d-flex align-items-center gap-2"><i class="fadeIn animated bx bx-comment-detail"></i> support@sourceindia-electronics.com</p>
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
                                <i class="fadeIn animated bx bx-envelope-open"></i>
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
                                <i class="fadeIn animated bx bx-envelope-open"></i>
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
