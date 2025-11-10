import React, { useEffect, useState } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from './../config';

const CategoryMain = ({ isHome, limit }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories/category-item?is_delete=0&status=1&limit=${limit}`);
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [limit]);

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
