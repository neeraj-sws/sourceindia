import React, { useEffect, useState } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from './../config';
import { useParams } from 'react-router-dom';

const ItemCategory = () => {
  const { slug } = useParams();
  const [subcategory, setSubcategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/item-category?slug=${slug}&page=${page}&limit=8`
        );

        const data = res.data;

        if (data && data.subcategory) {
          if (page === 1) {
            setSubcategory(data.subcategory);
          } else {
            // Merge pagination data
            setSubcategory(prev => ({
              ...prev,
              item_categories: [
                ...(prev?.item_categories || []),
                ...(data.subcategory.item_categories || [])
              ]
            }));
          }

          setHasMore(data.pagination?.hasMore || false);
        } else {
          console.warn("Invalid response structure:", data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [slug, page]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!subcategory) {
    return <p className="text-center my-5 text-muted">Loading...</p>;
  }

  return (
    <section className="categorySection py-4 my-4">
      <div className="container">
        {/* 🟢 Subcategory Heading */}

        <h4 className="fw-semibold mb-4  pb-2 text-blue">
          {subcategory.name}
        </h4>


        {/* 🟢 Item Categories */}
        <div className="row g-3">
          {subcategory.item_categories?.length > 0 ? (
            subcategory.item_categories.map((cat) => (

              <div key={cat.id} className="col-6 col-sm-4 col-md-3 text-center">
                <div className='card'>
                  <div className='card-body'>
                    <a href={`/item-subcategory/${cat.slug}`} className="d-block text-decoration-none text-dark">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="fw-semibold mb-3">{cat.name}</h6>
                        <span>→</span>
                      </div>
                    </a>
                    <div className="d-flex justify-content-between align-items-center">
                      <ul className="list-unstyled mb-0">
                        {(cat.items || []).length > 0 ? (
                          cat.items.map((item) => (
                            <li>
                              <a
                                href={`/item-subcategory/${cat.slug}`}
                                className="text-decoration-none text-primary small"
                              >
                                {item.name}
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
                          width="150px"
                          className="img-fluid"
                          alt={cat.name || "Category"}
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://learn-attachment.microsoft.com/api/attachments/8954256a-cc48-4d73-a863-5c8ebe3c426c?platform=QnA"; 
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
    </section >
  );
};

export default ItemCategory;
