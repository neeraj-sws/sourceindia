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
import '../assets/css/companydetails.css';

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
                      <SwiperSlide key={product.id}>
                        <div className="mb-4">
                          <div className="productBox productBoxswiper p-3 bg-white">
                            <div className="middlepro">
                              <div className="ProImg">
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
                              <div className="productlink">
                                <p className="mb-0 title-clamp" title={product.title}>{product.title}</p>
                                <Link to={`/products/${product.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2">
                                  <span className="pe-2">View</span>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" className="filtersvg"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"></path></svg>
                                </Link>
                              </div>
                            </div>
                          </div>
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
