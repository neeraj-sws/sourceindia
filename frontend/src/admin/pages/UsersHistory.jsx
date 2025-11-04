import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import UsersHistoryModals from "./modal/UsersHistoryModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

const UsersHistory = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { showNotification } = useAlert();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [appliedCountry, setAppliedCountry] = useState("");
  const [appliedState, setAppliedState] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [tempCustomerId, setTempCustomerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [tempFirstName, setTempFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tempUserEmail, setTempUserEmail] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [tempUserMobile, setTempUserMobile] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [tempOrganizationName, setTempOrganizationName] = useState("");
  const [mailType, setMailType] = useState([]);
  const [selectedMailType, setSelectedMailType] = useState("");
  const [appliedMailType, setAppliedMailType] = useState("");
  const [usersData, setMailHistoryData] = useState([]);
       const excelExportRef = useRef();

  useEffect(() => {
        setMailType([{id:"active_seller",name:"Active Seller"}, {id:"inactive_seller",name:"Inactive Seller"}, {id:"not_completed_seller",name:"Not Completed Seller"},
          {id:"not_approve_seller",name:"Not Approve Seller"}, {id:"delete_seller",name:"Delete Seller"}, {id:"active_buyer",name:"Active Buyer"},
          {id:"inactive_buyer",name:"Inactive Buyer"}, {id:"not_approve_buyer",name:"Not Approve Buyer"}, {id:"delete_buyer",name:"Delete Buyer"},
        ]);
      }, []);
    
      const handleMailTypeChange = (event) => { setSelectedMailType(event.target.value); };

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/countries`);
        setCountries(res.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);
  
  const handleCountryChange = async (event) => {
    const countryId = event.target.value;
    setSelectedCountry(countryId);
    try {
      const res = await axios.get(`${API_BASE_URL}/location/states/${countryId}`);
      setStates(res.data);
      setSelectedState("");
      setCities([]);
      setSelectedCity("");
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const handleStateChange = async (event) => {
    const stateId = event.target.value;
    setSelectedState(stateId);
    try {
      const res = await axios.get(`${API_BASE_URL}/location/cities/${stateId}`);
      setCities(res.data);
      setSelectedCity("");
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  const handleCityChange = (event) => { setSelectedCity(event.target.value); };

  useEffect(() => {
    $('#country').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Country"
    }).on("change", function () {
      const countryId = $(this).val();
      handleCountryChange({ target: { value: countryId } });
    });
    $("#state").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select State",
    })
    .on("change", function () {
      handleStateChange({ target: { value: $(this).val() } });
    });
    $("#city").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select City",
    })
    .on("change", function () {
      handleCityChange({ target: { value: $(this).val() } });
    });
    $("#mail_type").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select elcina member",
    })
    .on("change", function () {
      handleMailTypeChange({ target: { value: $(this).val() } });
    });
    return () => {
      $("#mail_type").off("change").select2("destroy");
    };
    return () => {
      $('#country').off("change").select2('destroy');
      $("#state").off("change").select2("destroy");
      $("#city").off("change").select2("destroy");
      $("#mail_type").off("change").select2("destroy");
    };
  }, [countries, states, cities, mailType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/signup/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, country: appliedCountry || "", state: appliedState || "", city: appliedCity || "",
          customerId: customerId || "", firstName: firstName || "", lastName: lastName || "", email: userEmail || "",
          mobile: userMobile ,organizationName: organizationName || "", mail_type: appliedMailType },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, appliedCountry, appliedState, appliedCity,
    customerId, firstName, lastName, userEmail, userMobile, organizationName, appliedMailType]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection == "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    if (filteredRecords === 0) {
      if (search.trim()) {
        return `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`;
      } else {
        return "Showing 0 to 0 of 0 entries";
      }
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    if (search.trim()) {
      return `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`;
    } else {
      return `Showing ${start} to ${end} of ${totalRecords} entries`;
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/signup/${id}/status`, { status: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
      showNotification("Status updated", "success");
    } catch (error) {
      console.error("Error updating Status:", error);
      showNotification("Failed to update Status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  useEffect(() => {
      axios.get(`${API_BASE_URL}/signup/all_users`).then((res) => {
        setMailHistoryData(res.data);
      });
    }, []);
  
    const handleDownload = () => {
      if (excelExportRef.current) {
        excelExportRef.current.exportToExcel();
      }
    };

  const clearFilters = () => {
    setSelectedCountry("");
    setSelectedState("");
    setStates([]);
    setSelectedCity("");
    setCities([]);
    setAppliedCountry("");
    setAppliedState("");
    setAppliedCity("");
    setCustomerId("");
    setTempCustomerId("");
    setFirstName("");
    setTempFirstName("");
    setLastName("");
    setTempLastName("");
    setUserEmail("");
    setTempUserEmail("");
    setUserMobile("");
    setTempUserMobile("");
    setOrganizationName("");
    setTempOrganizationName("");
    setSelectedMailType("");
    setAppliedMailType("");
    setPage(1);
    $("#country").val("").trigger("change");
    $("#state").val("").trigger("change");
    $("#city").val("").trigger("change");
    $("#mail_type").val("").trigger("change");
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="User Histories" maincount={totalRecords} page="" title="User History"
          actions={
              <button className="btn  btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
          } />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Customer ID"
                    value={tempCustomerId}
                    onChange={(e) => setTempCustomerId(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter First Name"
                    value={tempFirstName}
                    onChange={(e) => setTempFirstName(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Last Name"
                    value={tempLastName}
                    onChange={(e) => setTempLastName(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Company</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Company"
                    value={tempOrganizationName}
                    onChange={(e) => setTempOrganizationName(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Email"
                    value={tempUserEmail}
                    onChange={(e) => setTempUserEmail(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Mobile</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Mobile"
                    value={tempUserMobile}
                    onChange={(e) => setTempUserMobile(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Country</label>
                  <select id="country" className="form-control select2" value={selectedCountry} onChange={handleCountryChange}>
                    <option value="">All</option>
                    {countries.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">State</label>
                  <select id="state" className="form-control select2" value={selectedState} onChange={handleStateChange}>
                    <option value="">All</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">City</label>
                  <select id="city" className="form-control select2" value={selectedCity} onChange={handleCityChange}>
                    <option value="">All</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Steps</label>
                  <select id="mail_type" className="form-control select2">
                    <option value="">-- Select --</option>
                    {mailType.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-12 d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setAppliedCountry(selectedCountry);
                      setAppliedState(selectedState);
                      setAppliedCity(selectedCity);
                      setCustomerId(tempCustomerId);
                      setFirstName(tempFirstName);
                      setLastName(tempLastName);
                      setUserEmail(tempUserEmail);
                      setUserMobile(tempUserMobile);
                      setOrganizationName(tempOrganizationName);
                      setAppliedMailType(selectedMailType);
                      setPage(1);
                    }}
                  >
                    Apply
                  </button>
                  <button className="btn btn-secondary" onClick={() => { clearFilters(); }}>Clear</button>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "organization_name", label: "Company Name", sortable: true },
                  { key: "steps", label: "Steps", sortable: true },
                  { key: "is_seller", label: "Is Seller", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  { key: "status", label: "Status", sortable: false },
                ]}
                data={data}
                loading={loading}
                page={page}
                totalRecords={totalRecords}
                filteredRecords={filteredRecords}
                limit={limit}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onPageChange={(newPage) => setPage(newPage)}
                onSortChange={handleSortChange}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                search={search}
                onLimitChange={(val) => { setLimit(val); setPage(1); }}
                getRangeText={getRangeText}
                renderRow={(row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.organization_name && (<h6 className="username">{row.organization_name}</h6>)}
                      {row.elcina_member == 1 ? (<><span className="badge bg-primary">Elcina Member</span><br /></>) : ("")}
                      {row.full_name && (<><i className='bx bx-user' /> {row.full_name}<br /></>)}
                      {row.email && (<><i className='bx bx-envelope' /> {row.email}<br /></>)}
                      {row.mobile && (<><i className='bx bx-mobile' /> {row.mobile}<br /></>)}
                      {row.country_name && (<><i className='bx bx-globe' /> {row.country_name}<br /></>)}
                      {row.state_data && (<><i className='bx bx-map' /> {row.state_data}<br /></>)}
                      {row.city_data && (<><i className='bx bx-map' /> {row.city_data}</>)}
                    </td>
                    <td><span className="badge bg-primary">{row.status == 1 ? "Active Seller" : row.status == 0 ? "Inactive Seller" : ""}</span></td>
                    <td><span className="badge bg-primary">{row.is_seller == 1 ? "Seller" : row.is_seller == 0 ? "Buyer" : ""}</span></td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={row.status == 1}
                          onClick={(e) => {
                            e.preventDefault();
                            openStatusModal(row.id, row.status);
                          }}
                          readOnly
                        />
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <UsersHistoryModals
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
      <ExcelExport
              ref={excelExportRef}
              columnWidth={34.29}
              fileName="User History Export.xlsx"
              data={usersData}
              columns={[
                { label: "Status", key: "getStatus" },
                { label: "Organization name", key: "company_name" },
                { label: "Member", key: "membership_plan_name" },
                { label: "Fname", key: "fname" },
                { label: "Lname", key: "lname" },
                { label: "Email", key: "email" },
                { label: "Mobile", key: "mobile" },
                { label: "Country Name", key: "country_name" },
                { label: "State Name", key: "state_name" },
                { label: "City Name", key: "city_name" },
                { label: "Is Seller", key: "getUserStatus" },
                { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
                { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
              ]}
            />
    </>
  );
};

export default UsersHistory;