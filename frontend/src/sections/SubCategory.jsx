import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";
import LatestProductSlider from "../components/LatestProductSlider";

const SubCategory = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [subCatProducts, setSubCatProducts] = useState({});

  // =========================================================
// 🟢 FETCH PRODUCTS FOR EACH SUBCATEGORY
// =========================================================
useEffect(() => {
  const subs = (category?.subcategories || []).filter(
    (sub) => sub.product_count > 0
  );

  if (!subs.length || !category?.id) return;

  let cancelled = false;

  subs.forEach(async (sub) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          category: category.id,
          sub_category: sub.id,
          is_delete: 0,
          status: 1,
          is_approve: 1,
          is_front: 1,
          limit: 10,
          sort_by: "newest",
        },
      });

      if (!cancelled) {
        setSubCatProducts((prev) => ({
          ...prev,
          [sub.id]: res.data.products || [],
        }));
      }
    } catch (err) {
      console.error(
        `Error fetching products for subcategory ${sub.id}:`,
        err
      );
    }
  });

  return () => {
    cancelled = true;
  };
}, [category]);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/sub-category-item?slug=${slug}&page=${page}&limit=200`
        );

        const data = res.data;

        setTimeout(() => {
          if (data && data.category) {
  const visibleSubcategories = (data.category.subcategories || []).filter(
    (sub) => sub.product_count > 0
  );

  setCategory((prev) => ({
  // Copy all other fields from API category
  ...data.category,
  // Replace subcategories with filtered ones
  subcategories:
    page === 1
      ? visibleSubcategories
      : [...(prev?.subcategories || []), ...visibleSubcategories],
}));

// Update hasMore based on visible subcategories
setHasMore(visibleSubcategories.length === 9); // 9 is your limit
}

          setShowSkeleton(false);
        }, 1000); // ⏱️ 1 second skeleton
      } catch (err) {
        console.error("Error fetching categories:", err);
        setShowSkeleton(false);
      }
    };

    fetchCategories();
  }, [slug, page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

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

  const SubCategorySkeleton = () => (
    <>
      <style>
        {`
        @keyframes skeleton-loading {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}
      </style>

      <section className="categorySection py-md-4 pt-2 my-4">
        <div className="container">
          {/* Heading */}
          <Skeleton height="22px" width="220px" style={{ marginBottom: 24 }} />

          <div className="row g-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card h-100 p-3">
                  <Skeleton
                    height="18px"
                    width="80%"
                    style={{ marginBottom: 12 }}
                  />

                  {[...Array(3)].map((_, j) => (
                    <Skeleton
                      key={j}
                      height="14px"
                      width="70%"
                      style={{ marginBottom: 6 }}
                    />
                  ))}

                  <Skeleton height="80px" style={{ marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  if (showSkeleton && page === 1) {
    return <SubCategorySkeleton />;
  }

  return (
    <section className="categorySection py-md-4 pt-2 my-4">
      <div className="container-xl">
        <div className="categoryMain">
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

              <li className="breadcrumb-item active" aria-current="page">
                {category?.name || "Loading..."}
              </li>
            </ol>
          </nav>
          <h4 className="fw-semibold mb-4">{category.name}</h4>
          <div className="row g-3">

  {category.subcategories?.length > 0 ? (

    category.subcategories
      .filter((sub) => sub.product_count > 0)
      .map((sub) => (

        <div
          key={sub.id}
          className="col-12"
        >

          <div className="card card-hover h-100 shadow-sm border-0">

            <div className="card-body">

              {/* =========================================
                  SUBCATEGORY HEADER
              ========================================= */}

              <a
                href={`/categories/${category.slug}/${sub.slug}`}
                className="d-block text-decoration-none"
              >

                <div className="d-flex justify-content-between align-items-center">

                  <h5 className="fw-semibold mb-3">
                    {sub.name} ({sub.product_count})
                  </h5>

                  <span>→</span>

                </div>

              </a>


              {/* =========================================
                  ITEM CATEGORY CARDS
              ========================================= */}

              <div
                className="subcategory-items-slider"
                style={{
                  display: "flex",
                  gap: "24px",
                  overflowX: "auto",
                  overflowY: "hidden",
                  paddingBottom: "8px",
                  scrollbarWidth: "thin",
                }}
              >

                {(sub.item_categories || [])
                  .filter((item) => item.product_count > 0)
                  .map((item) => (

                    <a
                      key={item.id}
                      href={`/products?category_id=${category.id}&subcategory_id=${sub.id}&item_category_id=${item.id}`}
                      className="text-decoration-none"
                      style={{
                        flex: "0 0 160px",
                      }}
                    >

                      <div
                        className="border rounded text-center"
                        style={{
                          height: "205px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#fff",
                        }}
                      >

                        {/* Item Category Image */}

                        <div
                          style={{
                            width: "125px",
                            height: "125px",
                            marginBottom: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderRadius: "6px",
                          }}
                        >

                          <img
                            src={
                              item.file_name
                                ? `${ROOT_URL}/${item.file_name}`
                                : "/default.png"
                            }
                            alt={item.name}
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
                            }}
                          />

                        </div>


                        {/* Item Category Name */}

                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            lineHeight: "17px",
                            color: "#004f9e",
                          }}
                        >
                          {item.name}
                        </div>


                        {/* Product Count */}

                        {item.product_count > 0 && (
                          <div
                            className="text-success"
                            style={{
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            ({item.product_count})
                          </div>
                        )}

                      </div>

                    </a>

                  ))}

              </div>


              {/* =========================================
                  LATEST PRODUCTS SLIDER
              ========================================= */}

              {(subCatProducts[sub.id] || []).length > 0 && (

                <LatestProductSlider
                  products={subCatProducts[sub.id] || []}
                  categoryName={sub.name}
                  categoryId={sub.id}
                />

              )}

            </div>

          </div>

        </div>

      ))

  ) : (

    <p className="text-muted small">
      No subcategories found.
    </p>

  )}

</div>
          {/* 🟢 Load More Button */}
          {hasMore && (
            <div className="text-center mt-4">
              <button
                className="btn btn-outline-primary btn-sm px-4"
                onClick={handleLoadMore}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubCategory;
