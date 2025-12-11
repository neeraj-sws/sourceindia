import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { useAlert } from '../context/AlertContext';
import UseAuth from '../sections/UseAuth';

const ConnectForm = ({ show, onHide, companyId, companyName, receiverName }) => {
  const { showNotification } = useAlert();
  const { user } = UseAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      showNotification('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/enquiries/send-message`, {
        logged_in_user_id: user.id,
        company_id: companyId,
        title,
        message,
        receiver_name: receiverName,
      });
      showNotification('Message sent!', 'success');
      setTimeout(onHide, 1000);
    } catch (err) {
      showNotification('Error sending message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    onHide();
  };

  if (!show) return null;

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} id="enquiryModal" tabIndex="-1" role="dialog" aria-labelledby="enquiryModalLabel" aria-hidden={!show} style={{ display: show ? 'block' : 'none', backgroundColor: show ? '#0606068c' : 'none' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Connect with {companyName || 'Company'}</h5>
            <button type="button" className="close btn" onClick={handleClose}>
              <span aria-hidden="true"><i className="bx bx-x" /></span>
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group mb-3">
              <label>Title <sup className="text-danger">*</sup></label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Message <sup className="text-danger">*</sup></label>
              <textarea
                className="form-control"
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                'Send'
              )}
            </button>
            <button type="button" className="btn btn-danger" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectForm;
