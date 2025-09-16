import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const MetaSettingsForm = () => {
  const { showNotification } = useAlert();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ meta_keywords: '', meta_description: '' });

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
  },[]);

  const validateForm = () => {
    const errs = {};
    if (!formData.meta_keywords.trim()) errs.meta_keywords = 'Meta keywords is required';
    if (!formData.meta_description.trim()) errs.meta_description = 'Meta description is required';

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
      showNotification("Meta Setting updated successfully!", "success");
    } catch (error) {
      console.error('Error saving Meta Setting:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Meta Settings</h6>
    <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-12">
        <label htmlFor="meta_keywords" className="form-label required">Meta Keywords</label>
        <input type="text" className={`form-control ${errors.meta_keywords ? 'is-invalid' : ''}`} id="meta_keywords" 
        placeholder="Meta Keywords" value={formData.meta_keywords} onChange={handleInputChange} />
        {errors.meta_keywords && <div className="invalid-feedback">{errors.meta_keywords}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="meta_description" className="form-label required">Meta Description</label>
        <textarea
          className={`form-control ${errors.meta_description ? 'is-invalid' : ''}`}
          id="meta_description"
          placeholder="Meta Description"
          rows={3}
          onChange={handleInputChange} 
          defaultValue={formData.meta_description}
        />
        {errors.meta_description && <div className="invalid-feedback">{errors.meta_description}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default MetaSettingsForm