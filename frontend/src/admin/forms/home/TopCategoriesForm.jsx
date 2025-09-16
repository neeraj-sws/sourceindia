import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const TopCategoriesForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ categorysub_heading: '', category_heading: '', categoryshort_description: '' });

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
    if (!formData.categorysub_heading.trim()) errs.categorysub_heading = 'Sub heading is required';
    if (!formData.category_heading.trim()) errs.category_heading = 'Heading is required';
    if (!formData.categoryshort_description.trim()) errs.categoryshort_description = 'Short description is required';

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
      showNotification("Category form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving category form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Top Categories</h6>
    <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="categorysub_heading" className="form-label required">Sub Heading</label>
            <input type="text" className={`form-control ${errors.categorysub_heading ? 'is-invalid' : ''}`} id="categorysub_heading" 
            placeholder="Sub Heading" value={formData.categorysub_heading} onChange={handleInputChange} />
            {errors.categorysub_heading && <div className="invalid-feedback">{errors.categorysub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="category_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.category_heading ? 'is-invalid' : ''}`} id="category_heading" 
        placeholder="Heading" value={formData.category_heading} onChange={handleInputChange} />
        {errors.category_heading && <div className="invalid-feedback">{errors.category_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="categoryshort_description" className="form-label required">Short Description</label>
            <textarea
              className={`form-control ${errors.categoryshort_description ? 'is-invalid' : ''}`}
              id="categoryshort_description"
              placeholder="Short Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.categoryshort_description}
            />
            {errors.categoryshort_description && <div className="invalid-feedback">{errors.categoryshort_description}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default TopCategoriesForm