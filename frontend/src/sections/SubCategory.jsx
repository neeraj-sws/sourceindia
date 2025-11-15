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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/sub-category-item?slug=${slug}&page=${page}&limit=8`
        );

        const data = res.data;

        if (data && data.category) {
          // 🟢 If page = 1, set fresh data
          if (page === 1) {
            setCategory(data.category);
          } else {
            // 🟢 Merge subcategories when loading more
            setCategory(prev => ({
              ...prev,
              subcategories: [
                ...(prev?.subcategories || []),
                ...(data.category.subcategories || [])
              ]
            }));
          }

          setHasMore(data.pagination?.hasMore || false);
        } else {
          console.warn("Invalid response structure:", data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [slug, page]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!category) {
    return <p className="text-center my-5 text-muted">Loading...</p>;
  }

  return (
    <section className="categorySection py-4 my-4">
      <div className="container">
        <div className="categoryMain">
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
