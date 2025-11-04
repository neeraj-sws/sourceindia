import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import SellerModals from "./modal/SellerModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

const SellerList = ({ getInactive, getNotApproved, getNotCompleted, getDeleted }) => {
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
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '', });
  const [selectedSeller, setSelectedSeller] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [sellerData, setSellerData] = useState([]);
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
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [appliedState, setAppliedState] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [tempCustomerId, setTempCustomerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [tempFirstName, setTempFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tempLastName, setTempLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [tempOrganizationName, setTempOrganizationName] = useState("");
  const [coreActivities, setCoreActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedCoreActivity, setSelectedCoreActivity] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [appliedCoreActivity, setAppliedCoreActivity] = useState("");
  const [appliedActivity, setAppliedActivity] = useState("");
  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [appliedDesignation, setAppliedDesignation] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState("");
  const [appliedCategories, setAppliedCategories] = useState("");
  const [natureBusiness, setNatureBusiness] = useState([]);
  const [selectedNatureBusiness, setSelectedNatureBusiness] = useState("");
  const [appliedNatureBusiness, setAppliedNatureBusiness] = useState("");
  const [elcinaMember, setElcinaMember] = useState([]);
  const [selectedElcinaMember, setSelectedElcinaMember] = useState("");
  const [appliedElcinaMember, setAppliedElcinaMember] = useState("");

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/states/101`);
        setStates(res.data);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };
    fetchStates();
  }, []);

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
    const fetchCoreactivity = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities`);
        setCoreActivities(res.data);
      } catch (err) {
        console.error("Error fetching core activities:", err);
      }
    };
    fetchCoreactivity();
  }, []);

  const handleCoreactivityChange = async (event) => {
    const coreActivityId = event.target.value;
    setSelectedCoreActivity(coreActivityId);
    try {
      if (coreActivityId) {
        const res = await axios.get(`${API_BASE_URL}/activities/coreactivity/${coreActivityId}`);
        setActivities(res.data);
      } else {
        setActivities([]);
      }
      setSelectedActivity("");
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  const handleActivityChange = (event) => { setSelectedActivity(event.target.value); };

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/designations`);
        setDesignations(res.data);
      } catch (err) {
        console.error("Error fetching designations:", err);
      }
    };
    fetchDesignations();
  }, []);

  const handleDesignationChange = (event) => { setSelectedDesignation(event.target.value); };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoriesChange = (event) => { setSelectedCategories(event.target.value); };

  useEffect(() => {
    const fetchNatureBusiness = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/nature_business`);
        setNatureBusiness(res.data);
      } catch (err) {
        console.error("Error fetching nature business:", err);
      }
    };
    fetchNatureBusiness();
  }, []);

  const handleNatureBusinessChange = (event) => { setSelectedNatureBusiness(event.target.value); };

  useEffect(() => {
    setElcinaMember([{ id: 1, name: "Yes" }, { id: 2, name: "No" }, { id: 3, name: "Not Sure" }]);
  }, []);

  const handleElcinaMemberChange = (event) => { setSelectedElcinaMember(event.target.value); };

  useEffect(() => {
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
    $("#coreactivity").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Coreactivity",
    })
      .on("change", function () {
        handleCoreactivityChange({ target: { value: $(this).val() } });
      });
    $("#activity").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Activity",
    })
      .on("change", function () {
        handleActivityChange({ target: { value: $(this).val() } });
      });
    $("#designation").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Designation",
    })
      .on("change", function () {
        handleDesignationChange({ target: { value: $(this).val() } });
      });
    $("#categories").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Categories",
    })
      .on("change", function () {
        handleCategoriesChange({ target: { value: $(this).val() } });
      });
    $("#nature_business").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select nature business",
    })
      .on("change", function () {
        handleNatureBusinessChange({ target: { value: $(this).val() } });
      });
    $("#elcina_member").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select elcina member",
    })
      .on("change", function () {
        handleElcinaMemberChange({ target: { value: $(this).val() } });
      });
    return () => {
      $("#state").off("change").select2("destroy");
      $("#city").off("change").select2("destroy");
      $("#coreactivity").off("change").select2("destroy");
      $("#activity").off("change").select2("destroy");
      $("#designation").off("change").select2("destroy");
      $("#categories").off("change").select2("destroy");
      $("#nature_business").off("change").select2("destroy");
      $("#elcina_member").off("change").select2("destroy");
    };
  }, [states, cities, coreActivities, activities, designations, categories, natureBusiness, elcinaMember]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sellers/server-side`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection, getInactive: getInactive ? 'true' : 'false',
          getNotApproved: getNotApproved ? 'true' : 'false', getNotCompleted: getNotCompleted ? 'true' : 'false', getDeleted: getDeleted ? 'true' : 'false',
          dateRange, startDate, endDate, state: appliedState || "", city: appliedCity || "",
          customerId: customerId || "", firstName: firstName || "", lastName: lastName || "",
          core_activity: appliedCoreActivity, activity: appliedActivity || "", organizationName: organizationName || "",
          designation: appliedDesignation || "", categoryId: appliedCategories || "", nature_business: appliedNatureBusiness || "", elcina_member: appliedElcinaMember,
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
  }, [page, limit, search, sortBy, sortDirection, getInactive, getNotApproved, getNotCompleted, getDeleted, dateRange, startDate, endDate,
    appliedState, appliedCity, customerId, firstName, lastName, appliedCoreActivity, appliedActivity, organizationName,
    appliedDesignation, appliedCategories, appliedNatureBusiness, appliedElcinaMember
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

  const openDeleteModal = (sellerId) => { setSellerToDelete(sellerId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setSellerToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setSellerToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/sellers/delete-selected`, { data: { ids: selectedSeller } });
        setData((prevData) => prevData.filter((item) => !selectedSeller.includes(item.id)));
        setTotalRecords((prev) => prev - selectedSeller.length);
        setFilteredRecords((prev) => prev - selectedSeller.length);
        setSelectedSeller([]);
        showNotification(res.data?.message || "Selected sellers deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected sellers:", error);
        showNotification("Failed to delete selected sellers.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/sellers/${sellerToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== sellerToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Seller deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Seller:", error);
        showNotification("Failed to delete Seller.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSeller(data?.map((item) => item.id));
    } else {
      setSelectedSeller([]);
    }
  };

  const handleSelectSeller = (sellerId) => {
    setSelectedSeller((prevSelectedSeller) =>
      prevSelectedSeller.includes(sellerId)
        ? prevSelectedSeller.filter((id) => id !== sellerId)
        : [...prevSelectedSeller, sellerId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/sellers`).then((res) => {
      let filtered = res.data;
      if (getDeleted) {
        filtered = filtered.filter((c) => c.is_delete === 1);
      } else if (getInactive) {
        filtered = filtered.filter((c) => c.status === 0 && c.is_delete === 0);
      } else if (getNotApproved) {
        filtered = filtered.filter((c) => c.is_approve === 0 && c.is_delete === 0);
      } else if (getNotCompleted) {
        filtered = filtered.filter((c) => c.is_complete === 0 && c.is_delete === 0);
      } else {
        filtered = filtered.filter((c) => c.is_delete === 0 && c.status === 1 && c.is_approve === 1);
      }
      setSellerData(filtered);
    });
  }, [getInactive, getNotApproved, getNotCompleted, getDeleted]);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => {
    setStatusToggleInfo({ id, currentStatus, field, valueKey });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/sellers/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map(d => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if (field == "delete_status") {
        setData((prevData) => prevData.filter((item) => item.id !== id));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
      }
      if (field == "delete_status") {
        showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
      } else {
        showNotification("Status updated!", "success");
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
    setSelectedState("");
    setSelectedCity("");
    setCities([]);
    setAppliedState("");
    setAppliedCity("");
    setCustomerId("");
    setTempCustomerId("");
    setFirstName("");
    setTempFirstName("");
    setLastName("");
    setTempLastName("");
    setOrganizationName("");
    setTempOrganizationName("");
    setSelectedCoreActivity("");
    setSelectedActivity("");
    setActivities([]);
    setAppliedCoreActivity("");
    setAppliedActivity("");
    setSelectedDesignation("");
    setAppliedDesignation("");
    setSelectedCategories("");
    setAppliedCategories("");
    setSelectedNatureBusiness("");
    setAppliedNatureBusiness("");
    setSelectedElcinaMember("");
    setAppliedElcinaMember("");
    setPage(1);
    $("#state").val("").trigger("change");
    $("#city").val("").trigger("change");
    $("#coreactivity").val("").trigger("change");
    $("#activity").val("").trigger("change");
    $("#designation").val("").trigger("change");
    $("#categories").val("").trigger("change");
    $("#nature_business").val("").trigger("change");
    $("#elcina_member").val("").trigger("change");
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
          <Breadcrumb page="Users"
            title={getInactive ? "Inactive Sellers" : getNotApproved ? "Not Approved Sellers" : getNotCompleted ? "Not Completed Sellers" : getDeleted ? "Recently Deleted Sellers" : "Sellers"}
            add_button={!getDeleted && (<><i className="bx bxs-plus-square"></i> Add Seller</>)} add_link="/admin/add_seller"
            actions={
              <>
                {!getDeleted && !getInactive && !getNotApproved && (
                  <>
                    <button className="btn btn-sm btn-primary mb-2 me-2">
                      Selected Mail
                    </button>
                    <button className="btn btn-sm btn-primary mb-2 me-2">
                      All Mail
                    </button>
                  </>
                )}
                <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}>
                  <i className="bx bx-download" /> Excel
                </button>
                {!getDeleted && (
                  <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedSeller.length === 0}>
                    <i className="bx bx-trash"></i> Delete Selected
                  </button>
                )}
              </>
            }
          />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
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
                      <label className="form-label">Core Activities</label>
                      <select id="coreactivity" className="form-control select2" value={selectedCoreActivity} onChange={handleCoreactivityChange}>
                        <option value="">All</option>
                        {coreActivities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Activities</label>
                      <select id="activity" className="form-control select2" value={selectedActivity} onChange={handleActivityChange}>
                        <option value="">All</option>
                        {activities.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Categories</label>
                      <select id="categories" className="form-control select2" value={selectedCategories} onChange={handleCategoriesChange}>
                        <option value="">All</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Nature of Business</label>
                      <select id="nature_business" className="form-control select2" value={selectedNatureBusiness} onChange={handleNatureBusinessChange}>
                        <option value="">All</option>
                        {natureBusiness.map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
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
                      <label className="form-label">Designations</label>
                      <select id="designation" className="form-control select2" value={selectedDesignation} onChange={handleDesignationChange}>
                        <option value="">All</option>
                        {designations.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Elcina Member</label>
                      <select id="elcina_member" className="form-control select2">
                        <option value="">-- Select --</option>
                        {elcinaMember.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
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
                <div className={!getDeleted ? "col-md-12 d-flex justify-content-end gap-2" : "col-md-4 d-flex justify-content-end gap-2"}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange("customrange");
                      setAppliedState(selectedState);
                      setAppliedCity(selectedCity);
                      setCustomerId(tempCustomerId);
                      setFirstName(tempFirstName);
                      setLastName(tempLastName);
                      setOrganizationName(tempOrganizationName);
                      setAppliedCoreActivity(selectedCoreActivity);
                      setAppliedActivity(selectedActivity);
                      setAppliedDesignation(selectedDesignation);
                      setAppliedCategories(selectedCategories);
                      setAppliedNatureBusiness(selectedNatureBusiness);
                      setAppliedElcinaMember(selectedElcinaMember);
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
                  ...(!getDeleted ? [{ key: "select", label: (<input type="checkbox" onChange={handleSelectAll} />) }] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "organization_name", label: "Company Name", sortable: true },
                  { key: "coreactivity_name", label: "Coreactivity / Category / Segment / Sub Segment", sortable: true },
                  { key: "designation", label: "Designation / Website / Quality Certification", sortable: true },
                  { key: "created_at", label: "Created", sortable: true },
                  { key: "updated_at", label: "Last Update", sortable: true },
                  ...(!getDeleted ? [{ key: "status", label: "Status", sortable: false }] : []),
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
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                search={search}
                onLimitChange={(val) => { setLimit(val); setPage(1); }}
                getRangeText={getRangeText}
                renderRow={(row, index) => (
                  <tr key={row.id}>
                    {!getDeleted && (
                      <td>
                        <input type="checkbox" checked={selectedSeller.includes(row.id)} onChange={() => handleSelectSeller(row.id)} />
                      </td>
                    )}
                    <td><Link to={`/admin/seller/user-profile/${row.id}`}>{(page - 1) * limit + index + 1}</Link></td>
                    <td>
                      {row.organization_name && (<><strong>{row.organization_name}</strong><br /></>)}
                      {row.elcina_member == 1 && (<><span className="badge bg-primary mb-1">Elcina Member</span><br /></>)}
                      {row.is_trading == 1 && (<><span className="badge bg-success mb-1">Trader</span><br /></>)}
                      {row.full_name && (<><i className="bx bx-user me-1" />{row.full_name}<br /></>)}
                      {row.email && (<><i className="bx bx-user me-1" />{row.email}<br /></>)}
                      {row.mobile && (<><i className="bx bx-mobile me-1" />{row.mobile}<br /></>)}
                      {row.state_name && (<><i className="bx bx-map me-1" />{row.state_name}<br /></>)}
                      {row.city_name && (<><i className="bx bx-map me-1" />{row.city_name}<br /></>)}
                      <strong>Products:</strong> <span className="badge bg-primary mb-1">{row.user_count}</span>
                    </td>
                    <td>{row.coreactivity_name}<br />{row.activity_name}<br />{row.category_name}<br />{row.sub_category_name}</td>
                    <td>{row.designation}<br />{row.website}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    {!getDeleted && (
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={row.status == 1}
                            onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.status, "status", "status"); }}
                            readOnly
                          />
                        </div>
                      </td>
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
                                <button className="dropdown-item" onClick={() => navigate(`/admin/edit_seller/${row.id}`)}>
                                  <i className="bx bx-edit me-2"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={(e) => {
                                  e.preventDefault(); openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                                }}
                                >
                                  <i className="bx bx-trash me-2"></i> Delete
                                </button>
                              </li>
                              {!getInactive && !getNotApproved && (
                                <li>
                                  <button className="dropdown-item" onClick={() => navigate(`/admin/edit_seller/${row.id}`)}>
                                    <i className="bx bx-envelope me-2"></i> Mail
                                  </button>
                                </li>
                              )}
                              <li>
                                <button className="dropdown-item" onClick={() => navigate(`/admin/edit_seller/${row.id}`)}>
                                  <i className="bx bx-log-in me-2"></i> Login
                                </button>
                              </li>
                              {!getInactive && !getNotCompleted && !getNotApproved && (
                                <li>
                                  <button className="dropdown-item" onClick={() => navigate(`/admin/edit_seller/${row.id}`)}>
                                    <i className="bx bx-envelope me-2"></i> Mail History
                                  </button>
                                </li>
                              )}
                            </>
                          ) : (
                            <>
                              <li>
                                <button className="dropdown-item" onClick={(e) => {
                                  e.preventDefault(); openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                                }}
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
      <SellerModals
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
        fileName={`${getInactive ? "Inactive" : getNotApproved ? "Notapprove" : getNotCompleted ? "Incomplete" : getDeleted ? "Deleted" : "All"} Seller.xlsx`}
        data={sellerData}
        columns={[
          { label: "First Name", key: "fname" },
          { label: "Last Name", key: "lname" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "mobile" },
          ...(!getNotCompleted || !getDeleted ? [{ label: "Address", key: "address" }] : []),
          ...(!getInactive || !getNotApproved || !getNotCompleted || !getDeleted ? [{ label: "Country Name", key: "country_name" }] : []),
          ...(!getNotCompleted || !getDeleted ? [{ label: "State Name", key: "state_name" }] : []),
          ...(!getNotCompleted || !getDeleted ? [{ label: "City Name", key: "city_name" }] : []),
          ...(!getDeleted ? [{ label: "Membership Plan", key: "membership_plan_name" }] : []),
          ...(!getInactive || !getNotCompleted || !getNotApproved ? [{ label: "Designation", key: "designation" }] : []),
          ...(!getNotCompleted || !getDeleted ? [{ label: "Zipcode", key: "zipcode" }] : []),
          { label: "Organization Name", key: "company_name" },
          ...(getNotCompleted ? [{ label: "Core Activity", key: "coreactivity_name" }] : []),
          ...(getNotCompleted ? [{ label: "Activity", key: "activity_name" }] : []),
          ...(getNotCompleted ? [{ label: "Category", key: "category_names" }] : []),
          ...(getNotCompleted ? [{ label: "Sub Category", key: "sub_category_names" }] : []),
          ...(!getInactive || !getNotApproved || !getNotCompleted ? [{ label: "Company Email", key: "company_email" }] : []),
          ...(!getInactive || !getNotApproved || !getNotCompleted || !getDeleted ? [{ label: "Company Website", key: "company_website" }] : []),
          ...(getDeleted ? [{ label: "Quality Certification", key: "quality_certification" }] : []),
          ...(getNotCompleted ? [{ label: "Products", key: "products" }] : []),
          ...(!getInactive || !getNotApproved || !getNotCompleted || !getDeleted ? [{ label: "Product Count", key: "user_count" }] : []),
          ...(!getNotApproved || !getDeleted || !getNotCompleted || !getDeleted ? [{ label: "Status", key: "getStatus" }] : []),
          ...(!getNotApproved || !getDeleted || !getNotCompleted || !getDeleted ? [{ label: "Approve", key: "getApproved" }] : []),
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          ...(!getNotApproved || !getNotCompleted || !getDeleted ? [{ label: "Approve Update", key: "approve_date", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") }] : []),
        ]}
      />
    </>
  );
};

export default SellerList;