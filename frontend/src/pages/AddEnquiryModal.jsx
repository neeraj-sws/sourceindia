import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "../config";
import UseAuth from '../sections/UseAuth';
import { useAlert } from "../context/AlertContext";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
const AddEnquiryModal = ({ show, handleClose, onEnquiryAdded }) => {
    const { user } = UseAuth();
    const { showNotification } = useAlert();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        name: '',
        email: '',
        phone: '',
        country_code: '+91',
        company: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');
        setErrors({});

        try {
            const cleanPhone = (phone) => {
                const digits = phone.replace(/\D/g, '');
                return digits.length >= 10 ? digits.slice(-10) : digits;
            };

            const payload = user && user.is_approve === 1 && user.status === 1
                ? {
                    user_id: user.id,
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    isAuthenticated: true,
                }
                : {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: cleanPhone(formData.phone),
                    company: formData.company.trim(),
                    isAuthenticated: false,
                };

            console.log('Cleaned Payload:', payload);

            const response = await axios.post(
                `${API_BASE_URL}/enquiries/submit-enquiry`,
                payload,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.success) {
                showNotification(response.data.message, 'success');
                setFormData({
                    title: '',
                    description: '',
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                });
                setTimeout(() => handleClose(), 2000);
                onEnquiryAdded();

            }
        } catch (error) {
            const errMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).join(', ')
                : 'An error occurred. Please try again.';
            showNotification(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAuthenticated = user && user.is_approve === 1 && user.status === 1;

    return (
        <div
            className={`modal ${show ? 'd-block' : 'd-none'}`}
            style={{
                display: 'block',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
            }}
            tabIndex="-1"
            role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="enquiry_close p-2">
                        <button
                            type="button"
                            className="bg-white border-0 px-0"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            <i className="bx bx-arrow-back"></i>
                        </button>
                        <h5 className="product_enquiry text-center">Open Enquiry</h5>
                    </div>

                    <div className="modal-body pt-3 pb-sm-5 px-sm-5">
                        {isAuthenticated ? (
                            // Authenticated User Form
                            <form onSubmit={handleSubmit} id="productEnquiry">
                                <input type="hidden" name="user_id" value={user?.id || ''} />
                                <input type="hidden" name="id" value="" />
                                <div className="row">
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Enquiry Title<sup className="text-danger">*</sup>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                placeholder="Enter Title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.title && <div className="text-danger">{errors.title}</div>}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">
                                                Message<sup className="text-danger">*</sup>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                rows="4"
                                                placeholder="Enter Description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                            ></textarea>
                                            {errors.description && <div className="text-danger">{errors.description}</div>}
                                        </div>
                                    </div>
                                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                                    {errors.general && <div className="alert alert-danger">{errors.general}</div>}
                                    <div className="col-md-12 m-auto">
                                        <div className="d-grid mt-3 pb-5">
                                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                                Submit
                                                {isSubmitting && (
                                                    <i className="st_loader spinner-border spinner-border-sm ms-2" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        ) : user ? (
                            // Unapproved or Inactive User
                            <>
                                <div className="modal-header">
                                    <h5 className="modal-title text-center w-100">
                                        Please complete your profile to enable enquiries.
                                    </h5>
                                </div>
                                <div className="text-center mb-3">
                                    <button
                                        type="button"
                                        className="btn btn-small btn-secondary"
                                        onClick={handleClose}
                                    >
                                        Ok
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Unauthenticated User Form
                            <form onSubmit={handleSubmit} id="productEnquiry">
                                <input type="hidden" name="user_id" value="" />
                                <input type="hidden" name="id" value="" />
                                <div className="row">
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control open_enq"
                                                name="name"
                                                placeholder="Name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.name && <div className="text-danger">{errors.name}</div>}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <input
                                                type="email"
                                                className="form-control open_enq"
                                                name="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.email && <div className="text-danger">{errors.email}</div>}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control open_enq"
                                                name="company"
                                                placeholder="Company"
                                                value={formData.company}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.company && <div className="text-danger">{errors.company}</div>}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <PhoneInput
                                                country="in"
                                                value={
                                                    (formData.country_code || "").replace("+", "") +
                                                    (formData.phone || "")
                                                }
                                                onChange={(value, country) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        country_code: `+${country.dialCode}`,
                                                        phone: value.slice(country.dialCode.length),
                                                    }))
                                                }
                                                containerClass="w-100"
                                                inputClass={`form-control open_enq ${errors.phone ? "is-invalid" : ""}`}
                                                inputProps={{
                                                    name: "phone",
                                                    required: true,
                                                }}
                                                placeholder="Phone"
                                            />

                                            {errors.phone && (
                                                <div className="text-danger mt-1">{errors.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control open_enq"
                                                name="title"
                                                placeholder="Enquiry Title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.title && <div className="text-danger">{errors.title}</div>}
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <textarea
                                                className="form-control open_enq"
                                                name="description"
                                                rows="2"
                                                placeholder="Description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                            ></textarea>
                                            {errors.description && <div className="text-danger">{errors.description}</div>}
                                        </div>
                                    </div>
                                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                                    {errors.general && <div className="alert alert-danger">{errors.general}</div>}
                                    <div className="col-md-12 m-auto">
                                        <div className="d-grid pb-5">
                                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                                Submit
                                                {isSubmitting && (
                                                    <i className="st_loader spinner-border spinner-border-sm ms-2" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEnquiryModal;