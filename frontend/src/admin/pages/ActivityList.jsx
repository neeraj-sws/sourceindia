import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import SearchDropdown from "../common/SearchDropdown";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import ActivityModals from "./modal/ActivityModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", coreactivity: "", status: "1" };
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const ActivityList = ({ getDeleted }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { showNotification } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [coreActivities, setCoreActivities] = useState([]);
  const [selectedCoreActivities, setSelectedCoreActivities] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [selectedActivity, setSelectedActivity] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const excelExportRef = useRef();
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {startDate: new Date(), endDate: new Date(), key: 'selection'}
  ]);
  const datePickerRef = useRef(null);
  
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/activities/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false', dateRange, startDate, endDate },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted, dateRange, startDate, endDate]);

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

  const openForm = (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const coreactivityId = editData.coreactivity ? String(editData.coreactivity) : "";
      setFormData({ ...editData, status: String(editData.status) });
      setSelectedCoreActivities(coreactivityId);
      setTimeout(() => {
        if ($("#coreactivity").data("select2")) {
          $("#coreactivity").val(coreactivityId).trigger("change");
        }
      }, 100);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setErrors({});
    setSelectedCoreActivities('');
    setTimeout(() => {
    if ($("#coreactivity").data("select2")) {
      $("#coreactivity").val(null).trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const handleSelectChange = (fieldName) => (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption ? selectedOption.value : "",
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!selectedCoreActivities) errs.coreactivity = "Core Activity is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sCoreActivity = coreActivities.find((c) => c.id.toString() === selectedCoreActivities.toString());
    const payload = { ...formData, coreactivity: selectedCoreActivities, coreactivity_name: sCoreActivity?.name || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/activities/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/activities`, payload);
        const payload1 = { ...res.data.activity, coreactivity_name: sCoreActivity?.name || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Activity ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save activity.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCoreActivities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities`);
        setCoreActivities(res.data);
      } catch (error) {
        console.error("Error fetching core activities:", error);
      }
    };
    fetchCoreActivities();
  }, []);

  const handleCoreActivitiesChange = (event) => {
    setSelectedCoreActivities(event.target.value);
  };

  useEffect(() => {
          $('#coreactivity').select2({
            theme: "bootstrap",
            width: '100%',
            placeholder: "Select coreactivity"
          }).on("change", function () {
            const coreactivityId = $(this).val();
            handleCoreActivitiesChange({ target: { value: coreactivityId } });
          });
      
          return () => {
            if ($('#coreactivity').data('select2')) {$('#coreactivity').select2('destroy') };
          };
        }, [coreActivities]);

  const openDeleteModal = (activityId) => { setActivityToDelete(activityId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setActivityToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setActivityToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/activities/delete-selected`, {
          data: { ids: selectedActivity }
        });
        setData((prevData) => prevData.filter((item) => !selectedActivity.includes(item.id)));
        setTotalRecords((prev) => prev - selectedActivity.length);
        setFilteredRecords((prev) => prev - selectedActivity.length);
        setSelectedActivity([]);
        showNotification(res.data?.message || "Selected activities deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected activities:", error);
        showNotification("Failed to delete selected activities.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/activities/${activityToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== activityToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Activity deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting activity:", error);
        showNotification("Failed to delete activity.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedActivity(data?.map((item) => item.id));
    } else {
      setSelectedActivity([]);
    }
  };

  const handleSelectActivity = (activityId) => {
    setSelectedActivity((prevSelectedActivity) =>
      prevSelectedActivity.includes(activityId)
        ? prevSelectedActivity.filter((id) => id !== activityId)
        : [...prevSelectedActivity, activityId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/activities`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete=== (getDeleted ? 1 : 0));
      setActivityData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => { setStatusToggleInfo({ id, currentStatus, field, valueKey }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/activities/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if(field=="delete_status"){
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
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
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
          <Breadcrumb mainhead="Activity" maincount={totalRecords} page="Settings" title={getDeleted ? "Recently Deleted Activity" : "Activity"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square me-1" /> Add Activity</>)} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            {!getDeleted ? (
              <>
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedActivity.length === 0}>
                  <i className="bx bx-trash me-1" /> Delete Selected
                </button>
                <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/activity-remove-list">
                  Recently Deleted Activity
                </Link>
              </>
            ) : (
              <button className="btn btn-sm btn-primary mb-2 me-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                Back
              </button>
            )}
            </>
          }
          />
          <div className="row">
            {!getDeleted && (
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Activity" : "Add Activity"}</h5>
                  <form className="row" onSubmit={handleSubmit} noValidate>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="name" className="form-label required">Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Name"
                      />
                      {errors.name && (<div className="invalid-feedback">{errors.name}</div>)}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="coreactivity" className="form-label required">Core Activity</label>
                      {/* <SearchDropdown
                        options={coreActivities?.map(cat => ({ value: String(cat.id), label: cat.name }))}
                        value={formData.coreactivity}
                        onChange={handleSelectChange("coreactivity")}
                        placeholder="Select Core Activity"
                        id="coreactivity"
                        className={`form-control ${errors.coreactivity ? "is-invalid" : ""}`}
                      /> */}
                      <select
                        className="form-control"
                        id="coreactivity"
                        value={selectedCoreActivities}
                        onChange={handleCoreActivitiesChange}
                      >
                        <option value="">Select coreactivity</option>
                        {coreActivities?.map((coreactivity) => (
                          <option key={coreactivity.id} value={coreactivity.id}>
                            {coreactivity.name}
                          </option>
                        ))}
                      </select>
                      {errors.coreactivity && (<div className="text-danger small mt-1">{errors.coreactivity} </div>
                      )}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="status" className="form-label required">Status</label>
                      <select
                        id="status"
                        className={`form-select ${errors.status ? "is-invalid" : ""}`}
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                      {errors.status && (<div className="invalid-feedback">{errors.status}</div>
                      )}
                    </div>
                    <div className="d-flex justify-content-between">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                        {isEditing ? "Cancel" : "Reset"}
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {isEditing ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          isEditing ? "Update" : "Save"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            )}
            <div className={!getDeleted ? "col-md-8" : "col-md-12"}>                                
                  {getDeleted && (
                    <>
                    <div className="card mb-3">
                <div className="card-body">
                    <h5 className="card-title mb-3">Recently Deleted Activity List</h5>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0">Date Filter:</label>
                          <div className="position-relative">
                            <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                              <i className="bx bx-calendar me-2"></i>
                              {format(range[0].startDate, 'MMMM dd, yyyy')} - {format(range[0].endDate, 'MMMM dd, yyyy')}
                            </button>
                            {showPicker && (
                              <div
                                ref={datePickerRef}
                                className="position-absolute z-3 bg-white shadow p-3 rounded"
                                style={{ top: '100%', left: 0, minWidth: '300px' }}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0">Select Date Range</h6>
                                  <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Close"
                                    onClick={() => setShowPicker(false)}
                                  ></button>
                                </div>
                                <DateRangePicker
                                  ranges={range}
                                  onChange={handleRangeChange}
                                  showSelectionPreview={true}
                                  moveRangeOnFirstSelection={false}
                                  editableDateInputs={true}
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
                      </div>
                      <div className="col-md-4 d-flex justify-content-end gap-2">
                        <button className="btn btn-primary" onClick={() => {
                          setStartDate(tempStartDate);
                          setEndDate(tempEndDate);
                          setDateRange('customrange');
                          setPage(1);
                        }}>
                          Apply
                        </button>
                        <button className="btn btn-secondary" onClick={() => { clearFilters() }}>Clear</button>
                      </div>
                    </div>
                    </div>
                    </div>
                    </>
                  )}
                  <div className="card">
                <div className="card-body">
                  <DataTable
                    columns={[
                      ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]:[]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "name", label: "Name", sortable: true },
                      { key: "coreactivity_name", label: "Core Activity", sortable: true },
                      { key: "status", label: "Status", sortable: false },
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
                          <input type="checkbox" checked={selectedActivity.includes(row.id)} onChange={() => handleSelectActivity(row.id)} />
                        </td>
                        )}
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.coreactivity_name}</td>
                        <td>
                          {!getDeleted ? (
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`statusSwitch_${row.id}`}
                              checked={row.status == 1}
                              onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.status, "status", "status"); }}
                              readOnly
                            />
                          </div>
                          ):(
                            row.status == 1 ? (<span className="badge bg-success">Active</span>) : (<span className="badge bg-danger">InActive</span>)
                          )}
                        </td>
                        <td>
                          <div className="dropdown">
                            <button  className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <ul className="dropdown-menu">
                              {!getDeleted ? (
                              <>
                              <li>
                                <button className="dropdown-item" onClick={() => openForm(row)}>
                                  <i className="bx bx-edit me-2"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" 
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
        </div>
      </div>
      <ActivityModals
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
        fileName={getDeleted ? "Activity Remove Export.xlsx" : "Activity Export.xlsx"}
        data={activityData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Core Activity", key: "coreactivity_name" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default ActivityList;