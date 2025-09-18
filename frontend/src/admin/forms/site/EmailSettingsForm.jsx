import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const EmailSettingsForm = () => {
  const { showNotification } = useAlert();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    smtp_server_address: '', smtp_port: '', smtp_username: '', smtp_password: '',
    smtp_tls: '', smtp_auto_reply: ''
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/site`);
      setFormData(res.data);
    }
    fetchData();
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!formData.smtp_server_address.trim()) errs.smtp_server_address = 'SMTP server address is required';
    if (!formData.smtp_port.trim()) errs.smtp_port = 'SMTP port is required';
    if (!formData.smtp_username.trim()) errs.smtp_username = 'SMTP username is required';
    if (!formData.smtp_password.trim()) errs.smtp_password = 'SMTP password is required';
    if (!formData.smtp_tls.trim()) errs.smtp_tls = 'SMTP tls is required';
    if (!formData.smtp_auto_reply.trim()) errs.smtp_auto_reply = 'SMTP auto reply is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    try {
      await axios.put(`${API_BASE_URL}/settings/site`, data);
      showNotification("Email Setting updated successfully!", "success");
    } catch (error) {
      console.error('Error saving Email Setting:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">Email Settings</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="smtp_server_address" className="form-label required">SMTP Server Address</label>
          <input type="text" className={`form-control ${errors.smtp_server_address ? 'is-invalid' : ''}`} id="smtp_server_address"
            placeholder="SMTP Server Address" value={formData.smtp_server_address} onChange={handleInputChange} />
          {errors.smtp_server_address && <div className="invalid-feedback">{errors.smtp_server_address}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="smtp_port" className="form-label required">SMTP Port</label>
          <input type="text" className={`form-control ${errors.smtp_port ? 'is-invalid' : ''}`} id="smtp_port"
            placeholder="SMTP Port" value={formData.smtp_port} onChange={handleInputChange} />
          {errors.smtp_port && <div className="invalid-feedback">{errors.smtp_port}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="smtp_username" className="form-label required">Username</label>
          <input type="email" className={`form-control ${errors.smtp_username ? 'is-invalid' : ''}`} id="smtp_username"
            placeholder="Username" value={formData.smtp_username} onChange={handleInputChange} />
          {errors.smtp_username && <div className="invalid-feedback">{errors.smtp_username}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="smtp_password" className="form-label required">Password</label>
          <input type="text" className={`form-control ${errors.smtp_password ? 'is-invalid' : ''}`} id="smtp_password"
            placeholder="Password" value={formData.smtp_password} onChange={handleInputChange} />
          {errors.smtp_password && <div className="invalid-feedback">{errors.smtp_password}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="smtp_tls" className="form-label required">Turn on transport layer security (TLS)</label>
          <select id="smtp_tls" className={`form-select ${errors.smtp_tls ? 'is-invalid' : ''}`} value={formData.smtp_tls}
            onChange={handleInputChange}>
            <option value="">Select here</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {errors.smtp_tls && <div className="invalid-feedback">{errors.smtp_tls}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="smtp_auto_reply" className="form-label required">Auto email reply to email</label>
          <input type="email" className={`form-control ${errors.smtp_auto_reply ? 'is-invalid' : ''}`} id="smtp_auto_reply"
            placeholder="Auto email reply to email" value={formData.smtp_auto_reply} onChange={handleInputChange} />
          {errors.smtp_auto_reply && <div className="invalid-feedback">{errors.smtp_auto_reply}</div>}
        </div>
        <div className="col-12 text-end mt-4">
          <button type="submit" className="btn btn-primary btn-sm px-4">Update</button>
        </div>
      </form>
    </>
  )
}

export default EmailSettingsForm