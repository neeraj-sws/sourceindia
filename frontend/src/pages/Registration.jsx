import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";

const Registration = () => {
    const { showNotification } = useAlert();
    const [form, setForm] = useState({
        fname: "",
        lname: "",
        cname: "",
        website: "",
        mobile: "",
        email: "",
        category: "",
        elcina_member: "",
        is_trading: "",
        products: "",
        user_category: "",
        address: "",
        city: "",
        state: "",
        country: "",
        pinCode: "",
    });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const [emailVerified, setEmailVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState("");
    const [errors, setErrors] = useState({});

    // Fetch countries on mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/signup/countries`);
                setCountries(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCountries();
    }, []);

    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;
        if (name === "mobile") {
            // remove non-digits
            let cleanValue = value.replace(/\D/g, '');
            // limit to 10 digits
            if (cleanValue.length > 10) cleanValue = cleanValue.slice(0, 10);
            setForm({ ...form, [name]: cleanValue });
        } else {
            setForm({ ...form, [name]: value });
        }


    };

    // When country changes, load states
    useEffect(() => {
        const fetchStates = async () => {
            if (!form.country) return setStates([]);
            try {
                const res = await axios.get(`${API_BASE_URL}/signup/states?country_id=${form.country}`);
                setStates(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStates();
        setForm({ ...form, state: "", city: "" });
        setCities([]);
    }, [form.country]);

    // When state changes, load cities
    useEffect(() => {
        const fetchCities = async () => {
            if (!form.state) return setCities([]);
            try {
                const res = await axios.get(`${API_BASE_URL}/signup/cities?state_id=${form.state}`);
                setCities(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCities();
        // setForm({ ...form, city: "" });
    }, [form.state]);

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
            setUserId(res.data.user_id); // store user_id for verification
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
                user_id: userId, // important for backend mapping
            });
            if (res.data.message) {
                setEmailVerified(true); // mark email as verified
                setOtpSent(false);      // hide OTP input
                showNotification("Email verified successfully", "success");
            } else {
                setVerifyMessage(res.data.message || "Invalid OTP");
            }
        } catch (err) {
            showNotification(err.response?.data?.error || "Error verifying OTP", "error");
        } finally {
            setVerifyLoading(false);
        }
    };

    const handlePinBlur = async () => {
        if (form.pinCode.length !== 6 || isNaN(form.pinCode)) {
            showNotification("Please enter a valid 6-digit PIN code", "error");
            return;
        }
        try {
            const res = await axios.get(`https://api.postalpincode.in/pincode/${form.pinCode}`);
            const data = res.data[0];
            console.log('API Response:', data);

            if (data.Status !== "Success" || !data.PostOffice?.length) {
                showNotification("Invalid Pincode or No Data Found", "error");
                return;
            }

            const postOffice = data.PostOffice[0];


            // Use trimmed values to match backend names
            const countryName = postOffice.Country?.trim();
            const stateName = postOffice.State?.trim();
            const cityName = postOffice.District?.trim();

            // Get country ID from backend
            const countryRes = await axios.get(`${API_BASE_URL}/signup/countries?name=${encodeURIComponent(countryName)}`);
            const countryId = countryRes.data[0]?.id;

            // Get state ID
            const stateRes = await axios.get(`${API_BASE_URL}/signup/states?country_id=${countryId}&name=${encodeURIComponent(stateName)}`);
            const stateId = stateRes.data[0]?.id;

            // Get city ID
            const cityRes = await axios.get(`${API_BASE_URL}/signup/cities?state_id=${stateId}&name=${encodeURIComponent(cityName)}`);
            const cityId = cityRes.data[0]?.id;

            setForm({
                ...form,
                country: countryId || "",
                state: stateId || "",
                city: cityId || "",
            });
        } catch (err) {
            console.error(err);
            showNotification("Failed to fetch location from PIN code", "error");
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
        setErrors({});
        setVerifyMessage("");

        try {
            const payload = { ...form, cname: form.cname };

            const res = await axios.post(`${API_BASE_URL}/signup/register`, payload);

            if (res.data.success) {
                showNotification("Registration successful!", "success");

                setForm({
                    fname: "",
                    lname: "",
                    cname: "",
                    website: "",
                    mobile: "",
                    email: "",
                    category: "",
                    elcina_member: "",
                    is_trading: "",
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
                setUserId(null);
            } else if (res.data.errors) {
                setErrors(res.data.errors);
            } else {
                showNotification(res.data.error || "Something went wrong", "error");
            }
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            const message = err.response?.data?.error || "Server error. Please try again.";

            if (serverErrors) {
                setErrors(serverErrors);
            } else {
                showNotification(message, "error");
            }
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
                                <input type="text" name="fname" className="form-control" value={form.fname} onChange={handleChange} />
                                {errors.fname && <small className="text-danger">{errors.fname}</small>}
                            </div>

                            {/* Last Name */}
                            <div className="col-md-6 mb-3">
                                <label>Last Name*</label>
                                <input type="text" name="lname" className="form-control" value={form.lname} onChange={handleChange} />
                                {errors.lname && <small className="text-danger">{errors.lname}</small>}
                            </div>

                            {/* Company Name */}
                            <div className="col-md-6 mb-3">
                                <label>Company Name*</label>
                                <input type="text" name="cname" className="form-control" value={form.cname} onChange={handleChange} />
                                {errors.cname && <small className="text-danger">{errors.cname}</small>}
                            </div>

                            {/* Website */}
                            <div className="col-md-6 mb-3">
                                <label>Website</label>
                                <input type="text" name="website" className="form-control" value={form.website} onChange={handleChange} />

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
                                    maxLength={10}                    // max 10 digits
                                    pattern="\d{10}"                  // exactly 10 digits
                                    placeholder="Enter 10-digit mobile"
                                />
                                {errors.mobile && <small className="text-danger">{errors.mobile}</small>}
                            </div>


                            {/* Email + OTP */}
                            <div className="col-md-6 mb-3">
                                <label>Email*</label>
                                <div className="d-flex gap-2 align-items-start">
                                    <input type="email" name="email" className="form-control w-50" value={form.email} onChange={handleChange} disabled={emailVerified} />

                                    {!emailVerified && !otpSent && (
                                        <button type="button" className="btn btn-success" onClick={sendOtp} disabled={verifyLoading}>
                                            {verifyLoading ? "Sending..." : "Send OTP"}
                                        </button>
                                    )}

                                    {!emailVerified && otpSent && (
                                        <>
                                            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="form-control w-25" />
                                            <button type="button" className="btn btn-primary" onClick={verifyOtp} disabled={verifyLoading}>
                                                {verifyLoading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                        </>
                                    )}

                                    {emailVerified && <span className="badge bg-success">Verified</span>}
                                </div>

                                {verifyMessage && <small className="text-danger">{verifyMessage}</small>}
                                {errors.email && <small className="text-danger">{errors.email}</small>}
                            </div>

                            {/* Show rest of form only after email verification */}
                            {emailVerified && (
                                <>
                                    {/* Category */}
                                    <div className="col-md-6 mb-3">
                                        <label>Category*</label>
                                        <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                                            <option value="">Select Category</option>
                                            <option value="1">Seller</option>
                                            <option value="0">Buyer</option>
                                        </select>
                                        {errors.category && <small className="text-danger">{errors.category}</small>}
                                    </div>

                                    {/* ELCINA Member */}
                                    <div className="col-md-3 mb-3">
                                        <label>ELCINA Member*</label>
                                        <select name="elcina_member" className="form-select" value={form.elcina_member} onChange={handleChange}>
                                            <option value="">Select</option>
                                            <option value="1">Yes</option>
                                            <option value="2">No</option>
                                            <option value="3">Not sure</option>
                                        </select>
                                        {errors.elcina_member && <small className="text-danger">{errors.elcina_member}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>Trader*</label>
                                        <select name="is_trading" className="form-select" value={form.is_trading} onChange={handleChange}>
                                            <option value="">Select</option>
                                            <option value="0">No</option>
                                            <option value="1">Yes</option>
                                        </select>
                                        {errors.is_trading && <small className="text-danger">{errors.is_trading}</small>}
                                    </div>

                                    {/* Buyer Fields */}
                                    {form.category === "0" && (
                                        <>
                                            <div className="col-md-6 mb-3">
                                                <label>Products*</label>
                                                <input type="text" name="products" className="form-control" value={form.products} onChange={handleChange} />
                                                {errors.products && <small className="text-danger">{errors.products}</small>}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label>User Category*</label>
                                                <select className="form-select" name="user_category" value={form.user_category} onChange={handleChange}>
                                                    <option value="">Select User Category</option>
                                                    <option value="brand">Brand</option>
                                                    <option value="ems">EMS</option>
                                                    <option value="oem">OEM</option>
                                                    <option value="component manufacturer">Component Manufacturer</option>
                                                </select>


                                                {errors.user_category && <small className="text-danger">{errors.user_category}</small>}
                                            </div>
                                        </>
                                    )}

                                    {/* Address */}
                                    <div className="col-md-12 mb-3">
                                        <label>Address*</label>
                                        <textarea name="address" className="form-control" value={form.address} onChange={handleChange} />
                                        {errors.address && <small className="text-danger">{errors.address}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>Pin Code*</label>
                                        <input type="text" name="pinCode" className="form-control" value={form.pinCode} onChange={handleChange} onBlur={handlePinBlur} />
                                        {errors.pinCode && <small className="text-danger">{errors.pinCode}</small>}
                                    </div>
                                    {/* Country/State/City/Pin */}
                                    <div className="col-md-3 mb-3">
                                        <label>Country*</label>
                                        <select name="country" className="form-select" value={form.country} onChange={handleChange}>
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {errors.country && <small className="text-danger">{errors.country}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>State*</label>
                                        <select name="state" className="form-select" value={form.state} onChange={handleChange}>
                                            <option value="">Select State</option>
                                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        {errors.state && <small className="text-danger">{errors.state}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>City*</label>
                                        <select name="city" className="form-select" value={form.city} onChange={handleChange}>
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {errors.city && <small className="text-danger">{errors.city}</small>}
                                    </div>


                                    {/* Submit */}
                                    <div className="col-md-12 text-center mt-4">
                                        <button type="submit" className="btn btn-primary px-5" disabled={!emailVerified || loading}>
                                            {loading ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Registration;
