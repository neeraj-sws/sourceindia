import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";

const ContactUs = () => {
  const { showNotification } = useAlert();
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error of that field when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Validate fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fname.trim()) newErrors.fname = "First name is required.";
    if (!formData.lname.trim()) newErrors.lname = "Last name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    return newErrors;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    // showNotification("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/contacts`, formData);
      // setResponseMsg("Your message has been sent successfully!");
      showNotification('our message has been sent successfully!', "success");
      setFormData({
        fname: "",
        lname: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
    } catch (err) {
      console.error(err);
      // setResponseMsg("Something went wrong. Please try again later.");
      showNotification('Something went wrong. Please try again later.', "warning");
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
              <h1 className="mb-0 text-white">LET'S CONNECT</h1>
            </div>
          </div>
        </div>
        <div className="knowledgeBox">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-lg-4">
                  <div className="iframeBox h-100">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1752.2983465082036!2d77.26948655793018!3d28.55183975162639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce1599cb27a7d%3A0xbc4341a9e27b4c70!2sElectronic%20Industries%20Association%20Of%20India%20(Elcina)!5e0!3m2!1sen!2sin!4v1616479735028!5m2!1sen!2sin" allowfullscreen className="w-100 h-100"></iframe>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="contact-info ps-lg-4 pe-lg-3 border-end h-100">
                    <h2>MEET US</h2>
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
                <div className="col-lg-5">
                  <div className="contact-form">
                    <h2 className="mb-4">HAVE A QUESTION?</h2>
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        {/* First Name */}
                        <div className="col-md-6 p-2">
                          <div className="form-group">
                            <input
                              type="text"
                              name="fname"
                              placeholder="Your First Name*"
                              value={formData.fname}
                              onChange={handleChange}
                              className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors.fname ? "is-invalid" : ""
                                }`}
                            />
                            {errors.fname && (
                              <small className="text-danger">{errors.fname}</small>
                            )}
                          </div>
                        </div>

                        {/* Last Name */}
                        <div className="col-md-6 p-2">
                          <div className="form-group">
                            <input
                              type="text"
                              name="lname"
                              placeholder="Your Last Name*"
                              value={formData.lname}
                              onChange={handleChange}
                              className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors.lname ? "is-invalid" : ""
                                }`}
                            />
                            {errors.lname && (
                              <small className="text-danger">{errors.lname}</small>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="col-md-12 p-2">
                          <div className="form-group">
                            <input
                              type="text"
                              name="email"
                              placeholder="Your Email*"
                              value={formData.email}
                              onChange={handleChange}
                              className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors.email ? "is-invalid" : ""
                                }`}
                            />
                            {errors.email && (
                              <small className="text-danger">{errors.email}</small>
                            )}
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="col-md-12 p-2">
                          <div className="form-group">
                            <input
                              type="text"
                              name="subject"
                              placeholder="Subject*"
                              value={formData.subject}
                              onChange={handleChange}
                              className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors.subject ? "is-invalid" : ""
                                }`}
                            />
                            {errors.subject && (
                              <small className="text-danger">{errors.subject}</small>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        <div className="col-md-12 p-2">
                          <div className="form-group">
                            <textarea
                              name="message"
                              placeholder="Your Message*"
                              rows="6"
                              value={formData.message}
                              onChange={handleChange}
                              className={`form-control bg-white rounded-2 shadow-sm p-2 ${errors.message ? "is-invalid" : ""
                                }`}
                            ></textarea>
                            {errors.message && (
                              <small className="text-danger">{errors.message}</small>
                            )}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="col-md-12 text-center pt-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-100"
                          >
                            {loading ? "Sending..." : "Submit Now"}
                          </button>

                          {responseMsg && (
                            <div className="col-md-12 text-center mt-3">
                              <p className="text-success">{responseMsg}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
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

export default ContactUs;
