import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const CounterSectionForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ counter_1_heading: '', counter_1_number: '', counter_2_heading: '', counter_2_number: '',
      counter_3_heading: '', counter_3_number: ''
     });

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
    if (!formData.counter_1_heading.trim()) errs.counter_1_heading = 'Counter 1 heading is required';
    if (!formData.counter_1_number.trim()) errs.counter_1_number = 'Counter 1 number is required';
    if (!formData.counter_2_heading.trim()) errs.counter_2_heading = 'Counter 2 heading is required';
    if (!formData.counter_2_number.trim()) errs.counter_2_number = 'Counter 2 number is required';
    if (!formData.counter_3_heading.trim()) errs.counter_3_heading = 'Counter 3 heading is required';
    if (!formData.counter_3_number.trim()) errs.counter_3_number = 'Counter 3 number is required';

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
      showNotification("Counter section form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving counter section form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Counter Section</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="counter_1_heading" className="form-label required">Heading 1</label>
            <input type="text" className={`form-control ${errors.counter_1_heading ? 'is-invalid' : ''}`} id="counter_1_heading" 
            placeholder="Heading 1" value={formData.counter_1_heading} onChange={handleInputChange} />
            {errors.counter_1_heading && <div className="invalid-feedback">{errors.counter_1_heading}</div>}
          </div>
          <div className="col-md-6">
            <label htmlFor="counter_1_number" className="form-label required">
              Number 1
            </label>
            <input type="number" className={`form-control ${errors.counter_1_number ? 'is-invalid' : ''}`} id="counter_1_number" 
            placeholder="Number 1" value={formData.counter_1_number} onChange={handleInputChange} />
            {errors.counter_1_number && <div className="invalid-feedback">{errors.counter_1_number}</div>}
          </div>
          <div className="col-md-6">
            <label htmlFor="counter_2_heading" className="form-label required">Heading 2</label>
            <input type="text" className={`form-control ${errors.counter_2_heading ? 'is-invalid' : ''}`} id="counter_2_heading" 
            placeholder="Heading 2" value={formData.counter_2_heading} onChange={handleInputChange} />
            {errors.counter_2_heading && <div className="invalid-feedback">{errors.counter_2_heading}</div>}
          </div>
          <div className="col-md-6">
            <label htmlFor="counter_2_number" className="form-label required">
              Number 2
            </label>
            <input type="number" className={`form-control ${errors.counter_2_number ? 'is-invalid' : ''}`} id="counter_2_number" 
            placeholder="Number 2" value={formData.counter_2_number} onChange={handleInputChange} />
            {errors.counter_2_number && <div className="invalid-feedback">{errors.counter_2_number}</div>}
          </div>
          <div className="col-md-6">
            <label htmlFor="counter_3_heading" className="form-label required">Heading 3</label>
            <input type="text" className={`form-control ${errors.counter_3_heading ? 'is-invalid' : ''}`} id="counter_3_heading" 
            placeholder="Heading 3" value={formData.counter_3_heading} onChange={handleInputChange} />
            {errors.counter_3_heading && <div className="invalid-feedback">{errors.counter_3_heading}</div>}
          </div>
          <div className="col-md-6">
            <label htmlFor="counter_3_number" className="form-label required">
              Number 3
            </label>
            <input type="number" className={`form-control ${errors.counter_3_number ? 'is-invalid' : ''}`} id="counter_3_number" 
            placeholder="Number 3" value={formData.counter_3_number} onChange={handleInputChange} />
            {errors.counter_3_number && <div className="invalid-feedback">{errors.counter_3_number}</div>}
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary px-5">
              Update
            </button>
          </div>
        </form>
    </>
  )
}

export default CounterSectionForm