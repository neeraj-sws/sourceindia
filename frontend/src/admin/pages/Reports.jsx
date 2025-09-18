import React from 'react';
import Breadcrumb from '../common/Breadcrumb';

const Reports = () => {
  return (
    <div className="page-wrapper">
  <div className="page-content">
    <Breadcrumb page="Settings" title="Reports" />
    <div className="row">
      <div className="col-xl-12 mx-auto">
        <div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Seller Filter</h5>
      <div className="col-md-3">
        <select id="sellerFirstName" className="form-select">
          <option value="">First Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerLastName" className="form-select">
          <option value="">Last Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerEmail" className="form-select">
          <option value="">Email</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerMobile" className="form-select">
          <option value="">Mobile</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerCompany" className="form-select">
          <option value="">Company</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerMemberRole" className="form-select">
          <option value="">Member Role</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerAllStates" className="form-select">
          <option value="">All States</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerAllCities" className="form-select">
          <option value="">All Cities</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerZipcode" className="form-select">
          <option value="">Zipcode</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerStatus" className="form-select">
          <option value="">Select Status</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerApprove" className="form-select">
          <option value="">Select Approve</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="sellerDate" className="form-select">
          <option value="">Select Date</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-info btn-sm px-5 text-light float-end">
          Export
        </button>
      </div>
    </form>
  </div>
</div>
<div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Buyer Filter</h5>
      <div className="col-md-3">
        <select id="buyerFirstName" className="form-select">
          <option value="">First Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerLastName" className="form-select">
          <option value="">Last Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerEmail" className="form-select">
          <option value="">Email</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerMobile" className="form-select">
          <option value="">Mobile</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerCompany" className="form-select">
          <option value="">Company</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerMemberRole" className="form-select">
          <option value="">Member Role</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerAllStates" className="form-select">
          <option value="">All States</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerAllCities" className="form-select">
          <option value="">All Cities</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerZipcode" className="form-select">
          <option value="">Zipcode</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerStatus" className="form-select">
          <option value="">Select Status</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerApprove" className="form-select">
          <option value="">Select Approve</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="buyerDate" className="form-select">
          <option value="">Select Date</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-info btn-sm px-5 text-light float-end">
          Export
        </button>
      </div>
    </form>
  </div>
</div>
<div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Company Filter</h5>
      <div className="col-md-3">
        <select id="companyName" className="form-select">
          <option value="">Company Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyLocation" className="form-select">
          <option value="">Company Location</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyContactPerson" className="form-select">
          <option value="">Contact Person</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyBrief" className="form-select">
          <option value="">Brief Company</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyPhone" className="form-select">
          <option value="">Company Phone</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyWebsite" className="form-select">
          <option value="">Company Website</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyEmail" className="form-select">
          <option value="">Company Email</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyMemberRole" className="form-select">
          <option value="">Member Role</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyCoreActivity" className="form-select">
          <option value="">Core Activity</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>      
      <div className="col-md-3">
        <select id="companySegment" className="form-select">
          <option value="">Select Segment</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companySubSegment" className="form-select">
          <option value="">Select Sub Segment</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="companyDate" className="form-select">
          <option value="">Select Date</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-info btn-sm px-5 text-light float-end">
          Export
        </button>
      </div>
    </form>
  </div>
</div>
<div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Product Filter</h5>
      <div className="col-md-3">
        <select id="productName" className="form-select">
          <option value="">Product Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productUserName" className="form-select">
          <option value="">User Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productCategory" className="form-select">
          <option value="">All Category</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productSubCategory" className="form-select">
          <option value="">All Sub Category</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productCompanyName" className="form-select">
          <option value="">Company Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productCode" className="form-select">
          <option value="">Code</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productArticleNumber" className="form-select">
          <option value="">Article Number</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productProvideService" className="form-select">
          <option value="">Provide Service</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="productDate" className="form-select">
          <option value="">Select Date</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-9">
        <div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="goldCheckbox"
    defaultValue="gold"
  />
  <label className="form-check-label" htmlFor="goldCheckbox">
    Gold
  </label>
</div>
<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="featuredCheckbox"
    defaultValue="featured"
  />
  <label className="form-check-label" htmlFor="featuredCheckbox">
    Featured
  </label>
</div>
<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="recommendedCheckbox"
    defaultValue="recommended"
  />
  <label className="form-check-label" htmlFor="recommendedCheckbox">
    Recommended
  </label>
</div>
<div className="form-check form-check-inline">
  <input
    className="form-check-input"
    type="checkbox"
    id="bestCheckbox"
    defaultValue="best_product"
  />
  <label className="form-check-label" htmlFor="bestCheckbox">
    Best Product
  </label>
</div>
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-info btn-sm px-5 text-light float-end">
          Export
        </button>
      </div>
    </form>
  </div>
</div>
<div className="card mb-3">
  <div className="card-body p-4">
    <form className="row g-3">
        <h5>Enquiry Filter</h5>
      <div className="col-md-3">
        <select id="enquiryNumber" className="form-select">
          <option value="">Enquiry Number</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="enquiryCompanyName" className="form-select">
          <option value="">Company Name</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="enquiryCategory" className="form-select">
          <option value="">All Category</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="enquirySubCategory" className="form-select">
          <option value="">All Sub Category</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-md-3">
        <select id="enquiryDate" className="form-select">
          <option value="">Select Date</option>
          <option value="1">Active</option>
            <option value="2">Deactive</option>
        </select>
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-info btn-sm px-5 text-light float-end">
          Export
        </button>
      </div>
    </form>
  </div>
</div>
      </div>
    </div>
    {/*end row*/}
  </div>
</div>
  )
}

export default Reports