import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const GetInTouchForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ get_touchsub_heading: '', get_touch_heading: '', get_touchshort_description: '' });

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
  },[]);

  const validateForm = () => {
    const errs = {};
    if (!formData.get_touchsub_heading.trim()) errs.get_touchsub_heading = 'Sub heading is required';
    if (!formData.get_touch_heading.trim()) errs.get_touch_heading = 'Heading is required';
    if (!formData.get_touchshort_description.trim()) errs.get_touchshort_description = 'Short description is required';

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
      await axios.put(`${API_BASE_URL}/settings/home`, data);
      showNotification("Get in Touch form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving get in touch form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Get in Touch</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="get_touchsub_heading" className="form-label required">Sub Heading</label>
            <input type="text" className={`form-control ${errors.get_touchsub_heading ? 'is-invalid' : ''}`} id="get_touchsub_heading" 
            placeholder="Sub Heading" value={formData.get_touchsub_heading} onChange={handleInputChange} />
            {errors.get_touchsub_heading && <div className="invalid-feedback">{errors.get_touchsub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="get_touch_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.get_touch_heading ? 'is-invalid' : ''}`} id="get_touch_heading" 
        placeholder="Heading" value={formData.get_touch_heading} onChange={handleInputChange} />
        {errors.get_touch_heading && <div className="invalid-feedback">{errors.get_touch_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="get_touchshort_description" className="form-label required">Short Description</label>
            <textarea
              className={`form-control ${errors.get_touchshort_description ? 'is-invalid' : ''}`}
              id="get_touchshort_description"
              placeholder="Short Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.get_touchshort_description}
            />
            {errors.get_touchshort_description && <div className="invalid-feedback">{errors.get_touchshort_description}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default GetInTouchForm