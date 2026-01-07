import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
import { useAlert } from '../context/AlertContext';
import UseAuth from '../sections/UseAuth';

const Profile = () => {
  const { showNotification } = useAlert();
  const { user, loading } = UseAuth();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      showNotification('All fields are required.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showNotification('Confirm password does not match new password.', 'error');
      return;
    }
    setSubmitting(true);
    const token = localStorage.getItem('user_token');
    try {
      const response = await axios.post(`${API_BASE_URL}/signup/change-password`, form, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      showNotification(response.data.message || 'Password changed successfully!', 'success');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowModal(false), 2000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to change password.';
      showNotification(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Suspense fallback={<div></div>}>
      <div className="page-wrapper">
        <div className="page-content">
          {/*end breadcrumb*/}
          <div className="container">
            <div className="main-body">
              <div className="row">
                <div className="col-lg-4">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex flex-column align-items-center text-center">
                        <ImageWithFallback
                          src={user.file && `${ROOT_URL}/${user.file.file}`}
                          width={110}
                          height={110}
                          showFallback={true}
                          className="rounded-circle"
                        />
                        <div className="mt-3">
                          <h4>{user.fname} {user.lname}</h4>
                          <Link to="#" className="mb-1">{user.email}</Link>
                          <p className="text-muted font-size-sm">
                            {user.mobile}
                          </p>
                          <a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }} className="text-danger mb-1">Change Password <i className="bx bx-key" /></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="card">
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-sm-12">
                          <div className="edit_btn d-flex text-end justify-content-between align-items-center border-bottom pb-2">
                            <h5 className="mb-0 text-primary">Profile</h5>
                            <Link to="/profile-edit" className="py-1 btn btn-sm btn-primary">
                              <i className="lni lni-pencil-alt me-1" /> User Profile
                            </Link>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="pt-3 border-bottom">
                            <h6>Name</h6>
                            <p>{user.fname} {user.lname}</p>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="pt-3 border-bottom">
                            <h6>Email</h6>
                            <p>{user.email}</p>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="pt-3 border-bottom">
                            <h6>Mobile</h6>
                            <p>{user.mobile}</p>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="pt-3 border-bottom">
                            <h6>Alternate Number</h6>
                            <p>{user.alternate_number}</p>
                          </div>
                        </div>
                        {user.company_info?.designation && (
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Designation</h6>
                              <p>{user.company_info?.designation}</p>
                            </div>
                          </div>
                        )}
                        {user.is_seller == 0 && (
                          <>
                            {user.company_info?.user_category && (
                              <div className="col-sm-6">
                                <div className="pt-3 border-bottom">
                                  <h6>User Category:</h6>
                                  <p>{user.company_info?.user_category?.toUpperCase()}</p>
                                </div>
                              </div>
                            )}
                            {user.company_info?.company_website && (
                              <div className="col-sm-6">
                                <div className="pt-3 border-bottom">
                                  <h6>Website:</h6>
                                  <p>{user.company_info?.company_website}</p>
                                </div>
                              </div>
                            )}
                            {user.products && (
                              <div className="col-sm-6">
                                <div className="pt-3 border-bottom">
                                  <h6>Products:</h6>
                                  <p>{user.products}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {user.state_data?.name && (
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>State</h6>
                              <p>{user.state_data?.name}</p>
                            </div>
                          </div>
                        )}
                        {user.city_data?.name && (
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>City</h6>
                              <p>{user.city_data?.name}</p>
                            </div>
                          </div>
                        )}
                        {user.address && (
                          <div className="col-sm-12">
                            <div className="pt-3 border-bottom">
                              <h6>Address</h6>
                              <p>{user.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {user.company_info && user.is_seller == 1 && (
                  <div className="col-lg-12 mt-3">
                    <div className="card">
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-sm-12">
                            <div className="edit_btn d-flex text-end justify-content-between align-items-center border-bottom pb-2">
                              <h5 className="mb-0 text-primary">Company Information</h5>
                              <Link to="/company-edit" className="py-1 btn btn-sm btn-primary">
                                <i className="lni lni-pencil-alt me-1" /> Company Profile
                              </Link>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Organization Name</h6>
                              <p>{user.company_info?.organization_name}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Core Activities</h6>
                              <p>{user.company_info?.CoreActivity?.name}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Activity</h6>
                              <p>{user.company_info?.Activity?.name}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Category</h6>
                              <p>{user.company_info?.category_sell_names}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Sub Category</h6>
                              <p>{user.company_info?.sub_category_names}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Company Website</h6>
                              <p>{user.company_info?.company_website}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Company Location</h6>
                              <p>{user.company_info?.company_location}</p>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Company Brochure</h6>
                              <a href={user.company_info?.companySamplePptFile ? `${ROOT_URL}/${user.company_info.companySamplePptFile.file}` : "#"}>
                                Download File
                              </a>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="pt-3 border-bottom">
                              <h6>Company Logo</h6>
                              <ImageWithFallback
                                src={user.company_info?.companyLogo ? `${ROOT_URL}/${user.company_info.companyLogo.file}` : ""}
                                width={150}
                                height={150}
                                showFallback={true}
                              />
                            </div>
                          </div>
                          <div className="col-sm-12">
                            <div className="pt-3 border-bottom">
                              <h6>Company Introduction</h6>
                              <p>{user.company_info?.organizations_product_description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {showModal && (
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Change Password</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                      <label className="form-label">Old Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="oldPassword"
                        value={form.oldPassword}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className={`form-control ${form.newPassword && form.newPassword.length < 6 ? 'is-invalid' : ''}`}
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                      />
                      {form.newPassword && form.newPassword.length < 6 && (
                        <div className="invalid-feedback">Password must be at least 6 characters long.</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        className={`form-control ${form.confirmPassword && form.confirmPassword !== form.newPassword && 'is-invalid'}`}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                      />
                      {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                        <div className="invalid-feedback">Passwords do not match.</div>
                      )}
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        {showModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </Suspense>
  );
};

export default Profile;
