import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config'; // Assuming you have ROOT_URL for images
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import '../assets/css/companydetails.css';
import '../assets/css/product-detail.css';
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
import GlobalSeo from '../utils/GlobalSeo';

const ProductDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const thumbsSwiper = useRef(null); // Correct use of useRef
  const { showNotification } = useAlert();
  // ⭐ Review form state
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [quoteQty, setQuoteQty] = useState("");
  const [sellerProducts, setSellerProducts] = useState([]);
  const [sharePhone, setSharePhone] = useState("");
  const [shareQty, setShareQty] = useState("");
  const [relatedCategories, setRelatedCategories] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [currentItemTypes, setCurrentItemTypes] = useState([]);
  const [siblingItemSubcategories, setSiblingItemSubcategories] = useState([]);
  const [loadingItemCategories, setLoadingItemCategories] = useState(false);
  const [allowedItemCategoryIds, setAllowedItemCategoryIds] = useState([]);
  const [filteredRecommendedCompanies, setFilteredRecommendedCompanies] = useState([]);
  const { user } = UseAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/details/${slug}`);

        setProduct(res.data);
        setShowSkeleton(false);
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

  useEffect(() => {
    if (!product?.company_slug) return;
    axios.get(`${API_BASE_URL}/products/companies/${product.company_slug}`)
      .then(res => setSellerProducts((res.data?.products || []).filter(p => p.slug !== slug).slice(0, 8)))
      .catch(() => { });
  }, [product?.company_slug, slug]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1&limit=40`)
      .then(res => setPopularCategories(res.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const loadCurrentItemTypes = async () => {
      const categoryId = product?.category_id || product?.category || product?.categoryId;
      const subCategoryId = product?.sub_category_id || product?.subcategory_id || product?.subCategoryId;
      const itemCategoryId = product?.item_category_id || product?.itemCategoryId;

      if (!categoryId || !subCategoryId || !itemCategoryId) {
        setCurrentItemTypes([]);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory-all/${categoryId}/${subCategoryId}/${itemCategoryId}`
        );

        const itemSubCategories = Array.isArray(res.data)
          ? res.data
          : (
            res.data?.item_sub_categories ||
            res.data?.itemSubCategories ||
            res.data?.item_categories ||
            res.data?.itemCategories ||
            res.data?.data ||
            []
          );

        console.log("Fetched current item types:", itemSubCategories);

        setCurrentItemTypes(itemSubCategories);
      } catch (error) {
        console.error("Error fetching current item types:", error);
        setCurrentItemTypes([]);
      }
    };

    if (product) loadCurrentItemTypes();
  }, [product]);

  useEffect(() => {
    const loadItemCategories = async () => {
      const categoryId = product?.category_id || product?.category || product?.categoryId;
      const subCategoryId = product?.sub_category_id || product?.subcategory_id || product?.subCategoryId;
      const itemCategoryId = product?.item_category_id || product?.itemCategoryId;
      const currentItemSubCategoryId = product?.item_subcategory_id || product?.itemSubcategoryId;

      if (!categoryId || !subCategoryId || !itemCategoryId) {
        setSiblingItemSubcategories([]);
        return;
      }

      setLoadingItemCategories(true);
      try {
        const subCategoryRes = await axios.get(
          `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory-all/${categoryId}/${subCategoryId}/${itemCategoryId}`
        );

        const itemSubCategories = Array.isArray(subCategoryRes.data)
          ? subCategoryRes.data
          : (subCategoryRes.data?.item_sub_categories || subCategoryRes.data?.item_categories || []);

        const siblingSubCategories = itemSubCategories
          .filter((item) => String(item.id) !== String(currentItemSubCategoryId))
          .filter((item) => Number(item.product_count || 0) > 0);

        setSiblingItemSubcategories(siblingSubCategories);
      } catch (error) {
        console.error("Error fetching item subcategory groups:", error);
        setSiblingItemSubcategories([]);
      } finally {
        setLoadingItemCategories(false);
      }
    };

    if (product) loadItemCategories();
  }, [product]);

  useEffect(() => {
    const loadPriorityItemCategory = async () => {
      const categoryId = product?.category_id || product?.category || product?.categoryId;
      const subCategoryId = product?.sub_category_id || product?.subcategory_id || product?.subCategoryId;
      const itemSubCategoryId = product?.item_subcategory_id || product?.itemSubcategoryId;

      if (!categoryId || !subCategoryId || !itemSubCategoryId) {
        setAllowedItemCategoryIds([]);
        return;
      }

      try {
        const [itemSubCategoryRes, itemCategoryRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/item_sub_category/${itemSubCategoryId}`),
          axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${categoryId}/${subCategoryId}`),
        ]);

        const itemSubCategory = itemSubCategoryRes.data || {};
        const itemCategories = Array.isArray(itemCategoryRes.data)
          ? itemCategoryRes.data
          : (itemCategoryRes.data?.item_categories || []);

        const priorityItemCategoryId =
          itemSubCategory.priority_item_category_id ||
          itemSubCategory.priorityItemCategoryId ||
          product?.priority_item_category_id ||
          product?.priorityItemCategoryId ||
          product?.item_category_id ||
          product?.itemCategoryId;

        const priorityIndex = itemCategories.findIndex(
          (item) => String(item.id) === String(priorityItemCategoryId)
        );

        const allowedIds = priorityIndex >= 0
          ? itemCategories.slice(0, priorityIndex + 1).map((item) => item.id)
          : (priorityItemCategoryId ? [priorityItemCategoryId] : itemCategories.map((item) => item.id));

        setAllowedItemCategoryIds(allowedIds);
      } catch (error) {
        console.error("Error loading priority item category:", error);
        setAllowedItemCategoryIds([]);
      }
    };

    if (product) loadPriorityItemCategory();
  }, [product]);

  useEffect(() => {
    const loadRecommendedCompanies = async () => {
      const sourceCompanies = Array.isArray(product?.recommended_companies) ? product.recommended_companies : [];
      const currentItemSubcategoryId = product?.item_subcategory_id || product?.itemSubcategoryId;

      if (!sourceCompanies.length || !currentItemSubcategoryId) {
        setFilteredRecommendedCompanies([]);
        return;
      }

      try {
        const companyChecks = await Promise.all(
          sourceCompanies.map(async (company) => {
            if (!company?.organization_slug) return null;

            try {
              const res = await axios.get(`${API_BASE_URL}/products/companies/${company.organization_slug}`);
              const products = Array.isArray(res.data?.products) ? res.data.products : [];

              const hasMatchingProduct = products.some((item) => {
                const itemSubcategoryId = item?.item_subcategory_id || item?.itemSubcategoryId;
                const itemCategoryId = item?.item_category_id || item?.itemCategoryId;

                if (String(itemSubcategoryId) !== String(currentItemSubcategoryId)) return false;

                if (allowedItemCategoryIds.length > 0) {
                  return allowedItemCategoryIds.some((allowedId) => String(allowedId) === String(itemCategoryId));
                }

                return true;
              });

              return hasMatchingProduct ? company : null;
            } catch (error) {
              return null;
            }
          })
        );

        setFilteredRecommendedCompanies(companyChecks.filter(Boolean));
      } catch (error) {
        console.error("Error filtering recommended companies:", error);
        setFilteredRecommendedCompanies([]);
      }
    };

    if (product) loadRecommendedCompanies();
  }, [product, allowedItemCategoryIds]);

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



  // Combine main file_name with images array; use fallbacks to avoid exceptions
  const allImages = (() => {
    const imgs = Array.isArray(product?.images) ? product.images : [];
    if (product?.file_name) return [{ file: product.file_name, id: 'main' }, ...imgs];
    return imgs;
  })();

  const currentItemSubcategoryId = product?.item_subcategory_id || product?.itemSubcategoryId;
  const currentItemCategoryId = product?.item_category_id || product?.itemCategoryId;
  const currentCategoryId = product?.category_id || product?.category || product?.categoryId;
  const currentSubCategoryId = product?.sub_category_id || product?.subcategory_id || product?.subCategoryId;
  const priorityItemCategoryId =
    product?.priority_item_category_id ||
    product?.priorityItemCategoryId ||
    product?.priority_item_category ||
    product?.priorityItemCategory;

  const similarProducts = (Array.isArray(product?.similar_products) ? product.similar_products : [])
    .filter((item) => {
      if (!currentItemSubcategoryId) return true;
      const itemSubcategoryId = item?.item_subcategory_id || item?.itemSubcategoryId;
      return String(itemSubcategoryId) === String(currentItemSubcategoryId);
    })
    .filter((item) => {
      const itemCategoryId = item?.item_category_id || item?.itemCategoryId;

      if (allowedItemCategoryIds.length > 0) {
        return allowedItemCategoryIds.some((allowedId) => String(allowedId) === String(itemCategoryId));
      }

      if (currentItemCategoryId) {
        return String(itemCategoryId) === String(currentItemCategoryId);
      }

      return true;
    });

  const recommendedCompanies = (filteredRecommendedCompanies.length > 0
    ? filteredRecommendedCompanies
    : (Array.isArray(product?.recommended_companies) ? product.recommended_companies : [])
  ).filter((item) => item?.company_logo_file);

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

  return (
    <>

      <section className="productDetail pt-2 pb-4">
        <div className="container-fluid px-4">

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item"><a href="/" className="text-decoration-none">Home</a></li>
              <li className="breadcrumb-item"><a href="/products" className="text-decoration-none">Products</a></li>
              <li className="breadcrumb-item active" aria-current="page">{product.title}</li>
            </ol>
          </nav>

          <div className="row g-3 pd-main-row">

            {/* ── LEFT: Sticky image gallery ── */}
            <div className="col-xl-3 col-lg-4 col-md-5">
              <div className="pd-img-sticky">
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
            </div>

            {/* ── CENTER: Scrollable content ── */}
            <div className="col-xl-6 col-lg-5 col-md-7">
              <div className="pd-center-col">

                <h4 className="text-orange fw-bold mb-2">{product.title}</h4>

                {/* Sold By */}
                {product.company_name && (
                  <p className="mb-3 text-secondary" style={{ fontSize: 14 }}>
                    Sold By&nbsp;:&nbsp;
                    <Link to={`/companies/${product.company_slug}`} className="fw-semibold text-dark text-decoration-none">{product.company_name}</Link>
                  </p>
                )}

                {/* Send Inquiry — top CTA */}
                <button className="btn btn-orange px-5 py-2 mb-4" style={{ borderRadius: 50 }} onClick={() => setShowModal(true)}>
                  <i className="bx bx-phone pe-2" /> Send Inquiry
                </button>

                <EnquiryForm
                  show={showModal}
                  onHide={() => setShowModal(false)}
                  productId={`${product.id}`}
                  companyId={`${product.company_id}`}
                  productTitle={`${product.title}`}
                  companyName={`${product.company_name}`}
                />

                {/* Specs Table */}
                {(product.category_name || product.sub_category_name || product.item_category_name || product.item_subcategory_name || product.core_activity_name) && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Product Specifications</h6>
                    <table className="pd-spec-table">
                      <tbody>
                        {product.category_name && <tr><td className="spec-key">Category</td><td className="spec-val">{product.category_name}</td></tr>}
                        {product.sub_category_name && <tr><td className="spec-key">Sub Category</td><td className="spec-val">{product.sub_category_name}</td></tr>}
                        {product.item_category_name && <tr><td className="spec-key">Item Category</td><td className="spec-val">{product.item_category_name}</td></tr>}
                        {product.item_subcategory_name && <tr><td className="spec-key">Item Type</td><td className="spec-val">{product.item_subcategory_name}</td></tr>}
                        {product.core_activity_name && <tr><td className="spec-key">Nature of Business</td><td className="spec-val">{product.core_activity_name}</td></tr>}
                        {product.company_website && (
                          <tr>
                            <td className="spec-key">Website</td>
                            <td className="spec-val">
                              <a href={product.company_website?.startsWith('http') ? product.company_website : `https://${product.company_website}`} target="_blank" rel="noreferrer">{product.company_website}</a>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Product Overview */}
                {product.short_description && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Product Overview</h6>
                    <p className="text-secondary mb-0" style={{ lineHeight: '1.7' }}>{product.short_description}</p>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Additional Information</h6>
                    <div className="pd-description" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </div>
                )}



                {/* ── removed duplicate EnquiryForm; single instance above ── */}

                {/* Interested in this product? banner */}
                <div className="pd-interested-banner mb-4">
                  <div className="pd-ib-text">
                    <h6>Interested in this product?</h6>
                    <p>Ask for more details &amp; Latest Price from seller</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>Send Inquiry</button>
                </div>

                {/* Product Images grid */}
                {allImages.length > 1 && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Product Images</h6>
                    <div className="pd-images-grid">
                      {allImages.map((image, index) => (
                        <div key={image.id || index} className="pd-img-thumb">
                          <ImageFront
                            src={`${ROOT_URL}/${image.file}`}
                            alt={`${product.title} ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            showFallback={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(loadingItemCategories || siblingItemSubcategories.length > 0) && (
                  <div className="mb-4 pd-sibling-panel">
                    <div className="pd-sibling-head">
                      <h6 className="mb-0">Browse Related Categories</h6>
                    </div>
                    {loadingItemCategories ? (
                      <p className="text-secondary mb-0 px-3 pb-3">Loading item subcategories...</p>
                    ) : (
                      <div className="pd-sibling-grid">
                        {siblingItemSubcategories.map((item) => (
                          <a
                            key={item.id}
                            href={`/products?category_id=${product.category_id || product.category}&subcategory_id=${product.sub_category_id || product.subcategory_id}&item_category_id=${product.item_category_id || product.itemCategoryId}&item_subcategory_id=${item.id}`}
                            className="pd-sibling-card text-decoration-none"
                          >
                            <div className="pd-sibling-thumb">
                              <img
                                src={item.file_name ? `${ROOT_URL}/${item.file_name}` : "/default.png"}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/default.png";
                                }}
                              />
                            </div>
                            <div className="pd-sibling-name">
                              <span title={item.name}>{item.name}</span>
                              {Number(item.product_count || 0) > 0 && (
                                <small>({item.product_count})</small>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Company Overview */}
                {(product.brief_company || product.organizations_product_description) && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Company Overview</h6>
                    {product.brief_company && <p className="text-secondary mb-2">{product.brief_company}</p>}
                    {product.organizations_product_description && (
                      <div className="text-secondary" dangerouslySetInnerHTML={{ __html: product.organizations_product_description }} />
                    )}
                  </div>
                )}

                {/* Ratings & Reviews */}
                {Number(product.reviews_count || 0) > 0 && (
                  <div className="mb-4">
                    <h6 className="pd-section-title">Ratings &amp; Reviews</h6>

                    <div className="pd-rating-summary">
                      <div className="pd-overall-rating">
                        <div className="pd-rbox-header">
                          <span className="pd-rbox-dot" />
                          <span>Overall Rating</span>
                        </div>

                        <div className="pd-rbox-body">
                          <div className="pd-rating-num">
                            {avgRating > 0 && (
                              <>
                                {avgRating.toFixed(1)}
                                <span className="pd-of5">/5</span>
                              </>
                            )}
                          </div>

                          <div className="pd-rating-stars">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                style={{
                                  color:
                                    i < fullStars ||
                                      (i === fullStars && hasHalfStar)
                                      ? '#f5a623'
                                      : '#ddd'
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>

                          <div className="pd-rating-count">
                            Reviewed by {product.reviews_count} Users
                          </div>

                          <button
                            className="btn btn-outline-primary btn-sm mt-2 rounded-pill px-3"
                            onClick={() => setShowReviewModal(true)}
                          >
                            Write a Review
                          </button>
                        </div>
                      </div>

                      <div className="pd-satisfaction">
                        <div className="pd-rbox-header">
                          <span className="pd-rbox-dot" />
                          <span>User Satisfaction</span>
                        </div>

                        <div className="pd-rbox-body">
                          <div className="pd-sat-circles">
                            {[
                              ['Response', avgRating * 20],
                              ['Quality', avgRating * 20],
                              ['Delivery', avgRating * 20]
                            ].map(([label, pct]) => (
                              <div className="pd-sat-circle" key={label}>
                                {/* existing SVG */}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ── RIGHT: Sticky sidebar ── */}
            <div className="col-xl-3 col-lg-3 col-md-12">
              <div className="pd-sidebar-sticky">
                <div className="card sidebar-company-card">
                  <div className="card-body">
                    <div className="sidebar-company-head mb-3">
                      <Link to={`/companies/${product.company_slug}`} className="d-block">
                        <div className="sidebar-logo">
                          <ImageFront
                            src={`${ROOT_URL}/${product.company_logo}`}
                            alt={product.company_name}
                            showFallback={true}
                            defaultimg="/company.png"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid #eee' }}
                          />
                        </div>
                      </Link>
                      <div className="flex-grow-1">
                        <Link to={`/companies/${product.company_slug}`} className="text-dark text-decoration-none">
                          <h6 className="sidebar-company-name mb-1">{product.company_name}</h6>
                        </Link>
                        <div className="sidebar-company-location text-muted small"><i className="bx bx-map me-1" />{product.company_location || 'N/A'}</div>
                        <div className="mt-2 rating-row">
                          <span className="rating-stars" style={{ color: '#f5c518' }}>
                            {[...Array(5)].map((_, i) => (i < Math.round(product.averageRating || 0) ? '★' : '☆')).join('')}
                          </span>
                          <small className="text-muted ms-2">{product.reviews_count ? `(${product.reviews_count})` : ''}</small>
                        </div>
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
                          <div className="meta-value">{product.core_activity_name || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Link to={`/companies/${product.company_slug}`} className="view-company-link text-decoration-none">View Company Details →</Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pd-quote-widget">
                  <p className="pd-qw-title">Looking for <span>{product.title}?</span></p>
                  <label>Quantity</label>
                  <div className="pd-qty-row">
                    <input type="number" className="form-control" placeholder="Qty" value={quoteQty} onChange={e => setQuoteQty(e.target.value)} min="1" />
                    <input type="text" className="form-control" placeholder="Unit" defaultValue="Piece" />
                  </div>
                  <button className="btn-get-quote" onClick={() => setShowModal(true)}>Get Quote Now</button>
                </div>

                <div className="card mt-3 shadow-sm pd-boost-card">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-start justify-content-between">
                      <div>
                        <p className="mb-1" style={{ fontSize: 13, color: '#444' }}>Boost Business <span style={{ fontSize: 16 }}>⚡</span></p>
                        <h5 className="fw-bold mb-1" style={{ color: '#1a2233', lineHeight: 1.2 }}>Growth 10X<br />Faster</h5>
                        <p className="mb-3" style={{ fontSize: 12, color: '#6c7a94' }}>🚀 More Leads, More Buyers. More Growth.</p>
                      </div>
                      <span style={{ fontSize: 32 }}>🏪</span>
                    </div>
                    <Link to="/registration" className="btn btn-sm w-100 pd-boost-btn">Sell on Source India →</Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Share Requirements — full width between 3-col and carousels */}
      <div className="container-fluid px-4 py-0">
        <div className="row g-3">
          <div className="col-9">
            <div className="pd-share-form">
              <div className="pd-sf-header">
                <span>Share your requirements for a quick response!</span>
                <span className="pd-sf-badge">Save Your Time ▼</span>
              </div>
              <div className="pd-sf-body">
                <div className="mb-3">
                  <label className="form-label small">Looking for</label>
                  <input type="text" className="form-control" defaultValue={product.title} readOnly />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Quantity</label>
                    <div className="input-group">
                      <input type="number" className="form-control" placeholder="" value={shareQty} onChange={e => setShareQty(e.target.value)} min="1" />
                      <span className="input-group-text">Unit of Measurement</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Your Mobile No.</label>
                    <div className="input-group">
                      <span className="input-group-text">🇮🇳 +91</span>
                      <input type="tel" className="form-control" placeholder="Mobile No." value={sharePhone} onChange={e => setSharePhone(e.target.value)} maxLength={10} />
                    </div>
                  </div>
                </div>
                <div className="text-start">
                  <button className="btn btn-primary px-5 py-2" onClick={() => setShowModal(true)}>Get Quotes Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="product-detail-container companyProducts">
        <div className="container-fluid px-4">

          {/* More Products From This Seller */}
          {sellerProducts.length > 0 && (
            <div className="pd-seller-products">
              <h2>More Products From This Seller</h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                navigation
                watchOverflow={true}
                loop={sellerProducts.length > 4}
                className="similar-products-carousel"
                style={{ padding: '20px 0' }}
                breakpoints={{
                  0: { slidesPerView: 1 },
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1200: { slidesPerView: 4 },
                }}
              >
                {sellerProducts.map((sp, index) => (
                  <SwiperSlide key={sp.id}>
                    <div className="productBox productBoxswiper p-3 bg-white">
                      <div className="middlepro">
                        <div className="ProImg ProImgDetail">
                          <ImageFront src={`${ROOT_URL}/${sp.file_name}`} width={180} height={180} loading={index < 2 ? 'eager' : 'lazy'} showFallback />
                        </div>
                        <div className="productlink">
                          <p className="mb-0 title-clamp">{sp.title}</p>
                          <Link to={`/products/${sp.slug}`} className="d-inline-block pt-2 btn btn-primary lh-1 text-white mt-2">
                            <span className="pe-2">View</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" viewBox="4 9.28 23.91 13.44" aria-hidden="true"><path d="M21.188 9.281 19.78 10.72 24.063 15H4v2h20.063l-4.282 4.281 1.407 1.438L27.905 16Z" /></svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {similarProducts.length > 0 && (
            <div className="companyProducts">
              <h2 className="color-primary">Find Similar Products</h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                navigation
                watchOverflow={true}
                slidesPerView={4}
                slidesPerGroup={1}
                loop={similarProducts.length > 4}
                className="similar-products-carousel"
                style={{ padding: "20px 0" }}
                breakpoints={{
                  0: { slidesPerView: 1, slidesPerGroup: 1 },
                  576: { slidesPerView: 2, slidesPerGroup: 1 },
                  768: { slidesPerView: 3, slidesPerGroup: 1 },
                  1200: { slidesPerView: 4, slidesPerGroup: 1 },
                }}
              >
                {similarProducts.map((similar, index) => (
                  <SwiperSlide key={similar.id}>
                    <div className="productBox productBoxswiper p-3 bg-white">
                      <div className="middlepro">
                        <div className="ProImg ProImgDetail">
                          <ImageFront
                            src={`${ROOT_URL}/${similar.file_name}`}
                            width={180}
                            height={180}
                            loading={index < 2 ? 'eager' : 'lazy'}
                            fetchPriority={index < 2 ? 'high' : 'auto'}
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
        {recommendedCompanies.length > 0 && (
          <div className='container-fluid px-4'>
            <div className="similerCompany mt-lg-5 mt-3">
              <h2 className="color-primary">Recommended Companies</h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                navigation
                watchOverflow={true}
                loop={recommendedCompanies.length > 5}
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
                {recommendedCompanies.map((item, index) => (
                  <SwiperSlide key={item.id} className="bg-white border rounded p-2 text-center">
                    <div className='productContainer'>
                      <Link to={`/companies/${item.organization_slug}`}>
                        <div className="recLogoWrap">
                          <ImageFront
                            src={`${ROOT_URL}/${item.company_logo_file}`}
                            width={180}
                            height={180}
                            loading={index < 2 ? 'eager' : 'lazy'}
                            fetchPriority={index < 2 ? 'high' : 'auto'}
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

      {/* Browse Related Categories */}
      {true && (
        <div className="container-fluid px-4 py-4">
          <h5 className="pd-section-title mb-4">Item Subcategories</h5>
          {currentItemTypes.length > 0 ? (
            <div className="pd-related-grid">
              {currentItemTypes.map((cat) => (
                <Link key={cat.id} to={`/products?category_id=${product.category_id || product.category}&subcategory_id=${product.sub_category_id || product.subcategory_id}&item_category_id=${product.item_category_id || product.itemCategoryId}&item_subcategory_id=${cat.id}`} className="pd-rel-cat-card text-decoration-none">
                  <div className="pd-rel-cat-img">
                    <ImageFront src={`${ROOT_URL}/${cat.file_name || cat.image}`} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} showFallback />
                  </div>
                  <span className="pd-rel-cat-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-muted px-1">No item subcategories found for this item category.</div>
          )}
          <div className="mt-3 p-3 border rounded bg-light small text-muted">
            <div><strong>Debug:</strong> category_id = {String(currentCategoryId || "-")}, sub_category_id = {String(currentSubCategoryId || "-")}, item_category_id = {String(currentItemCategoryId || "-")}, item_subcategory_id = {String(currentItemSubcategoryId || "-")}</div>
            <div className="mt-1">Fetched item subcategories: {currentItemTypes.length}</div>
          </div>
        </div>
      )}

      {/* Popular Categories */}
      {popularCategories.length > 0 && (
        <div className="container-fluid px-4 pb-5">
          <h5 className="pd-pop-cats-title">Popular Categories</h5>
          <div className="pd-pop-cats">
            {popularCategories.map((cat) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} className="pd-pop-cat-tag text-decoration-none">{cat.name}</Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Write a Review Modal ── */}
      {showReviewModal && (
        <div className="pd-rm-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowReviewModal(false); }}>
          <div className="pd-rm-dialog">
            <div className="pd-rm-modal">

              {/* Navy header */}
              <div className="pd-rm-head">
                <div className="pd-rm-head-icon"><i className="bx bxs-star" /></div>
                <div className="pd-rm-head-text">
                  <p className="pd-rm-head-label">Rate your Experience with</p>
                  <h5 className="pd-rm-head-company">{product.company_name}</h5>
                </div>
                <button className="pd-rm-x" onClick={() => setShowReviewModal(false)} aria-label="Close">&#10005;</button>
              </div>

              <div className="pd-rm-subheader">
                <i className="bx bx-info-circle me-1" />
                To submit your ratings, please provide the following information
              </div>

              {/* Body */}
              <div className="pd-rm-body">
                <form onSubmit={e => { handleSubmit(e); setShowReviewModal(false); }}>

                  <div className="pd-rm-field">
                    <label className="pd-rm-label">Select product / service</label>
                    <select className="pd-rm-select">
                      <option value={product.id}>{product.title}</option>
                    </select>
                  </div>

                  <div className="pd-rm-field">
                    <label className="pd-rm-label">Your Rating</label>
                    <div className="pd-rm-stars">
                      {[...Array(5)].map((_, index) => {
                        const val = index + 1;
                        return (
                          <span key={val}
                            className={`pd-rm-star${val <= (hover || rating) ? ' active' : ''}`}
                            onClick={() => setRating(val)}
                            onMouseEnter={() => setHover(val)}
                            onMouseLeave={() => setHover(0)}>
                            &#9733;
                          </span>
                        );
                      })}
                      {rating > 0 && <span className="pd-rm-rating-text">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</span>}
                    </div>
                  </div>

                  <div className="pd-rm-field">
                    <label className="pd-rm-label">What did you Like?</label>
                    <div className="pd-rm-like-row">
                      {['Response', 'Quality', 'Delivery'].map(label => (
                        <div key={label} className="pd-rm-like-group">
                          <span className="pd-rm-like-label">{label}</span>
                          <div className="pd-rm-like-btns">
                            <button type="button" className="pd-rm-like-btn like"><i className="bx bx-like" /> Yes</button>
                            <button type="button" className="pd-rm-like-btn dislike"><i className="bx bx-dislike" /> No</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pd-rm-field">
                    <label className="pd-rm-label">Write your Review</label>
                    <textarea className="pd-rm-textarea" rows="4"
                      placeholder="Share your experience in detail... (minimum 20 characters)"
                      value={review} onChange={e => setReview(e.target.value)}
                      required minLength={20} />
                    <span className="pd-rm-char-count">{review.length} / 20 min</span>
                  </div>

                  <button type="submit" className="pd-rm-submit" disabled={loading}>
                    {loading
                      ? <><i className="bx bx-loader-alt bx-spin me-2" />Submitting...</>
                      : <><i className="bx bxs-send me-2" />Submit Review</>
                    }
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ProductDetail;
