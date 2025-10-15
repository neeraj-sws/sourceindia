import React from 'react'
import { Link } from 'react-router-dom';

const FrontFooter = () => {
  return (
    <footer>
      <div className='mainFooter'>
        <div className="container">
          <div className="row gy-4">
            <div className="col-md-3">
              <p className="fw-semibold mb-1">Developed and Managed by</p>
              <div className="footer-logo mb-2">
                <img src="/footer_new_img.jpeg" alt="ELCINA Logo" />
              </div>
            </div>
            <div className="col-md-6 pe-lg-5">
              <div className='electronicpart pe-lg-5'>
                <p className="fw-semibold mb-1">ELECTRONIC INDUSTRIES ASSOCIATION OF INDIA (ELCINA)</p>
                <p className="small mb-0">
                  Our focus is to support the value chain for Consumer Electronics, Telecom and Computers / IT correlating their common interest with that of equipment, material and machinery producers for expansion of manufacturing.
                </p>
              </div>
            </div>
            <div className="col-md-3 text-md-start text-center">
              <div className='supportclass'>
                <p className="fw-semibold mb-1">Supporting Associations</p>
                <div className="supporting-logos">
                  <img src="/mait.jpg" alt="MAIT" />
                  <img src="/cimei.png" alt="CIMEI" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-light opacity-25 my-4" />

          <div className="row gy-4">
            <div className="col-md-2">
              <p className="footer-section-title">Need Help?</p>
              <ul className="list-unstyled mb-0">
                <li><a href="#">Terms & Conditions</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><Link to="/get-support">Support</Link></li>
                <li><Link to="/knowledge-center">Knowledge Center</Link></li>
                <li><Link to="/contact-us">Contact Us</Link></li>
              </ul>
            </div>

            <div className="col-md-4 footer-border">
              <p className="footer-section-title">Policy</p>
              <ul className="list-unstyled mb-0">
                <li><a href="#">Schemes for Electronics Manufacturing</a></li>
                <li><a href="#">State ESDM Policies</a></li>
                <li><a href="#">Union Budget for ESDM sector</a></li>
                <li><a href="#">Foreign Trade Policy 2015-20</a></li>
                <li><a href="#">Duty Draw Back</a></li>
              </ul>
            </div>

            <div className="col-md-2 footer-border">
              <p className="footer-section-title">Quick Links</p>
              <ul className="list-unstyled mb-0">
                <li><a href="#">For Exporters</a></li>
                <li><a href="#">Work With Us</a></li>
                <li><a href="#">Subscription Plans</a></li>
                <li><a href="https://elcina.com/testlab-india">Test Labs in India</a></li>
              </ul>
            </div>

            <div className="col-md-4 footer-border">
              <p className="footer-section-title">Contact Us</p>
              <p className="mb-1"><i className="bi bi-telephone"></i> +91-11-41615985 / +91-11-41011291</p>
              <p className="mb-1"><i className="bi bi-envelope"></i> support@sourceindia-electronics.com</p>
              <p className="mb-2">
                Elcina House, 422, Okhla Industrial Estate, Phase-III, New Delhi, Delhi 110020
              </p>
              <div className="social-icons">
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-twitter-x"></i></a>
                <a href="#"><i className="bi bi-linkedin"></i></a>
                <a href="#"><i className="bi bi-youtube"></i></a>
                <a href="#"><i className="bi bi-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='copyrightsection bg-white'>
        <div className='container'>
          <div className="footer-bottom py-2 mt-0">
            © Copyright 2025 <a href="/" className='fw-bolder'>ELCINA</a>. All Rights Reserved
          </div>
        </div>
      </div>
    </footer >
  )
}

export default FrontFooter