import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config'; // Assuming you have ROOT_URL for images
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import '../assets/css/companydetails.css';
import { Navigation, Thumbs, Pagination } from 'swiper/modules'; // Removed Zoom module, added Thumbs
import 'swiper/css'; // Core Swiper styles
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import { Suspense, lazy } from 'react';
const ImageFront = lazy(() => import('../admin/common/ImageFront'));
import EnquiryForm from "./EnquiryForm";
import { useAlert } from "../context/AlertContext";
import UseAuth from '../sections/UseAuth';

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const thumbsSwiper = useRef(null); // Correct use of useRef
  const [activeTab, setActiveTab] = useState('productDetails'); // Manage active tab
  const { showNotification } = useAlert();
  // ⭐ Review form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = UseAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${slug}`);

        setTimeout(() => {
          setProduct(res.data);
          setShowSkeleton(false);
        }, 1000); // ⏱️ 1 second skeleton
      } catch (error) {
        console.error("Error fetching product:", error);
        setShowSkeleton(false);
      }
    };

    fetchProduct();
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const timeAgo = (date) => {
    if (!date) return '—';

    const created = new Date(date);
    const now = new Date();

    const diffMs = now - created;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} Year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} Month${months > 1 ? 's' : ''}`;
    if (days > 0) return `${days} Day${days > 1 ? 's' : ''}`;

    return 'Today';
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

  const ProductDetailSkeleton = () => (
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

            {/* Left Image */}
            <div className="col-lg-9">
              <div className="card p-3">
                <div className="row">
                  <div className="col-5">
                    <Skeleton height="300px" />
                    <div className="d-flex gap-2 mt-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} width="60px" height="60px" />
                      ))}
                    </div>
                  </div>

                  <div className="col-7">
                    <Skeleton height="28px" width="70%" style={{ marginBottom: 15 }} />
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} height="18px" style={{ marginBottom: 10 }} />
                    ))}
                    <Skeleton height="60px" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Card */}
            <div className="col-lg-3">
              <div className="card p-3 h-100">
                <Skeleton height="20px" width="80%" style={{ marginBottom: 12 }} />
                <Skeleton height="120px" />
                <Skeleton height="40px" style={{ marginTop: 20 }} />
              </div>
            </div>

          </div>

          {/* Tabs */}
          <div className="card mt-5 p-4">
            <Skeleton height="20px" width="150px" style={{ marginBottom: 15 }} />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height="16px" style={{ marginBottom: 8 }} />
            ))}
          </div>

          {/* Similar Products */}
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

  if (showSkeleton) return <ProductDetailSkeleton />;

  // If fetch failed but skeleton hidden, show a friendly message instead of crashing
  if (!product) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Product not found or an error occurred while loading the product.</div>
      </div>
    );
  }

  // Combine main file_name with images array; use fallbacks to avoid exceptions
  const allImages = (() => {
    const imgs = Array.isArray(product.images) ? product.images : [];
    if (product.file_name) return [{ file: product.file_name, id: 'main' }, ...imgs];
    return imgs;
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };


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
        product_id: product.id,
        company_id: product.company_id,
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

  const avgRating = Number(product.averageRating) || 0;
  const fullStars = Math.floor(avgRating);
  const hasHalfStar = (avgRating - fullStars) >= 0.5;

  // Render rating stars for the review form
  const renderReviewStars = () => {
    return [...Array(5)].map((_, index) => {
      const ratingValue = index + 1;
      return (
        <span
          key={ratingValue}
          onClick={() => setRating(ratingValue)}
          onMouseEnter={() => setHover(ratingValue)}
          onMouseLeave={() => setHover(0)}
          style={{ cursor: "pointer", fontSize: "28px", color: ratingValue <= (hover || rating) ? "#ffc107" : "#ccc" }}
        >
          ★
        </span>
      );
    });
  };

  return (
    <>
      <Suspense fallback={<div></div>}>
        <section className="productDetail py-5">
          <div className="container-xl">
            <div className="row">
              <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="/" className="text-decoration-none">Home</a>
                  </li>

                  <li className="breadcrumb-item">
                    <a href="/products" className="text-decoration-none">Products</a>
                  </li>

                  <li className="breadcrumb-item active" aria-current="page">
                    {product.title}
                  </li>
                </ol>
              </nav>
              <div className="col-xl-9 col-lg-8 mb-lg-0 mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-5">
                        {/* Main Swiper Slider with Hover Zoom */}
                        <Swiper
                          modules={[Navigation, Thumbs, Pagination]} // Added Thumbs for thumbnail sync
                          thumbs={{ swiper: thumbsSwiper.current && !thumbsSwiper.current.destroyed ? thumbsSwiper.current : null }}
                          navigation={true} // Arrows for navigation
                          pagination={{ clickable: true }} // Dots for pagination
                          loop={true} // Infinite loop
                          grabCursor={true} // Cursor changes to grab when hovering
                          style={{ maxWidth: '100%', height: '300px' }} // Adjust height as needed
                          className="custom-swiper" // Custom class for styling
                        >
                          {allImages.map((image, index) => (
                            <SwiperSlide key={image.id || index}>
                              <div className="swiper-slide-content text-center">

                                <ImageFront
                                  src={`${ROOT_URL}/${image.file}`}
                                  alt={`${product.title} ${index + 1}`}

                                  style={{ width: 'auto', height: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' }}
                                  showFallback={true}
                                  className="swiper-zoom-image"
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>

                        {/* Thumbnail Swiper */}
                        <Swiper
                          onSwiper={(swiper) => (thumbsSwiper.current = swiper)} // Assign swiper instance to useRef
                          spaceBetween={10}
                          slidesPerView={4} // Show 4 thumbnails at a time
                          watchSlidesProgress={true}
                          modules={[Thumbs]}
                          className="mt-3"
                          style={{ maxWidth: '100%', height: '80px' }} // Adjust height for thumbnails
                        >
                          {allImages.map((image, index) => (
                            <SwiperSlide key={image.id || index}>

                              <ImageFront
                                src={`${ROOT_URL}/${image.file}`}
                                alt={`${product.title} ${index + 1}`}

                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  border: '1px solid #ddd',
                                  borderRadius: '5px',
                                  cursor: 'pointer'
                                }}
                                showFallback={true}

                              />

                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                      <div className="col-md-7">
                        <div className="product-details mt-md-0 mt-3">
                          <div className="detailhead">
                            <h4 className="text-orange">{product.title}</h4>
                          </div>
                          <div className="product-meta-grid mt-2">
                            <div className="row g-3">
                              {product.company_website && (
                                <div className="col-md-6 col-sm-6">
                                  <div className="meta-item d-flex align-items-start">
                                    <div className="meta-icon"><i className="bx bx-globe" /></div>
                                    <div>
                                      <div className="meta-label">Website</div>
                                      <div className="meta-value"><a href={product.company_website?.startsWith('http') ? product.company_website : `https://${product.company_website}`} target="_blank" rel="noreferrer">{product.company_website}</a></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Core Activity and Activity removed per request */}

                              {product.category_name && (
                                <div className="col-md-6 col-sm-6">
                                  <div className="meta-item d-flex align-items-start">
                                    <div className="meta-icon"><i className="bx bx-category" /></div>
                                    <div>
                                      <div className="meta-label">Category</div>
                                      <div className="meta-value">{product.category_name}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {product.sub_category_name && (
                                <div className="col-md-6 col-sm-6">
                                  <div className="meta-item d-flex align-items-start">
                                    <div className="meta-icon"><i className="bx bx-list-ul" /></div>
                                    <div>
                                      <div className="meta-label">Sub Category</div>
                                      <div className="meta-value">{product.sub_category_name}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {product.item_category_name && (
                                <div className="col-md-6 col-sm-6">
                                  <div className="meta-item d-flex align-items-start">
                                    <div className="meta-icon"><i className="bx bx-box" /></div>
                                    <div>
                                      <div className="meta-label">Item Category</div>
                                      <div className="meta-value">{product.item_category_name}</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {product.item_subcategory_name && (
                                <div className="col-md-6 col-sm-6">
                                  <div className="meta-item d-flex align-items-start">
                                    <div className="meta-icon"><i className="bx bx-package" /></div>
                                    <div>
                                      <div className="meta-label">Item Type</div>
                                      <div className="meta-value">{product.item_subcategory_name}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p>{product.short_description || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="card-footer ps-0 bg-white border-0">
                          <button className="btn btn-orange w-50" onClick={() => setShowModal(true)}>
                            <i className="lni lni-phone pe-2"></i> Enquiry
                          </button>

                          <EnquiryForm
                            show={showModal}
                            onHide={() => setShowModal(false)}
                            productId={`${product.id}`}
                            companyId={`${product.company_id}`}
                            productTitle={`${product.title}`}
                            companyName={`${product.company_name}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              {/* Sidebar column */}
              <div className="col-xl-3 col-lg-4 mb-lg-0 mb-3">
                <div className="card sidebar-company-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <Link to={`/companies/${product.company_slug}`} className="d-block">
                        <div className="sidebar-logo">
                          <ImageFront
                            src={`${ROOT_URL}/${product.company_logo}`}
                            alt={product.company_name}
                            showFallback={true}
                            defaultimg="/company.png"
                            style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                          />
                        </div>
                      </Link>
                      <div className="flex-grow-1">
                        <Link to={`/companies/${product.company_slug}`} className="text-dark text-decoration-none">
                          <h6 className="mb-1">{product.company_name}</h6>
                        </Link>
                        <div className="text-muted small"><i className="bx bx-map me-1" />{product.company_location || 'N/A'}</div>

                        <div className="mt-2 rating-row">
                          <span className="rating-stars" style={{ color: '#f5c518' }}>
                            {[...Array(5)].map((_, i) => (i < Math.round(product.averageRating || 0) ? '★' : '☆')).join('')}
                          </span>
                          <small className="text-muted ms-2">{product.reviews_count ? `(${product.reviews_count})` : ''}</small>
                        </div>

                        {/* phone button removed per request */}
                      </div>
                    </div>

                    <hr />

                    <div className="meta-list">
                      <div className="d-flex align-items-start gap-2 mb-3">
                        <i className="bx bx-calendar text-secondary" />
                        <div>
                          <div className="meta-label">Member Since</div>
                          <div className="meta-value">{timeAgo(product.created_at) || '—'}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-2 mb-3">
                        <i className="bx bx-building text-secondary" />
                        <div>
                          <div className="meta-label">Nature of Business</div>
                          <div className="meta-value">{product.core_activity_name || product.core_activity_name || 'N/A'}</div>
                        </div>
                      </div>

                      {/* GST removed per request */}

                      <div className="mt-2">
                        <Link to={`/companies/${product.company_slug}`} className="view-company-link text-decoration-none">View Company Details →</Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separate compact Register CTA card below the sidebar company card */}
                <div className="card mt-3 shadow-sm list-cta-small">
                  <div className="card-body text-center py-3 px-2">
                    <h6 className="mb-1">To List your Product</h6>
                    <p className="mb-2 text-muted small">Boost Your Business Visibility</p>
                    <Link to="/register" className="btn btn-orange btn-sm">Register Now</Link>
                  </div>
                </div>

              </div>



            </div>
            <div className="col-12">
              <div className='card mt-5'>
                <div className='card-body'>
                  <div className="tabs-container">
                    {/* Tab Navigation */}
                    <ul className="nav nav-tabs border-bottom" role="tablist" style={{ paddingBottom: '1px' }}>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${activeTab === 'productDetails' ? 'active' : ''}`}
                          onClick={() => setActiveTab('productDetails')}
                          type="button"
                          role="tab"
                        >
                          Product Details
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${activeTab === 'companyDetails' ? 'active' : ''}`}
                          onClick={() => setActiveTab('companyDetails')}
                          type="button"
                          role="tab"
                        >
                          Company Details
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                          onClick={() => setActiveTab('reviews')}
                          type="button"
                          role="tab"
                        >
                          Reviews
                        </button>
                      </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content mt-3">
                      {/* Product Details Tab */}
                      {activeTab === 'productDetails' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                          <div className="product-details">
                            <div className="detailhead">
                              <h5 className="">Product Specification:
                              </h5>
                            </div>
                            <div>
                              <div
                                dangerouslySetInnerHTML={{ __html: product.description || 'N/A' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Company Details Tab */}
                      {activeTab === 'companyDetails' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                          <div className="company-details">
                            <div className="card p-3">
                              <div className="about-grid-wrap mt-3">
                                <div className="row">
                                  <div className="col-md-3 col-sm-12 d-flex justify-content-center">
                                    {/* left fixed column: logo + short info (keeps same markup) */}
                                    <div className="company-left-col text-center">
                                      <div className="companydetailimg mb-2">
                                        <ImageFront
                                          src={`${ROOT_URL}/${product.company_logo}`}
                                          alt={product.company_name}
                                          showFallback={true}
                                          defaultimg="/company.png"
                                        />
                                      </div>
                                      <div className="small-meta">
                                        <div className="rating-line">{product.averageRating ? `${product.averageRating}/5` : ''} <span className="stars">{product.averageRating ? '★★★★★'.slice(0, Math.round(product.averageRating)) : ''}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-md-9 col-sm-12">
                                    <div className="company-header mb-2">
                                      <h5 className="mb-1">{product.company_name}</h5>
                                      <div className="text-muted small"><i className="bx bx-map me-1" />{product.company_location || 'N/A'}</div>
                                    </div>

                                    <div className="about-grid">
                                      <div className="about-item">
                                        <div className="about-icon"><i className="bx bx-globe" aria-hidden="true" /></div>
                                        <div className="about-content">
                                          <div className="about-label">Website</div>
                                          <div className="about-value"><a href={product.company_website?.startsWith('http') ? product.company_website : `https://${product.company_website}`} target="_blank" rel="noreferrer">{product.company_website || "N/A"}</a></div>
                                        </div>
                                      </div>

                                      <div className="about-item">
                                        <div className="about-icon"><i className="bx bx-briefcase" aria-hidden="true" /></div>
                                        <div className="about-content">
                                          <div className="about-label">Core Activity</div>
                                          <div className="about-value">{product.core_activity_name || "N/A"}</div>
                                        </div>
                                      </div>

                                      <div className="about-item">
                                        <div className="about-icon"><i className="bx bx-cog" aria-hidden="true" /></div>
                                        <div className="about-content">
                                          <div className="about-label">Activity</div>
                                          <div className="about-value">{product.activity_name || "N/A"}</div>
                                        </div>
                                      </div>

                                      <div className="about-item">
                                        <div className="about-icon"><i className="bx bx-category" aria-hidden="true" /></div>
                                        <div className="about-content">
                                          <div className="about-label">Category</div>
                                          <div className="about-value">{product.category_name || "N/A"}</div>
                                        </div>
                                      </div>

                                      <div className="about-item">
                                        <div className="about-icon"><i className="bx bx-list-ul" aria-hidden="true" /></div>
                                        <div className="about-content">
                                          <div className="about-label">Sub Category</div>
                                          <div className="about-value">{product.sub_category_name || "N/A"}</div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="about-description mt-3">
                                      <p className="mb-2">{product.brief_company || ""}</p>
                                      <p className="text-muted" dangerouslySetInnerHTML={{ __html: product.organizations_product_description || "" }} />
                                    </div>

                                    {/* Removed Member Since, Nature of Business, GST No., Enquiry button and company CTAs per request */}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reviews Tab */}
                      {activeTab === 'reviews' && (
                        <div className="tab-pane fade show active" role="tabpanel">
                          <div className="reviews">
                            <h5 className="">Reviews</h5>
                            <div className="reviewSection text-start">
                              <form onSubmit={handleSubmit}>
                                <label className="form-label mt-2 mb-0">Rating</label>
                                <div className="d-flex">
                                  {renderReviewStars()}
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
                                    required
                                  ></textarea>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                  {loading ? "Submitting..." : "Submit"}
                                </button>
                              </form>

                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section >
        <div className="product-detail-container companyProducts">
          <div className="container-xl">
            {product?.similar_products?.length > 0 && (
          <div className="companyProducts">
            <h2 className="color-primary">Similar Products</h2>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={20}
              navigation
              watchOverflow={true}
              slidesPerView={4}
              slidesPerGroup={1}
              loop={product?.similar_products && product.similar_products.length > 4}
              loopFillGroupWithBlank={false}
              className="similar-products-carousel"
              style={{ padding: "20px 0" }}
              breakpoints={{
                0: { slidesPerView: 1, slidesPerGroup: 1 },
                576: { slidesPerView: 2, slidesPerGroup: 1 },
                768: { slidesPerView: 3, slidesPerGroup: 1 },
                1200: { slidesPerView: 4, slidesPerGroup: 1 },
              }}
            >
              {product.similar_products.map((similar) => (
                <SwiperSlide key={similar.id}>
                  <div className="productBox productBoxswiper p-3 bg-white">
                    <div className="middlepro">
                      <div className="ProImg ProImgDetail">
                        <ImageFront
                          src={`${ROOT_URL}/${similar.file_name}`}
                          width={180}
                          height={180}
                          showFallback
                        />
                      </div>
                      <div className="productlink">
                        <p className="mb-0 title-clamp">{similar.title}</p>
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
        )}

          </div>


           {/* Recommended Companies */}
        {product?.recommended_companies?.length > 0 && (
         <div className='container'>
              <div className="similerCompany mt-lg-5 mt-3">
            <h2 className="color-primary">Recommended Companies</h2>
            <Swiper
              modules={[Navigation, Pagination]}
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
              {product.recommended_companies.map((item) => (
                <SwiperSlide key={item.id} className="bg-white border rounded p-2 text-center">
                  <div className='productContainer'>
                    <Link to={`/companies/${item.organization_slug}`}>
                      <div className="recLogoWrap">
                        <ImageFront
                          src={`${ROOT_URL}/${item.company_logo_file}`}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" className="filtersvg" aria-hidden="true"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z"></path></svg>
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            </div>
            </div>
        )}

        </div>
      </Suspense >
    </>
  );
};

export default ProductDetail;