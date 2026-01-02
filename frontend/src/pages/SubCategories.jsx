import React from 'react';
import { Suspense, lazy } from 'react';
const SubCategory = lazy(() => import('../sections/SubCategory'));

const SubCategories = () => {
  return (
    <>
      <Suspense fallback={<div></div>}>
        <SubCategory />
      </Suspense>
    </>
  )
}

export default SubCategories