import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";
import UseAuth from "../sections/UseAuth";
import { Suspense, lazy } from 'react';
const ImageFront = lazy(() => import('../admin/common/ImageFront'));
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

const BuyerProduct = () => {
  const navigate = useNavigate();
  const { user, loading } = UseAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (loading) return;

    const token = localStorage.getItem("user_token");


    if (!user?.id) return;

    const fetchProducts = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/dashboard/get-products?userId=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, [user, loading, navigate]);

  return (
    <>
      <Suspense fallback={<div></div>}>
        {
          products.length > 0 && (
            <div className="productBuyer my-5">
              <div className="container">

                <>
                  <div className="firstHead text-center pb-4">
                    <h1>Suggested Products</h1>
                  </div>

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
                    {products.map((product) => (
                      <SwiperSlide key={product.id} className="bg-white border rounded p-2 text-center">
                        <div className="productContainer">
                          <Link to={`/products/${product.slug}`}>
                            <div className="recLogoWrap mb-2">
                              <ImageFront
                                src={
                                  product.file?.length
                                    ? `${ROOT_URL}/${product.file[0].file}`
                                    : "/default.png"
                                }
                                width={180}
                                height={180}
                                showFallback={true}
                              />
                            </div>
                            <div className="recText">
                              <h6 className="recName" title={product.title}>{product.title}</h6>
                            </div>
                          </Link>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </>

              </div>
            </div>
          )
        }
      </Suspense>
    </>
  );
};

export default BuyerProduct;
