import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css"; // Bootstrap look

const Registration = () => {
    const { showNotification } = useAlert();
    const { login, setUser, isLoggedIn, user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fname: "",
        lname: "",
        cname: "",
        website: "",
        mobile: "",
        alternate_number: "",
        country_code: "+91",
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
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    const [emailVerified, setEmailVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState("");
    const [errors, setErrors] = useState({});
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    useEffect(() => {
        if (isLoggedIn && user) {
            if (user.is_seller == 1) {
                navigate("/company-edit", { replace: true });
            } else {
                navigate("/profile-edit", { replace: true });
            }
        }
    }, [isLoggedIn, user, navigate]);

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

    const handleCountryChange = async (event) => {
        const countryId = event.target.value;
        setSelectedCountry(countryId);

        setForm(prev => ({
            ...prev,
            country: countryId,
            state: "",
            city: ""
        }));

        try {
            const res = await axios.get(`${API_BASE_URL}/signup/states?country_id=${countryId}`);
            setStates(res.data);
            setSelectedState("");
            setSelectedCity("");
            setCities([]);
        } catch (error) {
            console.error("Error fetching states:", error);
        }
    };

    const handleStateChange = async (event) => {
        const stateId = event.target.value;
        setSelectedState(stateId);

        setForm(prev => ({
            ...prev,
            state: stateId,
            city: ""
        }));

        try {
            const res = await axios.get(`${API_BASE_URL}/signup/cities?state_id=${stateId}`);
            setCities(res.data);
            setSelectedCity("");
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    const handleCityChange = (event) => {
        const cityId = event.target.value;
        setSelectedCity(cityId);

        setForm(prev => ({
            ...prev,
            city: cityId
        }));
    };

    useEffect(() => {
        if (!emailVerified) return; // Selects exist only when emailVerified is true

        const $country = $('#country');
        const $state = $('#state');
        const $city = $('#city');

        // ---- COUNTRY ----
        if (!$country.data("select2")) {
            $country.select2({
                theme: "bootstrap",
                width: "100%",
                placeholder: "Select Country"
            }).on("change", function () {
                handleCountryChange({ target: { value: $(this).val() } });
            });
        } else {
            // Sync React state to Select2 UI
            $country.val(selectedCountry);
        }

        // ---- STATE ----
        if (!$state.data("select2")) {
            $state.select2({
                theme: "bootstrap",
                width: "100%",
                placeholder: "Select State"
            }).on("change", function () {
                handleStateChange({ target: { value: $(this).val() } });
            });
        } else {
            $state.val(selectedState).trigger("change.select2");
        }

        // ---- CITY ----
        if (!$city.data("select2")) {
            $city.select2({
                theme: "bootstrap",
                width: "100%",
                placeholder: "Select City"
            }).on("change", function () {
                handleCityChange({ target: { value: $(this).val() } });
            });
        } else {
            $city.val(selectedCity).trigger("change.select2");
        }

        // Cleanup only when component unmounts or emailVerified becomes false
        return () => {
            if ($country.data("select2")) $country.off().select2("destroy");
            if ($state.data("select2")) $state.off().select2("destroy");
            if ($city.data("select2")) $city.off().select2("destroy");
        };

    }, [emailVerified, selectedCountry, selectedState, selectedCity]);

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
    // useEffect(() => {
    //     const fetchStates = async () => {
    //         if (!form.country) return setStates([]);
    //         try {
    //             const res = await axios.get(`${API_BASE_URL}/signup/states?country_id=${form.country}`);
    //             setStates(res.data);
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     };
    //     fetchStates();
    //     setForm({ ...form, state: "", city: "" });
    //     setCities([]);
    // }, [form.country]);

    // // When state changes, load cities
    // useEffect(() => {
    //     const fetchCities = async () => {
    //         if (!form.state) return setCities([]);
    //         try {
    //             const res = await axios.get(`${API_BASE_URL}/signup/cities?state_id=${form.state}`);
    //             setCities(res.data);
    //         } catch (err) {
    //             console.error(err);
    //         }
    //     };
    //     fetchCities();
    //     // setForm({ ...form, city: "" });
    // }, [form.state]);

    // Send OTP
    const sendOtp = async () => {
        if (!form.email) {
            setVerifyMessage("Please enter email first");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailRegex.test(form.email)) {
            alert("Please enter a valid email address");
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

    const handleResend = async () => {
        setVerifyLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/signup/resend-otp`, { email: form.email });
            setOtp("");
            showNotification('OTP resent successfully!', 'success');
        } catch (err) {
            showNotification('Error resending OTP', 'error');
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
                // country: countryId || "",
                // state: stateId || "",
                // city: cityId || "",
            });
            setSelectedCountry(countryId || '');
            setSelectedState(stateId || '');
            setSelectedCity(cityId || '');

            if (countryId) {
                const stRes = await axios.get(`${API_BASE_URL}/location/states/${countryId}`);
                setStates(stRes.data);
            }
            if (stateId) {
                const ctRes = await axios.get(`${API_BASE_URL}/location/cities/${stateId}`);
                setCities(ctRes.data);
            }
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
            const payload = {
                ...form,
                cname: form.cname,
                country: selectedCountry,
                state: selectedState,
                city: selectedCity
            };

            const res = await axios.post(`${API_BASE_URL}/signup/register`, payload);

            if (res.data.success) {
                showNotification("Registration successful!", "success");

                setForm({
                    fname: "",
                    lname: "",
                    cname: "",
                    website: "",
                    mobile: "",
                    alternate_number: "",
                    country_code: "+91",
                    email: "",
                    category: "",
                    elcina_member: "",
                    is_trading: "",
                    products: "",
                    user_category: "",
                    address: "",
                    // city: "",
                    // state: "",
                    // country: "",
                    pinCode: "",
                });
                setSelectedCountry('');
                setSelectedState('');
                setSelectedCity('');
                setEmailVerified(false);
                setOtp("");
                setOtpSent(false);
                setUserId(null);
                // navigate('/login');
                const generatedPassword = res.data.password;   // auto-generated password
                const email = form.email;

                // 🔥 AUTO LOGIN using generated backend password
                const loginResponse = await axios.post(`${API_BASE_URL}/signup/login`, {
                    email: email,
                    password: generatedPassword
                });

                if (loginResponse.data.token) {
                    // Save token & user to AuthContext
                    login(loginResponse.data.token);
                    setUser(loginResponse.data.user);

                    // 🔥 Redirect based on type
                    if (loginResponse.data.user.is_seller == 1) {
                        navigate("/company-edit", { replace: true });
                    } else {
                        navigate("/profile-edit", { replace: true });
                    }
                }

                return;
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
                                <label>First Name<sup className="text-danger">*</sup></label>
                                <input type="text" name="fname" className="form-control" value={form.fname} onChange={handleChange} />
                                {errors.fname && <small className="text-danger">{errors.fname}</small>}
                            </div>

                            {/* Last Name */}
                            <div className="col-md-6 mb-3">
                                <label>Last Name<sup className="text-danger">*</sup></label>
                                <input type="text" name="lname" className="form-control" value={form.lname} onChange={handleChange} />
                                {errors.lname && <small className="text-danger">{errors.lname}</small>}
                            </div>

                            {/* Company Name */}
                            <div className="col-md-6 mb-3">
                                <label>Company Name<sup className="text-danger">*</sup></label>
                                <input type="text" name="cname" className="form-control" value={form.cname} onChange={handleChange} />
                                {errors.cname && <small className="text-danger">{errors.cname}</small>}
                            </div>

                            {/* Website */}
                            <div className="col-md-6 mb-3">
                                <label>Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    className="form-control"
                                    placeholder="https://example.com"
                                    value={form.website}
                                    onChange={handleChange}
                                    pattern="^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(/.*)?$"
                                    title="Enter a valid website URL (e.g. https://example.com)"
                                />

                            </div>

                            {/* Mobile */}
                            <div className="col-md-6 mb-3">
                                <label>
                                    Mobile <sup className="text-danger">*</sup>
                                </label>

                                <PhoneInput
                                    country="in"
                                    value={
                                        form.country_code.replace("+", "") + form.mobile
                                    }
                                    onChange={(value, country) => {
                                        setForm(prev => ({
                                            ...prev,
                                            country_code: `+${country.dialCode}`,
                                            mobile: value.slice(country.dialCode.length)
                                        }));
                                    }}
                                    containerClass="w-100"
                                    inputClass="form-control"
                                />

                                {errors.mobile && (
                                    <small className="text-danger">{errors.mobile}</small>
                                )}
                            </div>



                            {/* Email + OTP */}
                            <div className="col-md-6 mb-3">
                                <label>Email<sup className="text-danger">*</sup></label>
                                <div className="d-flex gap-2 align-items-start">
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control w-50"
                                        placeholder="example@email.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        disabled={emailVerified}
                                        pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                                        title="Enter a valid email address (example@email.com)"
                                    />


                                    {!emailVerified && !otpSent && (
                                        <button type="button" className="btn btn-success" onClick={sendOtp} disabled={verifyLoading}>
                                            {verifyLoading ? "Sending..." : "Send OTP"}
                                        </button>
                                    )}


                                    {/* Resend OTP functionality */}
                                    {!emailVerified && otpSent && (
                                        <>
                                            <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))} className="form-control w-25" />
                                            <button type="button" className="btn btn-primary" onClick={verifyOtp} disabled={verifyLoading || otp.length === 0}>
                                                {verifyLoading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                            <button type="button" className="btn btn-link" style={{ whiteSpace: 'nowrap' }} onClick={handleResend} disabled={verifyLoading}>
                                                Resend OTP
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
                                    <div className="col-md-3 mb-3">
                                        <label>Alternate Number</label>
                                        <input type="text" name="alternate_number" className="form-control" id="alternate_number"
                                            placeholder="Alternate Number" value={form.alternate_number} onChange={handleChange} min={0} />
                                    </div>
                                    {/* Category */}
                                    <div className="col-md-3 mb-3">
                                        <label>Category<sup className="text-danger">*</sup></label>
                                        <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                                            <option value="">Select Category</option>
                                            <option value="1">Seller</option>
                                            <option value="0">Buyer</option>
                                        </select>
                                        {errors.category && <small className="text-danger">{errors.category}</small>}
                                    </div>

                                    {/* ELCINA Member */}
                                    <div className="col-md-3 mb-3">
                                        <label>ELCINA Member<sup className="text-danger">*</sup></label>
                                        <select name="elcina_member" className="form-select" value={form.elcina_member} onChange={handleChange}>
                                            <option value="">Select</option>
                                            <option value="1">Yes</option>
                                            <option value="2">No</option>
                                            <option value="3">Not sure</option>
                                        </select>
                                        {errors.elcina_member && <small className="text-danger">{errors.elcina_member}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>Trader</label>
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
                                                <label>Products<sup className="text-danger">*</sup></label>
                                                <input type="text" name="products" className="form-control" value={form.products} onChange={handleChange} />
                                                {errors.products && <small className="text-danger">{errors.products}</small>}
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label>User Category<sup className="text-danger">*</sup></label>
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
                                        <label>Address<sup className="text-danger">*</sup></label>
                                        <textarea name="address" className="form-control" value={form.address} onChange={handleChange} />
                                        {errors.address && <small className="text-danger">{errors.address}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>Pin Code<sup className="text-danger">*</sup></label>
                                        <input type="text" name="pinCode" className="form-control" value={form.pinCode} onChange={handleChange} onBlur={handlePinBlur} />
                                        {errors.pinCode && <small className="text-danger">{errors.pinCode}</small>}
                                    </div>
                                    {/* Country/State/City/Pin */}
                                    <div className="col-md-3 mb-3">
                                        <label>Country<sup className="text-danger">*</sup></label>
                                        {/* <select name="country" className="form-select" value={form.country} onChange={handleChange}>
                                            <option value="">Select Country</option>
                                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select> */}
                                        <select
                                            id="country"
                                            className="form-control select2"
                                            value={selectedCountry}
                                            onChange={handleCountryChange}
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(country => (
                                                <option key={country.id} value={country.id}>{country.name}</option>
                                            ))}
                                        </select>
                                        {errors.country && <small className="text-danger">{errors.country}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>State<sup className="text-danger">*</sup></label>
                                        {/* <select name="state" className="form-select" value={form.state} onChange={handleChange}>
                                            <option value="">Select State</option>
                                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select> */}
                                        <select
                                            id="state"
                                            className="form-control select2"
                                            value={selectedState}
                                            onChange={handleStateChange}
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {errors.state && <small className="text-danger">{errors.state}</small>}
                                    </div>
                                    <div className="col-md-3 mb-3">
                                        <label>City<sup className="text-danger">*</sup></label>
                                        {/* <select name="city" className="form-select" value={form.city} onChange={handleChange}>
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select> */}
                                        <select
                                            id="city"
                                            className="form-control select2"
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map((city) => (
                                                <option key={city.id} value={city.id}>{city.name}</option>
                                            ))}
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
