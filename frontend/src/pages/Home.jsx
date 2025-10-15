<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
import React, { useEffect, useState } from 'react'
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import CompaniesCarousel from './common/CompaniesCarousel';
<<<<<<< HEAD
=======
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
=======
>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
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
<<<<<<< HEAD
      <Company limit={11} />

=======
      <Company />
>>>>>>> dc7dcbf9522dd78c8af7dbc38df16cc6b0a261bd
=======
      <Company limit={11} />

>>>>>>> 2855156f652dd94aa244051a8b45f35dac613fb9
    </>
  )
}

export default Home