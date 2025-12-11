import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../config';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { showNotification } = useAlert();
    const { login, setUser } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isOtpMode, setIsOtpMode] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', otp: '' }); // Added otp
    const [errors, setErrors] = useState({});
    const [userId, setUserId] = useState(null);
    const [resendDisabled, setResendDisabled] = useState(false); // State for resend cooldown
    const [loading, setLoading] = useState(false); // New state for loading

    useEffect(() => {
        const savedEmail = Cookies.get('userEmail');
        const savedPassword = Cookies.get('userPassword');
        if (savedEmail && savedPassword) {
            setFormData({ email: savedEmail, password: savedPassword, otp: '' });
            setRememberMe(true);
        }
    }, []);

    const validateForm = () => {
        const errs = {};
        if (!formData.email.trim()) {
            errs.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errs.email = 'Invalid email format';
        }
        if (!isOtpMode && (!formData.password || !formData.password.trim())) {
            errs.password = 'Password is required';
        }
        if (isOtpMode && (!formData.otp || !formData.otp.trim())) {
            errs.otp = 'OTP is required';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const togglePasswordVisibility = (e) => {
        e.preventDefault();
        setShowPassword((prev) => !prev);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true); // Start loading

        if (!formData.email.trim()) {
            setErrors({ email: 'Email is required' });
            setLoading(false); // Stop loading on error
            return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setErrors({ email: 'Invalid email format' });
            setLoading(false); // Stop loading on error
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/signup/send-login-otp`, {
                email: formData.email,
            });

            if (response.data.userId) {
                setIsOtpMode(true);
                setUserId(response.data.userId);
                setUser(response.data.user); // Set user data from response
                showNotification(response.data.message, 'success');
            } else {
                showNotification(response.data.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false); // Stop loading regardless of success or failure
        }
    };

    const handleResendOtp = async () => {
        if (!formData.email.trim()) {
            showNotification('Email is required to resend OTP', 'error');
            return;
        }

        setResendDisabled(true); // Disable resend button
        try {
            const response = await axios.post(`${API_BASE_URL}/signup/send-login-otp`, {
                email: formData.email,
            });

            if (response.data.userId) {
                showNotification(response.data.message || 'OTP resent successfully', 'success');
            } else {
                showNotification(response.data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to resend OTP', 'error');
        } finally {
            // Re-enable resend after 30 seconds
            setTimeout(() => setResendDisabled(false), 30000); // 30-second cooldown
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!validateForm()) return;

        try {
            if (isOtpMode) {
                const response = await axios.post(`${API_BASE_URL}/signup/verify-login-otp`, {
                    userId,
                    otp: formData.otp,
                });

                if (response.data.token) {
                    login(response.data.token);
                    setUser(response.data.user);
                    showNotification(response.data.message, 'success');
                    navigate('/');
                } else {
                    showNotification(response.data.message || 'Invalid OTP', 'error');
                }
            } else {
                const response = await axios.post(`${API_BASE_URL}/signup/login`, {
                    email: formData.email,
                    password: formData.password,
                });

                if (response.data.token) {
                    login(response.data.token);
                    setUser(response.data.user);
                    if (rememberMe) {
                        Cookies.set('userEmail', formData.email, { expires: 7 });
                        Cookies.set('userPassword', formData.password, { expires: 7 });
                    } else {
                        Cookies.remove('userEmail');
                        Cookies.remove('userPassword');
                    }
                    showNotification(response.data.message || 'Login successful', 'success');
                    navigate('/');
                } else {
                    showNotification(response.data.message || 'Login failed', 'error');
                }
            }
        } catch (error) {
            showNotification(error.response?.data?.message || 'Login failed', 'error');
        }
    };

    return (
        <div className="container my-5">
            <div className="form-container shadow-sm">
                <h3 className="text-center mb-4 color-primary">LOGIN</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Enter Your Email</label>
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bx bx-envelope" />
                            </span>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isOtpMode}
                            />
                        </div>
                        {errors.email && <div className="text-danger small">{errors.email}</div>}
                    </div>

                    {!isOtpMode ? (
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Enter Password</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bx bx-lock-alt" />
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    id="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="input-group-text"
                                    onClick={togglePasswordVisibility}
                                >
                                    <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} />
                                </button>
                            </div>
                            {errors.password && <div className="text-danger small">{errors.password}</div>}
                        </div>
                    ) : (
                        <div className="mb-3">
                            <label htmlFor="otp" className="form-label">Enter OTP</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bx bx-key" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="otp"
                                    placeholder="Enter OTP"
                                    value={formData.otp || ''} // Ensure controlled input
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                />
                            </div>
                            {errors.otp && <div className="text-danger small">{errors.otp}</div>}
                        </div>
                    )}

                    <div className="d-grid mb-3">
                        <button type="submit" className="btn btn-primary">
                            {isOtpMode ? 'VERIFY OTP' : 'LOGIN'}
                        </button>
                    </div>

                    {isOtpMode && (
                        <div className="text-center mb-3">
                            <button
                                type="button"
                                className="btn btn-link text-decoration-none"
                                onClick={handleResendOtp}
                                disabled={resendDisabled}
                            >
                                Resend OTP {resendDisabled && '(30s cooldown)'}
                            </button>
                        </div>
                    )}

                    <div className="text-center mb-3">
                        <strong>OR</strong>
                        <br />
                        <button
                            type="button"
                            className="btn btn-outline-secondary mt-2"
                            onClick={handleSendOtp}
                            disabled={isOtpMode || loading} // Disable during loading
                        >
                            {loading ? 'Sending...' : 'Get an OTP on Your Email'}
                        </button>
                    </div>

                    {!isOtpMode && (
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="rememberMe">Remember Me</label>
                            </div>
                            <a href="#">Forgot Password?</a>
                        </div>
                    )}

                    <div className="text-center mt-3">
                        Don't have an account? <Link to="/registration">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;