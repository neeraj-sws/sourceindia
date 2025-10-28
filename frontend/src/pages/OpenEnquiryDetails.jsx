import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "./../config";
import DataTable from "../admin/common/DataTable";
import { formatDateTime } from "./../utils/formatDate";
import UseAuth from '../sections/UseAuth';

const OpenEnquiryDetails = () => {
  const { OpenEnquiryId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", description: "", created_at: "", fname: "", lname: "", user_image: null
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/open_enquiries/${OpenEnquiryId}`);
        const open_enquiry = res.data;
        setFormData({
          title: open_enquiry.title || "",
          description: open_enquiry.description || "",
          created_at: open_enquiry.created_at || "",
          fname: open_enquiry.fname || "",
          lname: open_enquiry.lname || "",
        });
      } catch (error) {
        console.error("Error fetching Activity Details:", error);
      }
    };
    fetchUserDetails();
  }, [OpenEnquiryId]);

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="page-breadcrumb align-items-center mb-3 ">
            <div className="d-flex justify-content-between">
                <div className="float-left">
                    <b><h3>{formData.title}</h3></b>
                </div>                
            </div>
            <p>{formData.description}</p>
            <div className="d-flex">
                <p className="pe-5"><i className="bx bx-time" aria-hidden="true"></i> {formatDateTime(formData.created_at)}</p>            
            </div>
        </div>
        <div className="card bg-light">
        <div className="card-body p-0">
            <div className="form-body bg-light">
            <div className="row">
                <div className="col-12 ">
                <div className="h-100">
                    <div className="heading_chart border-bottom   bg-light">
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
    </>
  );
};

export default OpenEnquiryDetails;
