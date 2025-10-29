import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../admin/common/Breadcrumb";
import DataTable from "../admin/common/DataTable";
import API_BASE_URL from "./../config";
import { useAlert } from "./../context/AlertContext";
import { formatDateTime } from './../utils/formatDate';
import LeadsModals from "../admin/pages/modal/LeadsModals";
import ExcelExport from "../admin/common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import UseAuth from '../sections/UseAuth';

const LeadDetail = () => {
  const { enquiry_number } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    enquiry_number: '', from_full_name: '', from_email: '', from_mobile: '',
    from_organization_name: '', to_full_name: '', to_email: '', to_mobile: '', to_organization_name: '',
    category_name: '', sub_category_name: '', description: '', enquiry_product: ''
  });

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/enquiries/${enquiry_number}`);
        const data = res.data;
        console.log(data);
        setFormData(data);
      } catch (error) {
        console.error('Error fetching Newsletter:', error);
      }
    };
    fetchNewsletter();
  }, [enquiry_number]);

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="View Enquiry" add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center mb-2">
                  <div className="avatar avatar-xxl avatar-rounded border border-warning bg-soft-warning me-3 flex-shrink-0">
                    {formData.from_full_name && (() => {
                      const parts = formData.from_full_name.trim().split(" ");
                      const initials = parts
                        .map(p => p.charAt(0).toUpperCase())
                        .slice(0, 2) // sirf first 2 letters (first name + last name)
                        .join("");
                      return (
                        <h6 className="mb-0 text-warning">
                          {initials}
                        </h6>
                      );
                    })()}
                  </div>
                  <div>
                    {formData.from_full_name && <h5 className="mb-0"><i className="bx bx-user"></i> {formData.from_full_name} </h5>}
                    {formData.from_email && <p className="mb-0"><i className="fadeIn animated bx bx-envelope me-1"></i>{formData.from_email}</p>}
                    {formData.from_mobile && <p className="mb-0"><i className="fadeIn animated bx bx-phone me-1"></i>{formData.from_mobile}</p>}
                    {formData.from_organization_name && <p className="mb-0"><i className="fadeIn animated bx bx-buildings"></i> {formData.from_organization_name}</p>}
                  </div>
                </div>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  {formData.enquiryUser?.enquiry_status === 1 ? (<span className="badge bg-success">Open</span>) :
                    formData.enquiryUser?.enquiry_status === 2 ? (<span className="badge bg-danger">Closed</span>) :
                      formData.enquiryUser?.enquiry_status === 3 ? (<span className="badge bg-danger">Closed</span>) :
                        (<span className="badge bg-soft-warning text-warning">Pending</span>)}

                  <div className="dropdown d-none">
                    <a href="#" className="btn btn-xs btn-success fs-12 py-1 px-2 fw-medium d-inline-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false"> <i className="ti ti-thumb-up me-1"></i>Closed<i className="ti ti-chevron-down ms-1"></i> </a>
                    <div className="dropdown-menu dropdown-menu-right">





                      <a className="dropdown-item" href=""><span>Closed</span></a>
                      <a className="dropdown-item" href=""><span>Lost</span></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="row">
            <div className="col-md-4">
              <div className="card mb-3">
                <div className="card-body">
                  <h6 className="mb-3 fw-semibold">Lead Information</h6>
                  <div className="border-bottom mb-3 pb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Date Created</p>
                      <p className="mb-0 text-dark">
                        {formData.created_at && (() => {
                          const date = new Date(formData.created_at);
                          const formatted = date.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          }).replace(',', '');
                          return <span>{formatted}</span>;
                        })()}
                      </p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Enquiry Number</p>
                      <p className="mb-0 text-dark">
                        <b> {formData.enquiry_number}</b>
                      </p>
                    </div>
                  </div>
                  <h6 className="mb-3 fw-semibold">Enquiry Detail</h6>
                  <div className="border-bottom mb-3 pb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Category</p>
                      <p className="mb-0 text-dark">
                        {formData.category_name}
                      </p>
                    </div>
                    {formData.sub_category_name &&
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Sub Category</p>
                        <p className="mb-0 text-dark">
                          {formData.sub_category_name}
                        </p>
                      </div>
                    }
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-dark">
                        {formData.description}
                      </p>
                    </div>

                  </div>
                  <h6 className="mb-3 fw-semibold">Product Detail</h6>
                  <div className="border-bottom mb-3 pb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <p className="mb-0 text-secondary">Product Name</p>
                      <p className="mb-0 text-dark">
                        {formData.product_details?.title}
                      </p>
                    </div>
                    {formData.product_details?.Categories &&
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Category</p>
                        <p className="mb-0 text-dark">
                          {formData.product_details?.Categories?.name}
                        </p>
                      </div>}

                    {formData.product_details?.SubCategories &&
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Sub Category</p>
                        <p className="mb-0 text-dark">
                          {formData.product_details?.SubCategories.name}
                        </p>
                      </div>
                    }
                    {formData.product_details?.company_info &&
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <p className="mb-0 text-secondary">Company Name</p>
                        <p className="mb-0 text-dark">
                          {formData.product_details?.company_info.organization_name}
                        </p>
                      </div>
                    }
                    {formData.product_details?.description &&
                      <div className="d-flex align-items-center justify-content-between mb-2 mt-3">

                        <p className="mb-0 text-dark">
                          {formData.product_details?.description}
                        </p>
                      </div>
                    }
                  </div>

                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card mb-3">
                <div className="card-body">
                  <ul className="nav nav-pills nav-justified mb-3" role="tablist">
                    <li className="nav-item" role="presentation">
                      <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-system" role="tab" aria-selected="true">
                        Awarded
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-password" role="tab" aria-selected="false">
                        Accept
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-meta" role="tab" aria-selected="false">
                        Shortlisted
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-email" role="tab" aria-selected="false">
                        Messages
                      </a>
                    </li>
                  </ul>
                  <div className="tab-content" id="pills-tabContent">
                    <div className="tab-pane fade show active" id="primary-pills-system" role="tabpanel">
                      <div className="text-center">
                        <i className="font-30 bx bxs-group" /><br />
                        <p>- No Enquiry Awarded -</p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="primary-pills-password" role="tabpanel">
                      <div className="text-center">
                        <i className="font-30 bx bxs-user-check" /><br />
                        <p>- No Enquiry Accepted -</p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="primary-pills-meta" role="tabpanel">
                      <div className="text-center">
                        <i className="font-30 bx bx-list-check" /><br />
                        <p>- No Enquiry Shortlisted -</p>
                      </div>
                    </div>
                    <div className="tab-pane fade" id="primary-pills-email" role="tabpanel">
                      <div className="text-center">
                        <i className="font-30 bx bxs-message-check" /><br />
                        <p>- No Enquiry Messages -</p>
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
  )
}

export default LeadDetail;