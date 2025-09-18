import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const WorkSectionForm = () => {
  const { showNotification } = useAlert();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ worksub_heading: '', work_heading: '', work_description: '', work_video_url: '' });

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
    if (!formData.worksub_heading.trim()) errs.worksub_heading = 'Sub heading is required';
    if (!formData.work_heading.trim()) errs.work_heading = 'Heading is required';
    if (!formData.work_description.trim()) errs.work_description = 'Short description is required';
    if (!formData.work_video_url) {
      errs.work_video_url = "Video URL is required";
    } else {
      try {
        new URL(formData.work_video_url);
      } catch (_) {
        errs.work_video_url = "Enter a valid URL";
      }
    }

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
      showNotification("Work form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving work form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
      <h6 className="mb-0 text-uppercase">Work Section</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="worksub_heading" className="form-label required">Sub Heading</label>
          <input type="text" className={`form-control ${errors.worksub_heading ? 'is-invalid' : ''}`} id="worksub_heading"
            placeholder="Sub Heading" value={formData.worksub_heading} onChange={handleInputChange} />
          {errors.worksub_heading && <div className="invalid-feedback">{errors.worksub_heading}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="work_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.work_heading ? 'is-invalid' : ''}`} id="work_heading"
            placeholder="Heading" value={formData.work_heading} onChange={handleInputChange} />
          {errors.work_heading && <div className="invalid-feedback">{errors.work_heading}</div>}
        </div>
        <div className="col-md-12">
          <label htmlFor="work_description" className="form-label required">Short Description</label>
          <textarea
            className={`form-control ${errors.work_description ? 'is-invalid' : ''}`}
            id="work_description"
            placeholder="Short Description"
            rows={3}
            onChange={handleInputChange}
            defaultValue={formData.work_description}
          />
          {errors.work_description && <div className="invalid-feedback">{errors.work_description}</div>}
        </div>
        <div className="col-md-12">
          <label htmlFor="work_video_url" className="form-label required">Video Url</label>
          <input type="url" className={`form-control ${errors.work_video_url ? 'is-invalid' : ''}`} id="work_video_url"
            placeholder="Video Url" value={formData.work_video_url} onChange={handleInputChange} />
          {errors.work_video_url && <div className="invalid-feedback">{errors.work_video_url}</div>}
        </div>
        <div className="col-12 text-end mt-4z">
          <button type="submit" className="btn btn-primary btn-sm px-4">Update</button>
        </div>
      </form>
    </>
  )
}

export default WorkSectionForm