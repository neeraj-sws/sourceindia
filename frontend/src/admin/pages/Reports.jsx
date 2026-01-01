import React from 'react';
import Breadcrumb from '../common/Breadcrumb';
import SellerFilter from "../reports/SellerFilter";
import BuyerFilter from "../reports/BuyerFilter";
import CompanyFilter from "../reports/CompanyFilter";
import ProductFilter from "../reports/ProductFilter";
import EnquiryFilter from "../reports/EnquiryFilter";

const Reports = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Reports" title="Reports List" />
        <div className="row">
          <div className="col-xl-12 mx-auto">
            <SellerFilter />
            <BuyerFilter />
            <CompanyFilter />
            <ProductFilter />
            <EnquiryFilter />
          </div>
        </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default Reports