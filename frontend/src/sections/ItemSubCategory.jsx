import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";

const ItemSubCategory = () => {
  const { slug } = useParams();
  const [subcategory, setSubcategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/sub-items?slug=${slug}&page=${page}&limit=8`
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
        }, 1000); // ⏱️ 1 second
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

  const ItemSubCategorySkeleton = () => (
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
          <Skeleton height="26px" width="280px" style={{ marginBottom: 24 }} />

          <div className="card mb-3">
            <div className="card-body">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton
                    height="20px"
                    width="200px"
                    style={{ marginBottom: 16 }}
                  />

                  <div className="row g-3">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="col-6 col-sm-4 col-md-3 col-lg-2">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body p-2">
                            <Skeleton height="125px" />
                            <Skeleton height="14px" style={{ marginTop: 10 }} />
                            <Skeleton
                              height="12px"
                              width="40%"
                              style={{ marginTop: 6 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );

  if (showSkeleton && page === 1) {
    return <ItemSubCategorySkeleton />;
  }

  return (
    <section className="categorySection py-md-4 pt-2 my-4">
      <div className="container-xl">
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

            {/* Parent Category (if available from API) */}
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
            {subcategory?.sub_category && (
              <li className="breadcrumb-item">
                <a
                  href={`/categories/${subcategory.category.slug}/${subcategory.sub_category.slug}`}
                  className="text-decoration-none"
                >
                  {subcategory.sub_category.name}
                </a>
              </li>
            )}

            {/* Current Subcategory */}
            <li className="breadcrumb-item active" aria-current="page">
              {subcategory?.name}
            </li>
          </ol>
        </nav>
        {/* 🟢 Subcategory Heading */}
        <h4 className="fw-semibold mb-3 color-primary text-capitalize">
          {subcategory.name}
        </h4>

        {/* 🟢 Item Categories */}
        {subcategory.item_categories?.length > 0 ? (
          subcategory.item_categories.map((cat) => (
            <div className="card mb-3 card-border">
              <div className="card-body">
                <div key={cat.id} className="pb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0 text-capitalize">
                      {cat.name}
                    </h6>
                  </div>

                  {/* 🟢 Items Grid */}
                  <div className="row g-3">
                    {(cat.items || []).length > 0 ? (
                      cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="col-6 col-sm-4 col-md-3 col-lg-2 text-center itemcolblock"
                        >
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-2">
                              <a href={`/products?item_id=${item.id}`}>
                                <img
                                  src={
                                    item.file_name
                                      ? `${ROOT_URL}/${item.file_name}`
                                      : "/default.png"
                                  }
                                  className="img-fluid rounded mb-2 w-100"
                                  alt={item.name}
                                  style={{ height: "125px" }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "/default.png";
                                  }}
                                />

                                <h6 className="small fw-semibold mb-1">
                                  {item.name}
                                </h6>
                              </a>
                              {item.product_count > 0 && (
                                <div className="text-success small">
                                  ({item.product_count})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted small">No items found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card mb-3 card-border">
            <div className="card-body">
              <p className="text-center text-muted">
                No item categories found.
              </p>
            </div>
          </div>
        )}
        {/* 🟢 Load More Button */}
        {hasMore && (
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

export default ItemSubCategory;
