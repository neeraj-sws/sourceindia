import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext";
import API_BASE_URL, { ROOT_URL } from "../config";

const FrontFooter = () => {
  const { siteSettings, loading } = useSiteSettings();

  if (loading || !siteSettings) return null;

  const helpItems = siteSettings.front_menu.filter(
    item => item.parent_id === 0 && item.type === 2
  );

  const helpLinks = [
    ...(!helpItems.some(item => item.link === '/faq' || item.name.toLowerCase() === 'faq')
      ? [{ id: 'faq', name: 'FAQ', link: '/faq' }] : []),
    ...helpItems
  ];

  return (
    <footer>
      <div className="mainFooter">
        <div className="container-xl">
          <div className="row gy-4">
            <div className="col-md-3 col-sm-4 order-1">
              <p className="fw-semibold mb-1">Developed and Managed by</p>
              <div className="footer-logo mb-2">
                <img src={siteSettings.home_settings.footer_logo ? `${ROOT_URL}/${siteSettings.home_settings.footer_logo}` : "/footer_new_img.jpeg"}
  alt="ELCINA Logo" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="col-md-6 order-md-2 order-3 pe-lg-5">
              <div className="electronicpart pe-lg-5">
                <p className="fw-semibold mb-1">{siteSettings.home_settings.footer_heading}</p>
                <p className="small mb-0">
                  {siteSettings.home_settings.footershort_description}
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6 text-md-start text--center order-md-3 order-2">
              <div className="supportclass">
                <p className="fw-semibold mb-1">Supporting Associations</p>
                <div className="supporting-logos">
                  <img src={siteSettings.home_settings.footer_img_1 ? `${ROOT_URL}/${siteSettings.home_settings.footer_img_1}` : "/mait.jpg"} 
                  alt="MAIT" className="mb-1" loading="lazy" decoding="async" />
                  <img src={siteSettings.home_settings.footer_img_2 ? `${ROOT_URL}/${siteSettings.home_settings.footer_img_2}` : "/cimei.png"} 
                  alt="CIMEI" className="mb-1" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-light opacity-25 my-4" />

          <div className="row gy-4">
            <div className="col-lg-2 col-sm-5">
              <p className="footer-section-title">Need Help?</p>
              <ul className="list-unstyled mb-0">
                {helpLinks.map((item) => (
                  <li key={item.id}>
                    <Link to={item.link}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-md-4 col-sm-5 footer-border">
              <p className="footer-section-title">Policy</p>
              <ul className="list-unstyled mb-0">
                <li>
                  <a href="#">Schemes for Electronics Manufacturing</a>
                </li>
                <li>
                  <a href="#">State ESDM Policies</a>
                </li>
                <li>
                  <a href="#">Union Budget for ESDM sector</a>
                </li>
                <li>
                  <a href="#">Foreign Trade Policy 2015-20</a>
                </li>
                <li>
                  <a href="#">Duty Draw Back</a>
                </li>
              </ul>
            </div>

            <div className="col-lg-2 col-sm-5 col-sm-3 footer-border">
              <p className="footer-section-title">Quick Links</p>
              <ul className="list-unstyled mb-0">
                <li>
                  <a href="#">For Exporters</a>
                </li>
                <li>
                  <a href="#">Work With Us</a>
                </li>
                <li>
                  <Link to="/plans">Subscription Plans</Link>
                </li>
                <li>
                  <a href="https://elcina.com/testlab-india">
                    Test Labs in India
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-4 col-sm-5 footer-border">
              <p className="footer-section-title">Contact Us</p>
              <div className="d-flex mb-1">
                <i className="bx bx-phone me-1"></i>
                <div className="d-flex flex-wrap">
                  <Link
                    to={`tel:${siteSettings.home_settings.contactphone_1}`}
                    className="d-inline-block"
                  >{siteSettings.home_settings.contactphone_1}</Link>{" "}
                  /{" "}
                  <Link
                    to={`tel:${siteSettings.home_settings.contactphone_2}`}
                    className="d-inline-block"
                  >
                    {siteSettings.home_settings.contactphone_2}
                  </Link>
                </div>
              </div>
              <p className="d-flex mb-1">
                <i className="bx bx-envelope me-1"></i>{" "}
                <Link
                  to={`mailto:${siteSettings.home_settings.contactemail}`}
                  className="d-inline-block"
                >
                  {siteSettings.home_settings.contactemail}
                </Link>
              </p>
              <div className="d-flex">
                <i className="bx bx-map me-1"></i>{" "}
                <Link to={siteSettings.home_settings.contact_map_url}>
                  <div
                    className="mb-2"
                    dangerouslySetInnerHTML={{
                      __html: siteSettings.home_settings.contactaddress,
                    }}
                  />
                </Link>
              </div>

              <div className="social-icons">
                <a
                  href={siteSettings.home_settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-facebook"></i>
                </a>
                <a
                  href={siteSettings.home_settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a
                  href={siteSettings.home_settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin"></i>
                </a>
                <a
                  href={siteSettings.home_settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-youtube"></i>
                </a>
                <a
                  href={siteSettings.home_settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="copyrightsection bg-white">
        <div className="container">
          <div className="footer-bottom py-2 mt-0">
            © Copyright 2026{" "}
            <a href="/" className="fw-bolder">
              ELCINA
            </a>
            . All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FrontFooter;
