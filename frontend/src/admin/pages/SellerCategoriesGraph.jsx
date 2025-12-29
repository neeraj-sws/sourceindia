import React from 'react'
import Breadcrumb from '../common/Breadcrumb';
import FilterableSellerChart from "../reports/FilterableSellerChart";

const SellerCategoriesGraph = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Products" title="Graph" />
        <div className="row my-3">
          <div className="col-xl-12">
            <FilterableSellerChart type="category" />
            </div>
            </div>
            <div className="row my-3">
          <div className="col-xl-12">
            <FilterableSellerChart type="subcategory" />
            </div>
          </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default SellerCategoriesGraph