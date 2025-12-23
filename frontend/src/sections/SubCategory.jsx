import React, { useEffect, useState } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from './../config';
import { useParams } from 'react-router-dom';

const SubCategory = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/categories/sub-category-item?slug=${slug}&page=${page}&limit=8`
      );

      const data = res.data;

      setTimeout(() => {
        if (data && data.category) {
          if (page === 1) {
            setCategory(data.category);
          } else {
            setCategory(prev => ({
              ...prev,
              subcategories: [
                ...(prev?.subcategories || []),
                ...(data.category.subcategories || [])
              ]
            }));
          }

          setHasMore(data.pagination?.hasMore || false);
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
    setPage(prev => prev + 1);
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

    <section className="categorySection py-4 my-4">
      <div className="container">

        {/* Heading */}
        <Skeleton height="22px" width="220px" style={{ marginBottom: 24 }} />

        <div className="row g-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="col-sm-6 col-lg-3">
              <div className="card h-100 p-3">
                <Skeleton height="18px" width="80%" style={{ marginBottom: 12 }} />

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
    <section className="categorySection py-4 my-4">
      <div className="container">
        <div className="categoryMain">
          <nav aria-label="breadcrumb" className="mb-3">
  <ol className="breadcrumb mb-0">
    <li className="breadcrumb-item">
      <a href="/" className="text-decoration-none">Home</a>
    </li>

    <li className="breadcrumb-item">
      <a href="/categories" className="text-decoration-none">Categories</a>
    </li>

    <li className="breadcrumb-item active" aria-current="page">
      {category?.name || "Loading..."}
    </li>
  </ol>
</nav>
          <h5 className="fw-semibold mb-4">{category.name}</h5>
          <div className="row g-3">
            {category.subcategories?.length > 0 ? (
              category.subcategories.map((sub) => (
                <div key={sub.id} className="col-sm-6 col-lg-3">
                  <div className="card card-hover h-100 shadow-sm border-0">
                    <div className="card-body">
                      <a href={`/item-categories/${sub.slug}`} className="d-block text-decoration-none text-dark">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="fw-semibold mb-3">{sub.name}</h6>
                          <span>→</span>
                        </div>
                      </a>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <ul className="list-unstyled ps-3 mb-0">
                            {(sub.item_categories || [])
                              .slice(0, 4)
                              .map((item, i) => (
                                <li key={i}>
                                  <a
                                    href={`/item-subcategory/${item.slug}`}
                                    className="text-decoration-none text-primary small d-inline-block"
                                  >
                                    {item.name}
                                  </a>
                                </li>
                              ))}

                          </ul>
                        </div>

                        {sub.file_name && (
                          <img
                            src={`${ROOT_URL}/${sub.file_name}`}
                            className="img-fluid"
                            alt={sub.name || "SubCategory"} width="100px"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://www.glossyjewels.com/uploads/dummy.jpg";
                            }}
                          />
                        )}


                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted small">No subcategories found.</p>
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
