
import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ViewEnquiry = ({ role = 'user' }) => {
    const params = useParams();
    const enquiryId = params.enquiry_number || params.id || params.OpenEnquiryId;
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        created_at: '',
        fname: '',
        lname: '',
        userid: '',
        user_image: null,
        status: 0,
    });
    const [enquiries, setEnquiries] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const chatContentRef = useRef(null);
    const [activeEnquiry, setActiveEnquiry] = useState(null);
    const [enquiryMessages, setEnquiryMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch enquiry details
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                let url = '';
                if (role === 'admin') {
                    url = `/v2/api/admin/open-enquiries/${enquiryId}`;
                } else {
                    url = `/v2/api/enquiries/${enquiryId}`;
                }
                const res = await axios.get(url);
                setFormData(res.data.data || res.data); // support both {data: ...} and direct
            } catch (err) {
                setError('Failed to fetch enquiry details');
            } finally {
                setLoading(false);
            }
        };
        if (enquiryId) fetchDetails();
    }, [enquiryId, role]);

    // Fetch chat/conversations (optional: only if you want chat like user)
    const fetchEnquiries = useCallback(async () => {
        setChatLoading(true);
        try {
            let url = '';
            if (role === 'admin') {
                url = `/v2/api/admin/open-enquiries/messages?enquiry_id=${enquiryId}`;
            } else {
                url = `/v2/api/open_enquiries/messages?enquiry_id=${enquiryId}`;
            }
            const res = await axios.get(url);
            setEnquiries(res.data.data || res.data || []);
        } catch (error) {
            setEnquiries([]);
        } finally {
            setChatLoading(false);
        }
    }, [enquiryId, role]);

    useEffect(() => {
        if (enquiryId) fetchEnquiries();
    }, [fetchEnquiries, enquiryId]);

    // Fetch messages for selected conversation (optional, for chat)
    const getuserChat = async (userId, enquiryId) => {
        setActiveEnquiry(userId);
        setChatLoading(true);
        try {
            let url = '';
            if (role === 'admin') {
                url = `/v2/api/admin/open-enquiries/messages?enquiry_id=${enquiryId}&user_id=${userId}`;
            } else {
                url = `/v2/api/open_enquiries/messages?enquiry_id=${enquiryId}&user_id=${userId}`;
            }
            const res = await axios.get(url);
            setEnquiryMessages(res.data.data || res.data || []);
        } catch (error) {
            setEnquiryMessages([]);
        } finally {
            setChatLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <div className="card">
                    <div className="card-body">
                        <h3>{formData.title}</h3>
                        <p>{formData.description}</p>
                        <div className="d-flex">
                            <p className="pe-5">
                                <i className="bx bx-time" aria-hidden="true"></i>{' '}
                                {formData.created_at}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Chat/Conversation UI (optional, if you want like user) */}
                {enquiries.length > 0 && (
                    <div className="row mt-4">
                        <div className="col-md-4 pe-lg-0">
                            <div className="card border rounded-0 h-100 myopenchat">
                                <div className="card-header py-3">
                                    <h5 className="mb-0 fw-bold">Conversations</h5>
                                </div>
                                <div className="card-body">
                                    <div className="allMessages chat-content m-0 p-0">
                                        {enquiries.map((enquiry, index) => (
                                            <a
                                                href="#"
                                                key={enquiry.id}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    getuserChat(enquiry.user_id, enquiry.enquiry_id);
                                                }}
                                                className={`message text-dark border-bottom p-3 d-flex gap-3 py-3 mb-2 ${activeEnquiry === enquiry.user_id ? 'active' : ''}`}
                                            >
                                                <div className="menquiry">
                                                    <p className="mb-0">
                                                        <b>{[enquiry.fname, enquiry.lname].filter(Boolean).join(' ')}</b>
                                                    </p>
                                                    <span className="text-dark">
                                                        {enquiry.message?.split(' ').slice(0, 5).join(' ')}
                                                    </span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="ps-lg-0 col-md-8">
                            <div className="card mb-3 border-0">
                                <div className="card-body">
                                    <div className="MainChat">
                                        <div className="chat-content ps ps--active-y start-0 m-0 mb-4" ref={chatContentRef}>
                                            {chatLoading ? (
                                                <div className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2 mb-0">Loading conversation...</p>
                                                </div>
                                            ) : enquiryMessages.length > 0 ? (
                                                enquiryMessages.map((msg, index) => (
                                                    <div key={index}>
                                                        <div className={msg.is_admin ? "chat-content-rightside" : "chat-content-leftside"}>
                                                            <div className="d-flex">
                                                                <div className="flex-grow-1 ms-2">
                                                                    <p className="mb-0 chat-time">
                                                                        {msg.fname} {msg.lname}, {msg.updated_at}
                                                                    </p>
                                                                    <p className={msg.is_admin ? "chat-right-msg" : "chat-left-msg"}>{msg.message}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-muted mt-4">No messages found</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewEnquiry;
