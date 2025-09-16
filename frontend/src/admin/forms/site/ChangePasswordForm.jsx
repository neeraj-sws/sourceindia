import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from "../../../config";
import { useAlert } from "../../../context/AlertContext";

const ChangePasswordForm = () => {
  const { showNotification } = useAlert();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!oldPassword) errs.oldPassword = 'Old password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    if (!confirmPassword) errs.confirmPassword = 'Confirm password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('You must be logged in.', "error");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/change-password`,
        {oldPassword, newPassword, confirmPassword},
        {headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}}
      );
      showNotification(res.data.message || 'Password changed successfully.', "success");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response && err.response.data && err.response.data.message) {
        showNotification(err.response.data.message, "error");
      } else {
        showNotification('Something went wrong.', "error");
      }
    }
  };

  return (
    <>
      <h6 className="mb-0 text-uppercase">Change Password</h6>
      <hr />
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-12">
          <label htmlFor="oldPassword" className="form-label required">Old Password</label>
          <input
            type="password"
            className={`form-control ${errors.oldPassword ? 'is-invalid' : ''}`}
            id="oldPassword"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          {errors.oldPassword && <div className="invalid-feedback">{errors.oldPassword}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="newPassword" className="form-label required">New Password</label>
          <input
            type="password"
            className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
            id="newPassword"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
        </div>
        <div className="col-md-6">
          <label htmlFor="confirmPassword" className="form-label required">Confirm Password</label>
          <input
            type="password"
            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
            id="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary px-5">Update</button>
        </div>
      </form>
    </>
  );
};

export default ChangePasswordForm;
