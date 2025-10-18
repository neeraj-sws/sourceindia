import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";

const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/open_enquiries?is_home=1&is_delete=0`);
        setEnquiries(response.data);
      } catch (error) {
        console.error('Error fetching enquiries:', error);
      }
    };

    fetchEnquiries();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className='enquirySection'>
        <div className="container my-5">
          <div className="card mb-5 commonHead border shadow-none">
            <div className="card-body py-5 text-center">
              <h1 className="text-white">Open Enquiry

              </h1>
            </div>
          </div>
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex gap-3">
                  <a href="#" className="btn btn-primary">All Enquiry</a>
                  <a href="#" className="btn btn-outline-primary">My Enquiry</a>
                </div>
                <div>
                  <a href="#" className="btn btn-outline-primary"><i className="fadeIn animated bx bx-plus-circle pe-1 pt-1"></i> Add Enquiry</a>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {enquiries.map((enquiry) => (
              <div key={enquiry.id} className="col-lg-4 col-md-6 mb-3">

                <div className="card h-100 border shadow-sm">
                  <div className="card-header bg-white">
                    <div className="d-flex gap-2 align-items-center">
                      <div className="compnaylogo">
                        {(enquiry.company_logo) && (
                          <ImageFront
                            src={`${ROOT_URL}/${enquiry.company_logo}`}
                            alt={`${enquiry.organization_name}`}

                            style={{
                              maxWidth: '90px',
                              height: 'auto',
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                            showFallback={true}
                            className=""
                            defaultimg="/company.png"
                          />
                        )}
                      </div>
                      <h5 className="card-title lh-sm" style={{ fontSize: '18px' }}>{enquiry.title} </h5>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="row gx-0">

                      <div className="col-lg-12 p-0">

                        <p className="card-text px-3 py-2 bg-light mb-0">
                          <b className="fw-semibold">Description:</b> {enquiry.description}</p>
                        <div className="px-3 py-2">
                          <p className="card-text mb-1">
                            <b className="fw-semibold">Quantity:</b> {enquiry.quantity}</p>
                          <p className="card-text mb-1">
                            <b className="fw-semibold">Name:</b> {enquiry.fname} {enquiry.lname}</p>
                          {(enquiry.organization_name || enquiry.company) && (
                            <p className="card-text mb-1">
                              <b className="fw-semibold">Company Name:</b>{' '}
                              {enquiry.organization_slug ? (
                                <a href={`/companies/${enquiry.organization_slug}`}>
                                  {enquiry.organization_name}
                                </a>
                              ) : (
                                enquiry.company
                              )}
                            </p>
                          )}

                          <p className="card-text mb-1">
                            <b className="fw-semibold">Date:</b> {new Date(enquiry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer text-center">
                    <Link className="btn btn-sm primary-color-bg text-white w-50  text-nowrap py-1 fw-medium orange-hoverbtn d-inline-block pt-2" to="">
                      <i className="lni lni-reply me-2" />
                      <span>Reply</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Enquiry