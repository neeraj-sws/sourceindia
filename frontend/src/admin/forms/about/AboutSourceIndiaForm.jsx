import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const AboutSourceIndiaForm = () => {
  const { showNotification } = useAlert();
  const [aboutFile, setAboutFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ categorysub_heading: '', category_heading: '', categoryshort_description: '', category_file: '' });
  const [submitting, setSubmitting] = useState(false);

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
  }, []);

  const handleAboutFileChange = (e) => { setAboutFile(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.categorysub_heading.trim()) errs.categorysub_heading = 'Sub heading is required';
    if (!formData.category_heading.trim()) errs.category_heading = 'Heading is required';
    if (!formData.categoryshort_description.trim()) errs.categoryshort_description = 'Short description is required';

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 2 * 1024 * 1024;
    if (aboutFile) {
      if (!allowedImageTypes.includes(aboutFile.type)) {
        errs.category_file = 'Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)';
      } else if (aboutFile.size > maxSize) {
        errs.category_file = 'Image size must be under 2MB';
      }
    }

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
    if (aboutFile) data.append('category_file', aboutFile);
    try {
      await axios.put(`${API_BASE_URL}/settings/about`, data);
      showNotification("About Source India form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving About Source India form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">About Source India</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="categorysub_heading" className="form-label required">Sub Heading</label>
          <input type="text" className={`form-control ${errors.categorysub_heading ? 'is-invalid' : ''}`} id="categorysub_heading"
            placeholder="Heading" value={formData.categorysub_heading} onChange={handleInputChange} />
          {errors.categorysub_heading && <div className="invalid-feedback">{errors.categorysub_heading}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="category_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.category_heading ? 'is-invalid' : ''}`} id="category_heading"
            placeholder="Heading" value={formData.category_heading} onChange={handleInputChange} />
          {errors.category_heading && <div className="invalid-feedback">{errors.category_heading}</div>}
        </div>
        <div className="col-md-12">
          <label htmlFor="category_file" className="form-label">Image</label>
          <input className={`form-control ${errors.category_file ? 'is-invalid' : ''}`} type="file" id="category_file" onChange={handleAboutFileChange} />
          {errors.category_file && <div className="invalid-feedback">{errors.category_file}</div>}
          {aboutFile ? (
            <img
              src={URL.createObjectURL(aboutFile)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
              loading="lazy"
              decoding="async"
            />
          ) : formData.category_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.category_file}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
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

export default AboutSourceIndiaForm