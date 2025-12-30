import React from 'react'
import Breadcrumb from '../common/Breadcrumb';
import FilterableSourcingInterestsChart from "../reports/FilterableSourcingInterestsChart";

const SourcingInterestsGraph = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Products" title="Graph" />
        <div className="row my-3">
          <div className="col-xl-12">
            <FilterableSourcingInterestsChart type="category" />
            </div>
            </div>
            <div className="row my-3">
          <div className="col-xl-12">
            <FilterableSourcingInterestsChart type="subcategory" />
            </div>
          </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default SourcingInterestsGraph