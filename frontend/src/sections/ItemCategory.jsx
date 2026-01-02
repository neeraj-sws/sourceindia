import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useParams } from "react-router-dom";

const ItemCategory = () => {
  const { slug } = useParams();
  console.log(slug);
  const [subcategory, setSubcategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

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
        }, 1000); // ⏱️ 1 second skeleton
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

  const ItemCategorySkeleton = () => (
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
          <Skeleton height="26px" width="250px" style={{ marginBottom: 24 }} />

          {/* Grid */}
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
                  <Skeleton height="90px" style={{ marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  if (showSkeleton && page === 1) {
    return <ItemCategorySkeleton />;
  }

  return (
    <section className="categorySection py-md-4 pt-2 my-4">
      <div className="container-xl">
        {/* 🟢 Subcategory Heading */}
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

            {/* Current Subcategory */}
            <li className="breadcrumb-item active" aria-current="page">
              {subcategory?.name}
            </li>
          </ol>
        </nav>

        <h4 className="fw-semibold mb-4">{subcategory.name}</h4>

        {/* 🟢 Item Categories */}
        <div className="row g-3">
          {subcategory.item_categories?.length > 0 ? (
            subcategory.item_categories.map((cat) => (
              <div key={cat.id} className="col-sm-6 col-lg-4 text-center">
                <div className="card h-100">
                  <div className="card-body">
                    <a
                      href={`/categories/${subcategory.category.slug}/${subcategory.slug}/${cat.slug}`}
                      className="d-block text-decoration-none"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="fw-semibold mb-3">{cat.name}</h6>
                        <span>→</span>
                      </div>
                    </a>
                    <div className="d-flex justify-content-between align-items--center gap-1 gridulimgcontainer">
                      <ul className="list-unstyled ps-0 mb-0 categorylistul">
                        {(cat.items || []).length > 0 ? (
                          cat.items.map((item) => (
                            <li className="text-start">
                              <a
                                href={`/categories/${subcategory.category.slug}/${subcategory.slug}/${cat.slug}`}
                                className="text-decoration-none text-primary small"
                              >
                                {item.name.length > 45
                                  ? item.name.slice(0, 45) + "..."
                                  : item.name}
                              </a>
                            </li>
                          ))
                        ) : (
                          <p className="text-muted small">No items found.</p>
                        )}
                      </ul>
                      {cat.file_name && (
                        <img
                          src={`${ROOT_URL}/${cat.file_name}`}
                          className="img-fluid categoryimagebox"
                          alt={cat.name || "Category"}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://learn-attachment.microsoft.com/api/attachments/8954256a-cc48-4d73-a863-5c8ebe3c426c?platform=QnA";
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted">No item categories found.</p>
          )}
        </div>

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

export default ItemCategory;
