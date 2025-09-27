import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const VisionForm = () => {
  const { showNotification } = useAlert();
  const [visionFile, setVisionFile] = useState(null);
  const [visionIcon, setVisionIcon] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ vision_heading: '', vision_description: '', vision_file: '', vision_icon: '' });
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

  const handleVisionFileChange = (e) => { setVisionFile(e.target.files[0]) };

  const handleVisionIconChange = (e) => { setVisionIcon(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.vision_heading.trim()) errs.vision_heading = 'Heading is required';
    if (!formData.vision_description) errs.vision_description = 'Description is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (!visionFile && !formData.vision_file) {
      errs.vision_file = 'Logo image is required';
    } else if (visionFile) {
      if (!allowedImageTypes.includes(visionFile.type)) {
        errs.vision_file = 'Invalid image format (only JPG/PNG allowed)';
      } else if (visionFile.size > maxSize) {
        errs.vision_file = 'Image size must be under 2MB';
      }
    }
    if (!visionIcon && !formData.vision_icon) {
      errs.vision_icon = 'Icon image is required';
    } else if (visionIcon) {
      if (!allowedImageTypes.includes(visionIcon.type)) {
        errs.vision_icon = 'Invalid image format (only JPG/PNG allowed)';
      } else if (visionIcon.size > maxSize) {
        errs.vision_icon = 'Image size must be under 2MB';
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
    if (visionFile) data.append('vision_file', visionFile);
    if (visionIcon) data.append('vision_icon', visionIcon);
    try {
      await axios.put(`${API_BASE_URL}/settings/about`, data);
      showNotification("Vision form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving vision form:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">Vision</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-12">
          <label htmlFor="vision_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.vision_heading ? 'is-invalid' : ''}`} id="vision_heading" placeholder="Heading"
            value={formData.vision_heading} onChange={handleInputChange} />
          {errors.vision_heading && <div className="invalid-feedback">{errors.vision_heading}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="vision_file" className="form-label required">Logo</label>
          <input className={`form-control ${errors.vision_file ? 'is-invalid' : ''}`} type="file" id="vision_file" onChange={handleVisionFileChange} />
          {errors.vision_file && <div className="invalid-feedback">{errors.vision_file}</div>}
          {visionFile ? (
            <img
              src={URL.createObjectURL(visionFile)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
            />
          ) : formData.vision_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.vision_file}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-6">
          <label htmlFor="vision_icon" className="form-label required">Icon</label>
          <input className={`form-control ${errors.vision_icon ? 'is-invalid' : ''}`} type="file" id="vision_icon" onChange={handleVisionIconChange} />
          {errors.vision_icon && <div className="invalid-feedback">{errors.vision_icon}</div>}
          {visionIcon ? (
            <img
              src={URL.createObjectURL(visionIcon)}
              className="img-preview object-fit-cover mt-3"
              width={150}
              height={150}
              alt="Preview"
            />
          ) : formData.vision_icon ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.vision_icon}`}
              width={150}
              height={150}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-12">
          <label htmlFor="vision_description" className="form-label required">Description</label>
          <textarea
            className={`form-control ${errors.vision_description ? 'is-invalid' : ''}`}
            id="vision_description"
            placeholder="Description"
            rows={3}
            onChange={handleInputChange}
            defaultValue={formData.vision_description}
          />
          {errors.vision_description && <div className="invalid-feedback">{errors.vision_description}</div>}
        </div>
        <div className="col-12 mt-4 text-end">
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

export default VisionForm