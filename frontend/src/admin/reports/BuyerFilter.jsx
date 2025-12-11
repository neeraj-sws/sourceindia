import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import API_BASE_URL from "../../config";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import ExcelExport from "../common/ExcelExport";
import { useAlert } from "../../context/AlertContext";

const BuyerFilter = () => {
  const { showNotification } = useAlert();
  const [buyers, setBuyers] = useState([]);
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
    const [showPicker, setShowPicker] = useState(false);
    const [range, setRange] = useState([
      { startDate: new Date(), endDate: new Date(), key: "selection" },
    ]);
    const datePickerRef = useRef(null);
    const excelExportRef = useRef();
    const [buyerData, setBuyerData] = useState([]);
    const [userHasSelectedDate, setUserHasSelectedDate] = useState(false);
      
    useEffect(() => {
        const handleClickOutside = (event) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
            setShowPicker(false);
        }
        };
        if (showPicker) {
        document.addEventListener("mousedown", handleClickOutside);
        } else {
        document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    const handleRangeChange = (item) => {
        setRange([item.selection]);
        setUserHasSelectedDate(true);
        setShowPicker(false);
    };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/buyers`)
      .then(res => {
        const filteredBuyers = res.data.filter(buyer => buyer.is_delete === 0);
        setBuyers(filteredBuyers)
      })
      .catch(err => console.error("Error fetching buyers:", err));

    axios.get(`${API_BASE_URL}/products/companies`)
      .then(res => {
        const filteredCompanies = res.data.companies.filter(company => company.is_delete === 0);
        setCompanies(filteredCompanies)
      })
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
    $("#fname1").select2({ theme: "bootstrap", width: "100%", placeholder: "First Name" })
      .on("change", function () {
        setSelectedFname($(this).val());
      });

    $("#lname1").select2({ theme: "bootstrap", width: "100%", placeholder: "Last Name" })
      .on("change", function () {
        setSelectedLname($(this).val());
      });

    $("#email1").select2({ theme: "bootstrap", width: "100%", placeholder: "Email" })
      .on("change", function () {
        setSelectedEmail($(this).val());
      });

    $("#mobile1").select2({ theme: "bootstrap", width: "100%", placeholder: "Mobile" })
      .on("change", function () {
        setSelectedMobile($(this).val());
      });

    $("#zipcode1").select2({ theme: "bootstrap", width: "100%", placeholder: "Zipcode" })
      .on("change", function () {
        setSelectedZipcode($(this).val());
      });

    $("#company_id1").select2({ theme: "bootstrap", width: "100%", placeholder: "Company" })
      .on("change", function () {
        setSelectedCompanies($(this).val());
      });

    $("#member_role1").select2({ theme: "bootstrap", width: "100%", placeholder: "Member Role" })
      .on("change", function () {
        handleMemberRoleChange({ target: { value: $(this).val() } });
      });

    $("#status1").select2({ theme: "bootstrap", width: "100%", placeholder: "Select Status" })
      .on("change", function () {
        handleUserStatusChange({ target: { value: $(this).val() } });
      });
      
    $("#is_approve1").select2({ theme: "bootstrap", width: "100%", placeholder: "Select Approve" })
      .on("change", function () {
        handleIsApproveChange({ target: { value: $(this).val() } });
      });

    $("#state1").select2({ theme: "bootstrap", width: "100%", placeholder: "Select State" })
      .on("change", function () {
        handleStateChange({ target: { value: $(this).val() } });
      });

    $("#city1").select2({ theme: "bootstrap", width: "100%", placeholder: "Select City" })
      .on("change", function () {
        handleCityChange({ target: { value: $(this).val() } });
      });

    return () => {
      $("#fname1, #lname1, #email1, #mobile1, #zipcode1, #company_id1, #member_role1, #status1, #is_approve1, #state1, #city1")
  .each(function () {
    if ($(this).data('select2')) {   // only destroy if initialized
      $(this).select2('destroy');
    }
  })
  .off("change");
    };
  }, [buyers, companies, memberRole, userStatus, isApprove, states, cities]);

  useEffect(() => {
  if (buyerData.length > 0) {
    excelExportRef.current.exportToExcel();
  }
}, [buyerData]);

    const handleExport = async () => {
  try {
    const params = {};

    if (selectedFname) params.fname = selectedFname;
    if (selectedLname) params.lname = selectedLname;
    if (selectedEmail) params.email = selectedEmail;
    if (selectedMobile) params.mobile = selectedMobile;
    if (selectedZipcode) params.zipcode = selectedZipcode;
    if (selectedMemberRole) params.member_role = selectedMemberRole;
    if (selectedCompanies) params.company_id = selectedCompanies;
    if (selectedUserStatus) params.status = selectedUserStatus;
    if (selectedIsApprove) params.is_approve = selectedIsApprove;
    if (selectedState) params.state = selectedState;
    if (selectedCity) params.city = selectedCity;

    // Only apply date filter if user selected it
    if (userHasSelectedDate) {
      params.dateRange = "customrange";
      params.startDate = format(range[0].startDate, "yyyy-MM-dd");
      params.endDate = format(range[0].endDate, "yyyy-MM-dd");
    }

    const res = await axios.get(`${API_BASE_URL}/buyers/filtered`, { params });

    if (!res.data.length) {
      showNotification("No data found for export.", "warning");
      return; // stop here (do not export)
    }

    setBuyerData(res.data);

    excelExportRef.current.exportToExcel();

  } catch (err) {
    console.error("Export Error:", err);
  }
};

const handleClear = () => {
  // Reset all states
  setBuyerData([]);
  setSelectedFname("");
  setSelectedLname("");
  setSelectedEmail("");
  setSelectedMobile("");
  setSelectedZipcode("");
  setSelectedCompanies("");
  setSelectedMemberRole("");
  setSelectedUserStatus("");
  setSelectedIsApprove("");
  setSelectedState("");
  setSelectedCity("");
  setCities([]);

  // Reset date range
  setUserHasSelectedDate(false);
  setRange([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Reset Select2 dropdowns
  $("#fname1").val("").trigger("change");
  $("#lname1").val("").trigger("change");
  $("#email1").val("").trigger("change");
  $("#mobile1").val("").trigger("change");
  $("#zipcode1").val("").trigger("change");
  $("#company_id1").val("").trigger("change");
  $("#member_role1").val("").trigger("change");
  $("#status1").val("").trigger("change");
  $("#is_approve1").val("").trigger("change");
  $("#state1").val("").trigger("change");
  $("#city1").val("").trigger("change");
};

  return (
    <>
    <div className="card mb-3">
      <div className="card-body p-4">
        <form className="row g-3">
          <h5>Buyer Filter</h5>
          <div className="col-md-3">
            <select id="fname1" className="form-control select2" value={selectedFname} onChange={() => {}}>
              <option value="">All</option>
              {buyers.map(s => (
                <option key={s.id} value={s.fname}>{s.fname}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="lname1" className="form-control select2" value={selectedLname} onChange={() => {}}>
              <option value="">All</option>
              {buyers.map(s => (
                <option key={s.id} value={s.lname}>{s.lname}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="email1" className="form-control select2" value={selectedEmail} onChange={() => {}}>
              <option value="">All</option>
              {buyers.map(s => (
                <option key={s.id} value={s.email}>{s.email}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="mobile1" className="form-control select2" value={selectedMobile} onChange={() => {}}>
              <option value="">All</option>
              {buyers.map(s => (
                <option key={s.id} value={s.mobile}>{s.mobile}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="company_id1" className="form-control select2" value={selectedCompanies} onChange={() => {}}>
              <option value="">All</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.organization_name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select id="member_role1" className="form-control select2" value={selectedMemberRole} onChange={() => {}}>
              <option value="">All</option>
              {memberRole.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
                <select id="state1" className="form-control select2" value={selectedState} onChange={handleStateChange}>
                    <option value="">All</option>
                    {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
                <select id="city1" className="form-control select2" value={selectedCity} onChange={handleCityChange}>
                    <option value="">All</option>
                    {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
            <select id="zipcode1" className="form-control select2" value={selectedZipcode} onChange={() => {}}>
              <option value="">All</option>
              {buyers.map(s => (
                <option key={s.id} value={s.zipcode}>{s.zipcode}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
            <select id="status1" className="form-control select2" value={selectedUserStatus} onChange={() => {}}>
              <option value="">All</option>
              {userStatus.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
            <div className="col-md-3">
            <select id="is_approve1" className="form-control select2" value={selectedIsApprove} onChange={() => {}}>
              <option value="">All</option>
              {isApprove.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <div className="position-relative">
              <button
                type="button"
                className="form-control text-start"
                onClick={() => setShowPicker(!showPicker)}
              >
                <i className="bx bx-calendar me-2"></i>
                {format(range[0].startDate, "MMMM dd, yyyy")} -{" "}
                {format(range[0].endDate, "MMMM dd, yyyy")}
              </button>
              {showPicker && (
                <div
                  ref={datePickerRef}
                  className="position-absolute z-3 bg-white shadow p-3 rounded"
                  style={{ top: "100%", left: 0, minWidth: "300px" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Select Date Range</h6>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowPicker(false)}
                    ></button>
                  </div>
                  <DateRangePicker
                    ranges={range}
                    onChange={handleRangeChange}
                    showSelectionPreview
                    moveRangeOnFirstSelection={false}
                    editableDateInputs
                  />
                  <div className="text-end mt-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowPicker(false)}
                    >
                        Close
                    </button>
                    </div>
                </div>
              )}
            </div>
          </div>
            <div className="col-12 d-flex justify-content-end gap-2">
  <button
    type="button"
    className="btn btn-info btn-sm px-5 text-light"
    onClick={handleExport}
  >
    Export
  </button>
  <button
    type="button"
    className="btn btn-secondary btn-sm px-5"
    onClick={handleClear}
  >
    Clear
  </button>
</div>
        </form>
      </div>
    </div>
    <ExcelExport
            ref={excelExportRef}
            columnWidth={34.29}
            fileName="Buyer.xlsx"
            data={buyerData}
            columns={[
              { label: "Id", key: "id" },
              { label: "First Name", key: "fname" },
              { label: "Last Name", key: "lname" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "mobile" },
              { label: "Address", key: "address" },
              { label: "Company Name", key: "organization_name" },
              { label: "State Name", key: "state_name" },
              { label: "City Name", key: "city_name" },
              { label: "Zipcode", key: "zipcode" },
              { label: "Status", key: "status" },
              { label: "Approve", key: "is_approve" },
              { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
            ]}
          />
          </>
  );
};

export default BuyerFilter;