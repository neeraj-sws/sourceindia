import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";

const ContactUs = () => {

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
                <div className="col-lg-5">
                  <div className="contact-form">
                    <h2 className="mb-4">HAVE A QUESTION?</h2>
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-md-6 p-3">
                          <div className="form-group m-0">
                            <input type="text" name="fname" value={formData.fname}
                              onChange={handleChange} placeholder="Your First Name*" className="form-control  bg-white rounded-2 shadow-sm p-2" />
                          </div>
                        </div>
                        <div className="col-md-6 p-3">
                          <div className="form-group m-0">
                            <input type="text" name="lname" placeholder="Your Last Name*" value={formData.lname}
                              onChange={handleChange} className="form-control bg-white rounded-2 shadow-sm p-2" />
                          </div>
                        </div>
                        <div className="col-md-6 p-3">
                          <div className="form-group m-0">
                            <input type="text" name="email" placeholder="Your Email*" value={formData.email}
                              onChange={handleChange} className="form-control  bg-white rounded-2 shadow-sm p-2" />
                          </div>
                        </div>
                        <div className="col-md-6 p-3">
                          <div className="form-group m-0">
                            <input type="text" name="subject" placeholder="Subject*" value={formData.subject}
                              onChange={handleChange} className="form-control  bg-white rounded-2 shadow-sm p-2" />
                          </div>
                        </div>
                        <div className="col-md-12 p-3">
                          <div className="form-group m-0">
                            <textarea className="form-control pt-3 bg-white rounded-2 shadow-sm p-2" placeholder="Your Message" name="message" value={formData.message}
                              onChange={handleChange} rows="10"></textarea>
                          </div>
                        </div>
                        <div className="col-md-12 pt-md-4 py-34 text-center">
                          <button type="submit" disabled={loading} className="btn btn-primary w-100">  {loading ? "Sending..." : "Submit Now"}</button>

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
