import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../../config";
import Breadcrumb from "../common/Breadcrumb";
import ImageWithFallback from "../common/ImageWithFallback";
import UserProducts from '../profile/UserProducts';
import UserEnquiry from '../profile/UserEnquiry';
import UserOpenLeads from '../profile/UserOpenLeads';
import { formatDateTime } from "../../utils/formatDate";

const SellerProfile = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fname: "", lname: "", email: "", mobile: "", address: "", zipcode: "", status: "", is_approve: "", created_at: "",
    country_name: "", state_name: "", city_name: "", organization_name: "", company_location: "", company_website: "",
    company_video_second: "", organizations_product_description: "", company_file_name: null, coreactivity_name: "",
    activity_name: "", category_name: "",
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/${sellerId}`);
        const seller_data = res.data;
        setFormData({
          fname: seller_data.fname || "",
          lname: seller_data.lname || "",
          email: seller_data.email || "",
          mobile: seller_data.mobile || "",
          address: seller_data.address || "",
          zipcode: seller_data.zipcode || "",
          status: seller_data.status || "",
          is_approve: seller_data.is_approve || "",
          created_at: seller_data.created_at || "",
          country_name: seller_data.country_name || "",
          state_name: seller_data.state_name || "",
          city_name: seller_data.city_name || "",
          organization_name: seller_data.organization_name || "",
          company_location: seller_data.company_location || "",
          company_website: seller_data.company_website || "",
          company_video_second: seller_data.company_video_second || "",
          organizations_product_description: seller_data.organizations_product_description || "",
          company_file_name: seller_data.company_file_name || null,
          coreactivity_name: seller_data.coreactivity_name || "",
          activity_name: seller_data.activity_name || "",
          category_name: seller_data.category_name || "",
        });
      } catch (error) {
        console.error("Error fetching Activity Details:", error);
      }
    };
    fetchUserDetails();
  }, [sellerId]);

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Buyer" title="User Profile" add_button="Back" add_link="#" onClick={(e) => {e.preventDefault(); navigate(-1);}} />
          <div className="row">
            <div className="card shadow-sm mb-4">
              <div className="card-body d-flex align-items-center"
                style={{background: "linear-gradient(90deg, #cc6e14, #db8932)", color: "white"}}>
                <div className="me-3">
                  <div className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center"
                    style={{ width: 60, height: 60 }}>
                    <i className="bx bx-user fs-3" />
                  </div>
                </div>
                <div><h5 className="mb-0">{formData.fname} {formData.lname}</h5></div>
              </div>
            </div>
            <div className="col-xl-12 mx-auto">
              <div className="card  mb-4">
                <div className="card-body py-0 px-1">
                  <ul className="nav nav-pills pb-0 customnavbar" role="tablist">
                    <li className="nav-item" role="presentation">
                      <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-personal" role="tab" aria-selected="true">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Personal Info</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-company" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Company Info</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-category" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Sell Category</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-products" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Products</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-enquiry" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Enquiry</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-open-leads" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">Open Leads</div>
                        </div>
                      </a>
                    </li>
                    <li className="nav-item" role="presentation">
                      <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-my-leads" role="tab" aria-selected="false">
                        <div className="d-flex align-items-center">
                          <div className="tab-title">My Leads</div>
                        </div>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="tab-content" id="pills-tabContent">
                    <div className="tab-pane fade show active" id="primary-pills-personal" role="tabpanel">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>First Name:</strong> {formData.fname}</td>
                            <td><strong>Last Name:</strong> {formData.lname}</td>
                            <td><strong>Email:</strong> {formData.email}</td>
                          </tr>
                          <tr>
                            <td><strong>Mobile:</strong> {formData.mobile}</td>
                            <td><strong>Address:</strong> {formData.address}</td>
                            <td><strong>Postcode:</strong> {formData.zipcode}</td>
                          </tr>
                          <tr>
                            <td><strong>Country:</strong> {formData.country_name}</td>
                            <td><strong>State:</strong> {formData.state_name}</td>
                            <td><strong>City:</strong> {formData.city_name}</td>
                          </tr>
                          <tr>
                            <td><strong>Member Since:</strong> {formatDateTime(formData.created_at)}</td>
                            <td><strong>User Status:</strong> {formData.status == 1 ? "Active" : "Inactive"}</td>
                            <td><strong>Account Status:</strong> {formData.is_approve ? "Active" : "Inactive"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="tab-pane fade" id="primary-pills-company" role="tabpanel">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td><strong>Company:</strong> {formData.organization_name}</td>
                            <td><strong>Location:</strong> {formData.company_location}</td>
                            <td><strong>Website:</strong> {formData.company_website}</td>
                          </tr>
                          <tr>
                            <td><strong>Core Activity:</strong> {formData.coreactivity_name}</td>
                            <td><strong>Activity:</strong> {formData.activity_name}</td>
                            <td><strong>Membership Plan:</strong> {formData.plan_name}</td>
                          </tr>
                          <tr>
                            <td colSpan="3"><strong>Upload Video Url:</strong><br />{formData.company_video_second}</td>
                          </tr>
                          <tr>
                            <td colSpan="3"><strong>Company Description:</strong><br />{formData.organizations_product_description}</td>
                          </tr>
                          <tr>
                            <td colSpan="3">
                              <strong>Company Logo:</strong><br />
                              <ImageWithFallback
                                src={formData.company_file_name ? `${ROOT_URL}/${formData.company_file_name}` : ''}
                                width={80}
                                height={80}
                                showFallback={true}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="tab-pane fade" id="primary-pills-category" role="tabpanel">
                      <strong>Sell Category:</strong> {formData.category_name}
                    </div>
                    <div className="tab-pane fade" id="primary-pills-products" role="tabpanel">
                      <UserProducts />
                    </div>
                    <div className="tab-pane fade" id="primary-pills-enquiry" role="tabpanel">
                      <UserEnquiry />
                    </div>
                    <div className="tab-pane fade" id="primary-pills-open-leads" role="tabpanel">
                      <UserOpenLeads />
                    </div>
                    <div className="tab-pane fade" id="primary-pills-my-leads" role="tabpanel">
                      <div className="text-center">
                        <i className="font-30 bx bx-list-check" /><br /><p>- No My Leads -</p>
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

export default SellerProfile;
