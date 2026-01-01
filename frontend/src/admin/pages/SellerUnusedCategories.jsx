import React from 'react'
import Breadcrumb from '../common/Breadcrumb';
import ProductCategoryList from "./ProductCategoryList";
import ProductSubCategoryList from "./ProductSubCategoryList";

const SellerUnusedCategories = () => {
  return (
    <>
        <Breadcrumb page="Sellers" title="Reports" />
        <div className="row">
          <div className="col-xl-12 mx-auto">
            <ProductCategoryList excludeSellerCategories={true} />
            <ProductSubCategoryList excludeSellerSubCategories={true} />
          </div>
        </div>
        </>
  )
}

export default SellerUnusedCategories