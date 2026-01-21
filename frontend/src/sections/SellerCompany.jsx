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
        {
          companies.length > 0 && (
            <div className="productBuyer my-5 pt-5">
              <div className="container">
                <div className="firstHead text-center pb-4">
                  <h1>Suggested Sellers</h1>
                </div>

                {companies.length ? (
                  <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={4}
                    navigation
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    className="recommended-companies-carousel"
                    style={{ padding: "20px 0" }}
                    breakpoints={{
                      0: { slidesPerView: 1 },
                      576: { slidesPerView: 2 },
                      768: { slidesPerView: 3 },
                      992: { slidesPerView: 4 },
                    }}
                  >
                    {companies.map((company) => (
                      <SwiperSlide key={company.id} className="bg-white border rounded p-2 text-center">
                        <div className="productContainer">
                          <Link to={`/companies/${company.organization_slug}`}>
                            <div className="recLogoWrap mb-2">
                              <ImageFront
                                src={
                                  company.companyLogo?.length
                                    ? `${ROOT_URL}/${company.companyLogo[0].file}`
                                    : "/default.png"
                                }
                                width={180}
                                height={180}
                                showFallback={true}
                              />
                            </div>
                            <div className="recText">
                              <h6 className="recName" title={company.organization_name}>{company.organization_name}</h6>
                              {(() => {
                                const shownState = STATIC_STATE || company.state_name;
                                return shownState ? (
                                  <div className="recLocation" title={shownState}>
                                    <i className="bx bx-map recLocIcon" />{company.user?.city_name}, {company.user?.state_name}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </Link>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <p className="text-center"></p>
                )}
              </div>
            </div>
          )
        }
      </Suspense>
    </>
  );
};

export default SellerCompany;
