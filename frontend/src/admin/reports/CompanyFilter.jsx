import React from 'react'

const CompanyFilter = () => {
  return (
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
  )
}

export default CompanyFilter