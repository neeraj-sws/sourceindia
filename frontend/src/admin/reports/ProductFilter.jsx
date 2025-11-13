import React from 'react'

const ProductFilter = () => {
  return (
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
  )
}

export default ProductFilter