import React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const FooterSectionForm = () => {
  const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ newsletter_heading: '', newsletter_short_description: '', footer_heading: '', 
      footershort_description: '', facebook_url: '', twitter_url: '', instagram_url: '', linkedin_url: '', youtube_url: ''
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
    if (!formData.newsletter_heading.trim()) errs.newsletter_heading = 'Newsletter heading is required';
    if (!formData.newsletter_short_description.trim()) errs.newsletter_short_description = 'Newsletter short description is required';
    if (!formData.footer_heading.trim()) errs.footer_heading = 'Heading is required';
    if (!formData.footershort_description.trim()) errs.footershort_description = 'Short description is required';
    if (!formData.facebook_url.trim()) {
      errs.facebook_url = "Facebook URL is required";
    } else if (!/^https?:\/\/(www\.)?facebook\.com\/.+$/.test(formData.facebook_url)) {
      errs.facebook_url = "Enter a valid Facebook URL";
    }
    if (!formData.twitter_url.trim()) {
      errs.twitter_url = "Twitter URL is required";
    } else if (!/^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.+$/.test(formData.twitter_url)) {
      errs.twitter_url = "Enter a valid Twitter/X URL";
    }
    if (!formData.instagram_url.trim()) {
      errs.instagram_url = "Instagram URL is required";
    } else if (!/^https?:\/\/(www\.)?instagram\.com\/.+$/.test(formData.instagram_url)) {
      errs.instagram_url = "Enter a valid Instagram URL";
    }
    if (!formData.youtube_url.trim()) {
      errs.youtube_url = "YouTube URL is required";
    } else if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(formData.youtube_url)) {
      errs.youtube_url = "Enter a valid YouTube URL";
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
      showNotification("Footer section form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving footer section form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Footer Section</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-12">
        <label htmlFor="newsletter_heading" className="form-label required">Newsletter Heading</label>
            <input type="text" className={`form-control ${errors.newsletter_heading ? 'is-invalid' : ''}`} id="newsletter_heading" 
            placeholder="Newsletter Heading" value={formData.newsletter_heading} onChange={handleInputChange} />
            {errors.newsletter_heading && <div className="invalid-feedback">{errors.newsletter_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="newsletter_short_description" className="form-label required">Newsletter Description</label>
        <textarea
              className={`form-control ${errors.newsletter_short_description ? 'is-invalid' : ''}`}
              id="newsletter_short_description"
              placeholder="Newsletter Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.newsletter_short_description}
            />
            {errors.newsletter_short_description && <div className="invalid-feedback">{errors.newsletter_short_description}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="footer_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.footer_heading ? 'is-invalid' : ''}`} id="footer_heading" 
        placeholder="Heading" value={formData.footer_heading} onChange={handleInputChange} />
        {errors.footer_heading && <div className="invalid-feedback">{errors.footer_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="footershort_description" className="form-label required">Short Description</label>
            <textarea
              className={`form-control ${errors.footershort_description ? 'is-invalid' : ''}`}
              id="footershort_description"
              placeholder="Short Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.footershort_description}
            />
            {errors.footershort_description && <div className="invalid-feedback">{errors.footershort_description}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="facebook_url" className="form-label required">Facebook Url</label>
        <input type="url" className={`form-control ${errors.facebook_url ? 'is-invalid' : ''}`} id="facebook_url" 
            placeholder="Facebook Url" value={formData.facebook_url} onChange={handleInputChange} />
            {errors.facebook_url && <div className="invalid-feedback">{errors.facebook_url}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="twitter_url" className="form-label required">Twitter Url</label>
        <input type="url" className={`form-control ${errors.twitter_url ? 'is-invalid' : ''}`} id="twitter_url" 
            placeholder="Twitter Url" value={formData.twitter_url} onChange={handleInputChange} />
            {errors.twitter_url && <div className="invalid-feedback">{errors.twitter_url}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="instagram_url" className="form-label required">Instagram Url</label>
        <input type="url" className={`form-control ${errors.instagram_url ? 'is-invalid' : ''}`} id="instagram_url" 
            placeholder="Instagram Url" value={formData.instagram_url} onChange={handleInputChange} />
            {errors.instagram_url && <div className="invalid-feedback">{errors.instagram_url}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="footerLinkedinUrl" className="form-label required">Linkedin Url</label>
        <input type="url" className={`form-control ${errors.linkedin_url ? 'is-invalid' : ''}`} id="linkedin_url" 
            placeholder="Linkedin Url" value={formData.linkedin_url} onChange={handleInputChange} />
            {errors.linkedin_url && <div className="invalid-feedback">{errors.linkedin_url}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="footerYoutubeUrl" className="form-label required">Youtube Url</label>
        <input type="url" className={`form-control ${errors.youtube_url ? 'is-invalid' : ''}`} id="youtube_url" 
            placeholder="Youtube Url" value={formData.youtube_url} onChange={handleInputChange} />
            {errors.youtube_url && <div className="invalid-feedback">{errors.youtube_url}</div>}
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary px-5">Update</button>
      </div>
    </form>
    </>
  )
}

export default FooterSectionForm