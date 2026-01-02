import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="page-wrapper">
            <div className="page-content">
                <div className="error-404">
                    <div className="container">
                        <div className="card py-5">
                            <div className="row g-0">
                                <div className="col col-xl-5">
                                    <div className="card-body p-4">
                                        <h1 className="display-1">
                                            <span className="text-primary">4</span>
                                            <span className="text-danger">0</span>
                                            <span className="text-success">4</span>
                                        </h1>
                                        <h2 className="font-weight-bold display-4">Lost in Space</h2>
                                        <p>
                                            You have reached the edge of the universe.
                                            <br />
                                            The page you requested could not be found.
                                            <br />
                                            Dont'worry and return to the previous page.
                                        </p>
                                        <div className="mt-5">
                                            {" "}
                                            <Link to="/admin" className="btn btn-primary btn-sm btn-lg px-md-5 radius-30">Go Home</Link>
                                            <a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}
                                                className="btn btn-outline-dark btn-lg ms-3 px-md-5 radius-30">Back</a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-7">
                                    <img src="/404.png" className="img-fluid" alt="404" loading="lazy" decoding="async" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default NotFound;