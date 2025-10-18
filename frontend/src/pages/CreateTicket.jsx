import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";

const CreateTicket = () => {

  return (
    <section className="my-5">
      <div className="container">
        <div className="card mb-5 commonHead border shodow-none">
          <div className="card-body py-5 d-flex align-items-center justify-content-center">
            <div className="firstHead text-center">
              <h1 className="mb-0 text-white">Support Portal</h1>
            </div>
          </div>
        </div>
        <div className="knowledgeBox">
          <div className="row">
            <div className="col-lg-12 mx-auto">
              <div className="card">
                <div className="card-body p-5">
                  <div className="contact-form">
                    <h4 className="mb-4">Create Ticket</h4>
                    <div className="row py-3">
                      <div className="col-md-4">
                        <div className="form-group ">
                          <label className="form-label">Email<sup className="text-danger">*</sup></label>
                          <input type="text" name="email" id="otp-email" className="form-control" placeholder="Enter Email" value="" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 d-flex gap-2">
                      <button type="submit" className="btn btn-primary">Submit <i className="st_loader spinner-border spinner-border-sm d-none"></i></button>
                      <Link to="/get-support" className="btn btn-secondary">Back</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateTicket;
