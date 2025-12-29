import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL, { ROOT_URL } from "./../config";
import axios from "axios";
import UseAuth from "../sections/UseAuth";
import ImageFront from "../admin/common/ImageFront";

// 🔥 Swiper
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
                  breakpoints={{
                    0: { slidesPerView: 1 },
                    576: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    992: { slidesPerView: 4 },
                  }}
                >
                  {products.map((product) => (
                    <SwiperSlide key={product.id}>
                      <div className="shadow-sm p-3 bg-white text-center">
                        <Link to={`/products/${product.slug}`}>
                          <div className="BuyerProImg mb-2">
                            <ImageFront
                              src={
                                product.file?.length
                                  ? `${ROOT_URL}/${product.file[0].file}`
                                  : "/default.png"
                              }
                              width={180}
                              height={100}
                              showFallback={true}
                            />
                          </div>
                          <p className="mb-0">{product.title}</p>
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
    </>
  );
};

export default BuyerProduct;
