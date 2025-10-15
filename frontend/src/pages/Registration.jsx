import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";

const Registration = () => {
   
    return (
        <div className="container my-5">
            <div className="card mb-5 commonHead border shodow-none">
                <div className="card-body py-5 d-flex align-items-center justify-content-center">
                    <div className="firstHead text-center">
                        <h1 className="mb-0 text-white">Source India Portal Registration</h1>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body p-4">
                    <form>
                        <div className='row'>
                            <div class="col-md-6">
                                <label class="form-label"><small>First Name<sup class="text-danger">*</sup></small></label>
                                <input type="text" class="form-control" name="fname" placeholder="Enter First Name" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label"><small>Last Name<sup class="text-danger">*</sup></small></label>
                                <input type="text" class="form-control" name="lname" placeholder="Enter Last Name" />
                            </div>
                            <div class="col-md-6 mt-md-3">
                                <label class="form-label"><small>Company Name<sup class="text-danger">*</sup></small></label>
                                <input type="text" class="form-control" name="companyname" placeholder="Enter Company Name" />
                            </div>
                            <div class="col-md-6 mt-md-3">
                                <label class="form-label"><small>Website<sup class="text-danger">*</sup></small></label>
                                <input type="text" class="form-control" name="website" placeholder="Enter Website" />
                            </div>
                            <div class="col-md-6 mt-md-3">
                                <label class="form-label"><small>Mobile<sup class="text-danger">*</sup></small></label>
                                <input type="text" class="form-control" name="website" placeholder="Enter Website" />
                            </div>
                            <div class="col-md-6 mt-md-3">
                                <label class="form-label"><small>Email<sup class="text-danger">*</sup></small></label>
                                <div className='d-flex gap-3'>
                                    <input type="text" class="form-control" name="email" placeholder="Enter Email" />
                                    <button type='button' className='btn btn-success btn-sm'>Verify</button>
                                </div>
                            </div>
                            <div class="col-md-12 mt-md-5 text-center">
                                <button type='submit' className='btn btn-primary btn-sm px-5'>Submit</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Registration