import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const CompanySectionForm = () => {
  const { showNotification } = useAlert();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ companysub_heading: '', company_heading: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/home`);
      setFormData(res.data);
    }
    fetchData();
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!formData.companysub_heading.trim()) errs.companysub_heading = 'Sub heading is required';
    if (!formData.company_heading.trim()) errs.company_heading = 'Heading is required';

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
      await axios.put(`${API_BASE_URL}/settings/home`, data);
      showNotification("Company form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving company form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">Company Section</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="companysub_heading" className="form-label required">Sub Heading</label>
          <input type="text" className={`form-control ${errors.companysub_heading ? 'is-invalid' : ''}`} id="companysub_heading"
            placeholder="Sub Heading" value={formData.companysub_heading} onChange={handleInputChange} />
          {errors.companysub_heading && <div className="invalid-feedback">{errors.companysub_heading}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="company_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.company_heading ? 'is-invalid' : ''}`} id="company_heading"
            placeholder="Heading" value={formData.company_heading} onChange={handleInputChange} />
          {errors.company_heading && <div className="invalid-feedback">{errors.company_heading}</div>}
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

export default CompanySectionForm