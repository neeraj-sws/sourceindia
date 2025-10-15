import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from "../../utils/formatDate";
import BuyerModals from "./modal/BuyerModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

const BuyerList = ({ getInactive, getNotApproved, getDeleted }) => {
  const navigate = useNavigate();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: "", valueKey: "" });
  const [selectedBuyer, setSelectedBuyer] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [buyerData, setBuyerData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);
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
  const [fullName, setFullName] = useState("");
  const [tempFullName, setTempFullName] = useState("");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/countries`);
        setCountries(res.data);
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = async (event) => {
    const countryId = event.target.value;
    setSelectedCountry(countryId);
    try {
      if (countryId) {
        const res = await axios.get(`${API_BASE_URL}/location/states/${countryId}`);
        setStates(res.data);
      } else {
        setStates([]);
      }
      setSelectedState("");
      setCities([]);
      setSelectedCity("");
    } catch (err) {
      console.error("Error fetching states:", err);
    }
  };

  const handleStateChange = async (event) => {
    const stateId = event.target.value;
    setSelectedState(stateId);
    try {
      if (stateId) {
        const res = await axios.get(`${API_BASE_URL}/location/cities/${stateId}`);
        setCities(res.data);
      } else {
        setCities([]);
      }
      setSelectedCity("");
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  const handleCityChange = (event) => { setSelectedCity(event.target.value); };

  useEffect(() => {
    $("#country").select2({
        theme: "bootstrap",
        width: "100%",
        placeholder: "Select Country",
      })
      .on("change", function () {
        handleCountryChange({ target: { value: $(this).val() } });
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
    return () => {
      $("#country").off("change").select2("destroy");
      $("#state").off("change").select2("destroy");
      $("#city").off("change").select2("destroy");
    };
  }, [countries, states, cities]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/buyers/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getInactive: getInactive ? "true" : "false",
          getNotApproved: getNotApproved ? "true" : "false", getDeleted: getDeleted ? "true" : "false",
          dateRange, startDate, endDate, country: appliedCountry || "", state: appliedState || "", city: appliedCity || "",
          customerId: customerId || "", full_name: fullName || "",
        },
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

  useEffect(() => {
    fetchData();
  }, [ page, limit, search, sortBy, sortDirection, getInactive, getNotApproved, getDeleted, dateRange, startDate, endDate,
    appliedCountry, appliedState, appliedCity, customerId, fullName,
  ]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection == "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    const isFiltered = search.trim() || dateRange || (startDate && endDate);
    if (filteredRecords === 0) {
      return isFiltered
        ? `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`
        : "Showing 0 to 0 of 0 entries";
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return isFiltered
      ? `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`
      : `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const openDeleteModal = (BuyerId) => { setBuyerToDelete(BuyerId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setBuyerToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setBuyerToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/buyers/delete-selected`, {data: {ids: selectedBuyer}});
        setData((prevData) => prevData.filter((item) => !selectedBuyer.includes(item.id)));
        setTotalRecords((prev) => prev - selectedBuyer.length);
        setFilteredRecords((prev) => prev - selectedBuyer.length);
        setSelectedBuyer([]);
        showNotification(res.data?.message || "Selected buyers deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected buyers:", error);
        showNotification("Failed to delete selected buyers.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/buyers/${buyerToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== buyerToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Buyer deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Buyer:", error);
        showNotification("Failed to delete Buyer.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedBuyer(data?.map((item) => item.id));
    } else {
      setSelectedBuyer([]);
    }
  };

  const handleSelectBuyer = (buyerId) => {
    setSelectedBuyer((prevSelectedBuyer) =>
      prevSelectedBuyer.includes(buyerId)
        ? prevSelectedBuyer.filter((id) => id !== buyerId)
        : [...prevSelectedBuyer, buyerId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/buyers`).then((res) => {
      let filtered = res.data;
      if (getDeleted) {
        filtered = filtered.filter((c) => c.is_delete === 1);
      } else if (getInactive) {
        filtered = filtered.filter((c) => c.status === 0 && c.is_delete === 0);
      } else if (getNotApproved) {
        filtered = filtered.filter((c) => c.is_approve === 0 && c.is_delete === 0);
      } else {
        filtered = filtered.filter((c) => c.is_delete === 0 && c.status === 1 && c.is_approve === 1);
      }
      setBuyerData(filtered);
    });
  }, [getInactive, getNotApproved, getDeleted]);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => { setStatusToggleInfo({ id, currentStatus, field, valueKey });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({id: null, currentStatus: null, field: "", valueKey: ""}); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/buyers/${id}/${field}`, {[valueKey]: newStatus});
      setData(data?.map((d) => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if (field == "seller_status" || field == "delete_status") {
        setData((prevData) => prevData.filter((item) => item.id !== id));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
      }
      if (field == "delete_status") {
        showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
      } else {
        showNotification(field == "seller_status" ? "Added to Seller" : "Status updated!", "success");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  const clearFilters = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setDateRange("");
    setStartDate(null);
    setEndDate(null);
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setStates([]);
    setCities([]);
    setAppliedCountry("");
    setAppliedState("");
    setAppliedCity("");
    setCustomerId("");
    setTempCustomerId("");
    setFullName("");
    setTempFullName("");
    setPage(1);
    $("#country").val("").trigger("change");
    $("#state").val("").trigger("change");
    $("#city").val("").trigger("change");
  };

  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, "yyyy-MM-dd"));
    setTempEndDate(format(end, "yyyy-MM-dd"));
    setShowPicker(false);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Buyers" maincount={totalRecords} page="" 
          title={getInactive ? "Inactive Buyers" : getNotApproved ? "Not Approved Buyers" : getDeleted ? "Recently Deleted Buyers" : "Buyers"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square"></i> Add Buyer</>)} add_link="/admin/add_buyer"
          actions={
            <>
              <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}>
                <i className="bx bx-download" /> Excel
              </button>
              {!getDeleted && (
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedBuyer.length === 0}>
                  <i className="bx bx-trash"></i> Delete Selected
                </button>
              )}
            </>
          }
          />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className={!getDeleted ? "col-md-6 mb-3" : "col-md-8 d-flex align-items-center gap-2"}>
                  <label className="form-label">Date Filter:</label>
                  <div className="position-relative">
                    <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                      <i className="bx bx-calendar me-2"></i>
                      {format(range[0].startDate, "MMMM dd, yyyy")} - {format(range[0].endDate, "MMMM dd, yyyy")}
                    </button>
                    {showPicker && (
                      <div className="position-absolute z-3 bg-white shadow p-2" style={{ top: "100%", left: 0 }}>
                        <DateRangePicker
                          ranges={range}
                          onChange={handleRangeChange}
                          showSelectionPreview={true}
                          moveRangeOnFirstSelection={false}
                          editableDateInputs={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {!getDeleted && (
                <>
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
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Full Name"
                    value={tempFullName}
                    onChange={(e) => setTempFullName(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Country</label>
                  <select id="country" className="form-control select2" value={selectedCountry} onChange={handleCountryChange}>
                    <option value="">All</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">State</label>
                  <select id="state" className="form-control select2" value={selectedState} onChange={handleStateChange}>
                    <option value="">All</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">City</label>
                  <select id="city" className="form-control select2" value={selectedCity} onChange={handleCityChange}>
                    <option value="">All</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                </>
                )}
                <div className={!getDeleted ? "col-md-12 d-flex justify-content-end gap-2" : "col-md-4 d-flex justify-content-end gap-2"}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange("customrange");
                      setAppliedCountry(selectedCountry);
                      setAppliedState(selectedState);
                      setAppliedCity(selectedCity);
                      setCustomerId(tempCustomerId);
                      setFullName(tempFullName);
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
                  ...(!getDeleted ? [{key: "select", label: (<input type="checkbox" onChange={handleSelectAll} />)}] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "full_name", label: "Name", sortable: true },
                  { key: "user_company", label: "Company Name", sortable: true },
                  { key: "address", label: "Location", sortable: true },
                  ...(!getDeleted ? [
                  { key: "status", label: "Status", sortable: false },
                  { key: "account_status", label: "Account Status", sortable: false },
                  { key: "seller_status", label: "Manage Seller", sortable: false },
                  ] : [
                  { key: "created_at", label: "Created", sortable: true },
                  { key: "updated_at", label: "Last Update", sortable: true },
                  ]),
                  { key: "action", label: "Action", sortable: false },
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
                onSearchChange={(val) => {setSearch(val); setPage(1);}}
                search={search}
                onLimitChange={(val) => {setLimit(val); setPage(1);}}
                getRangeText={getRangeText}
                renderRow={(row, index) => (
                  <tr key={row.id}>
                    {!getDeleted && (
                      <td>
                        <input type="checkbox" checked={selectedBuyer.includes(row.id)} onChange={() => handleSelectBuyer(row.id)}/>
                      </td>
                    )}
                    <td><Link to={`/admin/buyer/user-profile/${row.id}`}>{(page - 1) * limit + index + 1}</Link></td>
                    <td>{row.full_name}<br />{row.email}<br />{row.mobile}</td>
                    <td>{row.user_company}<br />{row.walkin_buyer == 1 ? (<span className="badge bg-primary">Walk-In Buyer</span>) : ("")}</td>
                    <td>{row.address}</td>
                    {!getDeleted ? (
                      <>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={row.status == 1}
                              onClick={(e) => { e.preventDefault(); openStatusModal( row.id, row.status, "status", "status" ); }}
                              readOnly
                            />
                          </div>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={row.is_approve == 1}
                              onClick={(e) => { e.preventDefault(); openStatusModal( row.id, row.is_approve, "account_status", "is_approve" ); }}
                              readOnly
                            />
                          </div>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={row.is_seller == 1}
                              onClick={(e) => { e.preventDefault(); openStatusModal( row.id, row.is_seller, "seller_status", "is_seller" ); }}
                              readOnly
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{formatDateTime(row.created_at)}</td>
                        <td>{formatDateTime(row.updated_at)}</td>
                      </>
                    )}
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                            <>
                              <li>
                                <button className="dropdown-item" onClick={() => navigate(`/admin/edit_buyer/${row.id}`)}>
                                  <i className="bx bx-edit me-2"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={(e) => { e.preventDefault(); openStatusModal( row.id, row.is_delete, "delete_status", "is_delete" ); }}
                                >
                                  <i className="bx bx-trash me-2"></i> Delete
                                </button>
                              </li>
                            </>
                          ) : (
                            <>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={(e) => { e.preventDefault(); openStatusModal( row.id, row.is_delete, "delete_status", "is_delete" ); }}
                                >
                                  <i className="bx bx-windows me-2"></i> Restore
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => openDeleteModal(row.id)}>
                                  <i className="bx bx-trash me-2"></i> Delete
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <BuyerModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        isBulkDelete={isBulkDelete}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName={`${getInactive ? "Inactive" : getNotApproved ? "Incomplete" : getDeleted ? "Remove" : "All"} Buyers.xlsx`}
        data={buyerData}
        columns={[
          { label: "First Name", key: "fname" },
          { label: "Last Name", key: "lname" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "mobile" },
          { label: "Address", key: "address" },
          { label: "Country Name", key: "country_name" },
          { label: "State Name", key: "state_name" },
          { label: "City Name", key: "city_name" },
          { label: "Membership Plan", key: "membership_plan_name" },
          { label: "Organization Name", key: "company_name" },
          ...(!getDeleted ? [{ label: "Status", key: "getStatus" }] : []),
          ...(!getDeleted ? [{ label: "Approve", key: "getApproved" }] : []),
          { label: "Sourcing Interest", key: "interest_names" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default BuyerList;
