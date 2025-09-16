import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const TestimonialSectionForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ testimonialsub_heading: '', testimonial_heading: '' });

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
    if (!formData.testimonialsub_heading.trim()) errs.testimonialsub_heading = 'Sub heading is required';
    if (!formData.testimonial_heading.trim()) errs.testimonial_heading = 'Heading is required';

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
      showNotification("Testimonial form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving testimonial form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Testimonial Section</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="testimonialsub_heading" className="form-label required">Sub Heading</label>
            <input type="text" className={`form-control ${errors.testimonialsub_heading ? 'is-invalid' : ''}`} id="testimonialsub_heading" 
            placeholder="Sub Heading" value={formData.testimonialsub_heading} onChange={handleInputChange} />
            {errors.testimonialsub_heading && <div className="invalid-feedback">{errors.testimonialsub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="testimonial_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.testimonial_heading ? 'is-invalid' : ''}`} id="testimonial_heading" 
        placeholder="Heading" value={formData.testimonial_heading} onChange={handleInputChange} />
        {errors.testimonial_heading && <div className="invalid-feedback">{errors.testimonial_heading}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default TestimonialSectionForm