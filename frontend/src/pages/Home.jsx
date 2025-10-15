import React, { useEffect, useState } from 'react'
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import CompaniesCarousel from './common/CompaniesCarousel';

const Home = () => {
  const [homeBanner, setHomeBanner] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchHomeBanner = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/home_banners`);
        setHomeBanner(res.data);
      } catch (err) {
        console.error("Error fetching home banners:", err);
      }
    };
    fetchHomeBanner();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products?limit=6`);
        setProducts(res.data.products);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies?limit=16`);
        setCompanies(res.data);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <>
    {/* Hero Section */}
    <section className="hero text-white text-center">
      <div id="carouselExampleCaptions" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {homeBanner.map((slider, index) => (
            <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={slider.id || index}>
              <img
                src={`${ROOT_URL}/${slider.file_name}`}
                className="d-block w-100 object-fit-cover"
                alt={slider.title}
                height={500}
              />
              <div className="overlay" />
              <div className="carousel-caption d-none d-md-block">
                <h2>{slider.title}</h2>
                <p>{slider.sub_title}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
    {/* Top Categories */}
    <section className="container my-5">
      <h2 className="text-center mb-4">Top Categories</h2>
      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-6 g-4">
        {categories.map((cat) => (
          <div className="col" key={cat.id}>
            <div className="category-box text-center">
              <ImageWithFallback
                src={`${ROOT_URL}/${cat.file_name}`}
                width={180}
                height={180}
                showFallback={true}
              />
              <h5>{cat.name}</h5>
              <p>{cat.product_count || 0} Products</p>
            </div>
          </div>
        ))}
      </div>
    </section>
    {/* Latest Products */}
    <section className="container my-5">
      <h2 className="text-center mb-4">The Latest</h2>
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {products.map((product) => (
        <div className="col" key={product.id}>
          <div className="latest-product">
            <ImageWithFallback
                src={`${ROOT_URL}/${product.file_name}`}
                width={180}
                height={180}
                showFallback={true}
              />
            <h5>{product.title}</h5>
          </div>
        </div>
        ))}
      </div>
    </section>
    {/* Featured Companies */}
    <CompaniesCarousel companies={companies} />
  </>
  )
}

export default Home