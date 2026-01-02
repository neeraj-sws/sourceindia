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
                    breakpoints={{
                      0: { slidesPerView: 1 },
                      576: { slidesPerView: 2 },
                      768: { slidesPerView: 3 },
                      992: { slidesPerView: 4 },
                    }}
                  >
                    {companies.map((company) => (
                      <SwiperSlide key={company.id}>
                        <div className="shadow-sm p-3 bg-white">
                          <Link to={`/products/${company.organization_slug}`}>
                            <div className="companyProImg mb-2 d-flex align-items-center gap-2">
                              <ImageFront
                                src={
                                  company.companyLogo?.length
                                    ? `${ROOT_URL}/${company.companyLogo[0].file}`
                                    : "/default.png"
                                }
                                width={180}
                                height={100}
                                showFallback={true}
                              />
                              <p className="mb-0">{company.organization_name}</p>
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
