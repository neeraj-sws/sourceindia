import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const ValuesForm = () => {
  const { showNotification } = useAlert();
  const [valueFile, setValueFile] = useState(null);
  const [valueIcon, setValueIcon] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ value_heading: '', value_description: '', value_file: '', value_icon: '' });
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

  const handleValueFileChange = (e) => { setValueFile(e.target.files[0]) };

  const handleValueIconChange = (e) => { setValueIcon(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.value_heading.trim()) errs.value_heading = 'Heading is required';
    if (!formData.value_description) errs.value_description = 'Description is required';

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 2 * 1024 * 1024;
    if (valueFile) {
      if (!allowedImageTypes.includes(valueFile.type)) {
        errs.value_file = 'Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)';
      } else if (valueFile.size > maxSize) {
        errs.value_file = 'Image size must be under 2MB';
      }
    }
    if (valueIcon) {
      if (!allowedImageTypes.includes(valueIcon.type)) {
        errs.value_icon = 'Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)';
      } else if (valueIcon.size > maxSize) {
        errs.value_icon = 'Image size must be under 2MB';
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
    if (valueFile) data.append('value_file', valueFile);
    if (valueIcon) data.append('value_icon', valueIcon);
    try {
      await axios.put(`${API_BASE_URL}/settings/about`, data);
      showNotification("Values form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving values form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">Values</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-12">
          <label htmlFor="value_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.value_heading ? 'is-invalid' : ''}`} id="value_heading" placeholder="Heading"
            value={formData.value_heading} onChange={handleInputChange} />
          {errors.value_heading && <div className="invalid-feedback">{errors.value_heading}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="value_file" className="form-label">Logo</label>
          <input className={`form-control ${errors.value_file ? 'is-invalid' : ''}`} type="file" id="value_file" onChange={handleValueFileChange} />
          {errors.value_file && <div className="invalid-feedback">{errors.value_file}</div>}
          {valueFile ? (
            <img
              src={URL.createObjectURL(valueFile)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
              loading="lazy"
              decoding="async"
            />
          ) : formData.value_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.value_file}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-6">
          <label htmlFor="value_icon" className="form-label">Icon</label>
          <input className={`form-control ${errors.value_icon ? 'is-invalid' : ''}`} type="file" id="value_icon" onChange={handleValueIconChange} />
          {errors.value_icon && <div className="invalid-feedback">{errors.value_icon}</div>}
          {valueIcon ? (
            <img
              src={URL.createObjectURL(valueIcon)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
              loading="lazy"
              decoding="async"
            />
          ) : formData.value_icon ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.value_icon}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-12">
          <label htmlFor="value_description" className="form-label required">Description</label>
          <textarea
            className={`form-control ${errors.value_description ? 'is-invalid' : ''}`}
            id="value_description"
            placeholder="Description"
            rows={3}
            onChange={handleInputChange}
            defaultValue={formData.value_description}
          />
          {errors.value_description && <div className="invalid-feedback">{errors.value_description}</div>}
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

export default ValuesForm