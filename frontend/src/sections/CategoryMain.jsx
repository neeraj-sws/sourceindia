import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import LatestProductSlider from "../components/LatestProductSlider";

const CategoryMain = ({ isHome, limit }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // CATEGORY WISE PRODUCTS
  // =========================================================
  const [catProducts, setCatProducts] = useState({});

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);

      try {
        // ⚠️ SAME API - DON'T CHANGE THIS
        const res = await axios.get(
          `${API_BASE_URL}/categories/category-item?is_delete=0&status=1&limit=${limit}&is_home=${isHome ? 1 : 0}`
        );

        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        // Show skeleton for at least 1 second
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    fetchCategories();
  }, [limit, isHome]);

  // =========================================================
  // FETCH LATEST PRODUCTS FOR EACH CATEGORY
  // =========================================================
  useEffect(() => {
    if (!categories.length) return;

    let cancelled = false;

    const fetchCategoryProducts = async () => {
      categories.forEach(async (cat) => {
        try {
          const res = await axios.get(`${API_BASE_URL}/products`, {
            params: {
              // IMPORTANT:
              // Only products belonging to this category
              category: cat.id,

              is_delete: 0,
              status: 1,
              is_approve: 1,
              is_front: 1,

              // Latest 10 products
              limit: 10,

              // Newest first
              sort_by: "newest",
            },
          });

          if (cancelled) return;

          setCatProducts((prev) => ({
            ...prev,
            [cat.id]: res.data?.products || [],
          }));
        } catch (err) {
          console.error(
            `Error fetching products for category ${cat.id}:`,
            err
          );
        }
      });
    };

    fetchCategoryProducts();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  // =========================================================
  // VALID SUBCATEGORIES (max 6 for the 3 x 2 grid)
  // =========================================================
  const getValidSubcategories = (cat) => {
    return (cat.subcategories || [])
      .filter((sub) => Number(sub.product_count || 0) > 0)
      .slice(0, 6);
  };

  // =========================================================
  // SKELETON
  // =========================================================
  const CategorySkeletonLoader = ({ count = 2 }) => {
    const skeletonCategories = Array.from({ length: count });

    return (
      <>
        {skeletonCategories.map((_, i) => (
          <section
            key={i}
            className="categorySection py-md-4 pt-2 my-4"
          >
            <div className="container-xxl">
              <div className="categoryMainBox">

                {/* Category Header Skeleton */}
                <div className="categoryMainHeader">
                  <span
                    className="content-placeholder"
                    style={{
                      width: "30%",
                      height: 24,
                      display: "block",
                      marginBottom: 12,
                    }}
                  />
                  <span
                    className="content-placeholder"
                    style={{
                      width: 24,
                      height: 2,
                      display: "block",
                      marginBottom: 12,
                    }}
                  />
                  <span
                    className="content-placeholder"
                    style={{
                      width: "45%",
                      height: 12,
                      display: "block",
                    }}
                  />
                </div>

                <div className="categoryMainBody">

                  {/* LEFT PROMO SKELETON */}
                  <div className="categoryPromoCard categoryPromoSkeleton" />

                  {/* RIGHT GRID SKELETON */}
                  <div className="subcategoryGrid">

                    {Array.from({ length: 6 }).map((_, j) => (
                      <div
                        key={j}
                        className="subcategoryCard subcategoryCardSkeleton"
                      >
                        <div className="subcategoryCardHeader">
                          <span
                            className="content-placeholder"
                            style={{
                              width: "70%",
                              height: 16,
                              display: "block",
                            }}
                          />
                          <span
                            className="content-placeholder"
                            style={{
                              width: 28,
                              height: 28,
                              display: "block",
                              borderRadius: "50%",
                              flexShrink: 0,
                            }}
                          />
                        </div>

                        <div className="subcategoryCardContent">
                          <ul className="categoryItemList">
                            {[90, 75, 60, 80].map((w, k) => (
                              <li key={k}>
                                <span
                                  className="content-placeholder"
                                  style={{
                                    width: `${w}%`,
                                    height: 11,
                                    display: "block",
                                  }}
                                />
                              </li>
                            ))}
                          </ul>

                          <div className="subcategoryThumb">
                            <span
                              className="content-placeholder"
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                              }}
                            />
                          </div>
                        </div>

                        <span
                          className="content-placeholder"
                          style={{
                            width: 60,
                            height: 11,
                            display: "block",
                            marginTop: 10,
                          }}
                        />
                      </div>
                    ))}

                  </div>
                </div>

              </div>
            </div>
          </section>
        ))}
      </>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return <CategorySkeletonLoader count={2} />;
  }

  // =========================================================
  // NO CATEGORY
  // =========================================================
  if (!categories.length) {
    return (
      <p className="text-center my-5 text-muted">
        No categories found.
      </p>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================
  return (
    <>
      {categories.map((cat) => {
        const validSubs = getValidSubcategories(cat);

        return (
          <section
            key={cat.id}
            className="categorySection py-md-4 pt-2 my-4"
          >
            <div className="container-xxl">

              <div className="categoryMainBox">

                {/* =================================================
                    CATEGORY HEADER
                ================================================= */}
                <div className="categoryMainHeader">
                  <h4 className="categoryMainTitle">
                    {cat.name}
                  </h4>
                  <span className="categoryMainAccent" />

                </div>

                {/* =================================================
                    MAIN LAYOUT (PROMO + SUBCATEGORY GRID)
                ================================================= */}
                <div className="categoryMainBody">

                  {/* ===============================================
                      LEFT PROMOTIONAL CARD
                  =============================================== */}
                  <div className="categoryPromoCard">

                    {cat.file_name && (
                      <img
                        src={`${ROOT_URL}/${cat.file_name}`}
                        className="categoryPromoImage"
                        alt={cat.name || "Category"}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default.png";
                        }}
                      />
                    )}

                    <div className="categoryPromoOverlay" />

                    <div className="categoryPromoContent">

                      <a
                        href={`/categories/${cat.slug}`}
                        className="categoryPromoBtn"
                      >
                        <span>Explore Components</span>
                        <span className="categoryPromoBtnArrow">→</span>
                      </a>
                    </div>

                  </div>

                  {/* ===============================================
                      RIGHT SUBCATEGORY GRID
                  =============================================== */}
                  <div className="subcategoryGrid">

                    {validSubs.length > 0 ? (

                      validSubs.map((sub) => (
                        <div
                          key={sub.id}
                          className="subcategoryCard"
                        >

                          {/* SUBCATEGORY HEADER */}
                          <div className="subcategoryCardHeader">
                            <a
                              href={`/categories/${cat.slug}/${sub.slug}`}
                              className="subcategoryCardTitleLink"
                            >
                              <h6 className="subcategoryCardTitle">
                                {sub.name}
                              </h6>
                            </a>

                            <a
                              href={`/categories/${cat.slug}/${sub.slug}`}
                              className="subcategoryArrow"
                              aria-label={`Explore ${sub.name}`}
                            >
                              <span>→</span>
                            </a>
                          </div>

                          {/* SUBCATEGORY CONTENT */}
                          <div className="subcategoryCardContent">

                            <ul className="categoryItemList">
                              {(sub.item_categories || [])
                                .filter(
                                  (item) =>
                                    Number(item.product_count || 0) > 0
                                )
                                .slice(0, 4)
                                .map((item) => (
                                  <li key={item.id}>
                                    <a
                                      href={`/products?category_id=${cat.id}&subcategory_id=${sub.id}&item_category_id=${item.id}`}
                                    >
                                      {item.name?.length > 20
                                        ? `${item.name.slice(0, 20)}...`
                                        : item.name}
                                    </a>
                                  </li>
                                ))}
                            </ul>

                            {/* SUBCATEGORY IMAGE */}
                            {sub.file_name && (
                              <div className="subcategoryThumb">
                                <img
                                  src={`${ROOT_URL}/${sub.file_name}`}
                                  alt={sub.name || "SubCategory"}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/default.png";
                                  }}
                                />
                              </div>
                            )}

                          </div>

                          {/* VIEW ALL */}
                          <a
                            href={`/categories/${cat.slug}/${sub.slug}`}
                            className="subcategoryViewAll"
                          >
                            <span>View all</span>
                            <span className="subcategoryViewAllArrow">→</span>
                          </a>

                        </div>
                      ))

                    ) : (

                      <p className="subcategoryEmpty">
                        No subcategories found.
                      </p>

                    )}

                  </div>

                </div>

                {/* =================================================
                    CATEGORY LATEST PRODUCTS SLIDER
                ================================================= */}
                <LatestProductSlider
                  products={catProducts[cat.id] || []}
                  categoryName={cat.name}
                  categoryId={cat.id}
                />

              </div>

            </div>
          </section>
        );
      })}
    </>
  );
};

export default CategoryMain;
