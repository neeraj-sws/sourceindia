<<<<<<< HEAD
import React, { useEffect, useState } from 'react'
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import CompaniesCarousel from './common/CompaniesCarousel';
=======
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
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
<<<<<<< HEAD
      <Company limit={11} />

=======
      <Company />
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
    </>
  )
}

export default Home