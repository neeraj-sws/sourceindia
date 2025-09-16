import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const AboutStatusForm = () => {
  const { showNotification } = useAlert();
      const [errors, setErrors] = useState({});
      const [formData, setFormData] = useState({ about_status: '' });
  
      const handleInputChange = (e) => {
      const { id, value } = e.target;
      setFormData((prev) => ({ ...prev, [id]: value }));
    };
      
    useEffect(() => {
      const fetchData = async () => {
        const res = await axios.get(`${API_BASE_URL}/settings/about`);
        setFormData(res.data);
      }
      fetchData();
    },[]);
  
    const validateForm = () => {
      const errs = {};
      if (!formData.about_status.trim()) errs.about_status = 'Status is required';
  
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
        await axios.put(`${API_BASE_URL}/settings/about`, data);
        showNotification("Status updated successfully!", "success");
      } catch (error) {
        console.error('Error saving status:', error);
        showNotification("Failed to update", "error");
      }
    };

  return (
    <>
    <h6 className="mb-0 text-uppercase">About Status</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-12">
        <label htmlFor="about_status" className="form-label required">Status</label>
        <select id="about_status" className={`form-select ${errors.about_status ? 'is-invalid' : ''}`} value={formData.about_status} 
        onChange={handleInputChange}>
          <option value="">Select here</option>
          <option value="1">Active</option>
          <option value="0">Deactive</option>
        </select>
        {errors.about_status && <div className="invalid-feedback">{errors.about_status}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default AboutStatusForm