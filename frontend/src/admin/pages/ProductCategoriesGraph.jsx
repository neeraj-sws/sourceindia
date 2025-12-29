import React from 'react'
import Breadcrumb from '../common/Breadcrumb';
import FilterableProductChart from "../reports/FilterableProductChart";

const ProductCategoriesGraph = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Products" title="Graph" />
        <div className="row my-3">
          <div className="col-xl-12">
            <FilterableProductChart type="category" />
            </div>
            </div>
            <div className="row my-3">
          <div className="col-xl-12">
            <FilterableProductChart type="subcategory" />
            </div>
          </div>
        <div className="row my-3">
          <div className="col-xl-12">
            <FilterableProductChart type="itemCategory" />
            </div>
            </div>
            <div className="row my-3">
          <div className="col-xl-12">
            <FilterableProductChart type="itemSubCategory" />
            </div>
          </div>
            <div className="row my-3">
          <div className="col-xl-12">
            <FilterableProductChart type="item" />
            </div>
          </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default ProductCategoriesGraph