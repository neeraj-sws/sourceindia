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
        border: "1px solid #d5d5d5",
        padding: "8px 10px 10px",
        marginTop: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* =====================================================
          SLIDER CSS
      ===================================================== */}

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

            /* Desktop scrollbar hidden */
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          /* Chrome / Edge / Safari */
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
          ========================= */

          .slider-arrow {
            display: flex;
          }


          /* =========================
             MOBILE / TABLET
          ========================= */

          @media (max-width: 768px) {

            .slider-arrow {
              display: none !important;
            }

            .latest-product-slider {
              cursor: grab;

              /* Firefox */
              scrollbar-width: thin;
              scrollbar-color: #315374 #e5e5e5;
            }

            .latest-product-slider:active {
              cursor: grabbing;
            }

            /* Chrome / Edge / Safari */
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