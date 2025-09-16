import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const ProductSectionForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ productsub_heading: '', product_heading: '', product_description: '' });

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
    if (!formData.productsub_heading.trim()) errs.productsub_heading = 'Sub heading is required';
    if (!formData.product_heading.trim()) errs.product_heading = 'Heading is required';
    if (!formData.product_description.trim()) errs.product_description = 'Short description is required';

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
      showNotification("Product form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving product form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Product Section</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="productsub_heading" className="form-label required">Sub Heading</label>
            <input type="text" className={`form-control ${errors.productsub_heading ? 'is-invalid' : ''}`} id="productsub_heading" 
            placeholder="Sub Heading" value={formData.productsub_heading} onChange={handleInputChange} />
            {errors.productsub_heading && <div className="invalid-feedback">{errors.productsub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="product_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.product_heading ? 'is-invalid' : ''}`} id="product_heading" 
        placeholder="Heading" value={formData.product_heading} onChange={handleInputChange} />
        {errors.product_heading && <div className="invalid-feedback">{errors.product_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="product_description" className="form-label required">Short Description</label>
            <textarea
              className={`form-control ${errors.product_description ? 'is-invalid' : ''}`}
              id="product_description"
              placeholder="Short Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.product_description}
            />
            {errors.product_description && <div className="invalid-feedback">{errors.product_description}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default ProductSectionForm