import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";
import UseAuth from "../sections/UseAuth";
import { Suspense, lazy } from 'react';
const ImageFront = lazy(() => import('../admin/common/ImageFront'));
// 🔥 Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import '../assets/css/companydetails.css';

const SellerCompany = () => {
  const navigate = useNavigate();
  const { user, loading } = UseAuth();
  const [companies, setCompanies] = useState([]);
  // Static state displayed for all suggested sellers (change value below)
  const STATIC_STATE = "Karnataka";

  useEffect(() => {
    if (loading) return;

    const token = localStorage.getItem("user_token");


    if (!user?.id) return;

    const fetchCompanies = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/dashboard/get-seller-company?userId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCompanies(res.data.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchCompanies();
  }, [user, loading, navigate]);

  return (
    <>
      <Suspense fallback={<div></div>}>

      {companies?.length > 0 && (
           <div className="productBuyer my-5 pt-5">
              <div className="container">
                <div className="firstHead text-center pb-4">
                  <h1>Suggested Sellers</h1>
                </div>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              navigation
              loop
              className="recommended-companies-carousel"
              style={{ padding: "20px 0" }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                },
                576: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
                992: {
                  slidesPerView: 4,
                },
                1200: {
                  slidesPerView: 5,
                },
              }}
            >
              {companies.map((item) => (
                <SwiperSlide key={item.id} className="bg-white border rounded p-2 text-center">
                  <div className='productContainer'>
                    <Link to={`/companies/${item.organization_slug}`}>
                      <div className="recLogoWrap">
                        <ImageFront
                           src={
                                    item.companyLogo
                                      ? `${ROOT_URL}/${item.companyLogo?.file}`
                                      : "/default.png"
                                  }
                          width={180}
                          height={180}
                          showFallback
                        />
                      </div>
                      <div className="recText">
                        <h6 className="recName" title={item.organization_name}>{item.organization_name}</h6>
                        <div className="recLocation">
                          {(item.city_name || item.state_name) && <i className="bx bx-map recLocIcon" />}
                          {item.city_name}
                          {item.city_name && item.state_name ? ', ' : ''}
                          {item.state_name}
                        </div>
                      </div>
                    </Link>

                    <div className="recFooter">
                      <Link
                        to={`/companies/${item.organization_slug}`}
                        className="btn btn-outline-primary btn-sm rec-view-bottom"
                        aria-label={`View ${item.organization_name}`}
                        title={`View ${item.organization_name}`}
                      >
                        View &nbsp;&nbsp;
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" class="filtersvg" aria-hidden="true"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"></path></svg>
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          
              </div>
            </div>
        )}

      </Suspense>
    </>
  );
};

export default SellerCompany;
