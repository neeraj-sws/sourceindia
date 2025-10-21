import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config'; // Assuming you have ROOT_URL for images
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Pagination } from 'swiper/modules'; // Removed Zoom module, added Thumbs
import 'swiper/css'; // Core Swiper styles
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import ImageFront from "../admin/common/ImageFront";
import { Link } from "react-router-dom";
import { useAlert } from "../context/AlertContext";

const ProductDetail = () => {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const thumbsSwiper = useRef(null); // Correct use of useRef
  const [activeTab, setActiveTab] = useState('productDetails'); // Manage active tab
  const { showNotification } = useAlert();
  // ⭐ Review form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${slug}`);
        setProduct(res.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };
    fetchProduct();
  }, [slug]);

  if (!product) return <div>Loading...</div>;

  // Combine main file_name with images array
  const allImages = product.file_name
    ? [{ file: product.file_name, id: 'main' }, ...product.images]
    : product.images;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!review.trim()) {
      alert("Please enter your review.");
      return;
    }
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/products/company-review`, {
        product_id: product.id,
        company_id: product.company_id,
        user_id: 2021, // replace with logged-in user ID if available
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

  return (
    <>
      <section className="productDetail py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-9">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <div className="col-5">
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
                    <div className="col-7">
                      <div className="product-details">
                        <div className="detailhead">
                          <h4 className="text-orange">{product.title}</h4>
                        </div>
                        <table className="table productTable">
                          <tbody>
                            <tr>
                              <th>Category</th>
                              <td>{product.category_name || 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Sub Category</th>
                              <td>{product.sub_category_name || 'N/A'}</td>
                            </tr>
                            <tr>
                              <th>Color</th>
                              <td>{product.color_name || 'N/A'}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div>
                          <p>{product.short_description || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="mb-3">
                    <h6 className="mb-3">{product.company_name}</h6>
                    <div className='text-center border rounded-2'>
                      <ImageFront
                        src={`${ROOT_URL}/${product.company_logo}`}
                        alt={`${product.title}`}

                        style={{
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'cover',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                        showFallback={true}
                        className=""
                        defaultimg="/company.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="card-footer pt-0 bg-white border-0">
                  <button className="btn btn-orange w-100">
                    <i className="lni lni-phone pe-2"></i> Enquiry
                  </button>
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
                          <h5>About the Company:
                          </h5>
                          <div className="mb-3">
                            <table className="table productTable">
                              <tbody>
                                <tr>
                                  <th>Company Name</th>
                                  <td>{product.company_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th>Sub Category</th>
                                  <td>{product.sub_category_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th>Activity</th>
                                  <td>{product.activity_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th>Core Activity	</th>
                                  <td>{product.core_activity_name || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <th>Location</th>
                                  <td>{product.company_location || 'N/A'}</td>
                                </tr>
                              </tbody>
                            </table>
                            <div className='companyInfo mt-4'>
                              <h5>Company Details:</h5>
                              <div
                                dangerouslySetInnerHTML={{ __html: product.brief_company || 'N/A' }}
                              />
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
      <div className="product-detail-container">
        <div className="container">
          <h2 className="color-primary">Similar Products</h2>
          <Swiper
            modules={[Navigation, Pagination]}
            slidesPerView={3} // Display 3 items at a time
            spaceBetween={20} // Space between slides
            navigation={true} // Enable navigation arrows

            loop={false} // Infinite loop
            className="similar-products-carousel"
            style={{ padding: '20px 0' }} // Optional padding for better spacing
          >
            {product.similar_products.map((similar) => (
              <SwiperSlide key={similar.id}>
                <div className="mb-4">
                  <div className="productBox p-3 bg-white">

                    <div className="middlepro">
                      <div className="ProImg">
                        <ImageFront
                          src={`${ROOT_URL}/${similar.file_name}`}
                          width={180}
                          height={180}
                          showFallback={true}
                        />
                      </div>
                      <div className="productlink">
                        <div className="">
                          <div className="cateproduct">
                            <h6 className={!similar.category_name ? "mb-0" : "mb-1"}>
                              {similar.category_name || ""}
                            </h6>
                          </div>

                          <p className="mb-0">{similar.title}</p>
                        </div>
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
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Recommended Companies Section */}
        <div className="recommended-companies">

          <div className='container'>
            <h2 className="color-primary">Recommended Companies</h2>
            <div className="companygrid">
              <Swiper
                modules={[Navigation, Pagination]}
                slidesPerView={5} // Display 3 items at a time
                spaceBetween={20} // Space between slides
                navigation={true} // Enable navigation arrows

                loop={true} // Infinite loop
                className="recommended-companies-carousel"
                style={{ padding: '20px 0' }} // Optional padding for better spacing
              >
                {product.recommended_companies.map((company) => (
                  <SwiperSlide key={company.id} className=' bg-white border rounded p-2 h-100 text-center'>
                    <div className="company-card">
                      <ImageFront
                        src={`${ROOT_URL}/${company.company_logo_file}`}
                        width={180}
                        height={180}
                        showFallback={true}
                      />
                      <p className='mt-3'>{company.organization_name}</p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;