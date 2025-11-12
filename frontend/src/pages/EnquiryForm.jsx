import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config'; // Ensure this is defined
import { useAlert } from "../context/AlertContext";
import axios from 'axios';
import UseAuth from '../sections/UseAuth';

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
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const { user } = UseAuth();

  useEffect(() => {
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
  }, [productId, companyId]);



  const handleVerify = async (e) => {
    e.preventDefault();
    setLoadingVerify(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/enquiries/verify`, { email });
      if (res.data.exists) {
        setExists(true);
        setMessage('Hey! Looks like you already have an account. Log in to continue!');
        showNotification('Hey! Looks like you already have an account. Log in to continue!', 'success');
      } else {
        setMessage('OTP sent to your email.');
        showNotification('OTP sent to your email.', 'success');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error verifying email');
      showNotification(err.response?.data?.error || 'Error verifying email', 'error');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post(`${API_BASE_URL}/resend-otp`, { email });
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
        setMessage('OTP verified!');
        showNotification('OTP verified!', 'success');
        setUserId(res.data.userId);
        setStep(3);
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
        company,
        phone,
        description,
        product_id: selectedProductId || productId,
        enq_company_id: companyId,
      });
      setMessage('Enquiry submitted successfully!');
      showNotification('Enquiry submitted successfully!', 'success');
      setTimeout(onHide, 2000);
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
        user_id,
        quantity,
        description,
        product_id: selectedProductId || productId,
        enq_company_id: companyId,
      });
      setMessage('Enquiry submitted successfully!');
      showNotification('Enquiry submitted successfully!', 'success');
      setTimeout(onHide, 2000);
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
      <div className="modal-dialog modal-dialog-centered" role="document">
        {!user ? (
          <div className="modal-content">
            <div className="modal-header justify-content-between align-items-start">
              <div>
                <h5 className="modal-title" id="enquiryModalLabel">Enquiry For - {companyName || 'Company'}</h5>
                <p className="text-secondary">{productTitle}</p>
              </div>
              <button type="button" className="close btn" onClick={handleClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              {exists ? (
                <div className="text-center p-3">
                  <h5>Hey! Looks like you already have an account with us. Log in to continue!</h5>
                  <a href="/login" className="btn btn-primary mt-3">Click here!</a>
                </div>
              ) : (
                <form onSubmit={step === 1 ? handleVerify : step === 2 ? handleSubmitOtp : handleSubmit}>
                  {step >= 1 && (
                    <div className="form-group mb-3 d-flex gap-2">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        readOnly={step > 1}
                        required
                      />

                      {step === 1 ? (
                        <button type="submit" className="btn btn-info" disabled={loadingVerify}>
                          {loadingVerify ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Verify'}
                        </button>
                      ) : (
                        <button type="button" className="btn btn-danger" onClick={handleResend} disabled={loadingVerify}>
                          {loadingVerify ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Resend'}
                        </button>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="form-group mb-3 d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-info" disabled={loadingOtp}>
                        {loadingOtp ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Submit OTP'}
                      </button>
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
                          type="text"
                          className="form-control"
                          placeholder="Phone *"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group mb-3">
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Description *"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        />
                      </div>
                      {error && <div className="text-danger mb-3">{error}</div>}
                      {message && <div className="text-success mb-3">{message}</div>}
                    </>
                  )}
                </form>
              )}
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
            <div className="modal-header justify-content-between align-items-start">
              <div>
                <h5 className="modal-title" id="enquiryModalLabel">Enquiry For - {companyName || 'Company'}</h5>
                <p className="text-secondary">{productTitle}</p>
              </div>
              <button type="button" className="close btn" onClick={handleClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUserSubmit}>
                <div className='form-group mb-3'>
                  <label>Quantity</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Quantity *"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label>Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Message *"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </form>
              <div className="modal-footer">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiryForm;