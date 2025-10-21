import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";

const TicketForm = ({ email, ticketId }) => {
  const { showNotification } = useAlert();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    title: "",
    message: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData({ ...formData, attachment: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => form.append(key, value));
      form.append("email", email);
      form.append("ticket_id", ticketId);

      const response = await axios.post(`${API_BASE_URL}/tickets/create`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showNotification(response.data.message || "Ticket created successfully", "success");
    } catch (error) {
      console.error(error);
      showNotification(error.response?.data?.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-body p-4">
        <h5 className="mb-3">Create Ticket</h5>

        <form onSubmit={handleSubmit}>
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
                rows="5"
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
      </div>
    </div>
  );
};

export default TicketForm;
