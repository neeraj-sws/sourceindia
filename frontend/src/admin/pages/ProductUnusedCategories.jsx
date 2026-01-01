import React from 'react'
import Breadcrumb from '../common/Breadcrumb';
import ProductCategoryList from "./ProductCategoryList";
import ProductSubCategoryList from "./ProductSubCategoryList";
import ItemCategory from "./ItemCategory";
import ItemSubCategory from "./ItemSubCategory";
import NewItems from "./NewItems";

const ProductUnusedCategories = () => {
  return (
    <>
        <Breadcrumb page="Products" title="Reports" />
        <div className="row">
          <div className="col-xl-12 mx-auto">
            <ProductCategoryList excludeProductCategories={true} />
            <ProductSubCategoryList excludeProductSubCategories={true} />
            <ItemCategory excludeItemCategories={true} />
            <ItemSubCategory excludeItemSubCategories={true} />
            <NewItems excludeItem={true} />
          </div>
        </div>
        </>
  )
}

export default ProductUnusedCategories