import React from 'react'

const BuyerFilter = () => {
  return (
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
  )
}

export default BuyerFilter