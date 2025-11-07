import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import RegistrationModals from "./modal/RegistrationModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';

const RegistrationsList = ({ getDeleted }) => {
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
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [registrationData, setRegistrationData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {startDate: new Date(), endDate: new Date(), key: 'selection'}
  ]);
  const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [appliedState, setAppliedState] = useState("");
    const [appliedCity, setAppliedCity] = useState("");
    const [registrationName, setRegistrationName] = useState("");
    const [tempRegistrationName, setTempRegistrationName] = useState("");
    const [registrationEmail, setRegistrationEmail] = useState("");
    const [tempRegistrationEmail, setTempRegistrationEmail] = useState("");
    const [registrationMobile, setRegistrationMobile] = useState("");
    const [tempRegistrationMobile, setTempRegistrationMobile] = useState("");
    const [registrationCategory, setRegistrationCategory] = useState([]);
    const [selectedRegistrationCategory, setSelectedRegistrationCategory] = useState("");
    const [appliedRegistrationCategory, setAppliedRegistrationCategory] = useState("");

  useEffect(() => {
      const fetchStates = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/location/states`);
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
        setRegistrationCategory([{id:"exhibitor",name:"Exhibitor"}, {id:"buyer",name:"Buyer"}, {id:"delegate",name:"Delegate"},
            {id:"sponsor",name:"Sponsor"}, {id:"speaker",name:"Speaker"}, {id:"visitor",name:"Visitor"},
        ]);
      }, []);
    
      const handleRegistrationCategoryChange = (event) => { setSelectedRegistrationCategory(event.target.value); };

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
        $("#registration_category").select2({
          theme: "bootstrap",
          width: "100%",
          placeholder: "Select category",
        })
        .on("change", function () {
          handleRegistrationCategoryChange({ target: { value: $(this).val() } });
        });
        return () => {
          $("#state").off("change").select2("destroy");
          $("#city").off("change").select2("destroy");
          $("#registration_category").off("change").select2("destroy");
        };
      }, [states, cities, registrationCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false',
        dateRange, startDate, endDate, state: appliedState || "", city: appliedCity || "",
        registrationName: registrationName || "", registrationEmail: registrationEmail || "", registrationMobile: registrationMobile || "",
        registrationCategory: appliedRegistrationCategory },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted, dateRange, startDate, endDate,
    appliedState, appliedCity, registrationName, registrationEmail, registrationMobile, appliedRegistrationCategory
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

  const openDeleteModal = (registrationId) => { setRegistrationToDelete(registrationId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setRegistrationToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setRegistrationToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/registrations/delete-selected`, {
          data: { ids: selectedRegistrations }
        });
        setData((prevData) => prevData.filter((item) => !selectedRegistrations.includes(item.id)));
        setTotalRecords((prev) => prev - selectedRegistrations.length);
        setFilteredRecords((prev) => prev - selectedRegistrations.length);
        setSelectedRegistrations([]);
        showNotification(res.data?.message || "Selected registrations deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected registrations:", error);
        showNotification("Failed to delete selected registrations.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        const res = await axios.delete(`${API_BASE_URL}/registrations/${registrationToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== registrationToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification(res.data?.message || "Registration deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Registration:", error);
        showNotification("Failed to delete Registration.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRegistrations(data?.map((item) => item.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectRegistration = (registrationId) => {
    setSelectedRegistrations((prevSelectedRegistrations) =>
      prevSelectedRegistrations.includes(registrationId)
        ? prevSelectedRegistrations.filter((id) => id !== registrationId)
        : [...prevSelectedRegistrations, registrationId]
    );
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => {
    setStatusToggleInfo({ id, currentStatus, field, valueKey });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/registrations/${id}/delete_status`, { is_delete: newStatus });
      setData((prevData) => prevData.filter((item) => item.id !== id));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/registrations`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === (getDeleted ? 1 : 0));
      setRegistrationData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const clearFilters = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setSelectedState("");
    setSelectedCity("");
    setCities([]);
    setAppliedState("");
    setAppliedCity("");
    setRegistrationName("");
    setTempRegistrationName("");
    setRegistrationEmail("");
    setTempRegistrationEmail("");
    setRegistrationMobile("");
    setTempRegistrationMobile("");
    setSelectedRegistrationCategory("");
    setAppliedRegistrationCategory("");
    setPage(1);
    $("#state").val("").trigger("change");
    $("#city").val("").trigger("change");
    $("#registration_category").val("").trigger("change");
  };
  
  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, 'yyyy-MM-dd'));
    setTempEndDate(format(end, 'yyyy-MM-dd'));
    setShowPicker(false);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Event 2024 Registrations" maincount={totalRecords} page="" title={getDeleted ? "Recently Deleted Event 2024 Registrations" : "Registration"}
            actions={
              <>
                <button className="btn  btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedRegistrations.length === 0}>
                      <i className="bx bx-trash me-1" /> Delete Selected
                    </button>
                    <Link className="btn  btn-primary mb-2" to="/admin/registrations-remove-list">
                      Recently Deleted Registration
                    </Link>
                  </>
                ) : (
                  <button className="btn  btn-primary mb-2 me-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                    Back
                  </button>
                )}
              </>
            }
          />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                {!getDeleted ? (
                <>
                <div className="col-md-4 mb-3">
                <label className="form-label">Name</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Name"
                    value={tempRegistrationName}
                    onChange={(e) => setTempRegistrationName(e.target.value)}
                />
                </div>
                <div className="col-md-4 mb-3">
                <label className="form-label">Email</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Email"
                    value={tempRegistrationEmail}
                    onChange={(e) => setTempRegistrationEmail(e.target.value)}
                />
                </div>
                <div className="col-md-4 mb-3">
                <label className="form-label">Mobile</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Mobile"
                    value={tempRegistrationMobile}
                    onChange={(e) => setTempRegistrationMobile(e.target.value)}
                />
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
                <div className="col-md-4 mb-3">
                <label className="form-label">Category</label>
                <select id="registration_category" className="form-control select2">
                    <option value="">-- Select --</option>
                    {registrationCategory.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
                </div>
                </>
                ) : (
                <div className="col-md-8 d-flex align-items-center gap-2">
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
                )}
                <div className={!getDeleted ? "col-md-12 d-flex justify-content-end gap-2" : "col-md-4 d-flex justify-content-end gap-2"}>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                    setStartDate(tempStartDate);
                    setEndDate(tempEndDate);
                    setDateRange("customrange");
                    setAppliedState(selectedState);
                    setAppliedCity(selectedCity);
                    setRegistrationName(tempRegistrationName);
                    setRegistrationEmail(tempRegistrationEmail);
                    setRegistrationMobile(tempRegistrationMobile);
                    setAppliedRegistrationCategory(selectedRegistrationCategory);
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
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "category", label: "Category", sortable: true },
                  { key: "name", label: "Info", sortable: true },
                  { key: "state_name", label: "Location", sortable: true },
                  { key: "designation", label: "Designation", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
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
                        <input type="checkbox" checked={selectedRegistrations.includes(row.id)} onChange={() => handleSelectRegistration(row.id)} />
                      </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.category}</td>
                    <td>{row.name && (<><strong>Name:</strong> {row.name}<br /></>)}
                      {row.email && (<><strong>Email:</strong> {row.email}<br /></>)}
                      {row.mobile && (<><strong>Mobile:</strong> {row.mobile}<br /></>)}</td>
                    <td>{row.state_name && (<><strong>Email:</strong> {row.state_name}<br /></>)}
                      {row.city_name && (<><strong>Mobile:</strong> {row.city_name}<br /></>)}</td>
                    <td>{row.designation}</td>
                    <td>{row.organization}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                            <>
                              <li>
                                <button className="dropdown-item"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                                  }}
                                >
                                  <i className="bx bx-trash me-2"></i> Delete
                                </button>
                              </li>
                            </>
                          ) : (
                            <>
                              <li>
                                <button className="dropdown-item"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                                  }}
                                >
                                  <i className="bx bx-windows me-2"></i> Restore
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => openDeleteModal(row.id)}>
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
      <RegistrationModals
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
        fileName="Event_2023_registration.xlsx"
        data={registrationData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "mobile" },
          { label: "State Name", key: "state_name" },
          { label: "City Name", key: "city_name" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default RegistrationsList;
