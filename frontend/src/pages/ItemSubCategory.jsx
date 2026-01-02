import React from 'react';
import { Suspense, lazy } from 'react';
const Item_SubCategory = lazy(() => import('../sections/ItemSubCategory'));

const ItemSubCategory = () => {
  return (
    <>
      <Suspense fallback={<div></div>}>
        <Item_SubCategory />
      </Suspense>
    </>
  )
}

export default ItemSubCategory