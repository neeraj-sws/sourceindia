import React from 'react'
import { Suspense, lazy } from 'react';
const Item = lazy(() => import('../sections/Item'));

const ItemCategories = () => {
  return (
    <>
      <Suspense fallback={<div></div>}>
        <Item />
      </Suspense>
    </>
  )
}

export default ItemCategories