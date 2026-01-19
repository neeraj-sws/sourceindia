
import React, { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
const ImageWithFallback = lazy(() => import('../../admin/common/ImageWithFallback'));
import API_BASE_URL, { ROOT_URL } from "../../config";
import { formatDateTime } from "../../utils/formatDate";


const ViewEnquiry = () => {
  const { id } = useParams();
  const enquiryId = id;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    created_at: "",
    fname: "",
    lname: "",
    userid: "",
    user_image: null,
    status: 0,
  });
  const [enquiries, setEnquiries] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatContentRef = useRef(null);
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [enquiryIdState, setEnquiryIdState] = useState(null);
  const [enquiryMessages, setEnquiryMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");


  // Admin: fetch enquiry details and messages by open enquiry id only
  useEffect(() => {
    const fetchDetailsAndMessages = async () => {
      setChatLoading(true);
      try {
        // Fetch enquiry details
        const res = await axios.get(`${API_BASE_URL}/open_enquiries/${enquiryId}`);
        const open_enquiry = res.data;
        setFormData({
          title: open_enquiry.title || "",
          description: open_enquiry.description || "",
          created_at: open_enquiry.created_at || "",
          fname: open_enquiry.fname || "",
          lname: open_enquiry.lname || "",
          userid: open_enquiry.user_id || "",
          user_image: open_enquiry.user_image || null,
          status: open_enquiry.status || 0,
        });
        // Fetch all messages for this enquiry
        const msgRes = await axios.get(`${API_BASE_URL}/open_enquiries/messages`, {
          params: {
            enquiryId: id
          }
        });
        setEnquiryMessages(msgRes.data || []);
      } catch (error) {
        setEnquiryMessages([]);
        console.error("Error fetching enquiry details/messages:", error);
      } finally {
        setChatLoading(false);
      }
    };
    fetchDetailsAndMessages();
  }, [enquiryId]);

  useEffect(() => {
    if (enquiries && enquiries.length > 0) {
      const first = enquiries[0];

      getuserChat(
        first.reply_user_id,
        first.enquiry_id,
        first.user_id
      );
    }
  }, [enquiries]);
  const getuserChat = async (replyUserId, enquiryId, userId) => {

    setActiveEnquiry(userId);
    setEnquiryIdState(enquiryId);
    const res = await axios.get(`${API_BASE_URL}/open_enquiries/messages`, {
      params: {
        replyUserId,
        enquiryId,
        userId
      }
    });

    setEnquiryMessages(res.data || []);
  }
  const scrollToBottom = () => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop =
        chatContentRef.current.scrollHeight;
    }
  };
  const loggedCompanyId = formData?.userid;

  const fetchEnquiries = useCallback(async () => {
    const delay = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const params = new URLSearchParams({
        is_home: "1",
        is_delete: "0",
      });
      const url = `${API_BASE_URL}/open_enquiries/user-openenquiry?enquiry_id=${enquiryId}`;
      const responsePromise = axios.get(url);
      const [response] = await Promise.all([responsePromise, delay]);
      setEnquiries(response.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  }, []);
  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);
  return (
    <Suspense fallback={<div></div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="page-breadcrumb align-items-center mb-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div className="float-left">
                    <b><h3>{formData.title}</h3></b>
                  </div>
                </div>
                <p>{formData.description}</p>
                <div className="d-flex">
                  <p className="pe-5">
                    <i className="bx bx-time" aria-hidden="true"></i>{" "}
                    {formatDateTime(formData.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {enquiries.length > 0 && (
            <div className="row mt-4">
              <div className={`col-md-4 pe-lg-0`}>
                <div className="card border rounded-0 h-100 myopenchat">
                  <div className="card-header py-3">
                    <h5 className="mb-0 fw-bold">Conversations</h5>
                  </div>
                  <div className="card-body">
                    <div className="allMessages chat-content m-0 p-0">
                      {enquiries && enquiries.length > 0 && enquiries.map((enquiry, index) => {
                        // color logic (same as PHP)
                        let color = "#fbaa54";
                        if (index % 2 === 0) color = "#dd1919";
                        else if (index % 3 === 0) color = "#9817f9";
                        else if (index % 4 === 0) color = "#4e9f57";
                        else if (index % 5 === 0) color = "#8bc34a";

                        const firstInitial = enquiry.fname
                          ? enquiry.fname.charAt(0).toUpperCase()
                          : "";
                        const lastInitial = enquiry.lname
                          ? enquiry.lname.charAt(0).toUpperCase()
                          : "";

                        return (
                          <a
                            href="#"
                            key={enquiry.id}
                            onClick={(e) => {
                              e.preventDefault();
                              getuserChat(enquiry.user_id, enquiry.enquiry_id, enquiry.user_id);
                            }}
                            className={`message text-dark border-bottom p-3 d-flex gap-3 py-3 mb-2 ${activeEnquiry === enquiry.user_id ? 'active' : ''}`}

                          >
                            {/* hidden input not required in React */}

                            <div className="enquiry_img position-relative">
                              <img
                                src={
                                  enquiry?.file
                                    ? `${ROOT_URL}/${enquiry?.file}`
                                    : "/user-demo.png"
                                }
                                alt=""
                                className="img-fluid rounded"
                                width="40"
                                onError={(e) => {
                                  e.target.onerror = null; // prevent infinite loop
                                  e.target.src = "/user-demo.png";
                                }}
                              />


                              <span
                                className="sign_logo"
                                style={{ backgroundColor: color }}
                              >
                                {firstInitial}
                                {lastInitial}

                              </span>
                            </div>

                            <div className="menquiry">
                              <p className="mb-0">
                                <b>
                                  {[enquiry.fname, enquiry.lname]
                                    .filter(Boolean)
                                    .join(" ")}
                                </b>
                              </p>

                              <span className="text-dark">
                                {enquiry.message?.split(" ").slice(0, 5).join(" ")}
                              </span>

                              <small className="d-block text-muted">
                                {enquiry.Entitle}

                              </small>
                            </div>
                          </a>
                        );
                      })}

                    </div>
                  </div>
                </div>
              </div>
              <div className={`ps-lg-0 col-md-8`}>
                {/* User details card */}
                <div className="card mb-3 border-0">
                  <div className="card-body">
                    <div className="MainChat">
                      <div className="chat-header start-0 p-0">
                        <div className="heading_chart border-bottom bg-light">
                          <div className="main_enquiry p-3 d-flex align-items-center gap-2">
                            <div className="enquiry_img position-relative">
                              <ImageWithFallback
                                src={`${ROOT_URL}/${formData.user_image}`}
                                width={40}
                                height={40}
                                showFallback={true}
                              />
                            </div>
                            {formData.fname} {formData.lname}
                          </div>
                        </div>
                      </div>
                      <div className="chat-content ps ps--active-y start-0 m-0 mb-4" ref={chatContentRef}>

                        {chatLoading ? (
                          <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading conversation...</p>
                          </div>
                        ) : enquiryMessages.length > 0 ? (

                          enquiryMessages.map((msg, index) => {
                            const time = new Date(msg.updated_at).toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true
                            });

                            return (
                              <div key={index}>
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
                                          {msg.fname} {msg.lname}, {time}
                                        </p>
                                        <p className="chat-left-msg">{msg.message}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {msg.user_id == loggedCompanyId && (
                                  <div className="chat-content-rightside">
                                    <div className="d-flex ms-auto">
                                      <div className="flex-grow-1 ms-2">
                                        <p className="mb-0 chat-time text-end">
                                          You, {time}
                                        </p>
                                        <p className="chat-right-msg">{msg.message}</p>
                                      </div>
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

                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })

                        ) : (
                          <p className="text-center text-muted mt-4">
                            No messages found
                          </p>
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
    </Suspense>
  );
};

export default ViewEnquiry;