import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from "./../config";
import { useAlert } from "../context/AlertContext";

const Login = () => {
    const { showNotification } = useAlert();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
    const savedEmail = Cookies.get('userEmail');
    const savedPassword = Cookies.get('userPassword');
    if (savedEmail && savedPassword) {
        setFormData({ email: savedEmail, password: savedPassword });
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
        if (!formData.password || !formData.password.trim()) {
        errs.password = "Password is required";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const togglePasswordVisibility = (e) => {
        e.preventDefault();
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors('');
        if (!validateForm()) return;
        try {
        const response = await axios.post(`${API_BASE_URL}/buyers/login`, {
            email: formData.email,
            password: formData.password
        });

        const { token } = response.data;
        localStorage.setItem('user_token', token);
        if (rememberMe) {
        Cookies.set('userEmail', formData.email, { expires: 7 });
        Cookies.set('userPassword', formData.password, { expires: 7 });
        } else {
        Cookies.remove('userEmail');
        Cookies.remove('userPassword');
        }
        showNotification('Login successful!', "success");
        navigate('/');
        } catch (error) {
        if (error.response && error.response.data) {
            showNotification(error.response.data.message || 'Login failed', "error");
        } else {
            showNotification('Server error. Please try again later.', "error");
        }
        }
    };

    return (
    <div className="container my-5">
        <div className="form-container shadow-sm">
            <h3 className="text-center mb-4">LOGIN</h3>
            <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="email" className="form-label">Enter Your Email</label>
                <div className="input-group">
                <span className="input-group-text"><i className="bx bx-envelope" /></span>
                <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                </div>
                {errors.email && <div className="text-danger small">{errors.email}</div>}
            </div>
            <div className="mb-3">
                <label htmlFor="password" className="form-label">Enter Password</label>
                <div className="input-group">
                <span className="input-group-text"><i className="bx bx-lock-alt" /></span>
                <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" className="input-group-text" onClick={togglePasswordVisibility}>
                    <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} />
                </button>
                </div>
                {errors.password && <div className="text-danger small">{errors.password}</div>}
            </div>
            <div className="d-grid mb-3">
                <button type="submit" className="btn btn-primary">LOGIN</button>
            </div>
            <div className="text-center mb-3">
                <strong>OR</strong>
                <br />
                <button type="button" className="btn btn-outline-secondary mt-2">
                Get an OTP on Your Email
                </button>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <div className="form-check">
                <input type="checkbox" className="form-check-input" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}/>
                <label className="form-check-label" htmlFor="rememberMe">Remember Me</label>
                </div>
                <a href="#">Forgot Password?</a>
            </div>
            <div className="text-center mt-3">
                Don't have an account? <a href="#">Sign Up</a>
            </div>
            </form>
        </div>
    </div>
  )
}

export default Login