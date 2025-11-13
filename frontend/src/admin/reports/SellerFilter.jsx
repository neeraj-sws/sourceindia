import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

const SellerFilter = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedFname, setSelectedFname] = useState("");
  const [selectedLname, setSelectedLname] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedMobile, setSelectedMobile] = useState("");
  const [selectedZipcode, setSelectedZipcode] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [memberRole, setMemberRole] = useState([]);
  const [selectedMemberRole, setSelectedMemberRole] = useState("");
  const [userStatus, setUserStatus] = useState([]);
  const [selectedUserStatus, setSelectedUserStatus] = useState("");
  const [isApprove, setIsApprove] = useState([]);
  const [selectedIsApprove, setSelectedIsApprove] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE_URL}/sellers`)
      .then(res => setSellers(res.data))
      .catch(err => console.error("Error fetching sellers:", err));

    axios.get(`${API_BASE_URL}/products/companies`)
      .then(res => setCompanies(res.data.companies))
      .catch(err => console.error("Error fetching companies:", err));

    setMemberRole([{ id: 1, name: "Admin" }]);

    setUserStatus([{ id: 1, name: "Active" }, { id: 0, name: "Inactive" }]);

    setIsApprove([{ id: 1, name: "Approve" }, { id: 0, name: "Pending" }]);

    axios.get(`${API_BASE_URL}/location/states/101`)
      .then(res => setStates(res.data))
      .catch(err => console.error("Error fetching states:", err));
  }, []);

  const handleStateChange = async (event) => {
    const stateId = event.target.value;
    setSelectedState(stateId);
    setSelectedCity("");
    if (stateId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/cities/${stateId}`);
        setCities(res.data);
      } catch (err) {
        console.error("Error fetching cities:", err);
      }
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (event) => setSelectedCity(event.target.value);
  
  const handleMemberRoleChange = (event) => { setSelectedMemberRole(event.target.value); };

  const handleUserStatusChange = (event) => { setSelectedUserStatus(event.target.value); };

  const handleIsApproveChange = (event) => { setSelectedIsApprove(event.target.value); };

  useEffect(() => {
    $("#fname").select2({ theme: "bootstrap", width: "100%", placeholder: "Select first name" })
      .on("change", function () {
        setSelectedFname($(this).val());
      });

    $("#lname").select2({ theme: "bootstrap", width: "100%", placeholder: "Select last name" })
      .on("change", function () {
        setSelectedLname($(this).val());
      });

    $("#email").select2({ theme: "bootstrap", width: "100%", placeholder: "Select email" })
      .on("change", function () {
        setSelectedEmail($(this).val());
      });

    $("#mobile").select2({ theme: "bootstrap", width: "100%", placeholder: "Select mobile" })
      .on("change", function () {
        setSelectedMobile($(this).val());
      });

    $("#zipcode").select2({ theme: "bootstrap", width: "100%", placeholder: "Select zipcode" })
      .on("change", function () {
        setSelectedZipcode($(this).val());
      });

    $("#company_id").select2({ theme: "bootstrap", width: "100%", placeholder: "Select company" })
      .on("change", function () {
        setSelectedCompanies($(this).val());
      });

    $("#member_role").select2({ theme: "bootstrap", width: "100%", placeholder: "Select member role" })
      .on("change", function () {
        handleMemberRoleChange({ target: { value: $(this).val() } });
      });

    $("#status").select2({ theme: "bootstrap", width: "100%", placeholder: "Select status" })
      .on("change", function () {
        handleUserStatusChange({ target: { value: $(this).val() } });
      });
      
    $("#is_approve").select2({ theme: "bootstrap", width: "100%", placeholder: "Select approve status" })
      .on("change", function () {
        handleIsApproveChange({ target: { value: $(this).val() } });
      });

    $("#state").select2({ theme: "bootstrap", width: "100%", placeholder: "Select State" })
      .on("change", function () {
        handleStateChange({ target: { value: $(this).val() } });
      });

    $("#city").select2({ theme: "bootstrap", width: "100%", placeholder: "Select City" })
      .on("change", function () {
        handleCityChange({ target: { value: $(this).val() } });
      });

    return () => {
      $("#fname, #lname, #email, #mobile, #zipcode, #company_id, #member_role, #status, #is_approve, #state, #city").off("change").select2("destroy");
    };
  }, [sellers, companies, memberRole, userStatus, isApprove, states, cities]);

  return (
    <div className="card mb-3">
      <div className="card-body p-4">
        <form className="row g-3">
          <h5>Seller Filter</h5>
          <div className="col-md-3">
            <select id="fname" className="form-control select2" value={selectedFname}>
              <option value="">All</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.fname}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="lname" className="form-control select2" value={selectedLname}>
              <option value="">All</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.lname}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="email" className="form-control select2" value={selectedEmail}>
              <option value="">All</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.email}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="mobile" className="form-control select2" value={selectedMobile}>
              <option value="">All</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.mobile}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="company_id" className="form-control select2" value={selectedCompanies}>
              <option value="">All</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.organization_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="member_role" className="form-control select2" value={selectedMemberRole}>
              <option value="">All</option>
              {memberRole.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
                <select id="state" className="form-control select2" value={selectedState} onChange={handleStateChange}>
                    <option value="">All</option>
                    {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
                <select id="city" className="form-control select2" value={selectedCity} onChange={handleCityChange}>
                    <option value="">All</option>
                    {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
            <select id="zipcode" className="form-control select2" value={selectedZipcode}>
              <option value="">All</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>{s.zipcode}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
            <select id="status" className="form-control select2" value={selectedUserStatus}>
              <option value="">All</option>
              {userStatus.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
            <select id="is_approve" className="form-control select2" value={selectedIsApprove}>
              <option value="">All</option>
              {isApprove.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
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
  );
};

export default SellerFilter;