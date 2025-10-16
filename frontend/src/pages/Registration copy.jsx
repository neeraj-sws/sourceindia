import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";

const Registration = () => {
    const { showNotification } = useAlert();
    const [form, setForm] = useState({
        fname: "",
        lname: "",
        companyname: "",
        website: "",
        mobile: "",
        email: "",
        category: "",
        elcina_member: "",
        products: "",
        user_category: "",
        address: "",
        city: "",
        state: "",
        country: "",
        pinCode: "",
    });

    const [emailVerified, setEmailVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState("");
    const [errors, setErrors] = useState({});

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // Send OTP
    const sendOtp = async () => {
        if (!form.email) {
            setVerifyMessage("Please enter email first");
            return;
        }
        setVerifyLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/signup/send-otp`, { email: form.email });
            setOtpSent(true);
            // setVerifyMessage(res.data.message || "OTP sent successfully");
            showNotification(res.data.message || "OTP sent successfully", "success");
        } catch (err) {
            showNotification(err.response?.data?.error || "Error sending OTP", "error");
        } finally {
            setVerifyLoading(false);
        }
    };

    // Verify OTP
    const verifyOtp = async () => {
        if (!otp) {
            setVerifyMessage("Please enter OTP");
            return;
        }
        setVerifyLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/signup/verify-otp`, {
                email: form.email,
                otp: otp,
            });
            if (res.data.success) {
                setEmailVerified(true);
                setOtpSent(false);
                showNotification("Email verified successfully", "success");
            } else {
                setVerifyMessage(res.data.message || "Invalid OTP");
            }
        } catch (err) {
            showNotification(err.response?.data?.error || "Error verifying OTP", "success");
        } finally {
            setVerifyLoading(false);
        }
    };

    // Submit registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!emailVerified) {
            setVerifyMessage("Please verify your email before submitting");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/signup/register`, form);
            if (res.data.success) {
                alert("Registration successful!");
                setForm({
                    fname: "",
                    lname: "",
                    companyname: "",
                    website: "",
                    mobile: "",
                    email: "",
                    category: "",
                    elcina_member: "",
                    products: "",
                    user_category: "",
                    address: "",
                    city: "",
                    state: "",
                    country: "",
                    pinCode: "",
                });
                setEmailVerified(false);
                setOtp("");
                setOtpSent(false);
                setErrors({});
                setVerifyMessage("");
            } else {
                setErrors(res.data.errors || {});
            }
        } catch (err) {
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container my-5">
            <div className="card mb-5 commonHead border shadow-none">
                <div className="card-body py-5 text-center">
                    <h1 className="text-white">Source India Portal Registration</h1>
                </div>
            </div>

            <div className="card">
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            {/* First Name */}
                            <div className="col-md-6 mb-3">
                                <label>First Name*</label>
                                <input
                                    type="text"
                                    name="fname"
                                    className="form-control"
                                    value={form.fname}
                                    onChange={handleChange}
                                />
                                {errors.fname && <small className="text-danger">{errors.fname}</small>}
                            </div>

                            {/* Last Name */}
                            <div className="col-md-6 mb-3">
                                <label>Last Name*</label>
                                <input
                                    type="text"
                                    name="lname"
                                    className="form-control"
                                    value={form.lname}
                                    onChange={handleChange}
                                />
                                {errors.lname && <small className="text-danger">{errors.lname}</small>}
                            </div>

                            {/* Company Name */}
                            <div className="col-md-6 mb-3">
                                <label>Company Name*</label>
                                <input
                                    type="text"
                                    name="companyname"
                                    className="form-control"
                                    value={form.companyname}
                                    onChange={handleChange}
                                />
                                {errors.companyname && <small className="text-danger">{errors.companyname}</small>}
                            </div>

                            {/* Website */}
                            <div className="col-md-6 mb-3">
                                <label>Website*</label>
                                <input
                                    type="text"
                                    name="website"
                                    className="form-control"
                                    value={form.website}
                                    onChange={handleChange}
                                />
                                {errors.website && <small className="text-danger">{errors.website}</small>}
                            </div>

                            {/* Mobile */}
                            <div className="col-md-6 mb-3">
                                <label>Mobile*</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    className="form-control"
                                    value={form.mobile}
                                    onChange={handleChange}
                                />
                                {errors.mobile && <small className="text-danger">{errors.mobile}</small>}
                            </div>

                            {/* Email + OTP */}
                            <div className="col-md-6 mb-3">
                                <label>Email*</label>
                                <div className="d-flex gap-2 align-items-center">
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control w-75"
                                        value={form.email}
                                        onChange={handleChange}
                                        disabled={emailVerified}
                                    />
                                    {!emailVerified && !otpSent && (
                                        <button type="button" className="btn btn-success" onClick={sendOtp}>
                                            {verifyLoading ? "Sending..." : "Send OTP"}
                                        </button>
                                    )}
                                    {!emailVerified && otpSent && (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="form-control"
                                            />
                                            <button type="button" className="btn btn-primary" onClick={verifyOtp}>
                                                {verifyLoading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                        </>
                                    )}
                                    {emailVerified && <span className="badge bg-success">Verified</span>}
                                </div>
                                {verifyMessage && <small className="text-info">{verifyMessage}</small>}
                                {errors.email && <small className="text-danger">{errors.email}</small>}
                            </div>

                            {/* Category */}
                            <div className="col-md-6 mb-3">
                                <label>Category*</label>
                                <select
                                    name="category"
                                    className="form-control"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Category</option>
                                    <option value="1">Seller</option>
                                    <option value="0">Buyer</option>
                                </select>
                                {errors.category && <small className="text-danger">{errors.category}</small>}
                            </div>

                            {/* ELCINA Member */}
                            <div className="col-md-6 mb-3">
                                <label>ELCINA Member*</label>
                                <select
                                    name="elcina_member"
                                    className="form-control"
                                    value={form.elcina_member}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                                {errors.elcina_member && <small className="text-danger">{errors.elcina_member}</small>}
                            </div>

                            {/* Conditional Buyer Fields */}
                            {form.category === "0" && (
                                <>
                                    <div className="col-md-6 mb-3">
                                        <label>Products*</label>
                                        <input
                                            type="text"
                                            name="products"
                                            className="form-control"
                                            value={form.products}
                                            onChange={handleChange}
                                        />
                                        {errors.products && <small className="text-danger">{errors.products}</small>}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label>User Category*</label>
                                        <input
                                            type="text"
                                            name="user_category"
                                            className="form-control"
                                            value={form.user_category}
                                            onChange={handleChange}
                                        />
                                        {errors.user_category && <small className="text-danger">{errors.user_category}</small>}
                                    </div>
                                </>
                            )}

                            {/* Address */}
                            <div className="col-md-12 mb-3">
                                <label>Address*</label>
                                <textarea
                                    name="address"
                                    className="form-control"
                                    value={form.address}
                                    onChange={handleChange}
                                />
                                {errors.address && <small className="text-danger">{errors.address}</small>}
                            </div>

                            {/* Country/State/City/Pin */}
                            <div className="col-md-3 mb-3">
                                <label>Country*</label>
                                <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label>State*</label>
                                <input type="text" name="state" className="form-control" value={form.state} onChange={handleChange} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label>City*</label>
                                <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label>Pin Code*</label>
                                <input type="text" name="pinCode" className="form-control" value={form.pinCode} onChange={handleChange} />
                            </div>

                            {/* Submit */}
                            <div className="col-md-12 text-center mt-4">
                                <button type="submit" className="btn btn-primary px-5" disabled={!emailVerified || loading}>
                                    {loading ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Registration;
