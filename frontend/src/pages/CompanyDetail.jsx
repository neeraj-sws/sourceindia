import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ImageFront from "../admin/common/ImageFront";
import { useAlert } from "../context/AlertContext";
import EnquiryForm from "./EnquiryForm";
import UseAuth from '../sections/UseAuth';

const CompanyDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [company, setCompany] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const { showNotification } = useAlert();
  // ⭐ Review form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = UseAuth();

  useEffect(() => {
  const fetchCompany = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/products/companies/${slug}`
      );

      // Always show skeleton for 1 second
      setTimeout(() => {
        setCompany(res.data);
        setShowSkeleton(false);
      }, 1000);

    } catch (error) {
      console.error("Error fetching company:", error);
      setShowSkeleton(false);
    }
  };

  fetchCompany();
}, [slug]);

  // 🧩 Handle Review Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showNotification("Please log in to submit a review.", "error");
      navigate("/login");
      return;
    }

    if (!review.trim()) {
      showNotification("Please enter your review.", "error");
      return;
    }
    if (rating === 0) {
      showNotification("Please select a rating.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/products/company-review`, {
        company_id: company.id,
        user_id: user?.id, // replace with logged-in user ID if available
        rating,
        review,
      });
      showNotification(response.data.message || "Review submitted successfully!", 'success');

      setReview("");
      setRating(0);
    } catch (err) {
      console.error(err);
      showNotification(err.response.data.message || "Error submitting review.", 'success');
    } finally {
      setLoading(false);
    }
  };

  const Skeleton = ({ width = "100%", height = "16px", style = {} }) => (
  <div
    style={{
      width,
      height,
      background: "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 37%,#e0e0e0 63%)",
      backgroundSize: "400% 100%",
      animation: "skeleton-loading 1.4s ease infinite",
      borderRadius: "6px",
      ...style,
    }}
  />
);

const CompanyDetailSkeleton = () => (
  <>
    <style>
      {`
        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}
    </style>

    <section className="productDetail py-5">
      <div className="container">
        <div className="row">

          {/* Left Card */}
          <div className="col-lg-3">
            <div className="card p-4">
              <Skeleton height="20px" width="80%" style={{ marginBottom: 12 }} />
              <Skeleton height="100px" style={{ marginBottom: 16 }} />

              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height="14px" style={{ marginBottom: 8 }} />
              ))}

              <Skeleton height="36px" style={{ marginTop: 12 }} />
            </div>
          </div>

          {/* Right Content */}
          <div className="col-lg-9">
            <div className="card p-4">
              <Skeleton height="28px" width="50%" style={{ marginBottom: 20 }} />

              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  height="18px"
                  style={{ marginBottom: 10 }}
                />
              ))}

              <Skeleton height="80px" style={{ marginTop: 20 }} />
              <Skeleton height="40px" width="160px" style={{ marginTop: 20 }} />
            </div>
          </div>

        </div>

        {/* Products Grid */}
        <div className="mt-5">
          <Skeleton height="30px" width="200px" style={{ marginBottom: 20 }} />
          <div className="row">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="col-md-4">
                <div className="card p-3">
                  <Skeleton height="180px" />
                  <Skeleton height="18px" style={{ marginTop: 12 }} />
                  <Skeleton height="32px" width="100px" style={{ marginTop: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  </>
);

  if (showSkeleton) return <CompanyDetailSkeleton />;

  return (
    <>
      <section className="productDetail py-5">
        <div className="container">
          <div className="row">
            <nav aria-label="breadcrumb" className="mb-3">
  <ol className="breadcrumb mb-0">
    <li className="breadcrumb-item">
      <a href="/" className="text-decoration-none">Home</a>
    </li>

    <li className="breadcrumb-item">
      <a href="/company-list" className="text-decoration-none">Seller</a>
    </li>

    <li className="breadcrumb-item active" aria-current="page">
      {company.organization_name}
    </li>
  </ol>
</nav>
            {/* Company Info */}
            <div className="col-lg-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center p-4">
                  <h6 className="my-3 text-start">{company.organization_name}</h6>

                  <div className="rounded-2">
                    <ImageFront
                      src={`${ROOT_URL}/${company.company_logo_file}`}
                      alt={company.organization_name}
                      style={{
                        width: 'auto',
                        height: '100px',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                      showFallback={true}
                      defaultimg="/company.png"
                    />
                  </div>

                  <div className="reviewSection pt-3 text-start">

                    <form onSubmit={handleSubmit}>
                      <h5>Review</h5>

                      <label className="form-label mt-2 mb-0">Rating</label>
                      <div className="d-flex">
                        {[...Array(5)].map((_, index) => {
                          const ratingValue = index + 1;
                          return (
                            <span
                              key={ratingValue}
                              onClick={() => setRating(ratingValue)}
                              onMouseEnter={() => setHover(ratingValue)}
                              onMouseLeave={() => setHover(0)}
                              style={{
                                cursor: "pointer",
                                fontSize: "28px",
                                color: ratingValue <= (hover || rating) ? "#ffc107" : "#ccc",
                              }}
                            >
                              ★
                            </span>
                          );
                        })}
                      </div>

                      <div className="col-md-12 mt-2 mb-3">
                        <label className="form-label">
                          Review <sup className="text-danger">*</sup>
                        </label>
                        <textarea
                          className="form-control"
                          name="review"
                          rows="3"
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                        ></textarea>
                      </div>

                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                      </button>
                    </form>

                  </div>
                </div>
              </div>


            </div>

            {/* Company Details */}
            <div className="col-lg-9">
              <div className="card h-100 shadow-sm">
                <div className="card-body p-4">
                  <h4 className="text-orange">{company.organization_name}</h4>
                  <table className="table productTable mt-3">
                    <tbody>
                      <tr><th>Location</th><td>{company.company_location || "N/A"}</td></tr>
                      <tr><th>Website</th><td>{company.company_website || "N/A"}</td></tr>
                      <tr><th>Core Activity</th><td>{company.coreactivity_name || "N/A"}</td></tr>
                      <tr><th>Activity</th><td>{company.activity_name || "N/A"}</td></tr>
                      <tr><th>Category</th><td>{company.category_name || "N/A"}</td></tr>
                      <tr><th>Sub Category</th><td>{company.sub_category_name || "N/A"}</td></tr>
                    </tbody>
                  </table>
                  <p>{company.brief_company || ""}</p>
                  <p>{company.organizations_product_description || ""}</p>
                  <div className='w-25 mt-4'>
                    <button className="btn btn-orange w-100" onClick={() => setShowModal(true)}>
                      <i className="lni lni-phone pe-2"></i> Enquiry
                    </button>
                  </div>
                  <EnquiryForm
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    productId=''
                    companyId={`${company.id}`}
                    productTitle=''
                    companyName={`${company.organization_name}`}
                  />

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Carousel */}
      <div className="container mt-5">
        {company?.products?.length > 0 && (
          < div className="companyProducts">
            <h2 className="color-primary">Products</h2>
            <Swiper
              modules={[Navigation, Pagination]}
              slidesPerView={3}
              spaceBetween={20}
              navigation
              loop={false}
              className="similar-products-carousel"
              style={{ padding: "20px 0" }}
            >
              {company.products.map((similar) => (
                <SwiperSlide key={similar.id}>
                  <div className="productBox p-3 bg-white">
                    <div className="middlepro">
                      <div className="ProImg ProImgDetail">
                        <ImageFront
                          src={`${ROOT_URL}/${similar.image}`}
                          width={180}
                          height={180}
                          showFallback
                        />
                      </div>
                      <div className="productlink">
                        <p className="mb-0">{similar.title}</p>
                        <Link to={`/products/${similar.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2">
                          <span className="pe-2">View</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            viewBox="4 9.28 23.91 13.44"
                            className="filtersvg">
                            <path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
        {/* ⭐ Review Section */}


        {/* Recommended Companies */}
        {company?.recommended_companies?.length > 0 && (
          <div className="similerCompany mt-5">
            <h2 className="color-primary">Recommended Companies</h2>
            <Swiper
              modules={[Navigation, Pagination]}
              slidesPerView={5}
              spaceBetween={20}
              navigation
              loop
              className="recommended-companies-carousel"
              style={{ padding: "20px 0" }}
            >
              {company.recommended_companies.map((item) => (
                <SwiperSlide key={item.id} className="bg-white border rounded p-2 text-center">
                  <Link to={`/companies/${item.organization_slug}`}>
                    <ImageFront
                      src={`${ROOT_URL}/${item.company_logo_file}`}
                      width={180}
                      height={180}
                      showFallback
                    />
                    <p className="mt-3 mb-2">{item.organization_name}</p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div >
    </>
  );
};

export default CompanyDetail;