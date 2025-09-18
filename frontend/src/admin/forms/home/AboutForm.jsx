import React, { useState, useEffect } from 'react'
import axios from "axios";
import ImageWithFallback from "../../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../../config";
import { useAlert } from "../../../context/AlertContext";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const AboutForm = () => {
  const { showNotification } = useAlert();
  const [aboutFile, setAboutFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    aboutsub_heading: '', about_heading: '', aboutshort_description: '',
    about_description: '', about_video_url: '', about_file: ''
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
  }, []);

  const handleAboutFileChange = (e) => { setAboutFile(e.target.files[0]) };

  const validateForm = () => {
    const errs = {};
    if (!formData.aboutsub_heading.trim()) errs.aboutsub_heading = 'Sub heading is required';
    if (!formData.about_heading.trim()) errs.about_heading = 'Heading is required';
    if (!formData.aboutshort_description.trim()) errs.aboutshort_description = 'Short description is required';
    if (!formData.about_description) errs.about_description = 'Description is required';
    if (!formData.about_video_url) {
      errs.about_video_url = "Video URL is required";
    } else {
      try {
        new URL(formData.about_video_url);
      } catch (_) {
        errs.about_video_url = "Enter a valid URL";
      }
    }

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
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (aboutFile) data.append('about_file', aboutFile);
    try {
      await axios.put(`${API_BASE_URL}/settings/home`, data);
      showNotification("About form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving about form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
      <h6 className="mb-0 fw-bold">About</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label htmlFor="aboutsub_heading" className="form-label required">Sub Heading</label>
          <input type="text" className={`form-control ${errors.aboutsub_heading ? 'is-invalid' : ''}`} id="aboutsub_heading"
            placeholder="Sub Heading" value={formData.aboutsub_heading} onChange={handleInputChange} />
          {errors.aboutsub_heading && <div className="invalid-feedback">{errors.aboutsub_heading}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="about_heading" className="form-label required">Heading</label>
          <input type="text" className={`form-control ${errors.about_heading ? 'is-invalid' : ''}`} id="about_heading"
            placeholder="Heading" value={formData.about_heading} onChange={handleInputChange} />
          {errors.about_heading && <div className="invalid-feedback">{errors.about_heading}</div>}
        </div>
         <div className="col-md-6">
          <label htmlFor="about_video_url" className="form-label required">Video Url</label>
          <input type="text" className={`form-control ${errors.about_video_url ? 'is-invalid' : ''}`} id="about_video_url"
            placeholder="Video Url" value={formData.about_video_url} onChange={handleInputChange} />
          {errors.about_video_url && <div className="invalid-feedback">{errors.about_video_url}</div>}
        </div>
        <div className="col-md-6">
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
        
        <div className="col-md-12">
          <label htmlFor="about_description" className="form-label required">
            Long Description
          </label>
          <CKEditor
            editor={ClassicEditor}
            data={formData.about_description || ''}
            onChange={(event, editor) => {
              const data = editor.getData();
              setFormData(prev => ({ ...prev, about_description: data }));
            }}
          />
          {errors.about_description && <div className="text-danger mt-1">{errors.about_description}</div>}
        </div>
       
        <div className="col-12 text-end mt-4">
          <button type="submit" className="btn btn-primary btn-sm px-4">Update</button>
        </div>
      </form>
    </>
  )
}

export default AboutForm