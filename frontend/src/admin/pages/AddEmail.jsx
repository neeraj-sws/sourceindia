import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from '../common/Breadcrumb';
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const AddEmail = () => {
  const { showNotification } = useAlert();
  const { emailId } = useParams();
  const isEditing = Boolean(emailId);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', email_for: 'User', subject: '', description: '', is_seller_direct: '', message: '', status: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.email_for) errs.email_for = 'Email for is required';
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.is_seller_direct) errs.is_seller_direct = 'Is Seller Direct is required';
    if (!formData.status) errs.status = 'Status is required';
    if (!formData.description) errs.description = 'Description is required';
    if (!formData.message) errs.message = 'Message is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!isEditing) return;

    const fetchEmail = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/emails/${emailId}`);
        const data = res.data;
        setFormData({
          title: data.title || '',
          email_for: data.email_for || '',
          subject: data.subject || '',
          status: String(data.status),
          is_seller_direct: String(data.is_seller_direct),
          description: data.description || '',
          message: data.message || '',
        });

      } catch (error) {
        console.error('Error fetching Email:', error);
      }
    };

    fetchEmail();
  }, [emailId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let endpoint, method, payload, headers;
      if (isEditing) {
        endpoint = `${API_BASE_URL}/emails/${emailId}`;
        method = "put";
        payload = {
          ...formData,
        };
        headers = { "Content-Type": "application/json" };
        await axios[method](endpoint, payload, { headers });
      } else {
        endpoint = `${API_BASE_URL}/emails`;
        method = "post";
        payload = {
          ...formData,
        };
        headers = { "Content-Type": "application/json" };
        await axios[method](endpoint, payload, { headers });
      }
      showNotification(`Email ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/admin/emails-list");
    } catch (error) {
      console.error("Error saving Email:", error);
      showNotification(`Failed to ${isEditing ? "update" : "add"} Email`, "error");
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Shop" title={isEditing ? "Edit Email" : "Add Email"} add_button="Back" add_link="/admin/emails-list" />
          <div className="row">
            <div className="col-xl-12 mx-auto">
              <div className="card">
                <div className="card-body p-4">
                  <form className="row g-3" onSubmit={handleSubmit}>
                    <div className="col-md-12">
                      <label htmlFor="title" className="form-label required">Title</label>
                      <input
                        type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`}
                        id="title"
                        placeholder="Title"
                        value={formData.title}
                        onChange={handleInputChange}
                        disabled={isEditing ? "disabled" : ""}
                      />
                      {errors.title && (<div className="invalid-feedback">{errors.title}</div>)}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email_for" className="form-label required">Email for</label>
                      <select
                        id="email_for" className={`form-control ${errors.email_for ? "is-invalid" : ""}`}
                        value={formData.email_for}
                        onChange={handleInputChange}
                      >
                        <option value="User">User</option>
                      </select>
                      {errors.email_for && (<div className="invalid-feedback">{errors.email_for}</div>)}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="subject" className="form-label required">Subject</label>
                      <input
                        type="text" className={`form-control ${errors.subject ? "is-invalid" : ""}`}
                        id="subject"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                      />
                      {errors.subject && (<div className="invalid-feedback">{errors.subject}</div>)}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="status" className="form-label required">Status</label>
                      <select
                        id="status" className={`form-control ${errors.status ? "is-invalid" : ""}`}
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="">Select here</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                      {errors.status && (<div className="invalid-feedback">{errors.status}</div>)}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="is_seller_direct" className="form-label required">Is Seller Direct</label>
                      <select
                        id="is_seller_direct" className={`form-control ${errors.is_seller_direct ? "is-invalid" : ""}`}
                        value={formData.is_seller_direct}
                        onChange={handleInputChange}
                      >
                        <option value="">Select here</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                      {errors.is_seller_direct && (<div className="invalid-feedback">{errors.is_seller_direct}</div>)}
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="description" className="form-label required">Description</label>
                      <textarea
                        className={`form-control ${errors.description ? "is-invalid" : ""}`}
                        id="description"
                        placeholder="Description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                      {errors.description && (<div className="invalid-feedback">{errors.description}</div>)}
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="message" className="form-label required">Message</label>
                      <CKEditor
                        editor={ClassicEditor}
                        data={formData.message || ''}
                        onChange={(event, editor) => {
                          const data = editor.getData();
                          setFormData(prev => ({ ...prev, message: data }));
                        }}
                      />
                      {errors.message && <div className="text-danger mt-1">{errors.message}</div>}
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary btn-sm px-5">{isEditing ? "Update" : "Save"} Email</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          {/*end row*/}
        </div>
      </div>
    </>
  )
}

export default AddEmail