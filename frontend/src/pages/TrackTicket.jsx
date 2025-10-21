import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
const TrackTicket = () => {
  const { showNotification } = useAlert();
  const [email, setEmail] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    ticketId: "",
  });

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));
     

      const response = await axios.post(`${API_BASE_URL}/tickets/track-ticket`, form, {

      });

      showNotification(response.data.message || "Ticket Tracking successfully", "success");
      const { ticket_id, token } = response.data;
      navigate(`/ticket/view/${ticket_id}?token=${token}`);
      setEmail("");
      setFormData({
        email: "",
        ticketId: ""
      });
    } catch (error) {
      console.error(error);
      showNotification(error.response?.data?.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
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
        <div className="knowledgeBox">
          <div className="row">
            <div className="col-lg-12 mx-auto">
              <div className="card">
                <div className="card-body p-5">
                  <div className="contact-form">
                    <form onSubmit={handleTicketSubmit}>
                      <h4 className="mb-4">Track Ticket</h4>
                      <div className="row py-3">
                        <div className="col-md-4">
                          <div className="form-group ">
                            <label className="form-label">Email<sup className="text-danger">*</sup></label>
                            <input type="text" name="email" id="otp-email" className="form-control" placeholder="Enter Email" value={formData.email}
                              onChange={handleChange} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group ">
                            <label className="form-label">Ticket Number<sup className="text-danger">*</sup></label>
                            <input type="text" name="ticketId" id="ticketId" className="form-control" placeholder="Enter Ticket Number" value={formData.ticketId} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 d-flex gap-2">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                          {loading ? "Submitting..." : "Submit Ticket"}
                        </button>
                        <Link to="/get-support" className="btn btn-secondary">Back</Link>
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

export default TrackTicket;
