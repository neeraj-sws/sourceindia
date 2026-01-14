import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
import API_BASE_URL, { ROOT_URL } from "./../config";
import { formatDateTime } from "./../utils/formatDate";
import UseAuth from "../sections/UseAuth";

const Inbox = () => {
  const { OpenEnquiryId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = UseAuth();
  const [enquiries, setEnquiries] = useState([]);
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



  const fetchEnquiries = useCallback(async () => {
    const delay = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const params = new URLSearchParams({
        is_home: "1",
        is_delete: "0",
      });
      const url = `${API_BASE_URL}/open_enquiries/user-openenquiry`;
      const responsePromise = axios.get(url);
      const [response] = await Promise.all([responsePromise, delay]);
      setEnquiries(response.data);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);


  return (
    <Suspense fallback={<div></div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h4>INBOX</h4>
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
                          getuserChat(enquiry.reply_user_id, enquiry.enquiry_id);
                        }}
                        className="message text-dark border-bottom p-3 d-flex gap-3 py-3"
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
            <div className="col-md-8"></div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default Inbox;
