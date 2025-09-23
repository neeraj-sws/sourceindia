import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const SmsSettingsForm = () => {
  const { showNotification } = useAlert();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    sms_username: '', sms_password: '', sms_route: '', sms_dlt_template_id: '',
    sms_pid: '', sms_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
    if (!formData.sms_username.trim()) errs.sms_username = 'SMS username is required';
    if (!formData.sms_password.trim()) errs.sms_password = 'SMTP password is required';
    if (!formData.sms_route.trim()) errs.sms_route = 'SMTP route is required';
    if (!formData.sms_dlt_template_id.trim()) errs.sms_dlt_template_id = 'SMTP dlt template ID is required';
    if (!formData.sms_pid.trim()) errs.sms_pid = 'SMTP pid address is required';
    if (!formData.sms_url.trim()) errs.sms_url = 'SMTP url reply is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    try {
      await axios.put(`${API_BASE_URL}/settings/site`, data);
      showNotification("SMS Setting updated successfully!", "success");
    } catch (error) {
      console.error('Error saving SMS Setting:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">SMS Settings</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="sms_username" className="form-label required">SMS Username</label>
          <input type="text" className={`form-control ${errors.sms_username ? 'is-invalid' : ''}`} id="sms_username"
            placeholder="SMS Username" value={formData.sms_username} onChange={handleInputChange} />
          {errors.sms_username && <div className="invalid-feedback">{errors.sms_username}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="sms_password" className="form-label required">SMS Password</label>
          <input type="text" className={`form-control ${errors.sms_password ? 'is-invalid' : ''}`} id="sms_password"
            placeholder="SMS Password" value={formData.sms_password} onChange={handleInputChange} />
          {errors.sms_password && <div className="invalid-feedback">{errors.sms_password}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="sms_route" className="form-label required">SMS Route</label>
          <input type="text" className={`form-control ${errors.sms_route ? 'is-invalid' : ''}`} id="sms_route"
            placeholder="SMS Route" value={formData.sms_route} onChange={handleInputChange} />
          {errors.sms_route && <div className="invalid-feedback">{errors.sms_route}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="sms_dlt_template_id" className="form-label required">SMS dlt template ID</label>
          <input type="text" className={`form-control ${errors.sms_dlt_template_id ? 'is-invalid' : ''}`} id="sms_dlt_template_id"
            placeholder="SMS dlt template ID" value={formData.sms_dlt_template_id} onChange={handleInputChange} />
          {errors.sms_dlt_template_id && <div className="invalid-feedback">{errors.sms_dlt_template_id}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="sms_pid" className="form-label required">SMS Pid</label>
          <input type="text" className={`form-control ${errors.sms_pid ? 'is-invalid' : ''}`} id="sms_pid"
            placeholder="SMS Pid" value={formData.sms_pid} onChange={handleInputChange} />
          {errors.sms_pid && <div className="invalid-feedback">{errors.sms_pid}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="sms_url" className="form-label required">SMS Url</label>
          <input type="url" className={`form-control ${errors.sms_url ? 'is-invalid' : ''}`} id="sms_url"
            placeholder="SMS Url" value={formData.sms_url} onChange={handleInputChange} />
          {errors.sms_url && <div className="invalid-feedback">{errors.sms_url}</div>}
        </div>
        <div className="col-12 text-end mt-4">
          <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </form>
    </>
  )
}

export default SmsSettingsForm