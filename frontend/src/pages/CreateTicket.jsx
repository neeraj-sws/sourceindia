import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import UseAuth from '../sections/UseAuth';

const CreateTicket = () => {
  const { showNotification } = useAlert();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    title: "",
    message: "",
    attachment: null,
  });
  const { user } = UseAuth();

  useEffect(() => {
  if (user) {
    setFormData((prev) => ({
      ...prev,
      first_name: user.fname || "",
      last_name: user.lname || "",
      phone: user.mobile || "",
    }));

    if (user.email) {
      setEmail(user.email);
    }
  }
}, [user]);

  // ✅ Handle OTP send/verify
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (!showOtpInput) {
        // Step 1: Send OTP
        response = await axios.post(`${API_BASE_URL}/tickets/send-otp`, { email, user_id: user ? user.id : 0, 
          created_by: user ? user.is_seller === 1 ? "Seller" : "Buyer" : "Guest" });
      } else {
        // Step 2: Verify OTP
        response = await axios.post(`${API_BASE_URL}/tickets/verify-otp`, { email, otp });
      }

      const { success, ticket_id, message } = response.data;

      if (success === 1) {
        showNotification(message || "OTP sent successfully", "success");
        setShowOtpInput(true);
        setTicketId(ticket_id);
      } else if (success === 2) {
        showNotification(message || "OTP verified successfully", "success");
        setShowTicketForm(true);
        setTicketId(ticket_id);
      }
    } catch (error) {
      console.error(error);
      showNotification(error.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Ticket Form input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Handle Ticket Form submit
  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));
      form.append("email", email);
      form.append("ticket_id", ticketId);
      if (user) {
        form.append("user_id", user.id);
        form.append("added_by", user.is_seller === 1 ? "Seller" : "Buyer");
      } else {
        form.append("user_id", 0);
        form.append("added_by", "Guest");
      }
      const response = await axios.post(`${API_BASE_URL}/tickets/store-ticket`, form);

      showNotification(response.data.message || "Ticket created successfully", "success");
      const { ticket_id, token } = response.data;
      navigate(`/ticket/view/${ticket_id}?token=${token}`);
      setShowTicketForm(false);
      setShowOtpInput(false);
      setEmail("");
      setOtp("");
      setFormData({
        first_name: "",
        last_name: "",
        phone: "",
        title: "",
        message: "",
        attachment: null,
      });
    } catch (error) {
      console.error(error);
      showNotification(error.response?.data?.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-5">
      <div className="container">
        {/* Header */}
        <div className="card mb-lg-5 mb-3 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">Support Portal</h1>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            {!showTicketForm ? (
              <>
                <h5 className="mb-3">Enter your Email</h5>

                <form onSubmit={handleOtpSubmit}>
                  <div className="row py-2">
                    <div className="col-md-4">
                      <div className="form-group mb-3">
                        <label className="form-label">
                          Email <sup className="text-danger">*</sup>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* OTP Input */}
                  {showOtpInput && (
                    <div className="row py-2">
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Enter OTP <sup className="text-danger">*</sup>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-primary px-4"
                      disabled={loading}
                    >
                      {showOtpInput ? "Verify OTP" : "Send OTP"}
                      {loading && (
                        <i className="st_loader spinner-border spinner-border-sm ms-2"></i>
                      )}
                    </button>

                    <Link to="/get-support" className="btn btn-secondary ms-2">
                      Back
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* ✅ Ticket Form (after OTP verified) */}
                <h5 className="mb-3">Create Ticket</h5>
                <form onSubmit={handleTicketSubmit}>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">First Name*</label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Last Name*</label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Phone Number*</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title*</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email*</label>
                      <input type="email" value={email} className="form-control" readOnly />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">Message*</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="form-control"
                        rows="6"
                        required
                      ></textarea>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">Attachment</label>
                      <input
                        type="file"
                        name="attachment"
                        className="form-control"
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Ticket"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateTicket;
