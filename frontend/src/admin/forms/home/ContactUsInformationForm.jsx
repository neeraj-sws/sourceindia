import  React, { useState, useEffect } from 'react'
import axios from "axios";
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const ContactUsInformationForm = () => {
    const { showNotification } = useAlert();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ contactsub_heading: '', contact_heading: '', contactshort_description: '',
      contactaddress: '', contactphone_1: '', contactphone_2: '', contactemail: '', contact_map_url: ''
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
    if (!formData.contactsub_heading.trim()) errs.contactsub_heading = 'Sub heading is required';
    if (!formData.contact_heading.trim()) errs.contact_heading = 'Heading is required';
    if (!formData.contactshort_description.trim()) errs.contactshort_description = 'Short description is required';
    if (!formData.contactaddress.trim()) errs.contactaddress = 'Address is required';
    if (!formData.contactphone_1.trim()) errs.contactphone_1 = 'Phone 1 is required';
    if (!formData.contactphone_2.trim()) errs.contactphone_2 = 'Phone 2 is required';
    if (!formData.contactemail.trim()) errs.contactemail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.contactemail)) errs.contactemail = 'Invalid email format';
    if (!formData.contact_map_url) {
      errs.contact_map_url = "Video URL is required";
    } else {
      try {
        new URL(formData.contact_map_url);
      } catch (_) {
        errs.contact_map_url = "Enter a valid URL";
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
      showNotification("Contact us information form updated successfully!", "success");
    } catch (error) {
      console.error('Error saving contact us information form:', error);
      showNotification("Failed to update", "error");
    }
  };

  return (
    <>
    <h6 className="mb-0 text-uppercase">Contact Us Information</h6>
        <hr />
    <form className="row g-3" onSubmit={handleSubmit}>
      <div className="col-md-6">
        <label htmlFor="contactsub_heading" className="form-label required">Sub Heading</label>
            <input type="text" className={`form-control ${errors.contactsub_heading ? 'is-invalid' : ''}`} id="contactsub_heading" 
            placeholder="Sub Heading" value={formData.contactsub_heading} onChange={handleInputChange} />
            {errors.contactsub_heading && <div className="invalid-feedback">{errors.contactsub_heading}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="contact_heading" className="form-label required">Heading</label>
        <input type="text" className={`form-control ${errors.contact_heading ? 'is-invalid' : ''}`} id="contact_heading" 
        placeholder="Heading" value={formData.contact_heading} onChange={handleInputChange} />
        {errors.contact_heading && <div className="invalid-feedback">{errors.contact_heading}</div>}
      </div>
      <div className="col-md-12">
        <label htmlFor="contactshort_description" className="form-label required">Short Description</label>
            <textarea
              className={`form-control ${errors.contactshort_description ? 'is-invalid' : ''}`}
              id="contactshort_description"
              placeholder="Short Description"
              rows={3}
              onChange={handleInputChange}
          defaultValue={formData.contactshort_description}
            />
            {errors.contactshort_description && <div className="invalid-feedback">{errors.contactshort_description}</div>}
      </div>
      <div className="col-md-12">
                          <label htmlFor="contactaddress" className="form-label required">
                            Address
                          </label>
                          <CKEditor
                                                          editor={ClassicEditor}
                                                          data={formData.contactaddress || ''}
                                                          onChange={(event, editor) => {
                                                          const data = editor.getData();
                                                          setFormData(prev => ({ ...prev, contactaddress: data }));
                                                          }}
                                                        />
                                                        {errors.contactaddress && <div className="text-danger mt-1">{errors.contactaddress}</div>}
                        </div>
                        <div className="col-md-4">
        <label htmlFor="contactphone_1" className="form-label required">Phone 1</label>
            <input type="text" className={`form-control ${errors.contactphone_1 ? 'is-invalid' : ''}`} id="contactphone_1" 
            placeholder="Phone 1" value={formData.contactphone_1} onChange={handleInputChange} />
            {errors.contactphone_1 && <div className="invalid-feedback">{errors.contactphone_1}</div>}
      </div>
      <div className="col-md-4">
        <label htmlFor="contactphone_2" className="form-label required">Phone 2</label>
            <input type="text" className={`form-control ${errors.contactphone_2 ? 'is-invalid' : ''}`} id="contactphone_2" 
            placeholder="Phone 2" value={formData.contactphone_2} onChange={handleInputChange} />
            {errors.contactphone_2 && <div className="invalid-feedback">{errors.contactphone_2}</div>}
      </div>
      <div className="col-md-4">
        <label htmlFor="contactemail" className="form-label required">Site Email</label>
        <input type="email" className={`form-control ${errors.contactemail ? 'is-invalid' : ''}`} id="contactemail" placeholder="Site Email" 
        value={formData.contactemail} onChange={handleInputChange} />
        {errors.contactemail && <div className="invalid-feedback">{errors.contactemail}</div>}
      </div>
                        <div className="col-md-12">
        <label htmlFor="contact_map_url" className="form-label required">Phone 2</label>
            <input type="url" className={`form-control ${errors.contact_map_url ? 'is-invalid' : ''}`} id="contact_map_url" 
            placeholder="Phone 2" value={formData.contact_map_url} onChange={handleInputChange} />
            {errors.contact_map_url && <div className="invalid-feedback">{errors.contact_map_url}</div>}
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

export default ContactUsInformationForm