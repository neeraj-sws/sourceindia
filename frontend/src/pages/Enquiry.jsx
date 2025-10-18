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
                  <a href="#" className="btn btn-outline-primary"><i class="fadeIn animated bx bx-plus-circle pe-1 pt-1"></i> Add Enquiry</a>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            {enquiries.map((enquiry) => (
              <div key={enquiry.id} className="col-lg-4 col-md-6 mb-3">

                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-3">
                        {(enquiry.company_logo) && (
                          <ImageFront
                            src={`${ROOT_URL}/${enquiry.company_logo}`}
                            alt={`${enquiry.organization_name}`}

                            style={{
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'cover',
                              border: '1px solid #ddd',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                            showFallback={true}
                            className=""
                            defaultimg="/company.png"
                          />
                        )}
                      </div>
                      <div className="col-lg-9">
                        <h5 className="card-title">{enquiry.title} </h5>
                        <p className="card-text">Description: {enquiry.description}</p>
                        <p className="card-text">Quantity: {enquiry.quantity}</p>
                        <p className="card-text">Name: {enquiry.fname} {enquiry.lname}</p>
                        {(enquiry.organization_name || enquiry.company) && (
                          <p className="card-text">
                            Company Name:{' '}
                            {enquiry.organization_slug ? (
                              <a href={`/companies/${enquiry.organization_slug}`}>
                                {enquiry.organization_name}
                              </a>
                            ) : (
                              enquiry.company
                            )}
                          </p>
                        )}

                        <p className="card-text">Date: {new Date(enquiry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                      </div>
                    </div>
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