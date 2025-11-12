import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from '../common/Breadcrumb';
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import JoditEditor from "jodit-react";
import EmailCircularModals from "./modal/EmailCircularModals";
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const AddEmailCircular = () => {
  const { showNotification } = useAlert();
  const { newsletterId } = useParams();
  const isEditing = Boolean(newsletterId);
  const navigate = useNavigate();
  const [userType, setUserType] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [formData, setFormData] = useState({ user_type: '', title: '', subject: '', description: '' });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showButton, setShowButton] = useState(false);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/newsletters/user_type`);
        setUserType(res.data);
      } catch (error) {
        console.error("Error fetching user type:", error);
      }
    };
    fetchUserType();
  }, []);

    const handleUserTypeChange = async (event) => {
    const userTypeId = event.target.value;
    setSelectedUserType(userTypeId);
  };

  useEffect(() => {  
      $('#user_type').select2({
        theme: "bootstrap",
        width: '100%',
        placeholder: "Select Activity"
      }).on("change", function () {
        const userTypeId = $(this).val();
        handleUserTypeChange({ target: { value: userTypeId } });
      });
  
      return () => {
        $('#user_type').off("change").select2('destroy');
      };
    }, [userType]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const validateForm = () => {
    const errs = {};
    if (!selectedUserType) errs.user_type = "User Type is required";
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.description) errs.description = 'Description is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (files.length === 0 && !isEditing) {
      errs.file = 'At least one email circular image is required';
    } else {
      files.forEach((file, index) => {
        if (!allowedImageTypes.includes(file.type)) {
          errs.file = `Invalid format in image ${index + 1} (only JPG/PNG allowed)`;
        } else if (file.size > maxSize) {
          errs.file = `Image ${index + 1} must be under 2MB`;
        }
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!isEditing) return;
    const fetchNewsletter = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/newsletters/${newsletterId}`);
        const data = res.data;
        setFormData({
          title: data.title || '',
          subject: data.subject || '',
          description: data.description || '',
          images: data.images || [],
        });
        setSelectedUserType(data.user_type || "");
      } catch (error) {
        console.error('Error fetching Newsletter:', error);
      }
    };
    fetchNewsletter();
  }, [newsletterId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let endpoint, method, payload, headers;
      if (isEditing) {
        endpoint = `${API_BASE_URL}/newsletters/${newsletterId}`;
        method = "put";
        payload = { ...formData, user_type: selectedUserType };
        headers = { "Content-Type": "application/json" };
        await axios[method](endpoint, payload, { headers });
        if (files.length > 0) {
          await handleAddImages();
        }
      } else {
        endpoint = `${API_BASE_URL}/newsletters`;
        method = "post";
        const data = new FormData();
        data.append("user_type", selectedUserType);
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== "images") data.append(key, value);
        });
        files.forEach((file) => {
          data.append("files", file);
        });
        payload = data;
        headers = { "Content-Type": "multipart/form-data" };
        await axios[method](endpoint, payload, { headers });
      }
      showNotification(`Email Circular ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/admin/email_circular");
    } catch (error) {
      console.error("Error saving Email Circular:", error);
      showNotification(`Failed to ${isEditing ? "update" : "add"} Email Circular`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImages = async () => {
    if (files.length === 0) return;
    const formDataObj = new FormData();
    files.forEach(file => formDataObj.append("files", file));

    try {
      const res = await axios.post(`${API_BASE_URL}/newsletters/${newsletterId}/images`,
        formDataObj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...(Array.isArray(res.data) ? res.data : [res.data])]
      }));
      setFiles([]);
      showNotification("Images added successfully!", "success");
    } catch (error) {
      console.error("Error adding images:", error);
      showNotification("Failed to add images", "error");
    }
  };

  const openDeleteModal = (id) => { setImageToDelete(id); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setShowDeleteModal(false); setImageToDelete(null); };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/newsletters/${newsletterId}/images/${imageToDelete}`);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageToDelete)
      }));
      showNotification("Image removed successfully!", "success");
    } catch (error) {
      console.error("Error removing image:", error);
      showNotification("Failed to remove image", "error");
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title={isEditing ? "Edit Email Circular" : "Add Email Circular"} add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
          <div className="row">
            <div className="col-xl-12 mx-auto">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="user_type" className="form-label required">User</label>
                        <select
                      id="user_type" className="form-control"
                      value={selectedUserType}
                      onChange={handleUserTypeChange}
                    >
                      <option value="">Select user type</option>
                      {userType?.map((user) => (
                        <option key={user.id} value={user.id}>{user.name.charAt(0).toUpperCase() + user.name.slice(1)}</option>
                      ))}
                    </select>
                        {errors.user_type && (<div className="text-danger small mt-1">{errors.user_type}</div>)}
                      </div>
                    </div>
                    <JoditEditor
                      value={formData.description}
                      config={{
                        readonly: false,
                        height: 300,
                        toolbarSticky: false,
                        buttons: [
                          'source', '|', 'bold', 'italic', 'underline', '|',
                          'ul', 'ol', '|', 'outdent', 'indent', '|',
                          'image', 'link', '|', 'undo', 'redo'
                        ]
                      }}
                      onChange={newContent => {
                        setFormData(prev => ({ ...prev, description: newContent }));
                        setShowButton(newContent.replace(/<[^>]*>/g, "").trim() !== "");
                      }}
                    />
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="file" className="form-label required">Email Circular Images</label><br />
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      multiple
                      accept="image/png, image/jpeg"
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => fileInputRef.current.click()}>
                      <i className="bx bxs-plus-square me-1" />Add Attachment
                    </button>
                    {errors.file && (<div className="invalid-feedback">{errors.file}</div>)}
                    <div className="col-md-12">
                      <div className="mt-3 d-flex flex-wrap">
                        {formData.images && formData.images.length > 0 && formData.images.map((image, index) => (
                          <div key={index} className="position-relative m-2">
                            <img
                              src={`${ROOT_URL}/${image.file}`}
                              alt={`Preview ${index}`}
                              className="object-fit-cover m-3"
                              width={80}
                              height={80}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-remove-image"
                              style={{ width: '1.5rem', height: '1.5rem' }}
                              onClick={() => openDeleteModal(image.id)}
                            >
                              <i className="bx bx-x me-0" />
                            </button>
                          </div>
                        ))}
                        {files.length > 0 && files.map((file, index) => (
                          <div key={index} className="position-relative m-2">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New Preview ${index}`}
                              className="object-fit-cover m-3"
                              width={80}
                              height={80}
                            />
                            <button
                              variant="danger"
                              size="sm"
                              className="btn btn-danger btn-remove-image"
                              style={{ width: '1.5rem', height: '1.5rem' }}
                              onClick={() => {
                                setFiles(prev => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <i className="bx bx-x me-0" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {files.length > 0 && files?.map((file, index) => (
                        <div key={index} className="position-relative m-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New Preview ${index}`}
                            className="object-fit-cover m-3"
                            width={80}
                            height={80}
                          />
                          <button
                            variant="danger"
                            size="sm"
                            className="btn btn-danger btn-remove-image"
                            style={{ width: '1.5rem', height: '1.5rem' }}
                            onClick={() => {
                              setFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <i className="bx bx-x me-0" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                 
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-sm btn-primary px-4 mt-3" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {isEditing ? "Updating..." : "Saving..."}
                        </>
                      ) : (
                        isEditing ? "Update" : "Save"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/*end row*/}
      </div>
      <EmailCircularModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        deleteType="image"
      />
    </>
  )
}

export default AddEmailCircular