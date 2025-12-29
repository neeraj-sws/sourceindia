import React, { useEffect, useState } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from './../config';
import { useParams } from 'react-router-dom';

const Item = () => {
  const { slug } = useParams();
  const [subcategory, setSubcategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories/items?slug=${slug}&page=${page}&limit=8`
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
    <section className="categorySection py-md-4 pt-2 my-4">
      <div className="container">
        {/* 🟢 Subcategory Heading */}
        <h4 className="fw-semibold mb-4  pb-2 text-blue">
          {subcategory.name}
        </h4>
        <div className='card mb-3 card-border'>
          <div className='card-body'>
            {/* 🟢 Item Categories */}
            {subcategory.item_categories?.length > 0 ? (
              subcategory.item_categories.map((cat) => (
                <div key={cat.id} className="pb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-semibold mb-0">{cat.name}</h5>

                  </div>

                  {/* 🟢 Items Grid */}
                  <div className="row g-3">
                    {(cat.items || []).length > 0 ? (
                      cat.items.map((item) => (
                        <div key={item.id} className="col-6 col-sm-4 col-md-3 col-lg-2 text-center itemcolblock">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-2">
                              <img
                                src={
                                  item.file_name
                                    ? `${ROOT_URL}/${item.file_name}`
                                    : "https://www.glossyjewels.com/uploads/dummy.jpg"
                                }
                                className="img-fluid rounded mb-2"
                                alt={item.name}
                              />
                              <h6 className="small fw-semibold mb-1">{item.name}</h6>
                              {item.product_count && (
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
              ))
            ) : (
              <p className="text-center text-muted">No item categories found.</p>
            )}
          </div>
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

export default Item;
