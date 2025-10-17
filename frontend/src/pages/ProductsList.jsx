import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from './../config';

const ProductsList = () => {
  const [productsData, setProductsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1`);
        const cats = res.data || [];
        const filtered = cats.filter(cat => cat.product_count > 0);
        setCategories(filtered);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories?is_delete=0&status=1`);
        const subs = res.data || [];
        const filtered = subs.filter(sub => sub.product_count > 0);
        setSubCategories(filtered);
      } catch (err) {
        console.error('Error fetching sub-categories:', err);
      }
    };
    fetchSubCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${API_BASE_URL}/products?is_delete=0&status=1&is_approve=1`;
        if (selectedCategories.length > 0) {
          url += `&category=${selectedCategories.join(',')}`;
        }
        if (selectedSubCategories.length > 0) {
          url += `&sub_category=${selectedSubCategories.join(',')}`;
        }
        const res = await axios.get(url);
        const products = res.data.products || [];
        setProductsData(products);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, [selectedCategories, selectedSubCategories]);

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

  const handleSubCategoryCheckboxChange = (subCategoryId) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const filteredProducts = productsData.filter(product =>
    product.title.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="bg-dark text-white min-vh-100">
      <nav className="bg-secondary py-3 mb-4">
        <div className="container position-relative">
          <div className="input-group flex-nowrap">
            <i className="bx bx-search input-group-text" />
            <input type="text" className="form-control" onChange={handleSearch} placeholder="Search products..." />
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          {/* Filters */}
          <aside className="col-12 col-md-3 mb-4">
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
                  <label htmlFor={`cat-${cat.id}`} className="form-check-label text-capitalize">
                    {cat.name} ({cat.product_count})
                  </label>
                </div>
              ))}
            </div>
            <h3 className="fs-5 mt-4 mb-3">Sub Category</h3>
              <div className="d-flex flex-column gap-2">
                {subCategories.map(sub => (
                  <div className="form-check" key={sub.id}>
                    <input
                      type="checkbox"
                      id={`subcat-${sub.id}`}
                      className="form-check-input"
                      checked={selectedSubCategories.includes(sub.id)}
                      onChange={() => handleSubCategoryCheckboxChange(sub.id)}
                    />
                    <label htmlFor={`subcat-${sub.id}`} className="form-check-label text-capitalize">
                      {sub.name} ({sub.product_count})
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
