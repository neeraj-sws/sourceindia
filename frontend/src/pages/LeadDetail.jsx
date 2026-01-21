import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Suspense, lazy } from 'react';
import Breadcrumb from "../admin/common/Breadcrumb";
import API_BASE_URL, { ROOT_URL } from "./../config";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import UseAuth from '../sections/UseAuth';
const MyEnquiry = lazy(() => import('../pages/EnquiryParts/MyEnquiry'));
const MyLead = lazy(() => import('../pages/EnquiryParts/MyLead'));

const LeadDetail = () => {
  const { enquiry_number } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const myEnquiry = queryParams.get("my-enquiry");
  const [counterCount, setcounterCount] = useState(null);
  const { user, loading } = UseAuth();
  const [awardedList, setAwardedList] = useState([]);
  const [acceptList, setAcceptList] = useState([]);
  const [shortList, setShortList] = useState([]);
  const [enquiryMessages, setEnquiryMessages] = useState([]);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    enquiry_number: '', from_full_name: '', from_email: '', from_mobile: '',
    from_organization_name: '', to_full_name: '', to_email: '', to_mobile: '', to_organization_name: '',
    category_name: '', sub_category_name: '', description: '', enquiry_product: ''
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/enquiries/${enquiry_number}?myEnquiry=${myEnquiry}`);
        const data = res.data;
        setFormData(data);
      } catch (error) {
        console.error('Error fetching Leads:', error);
      }
    };
    fetchLeads();
  }, [enquiry_number]);

  let status = "Pending";
  let color = "warning";

  if (formData?.status === 3) {
    status = "Closed";
    color = "danger";
  } else if (formData?.enquiry_status === 1) {
    status = "Open";
    color = "success";
  } else if (formData?.enquiry_status === 2) {
    status = "Closed";
    color = "danger";
  }
  const loggedCompanyId = user?.id;
  const chatContentRef = useRef(null);

  useEffect(() => {
    if (!user?.company_id || !formData?.id) return;
    // auth se

    // 🟢 Lead count
    axios
      .get(`${API_BASE_URL}/enquiries/lead-count?companyId=${user.company_id}&enquiryId=${formData.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {

        const counts = res.data || { total: 0, open: 0, closed: 0 };

        setcounterCount(counts);
      })
      .catch((err) => {
        console.error("Error fetching lead count:", err);
        setcounterCount({ total: 0, open: 0, closed: 0 });
      });

    // 🟣 Awarded companies
    axios
      .get(`${API_BASE_URL}/enquiries/awarded?enq_id=${formData.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const data = res.data?.data || [];

        setAwardedList(data);
      })
      .catch((err) => {
        console.error("Error fetching awarded companies:", err);
        setAwardedList([]); // fallback
      });
    // 🟣 accept companies
    axios
      .get(`${API_BASE_URL}/enquiries/accept?enq_id=${formData.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const data = res.data?.data || [];

        setAcceptList(data);
      })
      .catch((err) => {
        console.error("Error fetching awarded companies:", err);
        setAcceptList([]); // fallback
      });
    // 🟣 shortlist companies
    axios
      .get(`${API_BASE_URL}/enquiries/shortlisted?enq_id=${formData.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const data = res.data?.data || [];

        setShortList(data);
      })
      .catch((err) => {
        console.error("Error fetching awarded companies:", err);
        setShortList([]); // fallback
      });


  }, [user?.company_id, formData?.id]);

  useEffect(() => {
    if (formData?.id) {
      fetchEnquiryMessages();
    }
  }, [formData?.id, user?.company_id]);

  const fetchEnquiryMessages = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/enquiries/messages?enq_id=${formData.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setEnquiryMessages(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setEnquiryMessages([]);
    }
  };



  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop =
        chatContentRef.current.scrollHeight;
    }
  };


  const handleSendMessage = async () => {
    if (!message.trim() || !formData?.id) return;

    try {
      const payload = {
        enquiry_id: formData.id,
        message: message,
        user: user
      };

      const res = await axios.post(
        `${API_BASE_URL}/enquiries/send-message`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      fetchEnquiryMessages();
      setTimeout(scrollToBottom, 100);

      setMessage("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };




  return (
    <>
      <Suspense fallback={<div></div>}>
        <div className="page-wrapper">
          <div className="page-content">
            <Breadcrumb page="Settings" title="View Enquiry" add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
            {user?.is_seller == 1 &&
              (myEnquiry ? <MyEnquiry formData={formData} /> : <MyLead formData={formData} />)
            }
            <div className="card mb-3">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <div className="d-flex align-items-center mb-2">
                    <div className="avatar avatar-xxl avatar-rounded border border-warning bg-soft-warning me-3 flex-shrink-0">
                      {(() => {
                        const name = myEnquiry ? formData.to_full_name : formData.from_full_name;
                        if (!name) return null;
                        const parts = name.trim().split(" ");
                        const initials = parts
                          .map(p => p.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("");
                        return (
                          <h6 className="mb-0 text-warning">
                            {initials}
                          </h6>
                        );
                      })()}
                    </div>
                    <div>
                      {myEnquiry ? (
                        <>
                          {formData.to_full_name && <h5 className="mb-0"><i className="bx bx-user"></i> {formData.to_full_name} </h5>}
                          {formData.to_email && <p className="mb-0"><i className="fadeIn animated bx bx-envelope me-1"></i>{formData.to_email}</p>}
                          {formData.to_mobile && <p className="mb-0"><i className="fadeIn animated bx bx-phone me-1"></i>{formData.to_mobile}</p>}
                          {formData.to_organization_name && <p className="mb-0"><i className="fadeIn animated bx bx-buildings"></i> {formData.to_organization_name}</p>}
                        </>
                      ) : (
                        <>
                          {formData.from_full_name && <h5 className="mb-0"><i className="bx bx-user"></i> {formData.from_full_name} </h5>}
                          {formData.from_email && <p className="mb-0"><i className="fadeIn animated bx bx-envelope me-1"></i>{formData.from_email}</p>}
                          {formData.from_mobile && <p className="mb-0"><i className="fadeIn animated bx bx-phone me-1"></i>{formData.from_mobile}</p>}
                          {formData.from_organization_name && <p className="mb-0"><i className="fadeIn animated bx bx-buildings"></i> {formData.from_organization_name}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="mb-3 fw-semibold">Company Detail</h6>
                    <div className="border-bottom mb-3 pb-3">
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Company Name</p>
                        <p className="mb-0 text-dark">
                          <a href={`/companies/${myEnquiry ? formData.to_organization_slug : formData.from_organization_slug}`} target="_blank" className="">
                            {myEnquiry ? formData.to_organization_name : formData.from_organization_name}
                          </a>
                        </p>
                      </div>
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Core Activity</p>
                        <p className="mb-0 text-dark">
                          {myEnquiry ? formData.to_core_activity_name : formData.from_core_activity_name}
                        </p>
                      </div>
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Activity</p>
                        <p className="mb-0 text-dark">
                          {myEnquiry ? formData.to_activity_name : formData.from_activity_name}
                        </p>
                      </div>
                    </div>
                    <h6 className="mb-3 fw-semibold">Product Detail</h6>
                    <div className="border-bottom mb-3 pb-3">
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Product Name</p>
                        <p className="mb-0 text-dark">
                          <a href={`/products/${formData.product_details?.slug}`} target="_blank" className="">
                            {formData.product_details?.title}
                          </a>
                        </p>
                      </div>
                      {formData.product_details?.Categories &&
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                          <p className="mb-0 text-secondary">Category</p>
                          <p className="mb-0 text-dark">
                            {formData.product_details?.Categories?.name}
                          </p>
                        </div>
                      }
                      {formData.product_details?.SubCategories &&
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                          <p className="mb-0 text-secondary">Sub Category</p>
                          <p className="mb-0 text-dark">
                            {formData.product_details?.SubCategories.name}
                          </p>
                        </div>
                      }
                      {formData.product_details?.company_info &&
                        <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                          <p className="mb-0 text-secondary">Company Name</p>
                          <p className="mb-0 text-dark">
                            {formData.product_details?.company_info.organization_name}
                          </p>
                        </div>
                      }
                      {formData.product_details?.description &&
                        <div className="d-flex align-items-center justify-content-between mb-2 mt-3">
                          <p className="mb-0 text-dark" dangerouslySetInnerHTML={{ __html: formData.product_details?.description }} />
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-8">
                <div className="card mb-3">
                  <div className="card-body">
                    <ul className="nav nav-pills mb-3 border-bottom pb-2" role="tablist">
                      <li className="nav-item" role="presentation">
                        <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-email" role="tab" aria-selected="false">
                          Messages
                        </a>
                      </li>
                    </ul>
                    <div className="tab-content" id="pills-tabContent">
                      <div className="tab-pane fade show active" id="primary-pills-email" role="tabpanel">
                        {/* <div className="text-center">
                          <i className="font-30 bx bxs-message-check" /><br />
                          <p>- No Enquiry Messages -</p>
                        </div> */}
                        <div className="MainChat">
                          <div className="chat-content ps ps--active-y start-0 m-0 pt-2 mb-4" ref={chatContentRef}>
                            {enquiryMessages.length > 0 &&
                              enquiryMessages.map((msg, index) => {
                                const time = new Date(msg.updated_at).toLocaleTimeString("en-IN", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true
                                });

                                return (
                                  <div key={index}>
                                    {/* LEFT SIDE (Buyer/User) */}
                                    {msg.user_id !== loggedCompanyId && (
                                      <div className="chat-content-leftside">
                                        <div className="d-flex">
                                          <img
                                            src={
                                              msg.user_file
                                                ? `${ROOT_URL}/${msg.user_file}`
                                                : "/user-demo.png"
                                            }


                                            width="40"
                                            height="40"
                                            className="rounded-circle border"
                                            style={{ objectFit: "cover" }}
                                            alt=""
                                            onError={(e) => {
                                              e.target.onerror = null; // prevent infinite loop
                                              e.target.src = "/user-demo.png";
                                            }}
                                          />
                                          <div className="flex-grow-1 ms-2">
                                            <p className="mb-0 chat-time">
                                              {msg.user_fname} {msg.user_lname}, {time}
                                            </p>
                                            <p className="chat-left-msg">{msg.message}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* RIGHT SIDE (Seller) */}
                                    {msg.user_id == loggedCompanyId && (
                                      <div className="chat-content-rightside">
                                        <div className="d-flex ms-auto">
                                          <div className="flex-grow-1 me-2">
                                            <p className="mb-0 chat-time text-end">
                                              You, {time}
                                            </p>
                                            <p className="chat-right-msg">{msg.message}</p>
                                          </div>
                                          <img
                                            src={
                                              msg.seller_file
                                                ? `${ROOT_URL}/${msg.seller_file}`
                                                : "/user-demo.png"
                                            }
                                            width="40"
                                            height="40"
                                            className="rounded-circle border"
                                            style={{ objectFit: "cover" }}
                                            alt=""
                                            onError={(e) => {
                                              e.target.onerror = null; // prevent infinite loop
                                              e.target.src = "/user-demo.png";
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <div className="chat-footer d-flex align-items-center start-0">
                            <div className="flex-grow-1 pe-2">
                              <div className="input-group">	<span className="input-group-text"><i className="bx bx-envelope"></i></span>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type a message"
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />

                                <button
                                  className="btn btn-primary"
                                  onClick={handleSendMessage}
                                  disabled={!message.trim()}
                                >
                                  Send
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  )
}

export default LeadDetail;