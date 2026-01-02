import React from 'react'
import { Suspense, lazy } from 'react';
const ItemCategory = lazy(() => import('../sections/ItemCategory'));

const ItemCategories = () => {
  return (
    <>
      <Suspense fallback={<div></div>}>
        <ItemCategory />
      </Suspense>
    </>
  )
}

export default ItemCategories