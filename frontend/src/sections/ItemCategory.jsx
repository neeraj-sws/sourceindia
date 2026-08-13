import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";

const ItemCategory = () => {
  const { slug } = useParams();

  const [subcategory, setSubcategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [catProducts, setCatProducts] = useState({});

  // 🟢 Slider arrow states
  const [sliderState, setSliderState] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/item-category?slug=${slug}&page=${page}&limit=8`
        );

        const data = res.data;

        setTimeout(() => {
          if (data && data.subcategory) {
            if (page === 1) {
              setSubcategory(data.subcategory);
            } else {
              setSubcategory((prev) => ({
                ...prev,
                item_categories: [
                  ...(prev?.item_categories || []),
                  ...(data.subcategory.item_categories || []),
                ],
              }));
            }

            setHasMore(data.pagination?.hasMore || false);
          }

          setShowSkeleton(false);
        }, 1000);
      } catch (err) {
        console.error("Error fetching data:", err);
        setShowSkeleton(false);
      }
    };

    fetchData();
  }, [slug, page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  // 🟢 Fetch products for each category
  useEffect(() => {
    const cats = (subcategory?.item_categories || []).filter(
      (cat) => cat.product_count > 0
    );

    if (!cats.length) return;

    let cancelled = false;

    cats.forEach(async (cat) => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products`, {
          params: {
            item_category_id: cat.id,
            category: subcategory.category?.id,
            sub_category: subcategory.id,
            is_delete: 0,
            status: 1,
            is_approve: 1,
            is_front: 1,
            limit: 10,
            sort_by: "newest",
          },
        });

        if (!cancelled) {
          setCatProducts((prev) => ({
            ...prev,
            [cat.id]: res.data.products || [],
          }));
        }
      } catch (err) {
        console.error("Error fetching slider products:", err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [subcategory]);

  // =========================================================
  // 🟢 SLIDER ARROW STATE
  // =========================================================
  const updateSliderState = (catId, slider) => {
    if (!slider) return;

    const isAtStart = slider.scrollLeft <= 1;

    const isAtEnd =
      slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 1;

    const hasOverflow = slider.scrollWidth > slider.clientWidth + 1;

    setSliderState((prev) => ({
      ...prev,
      [catId]: {
        showPrev: hasOverflow && !isAtStart,
        showNext: hasOverflow && !isAtEnd,
      },
    }));
  };

  // 🟢 Check all sliders after products/render/resize
  useEffect(() => {
    const checkAllSliders = () => {
      document
        .querySelectorAll(".latest-product-slider")
        .forEach((slider) => {
          const catId = slider.dataset.catId;

          if (catId) {
            updateSliderState(catId, slider);
          }
        });
    };

    // Wait for DOM/images to settle
    const timer = setTimeout(() => {
      checkAllSliders();
    }, 100);

    window.addEventListener("resize", checkAllSliders);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkAllSliders);
    };
  }, [catProducts]);

  // =========================================================
  // 🟢 SKELETON
  // =========================================================

  const Skeleton = ({ width = "100%", height = "16px", style = {} }) => (
    <div
      style={{
        width,
        height,
        background:
          "linear-gradient(90deg,#e0e0e0 25%,#f5f5f5 37%,#e0e0e0 63%)",
        backgroundSize: "400% 100%",
        animation: "skeleton-loading 1.4s ease infinite",
        borderRadius: "6px",
        ...style,
      }}
    />
  );

  const ItemCategorySkeleton = () => (
    <>
      <style>
        {`
          @keyframes skeleton-loading {
            0% {
              background-position: 100% 50%;
            }

            100% {
              background-position: 0 50%;
            }
          }
        `}
      </style>

      <section className="categorySection py-md-4 pt-2 my-4">
        <div className="container">
          <Skeleton
            height="26px"
            width="250px"
            style={{ marginBottom: 24 }}
          />

          <div className="row g-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="col-6 col-sm-4 col-md-3">
                <div className="card p-3 h-100">
                  <Skeleton
                    height="18px"
                    width="70%"
                    style={{ marginBottom: 12 }}
                  />

                  {[...Array(3)].map((_, j) => (
                    <Skeleton
                      key={j}
                      height="14px"
                      width="80%"
                      style={{ marginBottom: 6 }}
                    />
                  ))}

                  <Skeleton
                    height="90px"
                    style={{ marginTop: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  // =========================================================
  // 🟢 VISIBLE CATEGORY COUNT
  // =========================================================

  const visibleCategoriesCount =
    subcategory?.item_categories?.filter((cat) =>
      (cat.items || []).some((item) => item.product_count > 0)
    ).length || 0;

  if (showSkeleton && page === 1) {
    return <ItemCategorySkeleton />;
  }

  return (
    <section className="categorySection py-md-4 pt-2 my-4">
      <div className="container-xl">

        {/* =====================================================
            BREADCRUMB
        ===================================================== */}

        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">

            <li className="breadcrumb-item">
              <a href="/" className="text-decoration-none">
                Home
              </a>
            </li>

            <li className="breadcrumb-item">
              <a href="/categories" className="text-decoration-none">
                Categories
              </a>
            </li>

            {subcategory?.category && (
              <li className="breadcrumb-item">
                <a
                  href={`/categories/${subcategory.category.slug}`}
                  className="text-decoration-none"
                >
                  {subcategory.category.name}
                </a>
              </li>
            )}

            <li
              className="breadcrumb-item active"
              aria-current="page"
            >
              {subcategory?.name}
            </li>

          </ol>
        </nav>

        <h4 className="fw-semibold mb-4">
          {subcategory?.name}
        </h4>

        {/* =====================================================
            ITEM CATEGORIES
        ===================================================== */}

        <div className="row g-3">

          {subcategory?.item_categories
            ?.filter((cat) => cat.product_count > 0)
            .map((cat) => (

              <div
                key={cat.id}
                className="col-12 text-center"
              >
                <div className="card h-100">

                  <div className="card-body">

                    {/* =================================================
                        CATEGORY TITLE
                    ================================================= */}

                    <a
                      href={`/products?category_id=${subcategory.category.id}&subcategory_id=${subcategory.id}&item_category_id=${cat.id}`}
                      className="d-block text-decoration-none"
                    >
                      <div className="d-flex justify-content-between align-items-start">

                        <h6 className="fw-semibold mb-3">
                          {cat.name} ({cat.product_count})
                        </h6>

                        <span>→</span>

                      </div>
                    </a>

                    <div className="d--flex justify-content-between align-items--center gap-1 gridulimgcontainer">

                      {/* =================================================
                          ITEMS
                      ================================================= */}

                      <div className="row categorylistul">

                        {(cat.items || []).length > 0 ? (

                          cat.items
                            .filter(
                              (item) => item.product_count > 0
                            )
                            .map((item) => (

                              <div
                                key={item.id}
                                className="col-6 col-sm-4 col-md-3 col-lg-2 text-center itemcolblock mb-3"
                              >

                                <div className="border rounded p-3">

                                  <a
                                    href={`/products?category_id=${subcategory.category.id}&subcategory_id=${subcategory.id}&item_category_id=${cat.id}&item_subcategory_id=${item.id}`}
                                  >

                                    <img
                                      src={
                                        item.file_name
                                          ? `${ROOT_URL}/${item.file_name}`
                                          : "/default.png"
                                      }
                                      className="img-fluid rounded mb-2 w-100"
                                      alt={item.name}
                                      style={{
                                        height: "125px",
                                      }}
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "/default.png";
                                      }}
                                    />

                                    <h6 className="small fw-semibold mb-1">
                                      {item.name.length > 45
                                        ? item.name.slice(0, 45) +
                                          "..."
                                        : item.name}
                                    </h6>

                                    {item.product_count > 0 && (
                                      <div className="text-success small">
                                        ({item.product_count})
                                      </div>
                                    )}

                                  </a>

                                </div>

                              </div>

                            ))

                        ) : (

                          <p className="text-muted small">
                            No items found.
                          </p>

                        )}

                      </div>

                      {/* =================================================
                          LATEST PRODUCTS SLIDER
                      ================================================= */}

                      {(catProducts[cat.id] || []).length > 0 && (

                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            background: "#f3f3f3",
                            border: "1px solid #d5d5d5",
                            padding: "8px 10px 10px",
                            marginTop: "5px",
                            boxSizing: "border-box",
                          }}
                        >

                          {/* Internal CSS */}

                          <style>
  {`
    /* =========================
       SLIDER
    ========================= */

    .latest-product-slider {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: smooth;
      width: 100%;
      box-sizing: border-box;

      /* Touch swipe */
      touch-action: pan-x;
      -webkit-overflow-scrolling: touch;

      /* Desktop: scrollbar hidden */
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    /* Chrome / Edge / Safari - Desktop hidden */
    .latest-product-slider::-webkit-scrollbar {
      display: none;
    }


    /* =========================
       CARD HOVER
    ========================= */

    .latest-product-card:hover {
      box-shadow: 0 2px 7px rgba(0, 0, 0, 0.12);
    }


    /* =========================
       DESKTOP
       Arrow visible
       Scrollbar hidden
    ========================= */

    .slider-arrow {
      display: flex;
    }


    /* =========================
       MOBILE / TABLET
       Arrow hidden
       Scrollbar visible
    ========================= */

    @media (max-width: 768px) {

      .slider-arrow {
        display: none !important;
      }

      .latest-product-slider {
        cursor: grab;

        /* Firefox scrollbar */
        scrollbar-width: thin;
        scrollbar-color: #315374 #e5e5e5;
      }

      .latest-product-slider:active {
        cursor: grabbing;
      }

      /* Chrome / Edge / Safari scrollbar */
      .latest-product-slider::-webkit-scrollbar {
        display: block;
        height: 4px;
      }

      .latest-product-slider::-webkit-scrollbar-track {
        background: #e5e5e5;
        border-radius: 10px;
      }

      .latest-product-slider::-webkit-scrollbar-thumb {
        background: #315374;
        border-radius: 10px;
      }

      .latest-product-slider::-webkit-scrollbar-thumb:hover {
        background: #315374;
      }

      .latest-product-card {
        flex: 0 0 220px !important;
      }
    }


    /* =========================
       SMALL MOBILE
    ========================= */

    @media (max-width: 576px) {

      .latest-product-card {
        flex: 0 0 200px !important;
      }

      .latest-product-slider::-webkit-scrollbar {
        height: 4px;
      }
    }
  `}
</style>

                          {/* Heading */}

                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#222",
                              marginBottom: "8px",
                              lineHeight: "18px",
                              textAlign: "left",
                            }}
                          >
                            Latest {cat.name} Products
                          </div>

                          {/* =================================================
                              SLIDER AREA
                          ================================================= */}

                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                            }}
                          >

                            {/* =================================================
                                PRODUCTS
                            ================================================= */}

                            <div
                              className="latest-product-slider"
                              data-cat-id={cat.id}
                              onScroll={(e) => {
                                updateSliderState(
                                  cat.id,
                                  e.currentTarget
                                );
                              }}
                              style={{
                                display: "flex",
                                gap: "16px",
                                overflowX: "auto",
                                overflowY: "hidden",
                                scrollBehavior: "smooth",
                                padding: "0",
                                width: "100%",
                                boxSizing: "border-box",
                              }}
                            >

                              {(catProducts[cat.id] || []).map(
                                (product) => (

                                  <div
                                    key={product.id}
                                    className="latest-product-card"
                                    style={{
                                      flex:
                                        "0 0 228px",
                                      height: "78px",
                                      background: "#fff",
                                      border:
                                        "1px solid #dcdcdc",
                                      borderRadius: "10px",
                                      padding: "8px",
                                      display: "flex",
                                      alignItems:
                                        "center",
                                      boxSizing:
                                        "border-box",
                                      overflow: "hidden",
                                      transition:
                                        "box-shadow 0.2s ease",
                                    }}
                                  >

                                    <a
                                      href={`/products/${product.slug}`}
                                      style={{
                                        display: "flex",
                                        alignItems:
                                          "center",
                                        width: "100%",
                                        height: "100%",
                                        textDecoration:
                                          "none",
                                        color: "#222",
                                        minWidth: 0,
                                      }}
                                    >

                                      {/* Product Image */}

                                      <div
                                        style={{
                                          flex:
                                            "0 0 65px",
                                          width: "65px",
                                          height: "60px",
                                          marginRight:
                                            "10px",
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          justifyContent:
                                            "center",
                                          overflow:
                                            "hidden",
                                          borderRadius:
                                            "8px",
                                          background:
                                            "#fff",
                                        }}
                                      >

                                        <img
                                          src={
                                            product.file_name
                                              ? `${ROOT_URL}/${product.file_name}`
                                              : "/default.png"
                                          }
                                          alt={
                                            product.title
                                          }
                                          loading="lazy"
                                          decoding="async"
                                          onError={(e) => {
                                            e.target.onerror =
                                              null;
                                            e.target.src =
                                              "/default.png";
                                          }}
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit:
                                              "contain",
                                            display:
                                              "block",
                                          }}
                                        />

                                      </div>

                                      {/* Product Details */}

                                      <div
                                        style={{
                                          minWidth: 0,
                                          flex: "1",
                                          overflow:
                                            "hidden",
                                        }}
                                      >

                                        {/* Product Name */}

                                        <div
                                          className="product-name"
                                          style={{
                                            fontSize:
                                              "13px",
                                            fontWeight:
                                              "600",
                                            lineHeight:
                                              "16px",
                                            color:
                                              "#111",
                                            marginBottom:
                                              "4px",
                                          }}
                                        >
                                          {product.title.length >
                                          35
                                            ? product.title.slice(
                                                0,
                                                35
                                              ) + "..."
                                            : product.title}
                                        </div>

                                        {/* Price */}

                                        {product.price && (
                                          <div
                                            style={{
                                              fontSize:
                                                "12px",
                                              lineHeight:
                                                "15px",
                                              color:
                                                "#333",
                                              whiteSpace:
                                                "nowrap",
                                              overflow:
                                                "hidden",
                                              textOverflow:
                                                "ellipsis",
                                            }}
                                          >
                                            Price:{" "}
                                            <span
                                              style={{
                                                color:
                                                  "#333",
                                              }}
                                            >
                                              ₹{" "}
                                              {
                                                product.price
                                              }
                                            </span>
                                          </div>
                                        )}

                                      </div>

                                    </a>

                                  </div>

                                )
                              )}

                            </div>

                            {/* =================================================
                                PREVIOUS ARROW
                                Initially hidden
                            ================================================= */}

                            {sliderState[cat.id]?.showPrev && (

                              <button
                                className="slider-arrow"
                                type="button"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "#315374fc";
                                  e.currentTarget.style.color =
                                    "#fff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "#fff";
                                  e.currentTarget.style.color =
                                    "#777";
                                }}
                                onClick={(e) => {
                                  const slider =
                                    e.currentTarget.parentElement.querySelector(
                                      ".latest-product-slider"
                                    );

                                  slider.scrollBy({
                                    left: -450,
                                    behavior:
                                      "smooth",
                                  });
                                }}
                                style={{
                                  position:
                                    "absolute",
                                  left: "-15px",
                                  top: "50%",
                                  transform:
                                    "translateY(-50%)",
                                  width: "40px",
                                  height: "40px",
                                  borderRadius:
                                    "50%",
                                  border:
                                    "1px solid #ddd",
                                  background: "#fff",
                                  color: "#777",
                                  fontSize: "30px",
                                  lineHeight: "34px",
                                  display: "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  zIndex: 20,
                                  cursor: "pointer",
                                  boxShadow:
                                    "0 2px 8px rgba(0,0,0,0.12)",
                                  transition:
                                    "all 0.3s ease",
                                }}
                              >
                                ‹
                              </button>

                            )}

                            {/* =================================================
                                NEXT ARROW
                                Hidden automatically at end
                            ================================================= */}

                            {sliderState[cat.id]?.showNext && (

                              <button
                                className="slider-arrow"
                                type="button"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "#315374fc";
                                  e.currentTarget.style.color =
                                    "#fff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "#fff";
                                  e.currentTarget.style.color =
                                    "#777";
                                }}
                                onClick={(e) => {
                                  const slider =
                                    e.currentTarget.parentElement.querySelector(
                                      ".latest-product-slider"
                                    );

                                  slider.scrollBy({
                                    left: 450,
                                    behavior:
                                      "smooth",
                                  });
                                }}
                                style={{
                                  position:
                                    "absolute",
                                  right: "-15px",
                                  top: "50%",
                                  transform:
                                    "translateY(-50%)",
                                  width: "40px",
                                  height: "40px",
                                  borderRadius:
                                    "50%",
                                  border:
                                    "1px solid #ddd",
                                  background: "#fff",
                                  color: "#777",
                                  fontSize: "30px",
                                  lineHeight: "34px",
                                  display: "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  cursor: "pointer",
                                  zIndex: 20,
                                  boxShadow:
                                    "0 2px 8px rgba(0, 0, 0, 0.12)",
                                  padding:
                                    "0 0 3px 0",
                                  transition:
                                    "all 0.3s ease",
                                }}
                              >
                                ›
                              </button>

                            )}

                          </div>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            ))}

        </div>

        {/* =====================================================
            LOAD MORE
        ===================================================== */}

        {hasMore && visibleCategoriesCount > 0 && (

          <div className="text-center mt-4">

            <button
              className="btn btn-outline-primary btn-sm px-4"
              onClick={handleLoadMore}
            >
              Load More +
            </button>

          </div>

        )}

      </div>
    </section>
  );
};

export default ItemCategory;