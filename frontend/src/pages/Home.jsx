import React from 'react'
import { Suspense, lazy } from 'react';
const Banner = lazy(() => import('../sections/Banner'));
const CommonSection = lazy(() => import('../pages/CommonSection'));
const Product = lazy(() => import('../sections/Product'));
const Company = lazy(() => import('../sections/Company'));
const CategoryMain = lazy(() => import('../sections/CategoryMain'));

const Home = () => {

  return (
    <>
      <Suspense fallback={<div></div>}>
        <Banner />
        <CommonSection />
        <Product />
        <CategoryMain limit={6} isHome={true} />
        <Company limit={11} />
      </Suspense>
    </>
  )
}

export default Home