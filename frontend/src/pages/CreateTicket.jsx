import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";

const CreateTicket = ({ setTicketId, setEmail, setShowTicketForm }) => {
  const [email, setLocalEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [ticketId, setLocalTicketId] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useAlert();

  // ✅ Send OTP or Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      // 🔹 Step 1: Send OTP
      if (!showOtpInput) {
        response = await axios.post(`${API_BASE_URL}/tickets/send-otp`, {
          email,
        });
      } else {
        // 🔹 Step 2: Verify OTP
        response = await axios.post(`${API_BASE_URL}/tickets/verify-otp`, {
          email,
          otp,
        });
      }

      const { success, ticket_id, email: resEmail, message } = response.data;

      setLocalTicketId(ticket_id);
      

      if (success === 1) {
        showNotification(message || "OTP sent successfully", "success");
        setShowOtpInput(true);
      } else if (success === 2) {
        showNotification(message || "OTP verified successfully", "success");
        setShowTicketForm(true);
      }
    } catch (error) {
      console.error(error);
      showNotification(
        error.response?.data?.message || "Something went wrong",
        "error"
      );
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
              <h1 className="mb-0 text-white">Support Portal</h1>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h5 className="mb-3">Enter your details</h5>

            <form onSubmit={handleSubmit}>
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
                      onChange={(e) => setLocalEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ✅ OTP Input */}
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

                <a href="/support" className="btn btn-secondary ms-2">
                  Back
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateTicket;
