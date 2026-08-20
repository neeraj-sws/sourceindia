import React, { useEffect, useState } from "react";
import { ROOT_URL } from "../config";

const LatestProductSlider = ({
  products = [],
  categoryName = "",
  categoryId,
}) => {
  const [sliderState, setSliderState] = useState({
    showPrev: false,
    showNext: false,
  });

  // =========================================================
  // CHECK SLIDER POSITION
  // =========================================================
  const updateSliderState = (slider) => {
    if (!slider) return;

    const isAtStart = slider.scrollLeft <= 1;

    const isAtEnd =
      slider.scrollLeft + slider.clientWidth >=
      slider.scrollWidth - 1;

    const hasOverflow =
      slider.scrollWidth > slider.clientWidth + 1;

    setSliderState({
      showPrev: hasOverflow && !isAtStart,
      showNext: hasOverflow && !isAtEnd,
    });
  };

  // =========================================================
  // INITIAL CHECK + RESIZE
  // =========================================================
  useEffect(() => {
    const slider = document.querySelector(
      `.latest-product-slider-${categoryId}`
    );

    if (!slider) return;

    const timer = setTimeout(() => {
      updateSliderState(slider);
    }, 100);

    const handleResize = () => {
      updateSliderState(slider);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [products, categoryId]);

  // =========================================================
  // NO PRODUCTS
  // =========================================================
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#f7f7f7",
        border: "1px solid #eeeeee",
        borderRadius: "6px",
        padding: "14px 20px 16px",
        marginTop: "30px",
        boxSizing: "border-box",
      }}
    >
      {/* =====================================================
          SLIDER CSS
      ===================================================== */}


      <style>
        {`
    /* =====================================================
       MAIN SLIDER CONTAINER
       ===================================================== */

    .latest-product-slider {
      display: flex !important;
      flex-direction: row !important;
      align-items: stretch !important;

      gap: 16px !important;

      width: 100% !important;

      overflow-x: auto !important;
      overflow-y: hidden !important;

      scroll-behavior: smooth !important;

      box-sizing: border-box !important;

      padding: 0 2px 4px !important;

      touch-action: pan-x !important;
      -webkit-overflow-scrolling: touch !important;

      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    .latest-product-slider::-webkit-scrollbar {
      display: none !important;
    }


    /* =====================================================
       PRODUCT CARD
       IMAGE LEFT + TEXT RIGHT
       ===================================================== */

    .latest-product-card {
      flex: 0 0 228px !important;

      width: 228px !important;
      min-width: 228px !important;

      height: 82px !important;
      min-height: 82px !important;

      background: #ffffff !important;

      border: 1px solid #e4e7eb !important;

      border-radius: 7px !important;

      padding: 7px 8px !important;

      display: flex !important;
      flex-direction: row !important;

      align-items: center !important;
      justify-content: flex-start !important;

      box-sizing: border-box !important;

      overflow: hidden !important;

      transition:
        box-shadow 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease !important;
    }


    /* =====================================================
       CARD HOVER
       ===================================================== */

    .latest-product-card:hover {
      border-color: #d9dde2 !important;

      box-shadow:
        0 3px 10px rgba(0, 0, 0, 0.09) !important;
    }


    /* =====================================================
       PRODUCT LINK
       IMAGE LEFT
       TEXT RIGHT
       ===================================================== */

    .latest-product-card > a {
      display: flex !important;

      flex-direction: row !important;

      align-items: center !important;
      justify-content: flex-start !important;

      width: 100% !important;
      height: 100% !important;

      min-width: 0 !important;

      text-decoration: none !important;

      color: #222 !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       PRODUCT IMAGE CONTAINER
       ===================================================== */

    .latest-product-card > a > div:first-child {
      flex: 0 0 60px !important;

      width: 60px !important;
      min-width: 60px !important;

      height: 60px !important;

      margin: 0 10px 0 0 !important;

      display: flex !important;

      align-items: center !important;
      justify-content: center !important;

      overflow: hidden !important;

      border-radius: 5px !important;

      background: #ffffff !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       PRODUCT IMAGE
       ===================================================== */

    .latest-product-card > a > div:first-child img {
      width: 100% !important;

      height: 100% !important;

      object-fit: contain !important;

      object-position: center !important;

      display: block !important;
    }


    /* =====================================================
       PRODUCT DETAILS
       TEXT RIGHT SIDE
       ===================================================== */

    .latest-product-card > a > div:last-child {
      flex: 1 1 auto !important;

      width: auto !important;

      min-width: 0 !important;

      height: auto !important;

      display: flex !important;

      flex-direction: column !important;

      align-items: flex-start !important;

      justify-content: center !important;

      overflow: hidden !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       PRODUCT NAME
       2 LINE MAX
       ===================================================== */

    .latest-product-card .product-name {
      width: 100% !important;

      min-width: 0 !important;

      font-size: 11.5px !important;

      font-weight: 600 !important;

      line-height: 14px !important;

      color: #182235 !important;

      margin: 0 0 4px 0 !important;

      padding: 0 !important;

      display: -webkit-box !important;

      -webkit-line-clamp: 2 !important;

      -webkit-box-orient: vertical !important;

      overflow: hidden !important;

      text-overflow: ellipsis !important;

      white-space: normal !important;

      min-height: 28px !important;

      max-height: 28px !important;

      box-sizing: border-box !important;
    }


    /* =====================================================
       PRICE
       ===================================================== */

    .latest-product-card
      > a
      > div:last-child
      > div:not(.product-name) {

      width: 100% !important;

      min-width: 0 !important;

      font-size: 11px !important;

      line-height: 14px !important;

      font-weight: 400 !important;

      color: #e51c23 !important;

      margin: 0 !important;

      padding: 0 !important;

      white-space: nowrap !important;

      overflow: hidden !important;

      text-overflow: ellipsis !important;
    }


    /* =====================================================
       PRICE VALUE
       ===================================================== */

    .latest-product-card
      > a
      > div:last-child
      > div:not(.product-name)
      span {

      color: #e51c23 !important;

      font-weight: 400 !important;
    }


    /* =====================================================
       CATEGORY SPECIFIC SLIDER
       ===================================================== */

    .latest-product-slider-${categoryId} {
      margin-top: 0 !important;

      scrollbar-width: none !important;
    }


    .latest-product-slider-${categoryId}
      .latest-product-card {

      box-sizing: border-box !important;
    }


    /* =====================================================
       SLIDER ARROWS
       ===================================================== */

    .slider-arrow {
      position: absolute !important;

      display: flex !important;

      align-items: center !important;
      justify-content: center !important;

      width: 36px !important;

      height: 36px !important;

      padding: 0 0 3px 0 !important;

      border-radius: 50% !important;

      border: 1px solid #e1e4e8 !important;

      background: #ffffff !important;

      color: #667085 !important;

      font-size: 26px !important;

      font-weight: 300 !important;

      line-height: 30px !important;

      z-index: 20 !important;

      cursor: pointer !important;

      box-shadow:
        0 2px 7px rgba(0, 0, 0, 0.10) !important;

      transition:
        background 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease !important;
    }


    /* =====================================================
       ARROW HOVER
       ===================================================== */

    .slider-arrow:hover {
      background: #315374 !important;

      color: #ffffff !important;

      border-color: #315374 !important;

      box-shadow:
        0 3px 10px rgba(0, 0, 0, 0.16) !important;
    }


    /* =====================================================
       PREVIOUS ARROW
       ===================================================== */

    .slider-arrow[aria-label="Previous products"] {
      left: -13px !important;

      top: 50% !important;

      transform: translateY(-50%) !important;
    }


    /* =====================================================
       NEXT ARROW
       ===================================================== */

    .slider-arrow[aria-label="Next products"] {
      right: -13px !important;

      top: 50% !important;

      transform: translateY(-50%) !important;
    }


    /* =====================================================
       TABLET / MOBILE
       ===================================================== */

    @media (max-width: 768px) {

      /* Hide arrows on mobile */
      .slider-arrow {
        display: none !important;
      }


      /* Mobile slider */
      .latest-product-slider {
        gap: 10px !important;

        cursor: grab !important;

        padding:
          0
          2px
          7px
          2px !important;

        scrollbar-width: thin !important;

        scrollbar-color:
          #315374
          #eeeeee !important;
      }


      .latest-product-slider:active {
        cursor: grabbing !important;
      }


      /* Mobile scrollbar */
      .latest-product-slider::-webkit-scrollbar {
        display: block !important;

        height: 4px !important;
      }


      .latest-product-slider::-webkit-scrollbar-track {
        background: #eeeeee !important;

        border-radius: 10px !important;
      }


      .latest-product-slider::-webkit-scrollbar-thumb {
        background: #315374 !important;

        border-radius: 10px !important;
      }


      /* Mobile card */
      .latest-product-card {
        flex: 0 0 220px !important;

        width: 220px !important;

        min-width: 220px !important;

        height: 80px !important;

        min-height: 80px !important;

        padding: 7px 8px !important;
      }


      /* Mobile image */
      .latest-product-card > a > div:first-child {
        flex: 0 0 58px !important;

        width: 58px !important;

        min-width: 58px !important;

        height: 58px !important;

        margin-right: 9px !important;
      }


      /* Mobile title */
      .latest-product-card .product-name {
        font-size: 11.5px !important;

        line-height: 14px !important;

        min-height: 28px !important;

        max-height: 28px !important;
      }


      /* Mobile price */
      .latest-product-card
        > a
        > div:last-child
        > div:not(.product-name) {

        font-size: 10.5px !important;

        line-height: 14px !important;
      }
    }


    /* =====================================================
       SMALL MOBILE
       ===================================================== */

    @media (max-width: 576px) {

      .latest-product-slider {
        gap: 9px !important;
      }


      .latest-product-card {
        flex: 0 0 205px !important;

        width: 205px !important;

        min-width: 205px !important;

        height: 78px !important;

        min-height: 78px !important;

        padding: 6px 7px !important;
      }


      .latest-product-card > a > div:first-child {
        flex: 0 0 55px !important;

        width: 55px !important;

        min-width: 55px !important;

        height: 55px !important;

        margin-right: 8px !important;
      }


      .latest-product-card .product-name {
        font-size: 11px !important;

        line-height: 13.5px !important;

        min-height: 27px !important;

        max-height: 27px !important;

        margin-bottom: 3px !important;
      }


      .latest-product-card
        > a
        > div:last-child
        > div:not(.product-name) {

        font-size: 10.5px !important;

        line-height: 13px !important;
      }


      .latest-product-slider::-webkit-scrollbar {
        height: 4px !important;
      }
    }


    /* =====================================================
       VERY SMALL MOBILE
       ===================================================== */

    @media (max-width: 400px) {

      .latest-product-card {
        flex: 0 0 195px !important;

        width: 195px !important;

        min-width: 195px !important;
      }


      .latest-product-card > a > div:first-child {
        flex: 0 0 52px !important;

        width: 52px !important;

        min-width: 52px !important;

        height: 52px !important;
      }
    }
  `}
      </style>


      {/* =====================================================
          HEADING
      ===================================================== */}

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
        Latest {categoryName} Products
      </div>

      {/* =====================================================
          SLIDER AREA
      ===================================================== */}

      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        {/* ===================================================
            PRODUCTS
        =================================================== */}

        <div
          className={`latest-product-slider latest-product-slider-${categoryId}`}
          onScroll={(e) => {
            updateSliderState(e.currentTarget);
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
          {products.map((product) => (
            <div
              key={product.id}
              className="latest-product-card"
              style={{
                flex: "0 0 228px",
                height: "78px",
                background: "#fff",
                border: "1px solid #dcdcdc",
                borderRadius: "10px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                overflow: "hidden",
                transition: "box-shadow 0.2s ease",
              }}
            >
              <a
                href={`/products/${product.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                  textDecoration: "none",
                  color: "#222",
                  minWidth: 0,
                }}
              >
                {/* ===========================================
                    PRODUCT IMAGE
                =========================================== */}

                <div
                  style={{
                    flex: "0 0 65px",
                    width: "65px",
                    height: "60px",
                    marginRight: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: "8px",
                    background: "#fff",
                  }}
                >
                  <img
                    src={
                      product.file_name
                        ? `${ROOT_URL}/${product.file_name}`
                        : "/default.png"
                    }
                    alt={product.title || "Product"}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default.png";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>

                {/* ===========================================
                    PRODUCT DETAILS
                =========================================== */}

                <div
                  style={{
                    minWidth: 0,
                    flex: "1",
                    overflow: "hidden",
                  }}
                >
                  {/* Product Name */}

                  <div
                    className="product-name"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      lineHeight: "16px",
                      color: "#111",
                      marginBottom: "4px",
                    }}
                  >
                    {product.title?.length > 35
                      ? product.title.slice(0, 35) + "..."
                      : product.title}
                  </div>

                  {/* Price */}

                  {product.price && (
                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: "15px",
                        color: "#333",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Price:{" "}
                      <span
                        style={{
                          color: "#333",
                        }}
                      >
                        ₹ {product.price}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* ===================================================
            PREVIOUS ARROW
        =================================================== */}

        {sliderState.showPrev && (
          <button
            className="slider-arrow"
            type="button"
            aria-label="Previous products"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#315374fc";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#777";
            }}
            onClick={(e) => {
              const slider =
                e.currentTarget.parentElement.querySelector(
                  ".latest-product-slider"
                );

              if (slider) {
                slider.scrollBy({
                  left: -450,
                  behavior: "smooth",
                });
              }
            }}
            style={{
              position: "absolute",
              left: "-15px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #ddd",
              background: "#fff",
              color: "#777",
              fontSize: "30px",
              lineHeight: "34px",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              transition: "all 0.3s ease",
            }}
          >
            ‹
          </button>
        )}

        {/* ===================================================
            NEXT ARROW
        =================================================== */}

        {sliderState.showNext && (
          <button
            className="slider-arrow"
            type="button"
            aria-label="Next products"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#315374fc";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = "#777";
            }}
            onClick={(e) => {
              const slider =
                e.currentTarget.parentElement.querySelector(
                  ".latest-product-slider"
                );

              if (slider) {
                slider.scrollBy({
                  left: 450,
                  behavior: "smooth",
                });
              }
            }}
            style={{
              position: "absolute",
              right: "-15px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #ddd",
              background: "#fff",
              color: "#777",
              fontSize: "30px",
              lineHeight: "34px",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
              padding: "0 0 3px 0",
              transition: "all 0.3s ease",
            }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default LatestProductSlider;