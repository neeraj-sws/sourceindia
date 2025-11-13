import React from 'react'

const EnquiryFilter = () => {
  return (
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
  )
}

export default EnquiryFilter