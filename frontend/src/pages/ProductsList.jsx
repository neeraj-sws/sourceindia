import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from './../config'; // Assuming you have ROOT_URL for images

const ProductsList = () => {
  const [categories, setCategories] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1`);
        const cats = res.data || [];
        // Filter categories that have products
        const filtered = cats.filter(cat => cat.product_count > 0);
        setCategories(filtered);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when selectedCategories changes
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${API_BASE_URL}/products?is_delete=0&status=1&is_approve=1`;
        if (selectedCategories.length === 1) {
          url += `&category=${selectedCategories[0]}`;
        } else if (selectedCategories.length > 1) {
          // If your API supports multiple category filter by comma separated
          url += `&category=${selectedCategories.join(',')}`;
        }
        const res = await axios.get(url);
        const products = res.data.products || [];
        setProductsData(products);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, [selectedCategories]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter products by search term on client side
  const filteredProducts = productsData.filter(product =>
    product.title.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="bg-dark text-white min-vh-100">
      <nav className="bg-secondary py-3 mb-4">
        <div className="container position-relative">
          <input
            type="text"
            onChange={handleSearch}
            placeholder="Search products..."
            className="form-control ps-5"
          />
          <svg
            className="position-absolute top-50 start-0 translate-middle-y ms-3"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="10" cy="10" r="7" />
            <path d="M21 21l-6 -6" />
          </svg>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          {/* Filters */}
          <aside className="col-12 col-md-3 mb-4">
            <h2 className="fs-4">Filters</h2>
            <h3 className="fs-5 mb-3">Category</h3>
            <div className="d-flex flex-column gap-2">
              {categories.map(cat => (
                <div className="form-check" key={cat.id}>
                  <input
                    type="checkbox"
                    id={`cat-${cat.id}`}
                    className="form-check-input"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCheckboxChange(cat.id)}
                  />
                  <label
                    htmlFor={`cat-${cat.id}`}
                    className="form-check-label text-capitalize"
                  >
                    {cat.name} ({cat.product_count})
                  </label>
                </div>
              ))}
            </div>
          </aside>

          {/* Products grid */}
          <section className="col-12 col-md-9">
            <div className="row row-cols-2 row-cols-sm-3 row-cols-xl-4 g-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="col">
                    <div className="card h-100 text-dark">
                      <div
                        className="bg-light d-flex justify-content-center align-items-center"
                        style={{ height: '200px', overflow: 'hidden' }}
                      >
                        <img
                          src={`${ROOT_URL}/${product.file_name}`}
                          alt={product.title}
                          className="img-fluid"
                          style={{ objectFit: 'contain', maxHeight: '100%' }}
                        />
                      </div>
                      <div className="card-body">
                        <h5 className="card-title">{product.title}</h5>
                        <p className="card-text">{product.company_name}</p>
                        <p className="card-text">{product.state_name}</p>
                        {/* Assuming price isn't provided, if you have a price field add here */}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <p className="text-center">No products found.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductsList;
