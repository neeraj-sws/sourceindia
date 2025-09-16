import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const WhyChooseForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ choosesub_heading: '', choose_heading: '', choose_inner_heading_1: '',
      choose_inner_desc_1: '', choose_inner_heading_2: '', choose_inner_desc_2: '', choose_inner_heading_3: '', choose_inner_desc_3: '',
     });

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
    if (!formData.choosesub_heading.trim()) errs.choosesub_heading = 'Sub heading is required';
    if (!formData.choose_heading.trim()) errs.choose_heading = 'Heading is required';
    if (!formData.choose_inner_heading_1.trim()) errs.choose_inner_heading_1 = 'Inner Heading 1 is required';
    if (!formData.choose_inner_desc_1.trim()) errs.choose_inner_desc_1 = 'Inner Description 1 is required';
    if (!formData.choose_inner_heading_2.trim()) errs.choose_inner_heading_2 = 'Inner Heading 2 is required';
    if (!formData.choose_inner_desc_2.trim()) errs.choose_inner_desc_2 = 'Inner Description 2 is required';
    if (!formData.choose_inner_heading_3.trim()) errs.choose_inner_heading_3 = 'Inner Heading 3 is required';
    if (!formData.choose_inner_desc_3.trim()) errs.choose_inner_desc_3 = 'Inner Description 3 is required';

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
      showNotification("Why choose form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving why choose form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Why Choose</h6>
        <hr />
                <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="choosesub_heading" className="form-label required">Sub Heading</label>
        <input type="text" className={`form-control ${errors.choosesub_heading ? 'is-invalid' : ''}`} id="choosesub_heading" 
            placeholder="Sub Heading" value={formData.choosesub_heading} onChange={handleInputChange} />
            {errors.choosesub_heading && <div className="invalid-feedback">{errors.choosesub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="choose_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.choose_heading ? 'is-invalid' : ''}`} id="choose_heading" 
        placeholder="Heading" value={formData.choose_heading} onChange={handleInputChange} />
        {errors.choose_heading && <div className="invalid-feedback">{errors.choose_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_heading_1" className="form-label required">Inner Heading 1</label>
        <input type="text" className={`form-control ${errors.choose_inner_heading_1 ? 'is-invalid' : ''}`} id="choose_inner_heading_1" 
        placeholder="Inner Heading 1" value={formData.choose_inner_heading_1} onChange={handleInputChange} />
        {errors.choose_inner_heading_1 && <div className="invalid-feedback">{errors.choose_inner_heading_1}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_desc_1" className="form-label required">Inner Description 1</label>
        <textarea
          className={`form-control ${errors.choose_inner_desc_1 ? 'is-invalid' : ''}`}
          id="choose_inner_desc_1"
          placeholder="Inner Description 1"
          rows={3}
          onChange={handleInputChange}
          defaultValue={formData.choose_inner_desc_1}
        />
        {errors.choose_inner_desc_1 && <div className="invalid-feedback">{errors.choose_inner_desc_1}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_heading_2" className="form-label required">Inner Heading 2</label>
        <input type="text" className={`form-control ${errors.choose_inner_heading_2 ? 'is-invalid' : ''}`} id="choose_inner_heading_2" 
        placeholder="Inner Heading 2" value={formData.choose_inner_heading_2} onChange={handleInputChange} />
        {errors.choose_inner_heading_2 && <div className="invalid-feedback">{errors.choose_inner_heading_2}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_desc_2" className="form-label required">Inner Description 2</label>
        <textarea
          className={`form-control ${errors.choose_inner_desc_2 ? 'is-invalid' : ''}`}
          id="choose_inner_desc_2"
          placeholder="Inner Description 2"
          rows={3}
          onChange={handleInputChange}
          defaultValue={formData.choose_inner_desc_2}
        />
        {errors.choose_inner_desc_2 && <div className="invalid-feedback">{errors.choose_inner_desc_2}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_heading_3" className="form-label required">Inner Heading 3</label>
        <input type="text" className={`form-control ${errors.choose_inner_heading_3 ? 'is-invalid' : ''}`} id="choose_inner_heading_3" 
        placeholder="Inner Heading 3" value={formData.choose_inner_heading_3} onChange={handleInputChange} />
        {errors.choose_inner_heading_3 && <div className="invalid-feedback">{errors.choose_inner_heading_3}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="choose_inner_desc_3" className="form-label required">Inner Description 3</label>
        <textarea
          className={`form-control ${errors.choose_inner_desc_3 ? 'is-invalid' : ''}`}
          id="choose_inner_desc_3"
          placeholder="Inner Description 3"
          rows={3}
          onChange={handleInputChange}
          defaultValue={formData.choose_inner_desc_3}
        />
        {errors.choose_inner_desc_3 && <div className="invalid-feedback">{errors.choose_inner_desc_3}</div>}
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

export default WhyChooseForm