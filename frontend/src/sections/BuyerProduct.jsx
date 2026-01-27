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

  // truncate a title to a given number of words
  const truncateWords = (text, wordLimit = 12) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  return (
    <>
      <Suspense fallback={<div></div>}>

       {products?.length > 0 && (
          <div className="companyProducts my-5">
           <div className="container">
                <div className="firstHead text-center pb-4">
                  <h1>Suggested Products</h1>
                </div>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={20}
              navigation
              watchOverflow={true}
              slidesPerView={4}
              slidesPerGroup={1}
              loop={products && products.length > 4}
              className="similar-products-carousel"
              style={{ padding: "20px 0" }}
              breakpoints={{
                0: { slidesPerView: 1, slidesPerGroup: 1 },
                576: { slidesPerView: 2, slidesPerGroup: 1 },
                768: { slidesPerView: 3, slidesPerGroup: 1 },
                1200: { slidesPerView: 4, slidesPerGroup: 1 },
              }}
            >
              {products.map((similar) => (
                <SwiperSlide key={similar.id}>
                  <div className="productBox productBoxswiper p-3 bg-white">
                    <div className="middlepro">
                      <div className="ProImg ProImgDetail">
                        <ImageFront
                           src={
                                    similar.file
                                      ? `${ROOT_URL}/${similar.file?.file}`
                                      : "/default.png"
                                  }
                          width={180}
                          height={180}
                          showFallback
                        />
                      </div>
                      <div className="productlink">
                        <p className="mb-0 title-clamp">{truncateWords(similar.title, 8)}</p>
                        <Link to={`/products/${similar.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2" aria-label={`View ${similar.title}`}>
                          <span className="pe-2">View</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" className="filtersvg" aria-hidden="true">
                            <path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z" />
                          </svg>
                        </Link>
                      </div>
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

export default BuyerProduct;
