import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import CompaniesCarousel from './common/CompaniesCarousel';
import Banner from '../sections/Banner';
import Category from '../sections/Category';
import Product from '../sections/Product';
import Company from '../sections/Company';
import React, { useEffect, useState } from 'react'

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);



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
      <Banner />
      <Category />
      <Product />
      <Company />

    </>
  )
}

export default Home