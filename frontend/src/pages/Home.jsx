import React, { useEffect, useState } from 'react'
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import CompaniesCarousel from './common/CompaniesCarousel';
import Banner from '../sections/Banner';
import Category from '../sections/Category';
import Product from '../sections/Product';
import Company from '../sections/Company';

const Home = () => {

  return (
    <>
      {/* Hero Section */}
      <Banner />
      <Category limit={12} isHome={true} />
      <Product />
      <Company limit={11} />
    </>
  )
}

export default Home