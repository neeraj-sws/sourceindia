import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const AnniversaryForm = () => {
  const { showNotification } = useAlert();
  const [aboutFile, setAboutFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    year: '', about_heading: '', aboutshort_description: '',
    about_description: '', about_file: ''
  });
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
    if (!formData.year.trim()) errs.year = 'Year is required';
    if (!formData.about_heading.trim()) errs.about_heading = 'Heading is required';
    if (!formData.aboutshort_description.trim()) errs.aboutshort_description = 'Short description is required';
    if (!formData.about_description) errs.about_description = 'Description is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (!aboutFile && !formData.about_file) {
      errs.about_file = 'About image is required';
    } else if (aboutFile) {
      if (!allowedImageTypes.includes(aboutFile.type)) {
        errs.about_file = 'Invalid image format (only JPG/PNG allowed)';
      } else if (aboutFile.size > maxSize) {
        errs.about_file = 'Image size must be under 2MB';
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
    if (aboutFile) data.append('about_file', aboutFile);
    try {
      await axios.put(`${API_BASE_URL}/settings/about`, data);
      showNotification("Anniversary form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving anniversary form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 text-uppercase">Anniversary</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="year" className="form-label required">Year</label>
          <input type="number" className={`form-control ${errors.year ? 'is-invalid' : ''}`} id="year"
            placeholder="Heading" value={formData.year} onChange={handleInputChange} />
          {errors.year && <div className="invalid-feedback">{errors.year}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="about_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.about_heading ? 'is-invalid' : ''}`} id="about_heading"
            placeholder="Heading" value={formData.about_heading} onChange={handleInputChange} />
          {errors.about_heading && <div className="invalid-feedback">{errors.about_heading}</div>}
        </div>

        <div className="col-md-12">
          <label htmlFor="about_file" className="form-label required">About Image</label>
          <input className={`form-control ${errors.about_file ? 'is-invalid' : ''}`} type="file" id="about_file" onChange={handleAboutFileChange} />
          {errors.about_file && <div className="invalid-feedback">{errors.about_file}</div>}
          {aboutFile ? (
            <img
              src={URL.createObjectURL(aboutFile)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
            />
          ) : formData.about_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.about_file}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-12">
          <label htmlFor="aboutshort_description" className="form-label required">Short Description</label>
          <textarea
            className={`form-control ${errors.aboutshort_description ? 'is-invalid' : ''}`}
            id="aboutshort_description"
            placeholder="Short Description"
            rows={3}
            onChange={handleInputChange}
            defaultValue={formData.aboutshort_description}
          />
          {errors.aboutshort_description && <div className="invalid-feedback">{errors.aboutshort_description}</div>}
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

export default AnniversaryForm