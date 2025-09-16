import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from "axios";
import API_BASE_URL from "../../config";
import Breadcrumb from '../common/Breadcrumb';

const ViewEnquiry = () => {
    const { enquiry_number } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ enquiry_number: '', from_full_name: '', from_email: '', from_mobile: '',
        from_organization_name: '', to_full_name: '', to_email: '', to_mobile: '', to_organization_name: '',
        category_name: '', sub_category_name: '', description: '', enquiry_product: ''
     });

    useEffect(() => {
      const fetchNewsletter = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/enquiries/${enquiry_number}`);
          const data = res.data;
          setFormData({
            enquiry_number: data.enquiry_number || '',
            from_full_name: data.from_full_name || '',
            from_email: data.from_email || '',
            from_mobile: data.from_mobile || '',
            from_organization_name: data.from_organization_name || '',
            to_full_name: data.to_full_name || '',
            to_email: data.to_email || '',
            to_mobile: data.to_mobile || '',
            to_organization_name: data.to_organization_name || '',
            category_name: data.category_name || '',
            sub_category_name: data.sub_category_name || '',
            description: data.description || '',
            enquiry_product: data.enquiry_product || '',
          });
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
            <h4 className="mb-4">View Enquiry #{formData.enquiry_number}</h4>
            <div className="row">
              <div className="col-md-6">
                <h5>From</h5>
                <ul className="list-group">
                  {formData.from_full_name && <li className="list-group-item">{formData.from_full_name}</li> }
                  {formData.from_email && <li className="list-group-item">{formData.from_email}</li> }
                  {formData.from_mobile && <li className="list-group-item">{formData.from_mobile}</li> }
                  {formData.from_organization_name && <li className="list-group-item">{formData.from_organization_name}</li> }
                </ul>
              </div>
              <div className="col-md-6">
                <h5>To</h5>
                <ul className="list-group">
                  {formData.to_full_name && <li className="list-group-item">{formData.to_full_name}</li> }
                  {formData.to_email && <li className="list-group-item">{formData.to_email}</li> }
                  {formData.to_mobile && <li className="list-group-item">{formData.to_mobile}</li> }
                  {formData.to_organization_name && <li className="list-group-item">{formData.to_organization_name}</li> }
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-body">
                <h5>Enquiry</h5>
                <ul className="list-group">
                  {formData.category_name && <li className="list-group-item">{formData.category_name}</li> }
                  {formData.sub_category_name && <li className="list-group-item">{formData.sub_category_name}</li> }
                  {formData.description && <li className="list-group-item">{formData.description}</li> }
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-body">
                <h5>Company</h5>
                <ul className="list-group mb-1">
                  {formData.to_organization_name && <li className="list-group-item">{formData.to_organization_name}</li> }
                </ul>
                <h5>Product</h5>
                <ul className="list-group">
                  {formData.enquiry_product && <li className="list-group-item">{formData.enquiry_product}</li> }
                </ul>
              </div>
            </div>
          </div>
        </div>
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
    </>
  )
}

export default ViewEnquiry