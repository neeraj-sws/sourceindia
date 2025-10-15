import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";

const Login = () => {
  const { showNotification } = useAlert();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedEmail = Cookies.get('rememberedEmail');
    const savedPassword = Cookies.get('rememberedPassword');
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
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        email: formData.email,
        password: formData.password
      });

      const { token } = response.data;
      localStorage.setItem('token', token);

      if (rememberMe) {
        Cookies.set('rememberedEmail', formData.email, { expires: 7 });
        Cookies.set('rememberedPassword', formData.password, { expires: 7 });
      } else {
        Cookies.remove('rememberedEmail');
        Cookies.remove('rememberedPassword');
      }
      showNotification('Login successful!', "success");
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.response && error.response.data) {
        showNotification(error.response.data.message || 'Login failed', "error");
      } else {
        showNotification('Server error. Please try again later.', "error");
      }
    }
  };

  return (
    <div className="section-authentication-signin d-flex align-items-center justify-content-center my-5 my-lg-4">
      <div className="container-fluid">
        <div className="row row-cols-1 row-cols-lg-2 row-cols-xl-3">
          <div className="col mx-auto">
            <div className="card mt-5 mt-lg-0">
              <div className="card-body">
                <div className="border p-4 rounded">
                  <div className="text-center">
                    <h3 className="">Log In</h3>
                  </div>
                  <div className="form-body">
                    <form className="row g-3" onSubmit={handleSubmit}>
                      <div className="col-12">
                        <label htmlFor="inputEmailAddress" className="form-label required">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className={`form-control ${errors.email ? 'border-danger' : ''}`}
                          id="inputEmailAddress"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {errors.email && <div className="text-danger small">{errors.email}</div>}
                      </div>
                      <div className="col-12">
                        <label htmlFor="inputChoosePassword" className="form-label required">
                          Enter Password
                        </label>
                        <div className="input-group" id="show_hide_password">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control border-end-0 ${errors.password ? 'border-danger' : ''}`}
                            id="inputChoosePassword"
                            placeholder="Enter Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          />
                          <button
                            type="button"
                            className={`input-group-text bg-transparent ${errors.password ? 'border-danger' : ''}`}
                            onClick={togglePasswordVisibility}
                          >
                            <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'}`} />
                          </button>
                        </div>
                        {errors.password && <div className="text-danger small">{errors.password}</div>}
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="flexSwitchCheckChecked"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="flexSwitchCheckChecked">
                            Remember Me
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-grid">
                          <button type="submit" className="btn btn-primary btn-sm">
                            <i className="bx bxs-lock-open" /> Sign in
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
