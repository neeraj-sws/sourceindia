import React, { useState, useEffect } from 'react';
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useAlert } from "../context/AlertContext";
import axios from 'axios';
// import UseAuth from '../sections/UseAuth';
import { useAuth } from "../context/AuthContext";
import { Suspense, lazy } from 'react';

const EnquiryForm = ({ show, onHide, productId, companyId, productTitle, companyName }) => {
  const { showNotification } = useAlert();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [products, setProducts] = useState([]); // Initialize as empty array
  const [singleProduct, setSingleProduct] = useState(null);
  const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const { user, login } = useAuth();

  useEffect(() => {
    if (user && user.walkin_buyer === 1 && user.is_walkin_new  === 0 && show) {
      setStep(3);
      setUserId(user.id);
    }
  }, [user, show]);

  console.log('EnquiryForm:', user);

  useEffect(() => {
    if (!show) return;
    if (!productId && companyId) {
      const fetchProducts = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/products/all-products?company_id=${companyId}`);
          console.log('API Response:', res.data);

          const { success, data } = res.data;
          setProducts(success && Array.isArray(data) ? data : []);
        } catch (err) {
          console.log('Error Details:', err.response?.data || err.message);
          setError('Error fetching products');
          showNotification('Error fetching products', 'error');
          setProducts([]); // Set to empty array on error
        }
      };
      fetchProducts();
    } else {
      console.log('Condition not met - productId:', productId, 'companyId:', companyId);
    }
  }, [show, productId, companyId]);


  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${productId}`);

        setTimeout(() => {
          setSingleProduct(res.data);

        }, 1000);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, [productId]);



  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      showNotification('Email is required', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    setLoadingVerify(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/enquiries/verify`, { email });
      // if (res.data.exists) {
      //   setExists(true);
      //   setMessage('Hey! Looks like you already have an account. Log in to continue!');
      //   showNotification('Hey! Looks like you already have an account. Log in to continue!', 'success');
      // } else {
      setMessage('OTP sent to your email.');
      showNotification('OTP sent to your email.', 'success');
      setStep(2);
      // }
    } catch (err) {
      setError(err.response?.data?.error || 'Error verifying email');
      showNotification(err.response?.data?.error || 'Error verifying email', 'error');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_BASE_URL}/enquiries/resend-otp`, { email });
      setMessage('OTP resent successfully!');
      showNotification('OTP resent successfully!', 'success');
    } catch (err) {
      setError('Error resending OTP');
      showNotification('Error resending OTP', 'error');
    }
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setLoadingOtp(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/enquiries/submit-otp`, { email, otp });

      if (res.data.verified) {

        login(res.data.token, res.data.user);
        setUserId(res.data.user.id);
        showNotification("OTP verified & logged in!", "success");
        setStep(3);
        // setMessage('OTP verified!');
        // showNotification('OTP verified!', 'success');
        // setUserId(res.data.userId);
        // setStep(3);
      }
    } catch (err) {
      setError('Invalid OTP');
      showNotification('Invalid OTP', 'error');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId && !productId) {
      setError('Please select a product');
      showNotification('Please select a product', 'error');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/enquiries/store`, {
        userId,
        name,
        quantity,
        company,
        phone,
        description,
        product_id: selectedProductId || productId,
        enq_company_id: companyId,
      });
      setMessage('Enquiry submitted successfully!');
      showNotification('Enquiry submitted successfully!', 'success');
      setExists(true);
    } catch (err) {
      setError('Error submitting enquiry');
      showNotification('Error submitting enquiry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId && !productId) {
      setError('Please select a product');
      showNotification('Please select a product', 'error');
      return;
    }
    setLoading(true);
    try {
      const user_id = user?.id;
      await axios.post(`${API_BASE_URL}/enquiries/user-submit-enquiry`, {
        userId: user_id,
        quantity,
        description,
        product_id: selectedProductId || productId,
        enq_company_id: companyId,
      });
      setMessage('Enquiry submitted successfully!');
      showNotification('Enquiry submitted successfully!', 'success');
      setExists(true);
      // setTimeout(onHide, 2000);
    } catch (err) {
      setError('Error submitting enquiry');
      showNotification('Error submitting enquiry', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setName('');
    setCompany('');
    setQuantity('');
    setPhone('');
    setDescription('');
    setUserId(null);
    setMessage('');
    setError('');
    setExists(false);
    setSelectedProductId(productId || '');
    if (onHide) onHide();
  };
  return (
    <div className={`modal fade ${show ? 'show' : ''}`} id="enquiryModal" tabIndex="-1" role="dialog" aria-labelledby="enquiryModalLabel" aria-hidden={!show} style={{ display: show ? 'block' : 'none', backgroundColor: show ? '#0606068c' : 'none' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
        {!user || (user.walkin_buyer === 1 && user.is_walkin_new  === 0) ? (
          <div className="modal-content">

            <div className="modal-body p-0">
              <div className='row'>
                <div className='col-md-5'>
                  <div className='p-3 bg-light h-100'>
                    <div className='mb-2'>
                      <img
                        src={
                          singleProduct?.file_name
                            ? `${ROOT_URL}/${singleProduct.file_name}`
                            : "/default.png"
                        }
                        alt="Product"
                        className='img-fluid img-thumbnail'
                        onError={(e) => {
                          e.target.onerror = null; // prevent infinite loop
                          e.target.src = "/default.png";
                        }}
                      />
                    </div>

                    <h6>{singleProduct?.title}</h6>
                    <p><i className="bx bx-building" aria-hidden="true"></i> {companyName || 'Company'}</p>
                  </div>
                </div>
                <div className='col-md-7 pe-4'>
                  <div className='text-end position-relative mt-3'>
                    <button type="button" className="close btn position-absolute end-0 p-0" onClick={handleClose} aria-label="Close">
                      <span aria-hidden="true"><i className="bx bx-x" /></span>
                    </button>
                  </div>
                  <p><i className="bx bx-building" aria-hidden="true"></i> {companyName || 'Company'}</p>
                  {exists ? (
                    <div className="text-center p-3 py-4">
                      <img src="/check.png" className='img-fluid' width="60" />
                      <h4 className="fw-bold my-3">Enquiry Sent Successfully!</h4>

                      <p className="text-muted mb-4">
                        Your enquiry for <strong>{singleProduct?.title}</strong> has been sent to
                        <strong> {companyName || 'Company'}</strong>.<br />
                        You’ll be contacted shortly with pricing details.
                      </p>

                      <div className="d-flex justify-content-center gap-3">
                        <button className="btn btn-primary px-4" onClick={() => window.location.reload()}>
                          View Similar Products
                        </button>
                        <button className="btn btn-outline-secondary px-4" onClick={handleClose} aria-label="Close">
                          Continue Browsing
                        </button>
                      </div>

                    </div>
                  ) : (
                    <>
                      <h5>Enquiry Form</h5>
                      <form className="pe-1 pt-2" onSubmit={step === 1 ? handleVerify : step === 2 ? handleSubmitOtp : handleSubmit}>
                        {step >= 1 && (
                          <>
                            <div className="form-group mb-3">
                              <label>
                                Quantity <sup className="text-danger">*</sup>
                              </label>

                              <div className="input-group">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Enter quantity"
                                  value={quantity}
                                  min="1"
                                  onChange={(e) => setQuantity(e.target.value)}
                                  required
                                />
                                <span className="input-group-text">Qty</span>
                              </div>
                            </div>

                            <div className="form-group mb-3">

                              {user?.walkin_buyer !== 1 && (
                                <>
                                  <label>
                                    Email <sup className="text-danger">*</sup>
                                  </label>

                                  <div className="d-flex gap-2">
                                    <input
                                      type="email"
                                      className="form-control"
                                      placeholder="Enter Email"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      readOnly={step > 1}
                                      required
                                    />
                                  </div>
                                </>
                              )}

                              <div className='mt-3'>
                                {step === 1 ? (
                                  <button
                                    type="submit"
                                    className="btn btn-success rounded-0 text-white"
                                    disabled={loadingVerify}
                                  >
                                    {loadingVerify ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      'Continue'
                                    )}
                                  </button>
                                ) : step !== 3 ? (
                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleResend}
                                    disabled={loadingVerify}
                                  >
                                    {loadingVerify ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="fadeIn animated bx bx-refresh" aria-hidden="true"></i>
                                    )}
                                  </button>
                                ) : null}
                              </div>
                            </div>

                          </>
                        )}

                        {step === 2 && (
                          <div className="form-group mb-3 pt-1">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))}
                              required
                            />
                            <div className='text-center'>
                              <button type="submit" className="btn btn-primary px-5 mt-4 text-white text-nowrap" disabled={loadingOtp}>
                                {loadingOtp ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Submit OTP'}
                              </button>
                            </div>
                          </div>
                        )}

                        {step === 3 && (
                          <>
                            {!productId && (
                              <div className="form-group mb-3">
                                <select
                                  className="form-select"
                                  value={selectedProductId}
                                  onChange={(e) => setSelectedProductId(e.target.value)}
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.length > 0 ? (
                                    products.map((product) => (
                                      <option key={product.id} value={product.id}>
                                        {product.title || 'Untitled Product'}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>
                                      No products available
                                    </option>
                                  )}
                                </select>
                              </div>
                            )}
                            <div className="form-group mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Name *"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Company *"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group mb-3">
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Phone *"
                                value={phone}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.length <= 10) {
                                    setPhone(value);
                                  }
                                }}
                                required
                              />
                            </div>
                            <div className="form-group mb-3">
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Description *"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                              />
                            </div>
                            {error && <div className="text-danger mb-3">{error}</div>}
                            {/* {message && <div className="text-success mb-3">{message}</div>} */}
                          </>
                        )}
                      </form>
                    </>
                  )}
                </div>
              </div>

            </div>
            {step === 3 && !exists && (
              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || (!productId && !selectedProductId)}
                >
                  {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Submit'}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleClose}>Close</button>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-content">
            <div className="modal-body">
              <div className='row'>
                <div className='col-md-5'>
                  <div className='p-3 bg-light h-100'>
                    <div className='mb-2'>
                      <img
                        src={
                          singleProduct?.file_name
                            ? `${ROOT_URL}/${singleProduct.file_name}`
                            : "/default.png"
                        }
                        alt="Product"
                        className='img-fluid img-thumbnail'
                        onError={(e) => {
                          e.target.onerror = null; // prevent infinite loop
                          e.target.src = "/default.png";
                        }}
                      />
                    </div>

                    <h6>{singleProduct?.title}</h6>
                    <p><i className="bx bx-building"></i> {companyName || 'Company'}</p>
                  </div>
                </div>
                <div className='col-md-7 pe-4'>
                  <div className='text-end position-relative mt-3'>
                    <button type="button" className="close btn position-absolute end-0 p-0" onClick={handleClose} aria-label="Close">
                      <span aria-hidden="true"><i className="bx bx-x" /></span>
                    </button>
                  </div>
                  {exists ? (
                    <div className="text-center p-3 py-4">
                      <img src="/check.png" className='img-fluid' width="60" />
                      <h4 className="fw-bold my-3">Enquiry Sent Successfully!</h4>

                      <p className="text-muted mb-4">
                        Your enquiry for <strong>{singleProduct?.title}</strong> has been sent to
                        <strong> {companyName || 'Company'}</strong>.<br />
                        You’ll be contacted shortly with pricing details.
                      </p>

                      <div className="d-flex justify-content-center gap-3">
                        <button className="btn btn-primary px-4" onClick={() => window.location.reload()}>
                          View Similar Products
                        </button>
                        <button className="btn btn-outline-secondary px-4" onClick={handleClose} aria-label="Close">
                          Continue Browsing
                        </button>
                      </div>

                    </div>) : (
                    <>
                      <h5>Enquiry Form</h5>
                      <form onSubmit={handleUserSubmit}>

                        {!productId && (
                          <div className="form-group mb-3">
                            <label>Products<sup className="text-danger">*</sup></label>
                            <select
                              className="form-select"
                              value={selectedProductId}
                              onChange={(e) => setSelectedProductId(e.target.value)}
                              required
                            >
                              <option value="">Select Product</option>
                              {products.length > 0 ? (
                                products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.title || 'Untitled Product'}
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>
                                  No products available
                                </option>
                              )}
                            </select>
                          </div>
                        )}
                        <div className="form-group mb-3 mt-4">
                          <label>
                            Quantity <sup className="text-danger">*</sup>
                          </label>

                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter quantity"
                              value={quantity}
                              min="1"
                              onChange={(e) => setQuantity(e.target.value)}
                              required
                            />
                            <span className="input-group-text">Qty</span>
                          </div>
                        </div>
                        <div className="form-group my-2">
                          <label>Message<sup className="text-danger">*</sup></label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Message"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            style={{ height: "100px" }}
                          />
                        </div>
                      </form>
                      <div className="modal-footer border-0 mt-3 p-0 pt-5">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          onClick={handleUserSubmit}
                          disabled={loading || (!productId && !selectedProductId)}
                        >
                          {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Submit'}
                        </button>
                        <button type="button" className="btn btn-danger" onClick={handleClose}>Close</button>
                      </div>
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default EnquiryForm;