import React from 'react'
import Banner from '../sections/Banner';
import Category from '../sections/Category';
import Product from '../sections/Product';
import Company from '../sections/Company';
import CategoryMain from '../sections/CategoryMain';

const Home = () => {

  return (
    <>
      {/* Hero Section */}
      <Banner />
      <Category limit={12} isHome={true} />
      <Product />
      <Company limit={11} />
      <CategoryMain limit={6} />
    </>
  )
}

export default Home