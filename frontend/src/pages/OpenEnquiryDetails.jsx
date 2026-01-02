import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
import API_BASE_URL, { ROOT_URL } from "./../config";
import { formatDateTime } from "./../utils/formatDate";
import UseAuth from "../sections/UseAuth";

const OpenEnquiryDetails = () => {
  const { OpenEnquiryId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = UseAuth();
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

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/open_enquiries/${OpenEnquiryId}`);
        const open_enquiry = res.data;
        console.log(open_enquiry);
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
      } catch (error) {
        console.error("Error fetching Activity Details:", error);
      }
    };
    fetchUserDetails();
  }, [OpenEnquiryId]);

  const closeEnquiry = async () => {
    try {
      await axios.post(`${API_BASE_URL}/open_enquiries/close/${OpenEnquiryId}`);
      setFormData((prev) => ({ ...prev, status: 1 }));
      alert("Enquiry closed successfully!");
    } catch (error) {
      console.error("Error closing enquiry:", error);
    }
  };

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

                {/* ✅ Conditional Buttons like PHP */}
                {!loading && user && user.id === formData.userid && (
                  <>
                    {formData.status === 0 ? (
                      <div>
                        <button
                          className="btn btn-danger radius-30 px-4 py-1 mt-1 btn-sm text-white small"
                          onClick={closeEnquiry}
                        >
                          Close Enquiry
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button
                          className="btn btn-danger radius-30 px-4 py-1 mt-1 btn-sm text-white small"
                          disabled
                        >
                          This Enquiry Closed
                        </button>
                      </div>
                    )}
                  </>
                )}

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

          {/* User details card */}
          <div className="card mt-5">
            <div className="card-body">
              <div className="form-body">
                <div className="row">
                  <div className="col-12 ">
                    <div className="h-100">
                      <div className="heading_chart border-bottom bg-light">
                        <div className="main_enquiry p-3">
                          <div className="enquiry_img position-relative">
                            <ImageWithFallback
                              src={`${ROOT_URL}/${formData.user_image}`}
                              width={40}
                              height={40}
                              showFallback={true}
                            />
                            <span className="sign_logo">A D</span>
                          </div>
                          {formData.fname} {formData.lname}
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
  );
};

export default OpenEnquiryDetails;
