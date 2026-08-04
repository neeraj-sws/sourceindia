import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config';
import Breadcrumb from '../common/Breadcrumb';

const formatDate = (value) => value
  ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
  : '-';

const OpenEnquiryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [enquiryResponse, messagesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/open_enquiries/${id}`),
          axios.get(`${API_BASE_URL}/open_enquiries/messages`, { params: { enquiry_id: id } }),
        ]);
        setEnquiry(enquiryResponse.data);
        setMessages(messagesResponse.data || []);
      } catch (error) {
        console.error('Unable to load open enquiry:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Open Enquiries" title="View Open Enquiry" add_button="Back" onClick={() => navigate(-1)} />
        {loading ? <div className="card"><div className="card-body">Loading...</div></div> : !enquiry ? (
          <div className="card"><div className="card-body text-danger">Open enquiry not found.</div></div>
        ) : (
          <div className="row">
            <div className="col-md-4">
              <div className="card mb-3"><div className="card-body">
                <h6 className="mb-3 fw-semibold">Contact Information</h6>
                <div className="border-bottom mb-3 pb-3">
                  <p className="mb-2"><span className="text-secondary">Name</span><br />{[enquiry.fname, enquiry.lname].filter(Boolean).join(' ') || enquiry.name || '-'}</p>
                  <p className="mb-2"><span className="text-secondary">Email</span><br />{enquiry.email || '-'}</p>
                  <p className="mb-0"><span className="text-secondary">Mobile</span><br />{enquiry.mobile || enquiry.phone || '-'}</p>
                </div>
                <h6 className="mb-3 fw-semibold">Open Enquiry Information</h6>
                <p className="mb-2"><span className="text-secondary">Date Created</span><br />{formatDate(enquiry.created_at)}</p>
                <p className="mb-0"><span className="text-secondary">Status</span><br />{enquiry.status || 'Pending'}</p>
              </div></div>
            </div>
            <div className="col-md-8">
              <div className="card mb-3"><div className="card-body">
                <h6 className="mb-3 fw-semibold">Enquiry Detail</h6>
                <p className="text-secondary mb-1">Title</p>
                <h5 className="mb-3">{enquiry.title}</h5>
                <p className="text-secondary mb-1">Message</p>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{enquiry.description}</p>
              </div></div>
              <div className="card"><div className="card-body">
                <ul className="nav nav-pills mb-3"><li className="nav-item"><span className="nav-link active">Messages</span></li></ul>
                <div className="MainChat">
                  <div className="chat-content ps ps--active-y start-0 m-0 pt-2 mb-2" style={{ minHeight: '260px', maxHeight: '520px', overflowY: 'auto' }}>
                    {messages.length ? messages.map((message) => {
                      const isEnquiryUser = String(message.user_id) === String(enquiry.user_id);
                      const sender = [message.fname, message.lname].filter(Boolean).join(' ') || (isEnquiryUser ? 'User' : 'Admin');
                      return isEnquiryUser ? (
                        <div className="chat-content-leftside mb-3" key={message.id}>
                          <div className="d-flex"><div className="flex-grow-1 ms-2">
                            <p className="mb-0 chat-time">{sender}, {formatDate(message.created_at)}</p>
                            <p className="chat-left-msg">{message.message}</p>
                          </div></div>
                        </div>
                      ) : (
                        <div className="chat-content-rightside mb-3" key={message.id}>
                          <div className="d-flex ms-auto"><div className="flex-grow-1 me-2">
                            <p className="mb-0 chat-time text-end">{sender}, {formatDate(message.created_at)}</p>
                            <p className="chat-right-msg">{message.message}</p>
                          </div></div>
                        </div>
                      );
                    }) : <p className="text-center text-secondary pt-5">No messages yet.</p>}
                  </div>
                </div>
              </div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenEnquiryView;
