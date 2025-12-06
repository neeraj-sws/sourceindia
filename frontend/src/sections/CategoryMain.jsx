import React, { useEffect, useState } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from './../config';

const CategoryMain = ({ isHome, limit }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/categories/category-item?is_delete=0&status=1&limit=${limit}`);
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        // show skeleton for at least 1 second
        setTimeout(() => setLoading(false), 1000);
      }
    };
    fetchCategories();
  }, [limit]);

  const CategorySkeletonLoader = ({ count = 2 }) => {
  const categories = Array.from({ length: count });

  return (
    <>
      {categories.map((_, i) => (
        <section key={i} className="categorySection py-4 my-4">
          <div className="container">
            <div className="categoryMain">
              {/* Category Title Skeleton */}
              <h5 className="fw-semibold mb-3">
                <span
                  className="content-placeholder"
                  style={{ width: "30%", height: 20, display: "block" }}
                ></span>
              </h5>

              <div className="card">
                <div className="card-body">
                  <div className="row g-4">
                    {/* LEFT IMAGE BLOCK Skeleton */}
                    <div className="col-md-4">
                      <div
                        className="position-relative rounded overflow-hidden shadow-sm h-100"
                        style={{ backgroundColor: "#eee", minHeight: 200 }}
                      ></div>
                    </div>

                    {/* RIGHT SIDE GRID (Subcategories) Skeleton */}
                    <div className="col-md-8">
                      <div className="row g-3">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div key={j} className="col-sm-6 col-lg-4">
                            <div className="card card-hover h-100 shadow-sm border-0 p-3">
                              <span
                                className="content-placeholder"
                                style={{ width: "70%", height: 18, display: "block", marginBottom: 6 }}
                              ></span>
                              <span
                                className="content-placeholder"
                                style={{ width: "50%", height: 14, display: "block" }}
                              ></span>
                              <div
                                className="mt-2"
                                style={{ width: "100%", height: 60, backgroundColor: "#eee", borderRadius: 4 }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

if (loading) {
    return <CategorySkeletonLoader count={2} />; // Show 2 skeleton categories
  }

  return (
    <>
      {categories.length > 0 ? (
        categories.map((cat) => (
          <section key={cat.id} className="categorySection py-4 my-4">
            <div className="container">
              <div className="categoryMain">
                {/* ✅ Dynamic Category Name */}
                <h5 className="fw-semibold">{cat.name}</h5>

                <div className="card">
                  <div className="card-body">
                    <div className="row g-4">
                      {/* ✅ LEFT IMAGE BLOCK */}
                      <div className="col-md-4">
                        <div className="position-relative rounded overflow-hidden shadow-sm h-100">
                          {cat.file_name && (
                            <img
                              src={`${ROOT_URL}/${cat.file_name}`}
                              className="img-fluid w-100"
                              alt={cat.name || "Category"}
                              onError={(e) => {
                                e.target.onerror = null; // prevent infinite loop
                                e.target.src = "https://learn-attachment.microsoft.com/api/attachments/8954256a-cc48-4d73-a863-5c8ebe3c426c?platform=QnA"; // fallback image ka path
                              }}
                            />
                          )}
                          <div className="overlay d-flex justify-content-center align-items-end">
                            <a href={`sub-categories/${cat.slug}`} className="btn btn-danger btn-sm mb-3">View All</a>
                          </div>
                        </div>
                      </div>

                      {/* ✅ RIGHT SIDE GRID (SUBCATEGORIES) */}
                      <div className="col-md-8">
                        <div className="row g-3">
                          {cat.subcategories?.length > 0 ? (
                            cat.subcategories.map((sub) => (
                              <div key={sub.id} className="col-sm-6 col-lg-4">
                                <div className="card card-hover h-100 shadow-sm border-0">
                                  <div className="card-body">
                                    <a href={`/item-categories/${sub.slug}`} className='d-block'>
                                      <div className="d-flex justify-content-between align-items-start">
                                        <h6 className="fw-semibold mb-3">{sub.name}</h6>
                                        <span>→</span>
                                      </div></a>
                                    <div className='d-flex justify-content-between align-items-center'>
                                      <ul className="list-unstyled mb-0">
                                        {(sub.item_categories || []).slice(0, 4).map((item, i) => (
                                          <li key={i}>
                                            <a href={`/item-subcategory/${item.slug}`} className="text-decoration-none text-primary small">
                                              {item.name}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                      <img src="https://www.glossyjewels.com/uploads/dummy.jpg" className='img-fluid' width="100" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted small">No subcategories found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))
      ) : (
        <p className="text-center my-5 text-muted">No categories found.</p>
      )}
    </>
  );
};

export default CategoryMain;
