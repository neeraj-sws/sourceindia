import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const SystemSettingsForm = () => {
  const { showNotification } = useAlert();
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ title: '', website_email: '', site_email: '', site_email_cc: '', site_email_bcc: '', mobile: '', address: '', logo_file: '', favicon_file: '', seller_category_limit: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${API_BASE_URL}/settings/site`);
      setFormData(res.data);
    }
    fetchData();
  }, []);

  const handleLogoFileChange = (e) => { setLogoFile(e.target.files[0]) };

  const handleFaviconFileChange = (e) => { setFaviconFile(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';

    if (!formData.website_email.trim()) errs.website_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.website_email)) errs.website_email = 'Invalid email format';

    if (!formData.site_email.trim()) errs.site_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.site_email)) errs.site_email = 'Invalid email format';

    if (!formData.site_email_cc.trim()) errs.site_email_cc = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.site_email_cc)) errs.site_email_cc = 'Invalid email format';

    if (!formData.site_email_bcc.trim()) errs.site_email_bcc = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.site_email_bcc)) errs.site_email_bcc = 'Invalid email format';

    if (!formData.mobile.trim()) errs.mobile = 'Mobile is required';
    else if (!/^[6-9]\d{9}$/.test(formData.mobile)) errs.mobile = "Mobile Number is invalid";
    if (!formData.address) errs.address = 'Address is required';
    if (!formData.seller_category_limit) errs.seller_category_limit = 'Seller category limit is required';

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 2 * 1024 * 1024;
    if (!logoFile && !formData.logo_file) {
      errs.logo_file = 'Logo image is required';
    } else if (logoFile) {
      if (!allowedImageTypes.includes(logoFile.type)) {
        errs.logo_file = 'Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)';
      } else if (logoFile.size > maxSize) {
        errs.logo_file = 'Image size must be under 2MB';
      }
    }
    if (!faviconFile && !formData.favicon_file) {
      errs.favicon_file = 'Favicon image is required';
    } else if (faviconFile) {
      if (!allowedImageTypes.includes(faviconFile.type)) {
        errs.favicon_file = 'Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)';
      } else if (faviconFile.size > maxSize) {
        errs.favicon_file = 'Image size must be under 2MB';
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
    if (logoFile) data.append('logo_file', logoFile);
    if (faviconFile) data.append('favicon_file', faviconFile);
    try {
      await axios.put(`${API_BASE_URL}/settings/site`, data);
      showNotification("System setting updated successfully!", "success");
    } catch (error) {
      console.error('Error saving system setting:', error);
      showNotification("Failed to update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">System Settings</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <label htmlFor="title" className="form-label required">Title</label>
          <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} id="title" placeholder="Title"
            value={formData.title} onChange={handleInputChange} />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>
        <div className="col-md-4">
          <label htmlFor="website_email" className="form-label required">Website Email</label>
          <input type="email" className={`form-control ${errors.website_email ? 'is-invalid' : ''}`} id="website_email" placeholder="Website Email"
            value={formData.website_email} onChange={handleInputChange} />
          {errors.website_email && <div className="invalid-feedback">{errors.website_email}</div>}
        </div>
        <div className="col-md-4">
          <label htmlFor="mobile" className="form-label required">Mobile</label>
          <input type="text" className={`form-control ${errors.mobile ? 'is-invalid' : ''}`} id="mobile" placeholder="Mobile"
            value={formData.mobile} onChange={handleInputChange} />
          {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="logo_file" className="form-label required">Image</label>
          <input className={`form-control ${errors.logo_file ? 'is-invalid' : ''}`} type="file" id="logo_file" onChange={handleLogoFileChange} />
          {errors.logo_file && <div className="invalid-feedback">{errors.logo_file}</div>}
          {logoFile ? (
            <img
              src={URL.createObjectURL(logoFile)}
              className="img-fluid  object-fit-cover mt-3"
              width={80}
              height={80}
              alt="Preview"
              loading="lazy"
              decoding="async"
            />
          ) : formData.logo_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.logo_file}`}
              width={80}
              height={80}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-6">
          <label htmlFor="favicon_file" className="form-label required">Favicon</label>
          <input className={`form-control ${errors.favicon_file ? 'is-invalid' : ''}`} type="file" id="favicon_file" onChange={handleFaviconFileChange} />
          {errors.favicon_file && <div className="invalid-feedback">{errors.favicon_file}</div>}
          {faviconFile ? (
            <img
              src={URL.createObjectURL(faviconFile)}
              className="img-fluid  object-fit-cover mt-3"
              width={80}
              height={80}
              alt="Preview"
              loading="lazy"
              decoding="async"
            />
          ) : formData.favicon_file ? (
            <ImageWithFallback
              src={`${ROOT_URL}/${formData.favicon_file}`}
              width={80}
              height={80}
              showFallback={false}
            />
          ) : null}
        </div>
        <div className="col-md-12">
          <label htmlFor="address" className="form-label required">Address</label>
          <textarea
            className={`form-control ${errors.address ? 'is-invalid' : ''}`}
            id="address"
            placeholder="Address"
            rows={3}
            onChange={handleInputChange}
            defaultValue={formData.address}
          />
          {errors.address && <div className="invalid-feedback">{errors.address}</div>}
        </div>
        <div className="col-md-3">
          <label htmlFor="seller_category_limit" className="form-label required">Seller Category Limit</label>
          <select id="seller_category_limit"
            className={`form-select ${errors.seller_category_limit ? 'is-invalid' : ''}`}
            value={formData.seller_category_limit} onChange={handleInputChange}
          >
            <option value="">Select here</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          {errors.seller_category_limit && <div className="invalid-feedback">{errors.seller_category_limit}</div>}
        </div>
         <div className="col-md-3">
          <label htmlFor="site_email" className="form-label required">Admin Site Email</label>
          <input type="email" className={`form-control ${errors.site_email ? 'is-invalid' : ''}`} id="site_email" placeholder="Site Email"
            value={formData.site_email} onChange={handleInputChange} />
          {errors.site_email && <div className="invalid-feedback">{errors.site_email}</div>}
        </div>
         <div className="col-md-3">
          <label htmlFor="site_email_cc" className="form-label required">Admin Site Email CC</label>
          <input type="email" className={`form-control ${errors.site_email_cc ? 'is-invalid' : ''}`} id="site_email_cc" placeholder="Site Email CC"
            value={formData.site_email_cc} onChange={handleInputChange} />
          {errors.site_email_cc && <div className="invalid-feedback">{errors.site_email_cc}</div>}
        </div>
         <div className="col-md-3">
          <label htmlFor="site_email_bcc" className="form-label required">Admin Site Email BCC</label>
          <input type="email" className={`form-control ${errors.site_email_bcc ? 'is-invalid' : ''}`} id="site_email_bcc" placeholder="Site Email BCC"
            value={formData.site_email_bcc} onChange={handleInputChange} />
          {errors.site_email_bcc && <div className="invalid-feedback">{errors.site_email_bcc}</div>}
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

export default SystemSettingsForm