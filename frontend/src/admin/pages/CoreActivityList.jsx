import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import ImageWithFallback from "../common/ImageWithFallback";
import DataTable from "../common/DataTable";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import CoreActivityModals from "./modal/CoreActivityModals";
const initialForm = { id: null, name: "", color: "", status: "1", file: null };
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const CoreActivityList = ({ getDeleted }) => {
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [colors, setColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coreActivityToDelete, setCoreActivityToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCoreActivity, setSelectedCoreActivity] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [coreActivityData, setCoreActivityData] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/core_activities/server-side`, {
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

  const openForm = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/core_activities/${editData.id}`);
      const colorId = editData.color ? String(editData.color) : "";
      setFormData({ ...editData, status: String(editData.status), file_name: res.data.file_name, file: null });
      setSelectedColors(colorId);
      setTimeout(() => {
        if ($("#color").data("select2")) {
          $("#color").val(colorId).trigger("change");
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
    setSelectedColors('');
    setTimeout(() => {
    if ($("#color").data("select2")) {
      $("#color").val(null).trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, file: "Please upload a valid image (JPG, PNG, GIF).", }));
        setFormData((prev) => ({ ...prev, file: null, }));
        return;
      }
      setErrors((prev) => ({ ...prev, file: null, }));
      setFormData((prev) => ({ ...prev, file: file, file_name: file.name, }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!selectedColors) errs.color = "Color is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    if (!formData.file && !isEditing) {
      errs.file = "Image is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sColor = colors.find((c) => c.id.toString() === selectedColors.toString());
    const payload = { ...formData, color: selectedColors, color_name: sColor?.title || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/core_activities/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/core_activities`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const payload1 = { ...res.data.coreActivity, color_name: sColor?.title || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Core Activity ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save core activity.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities/colors`);
        setColors(res.data);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  const handleColorsChange = async (event) => {
    const colorsId = event.target.value;
    setSelectedColors(colorsId);
  };

  useEffect(() => {
          $('#color').select2({
            theme: "bootstrap",
            width: '100%',
            placeholder: "Select Color"
          }).on("change", function () {
            const colorId = $(this).val();
            handleColorsChange({ target: { value: colorId } });
          });
      
          return () => {
            if ($('#color').data('select2')) {$('#color').select2('destroy') };
          };
        }, [colors]);

  const openDeleteModal = (coreActivityId) => { setCoreActivityToDelete(coreActivityId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setCoreActivityToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setCoreActivityToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/core_activities/delete-selected`, {
          data: { ids: selectedCoreActivity }
        });
        setData((prevData) => prevData.filter((item) => !selectedCoreActivity.includes(item.id)));
        setTotalRecords((prev) => prev - selectedCoreActivity.length);
        setFilteredRecords((prev) => prev - selectedCoreActivity.length);
        setSelectedCoreActivity([]);
        showNotification(res.data?.message || "Selected core activities deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected core activities:", error);
        showNotification("Failed to delete selected core activities.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/core_activities/${coreActivityToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== coreActivityToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Core Activity deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting core activity:", error);
        showNotification("Failed to delete core activity.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCoreActivity(data?.map((item) => item.id));
    } else {
      setSelectedCoreActivity([]);
    }
  };

  const handleSelectCoreActivity = (coreActivityId) => {
    setSelectedCoreActivity((prevSelectedCoreActivity) =>
      prevSelectedCoreActivity.includes(coreActivityId)
        ? prevSelectedCoreActivity.filter((id) => id !== coreActivityId)
        : [...prevSelectedCoreActivity, coreActivityId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/core_activities`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete=== (getDeleted ? 1 : 0));
      setCoreActivityData(filtered);
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
      await axios.patch(`${API_BASE_URL}/core_activities/${id}/${field}`, { [valueKey]: newStatus });
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
          <Breadcrumb page="Settings" title={getDeleted ? "Recently Deleted Core Activity" : "Core Activity"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square"></i> Add Core Activity</>)} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download" /> Excel</button>
            {!getDeleted ? (
              <>
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedCoreActivity.length === 0}>
                  <i className="bx bx-trash"></i> Delete Selected
                </button>
                <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/coreactivity-remove-list">
                  Recently Deleted Core Activity
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
            <div className="col-md-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Core Activity" : "Add Core Activity"}</h5>
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
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="color" className="form-label required">Color</label>
                        <select
                        className={`form-control ${errors.color ? "is-invalid" : ""}`}
                        id="color"
                        value={selectedColors}
                        onChange={handleColorsChange}
                      >
                        <option value="">Select color</option>
                        {colors?.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.title}
                          </option>
                        ))}
                      </select>
                      </div>
                    <div className="form-group col-md-12 mb-3">
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
                      {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="file" className="form-label required">Core Activity Image</label>
                      <input
                        type="file"
                        className={`form-control ${errors.file ? "is-invalid" : ""}`}
                        id="file"
                        onChange={handleFileChange}
                      />
                      {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                      {formData.file ? (
                        <img
                          src={URL.createObjectURL(formData.file)}
                          className="img-preview object-fit-cover mt-3"
                          width={150}
                          height={150}
                          alt="Preview"
                        />
                      ) : formData.file_name ? (
                        <ImageWithFallback
                          src={`${ROOT_URL}/${formData.file_name}`}
                          width={150}
                          height={150}
                          showFallback={false}
                        />
                      ) : null}
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
            <div className={!getDeleted ? "col-md-7" : "col-md-12"}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{!getDeleted ? "Core Activity List" : "Recently Deleted Core Activity List"}</h5>
                  {getDeleted && (
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <div className="d-flex align-items-center gap-2">
                          <label className="form-label mb-0">Date Filter:</label>
                          <div className="position-relative">
                            <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                              <i className="bx bx-calendar me-2"></i>
                              {format(range[0].startDate, 'MMMM dd, yyyy')} - {format(range[0].endDate, 'MMMM dd, yyyy')}
                            </button>
                            {showPicker && (
                              <div className="position-absolute z-3 bg-white shadow p-2" style={{ top: '100%', left: 0 }}>
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
                  )}
                  <DataTable
                    columns={[
                      ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]:[]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "image", label: "Image", sortable: false },
                      { key: "name", label: "Name", sortable: true },
                      { key: "created_at", label: "Created At", sortable: true },
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
                          <input type="checkbox" checked={selectedCoreActivity.includes(row.id)} onChange={() => handleSelectCoreActivity(row.id)} />
                        </td>
                        )}
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td><ImageWithFallback
                          src={`${ROOT_URL}/${row.file_name}`}
                          width={50}
                          height={50}
                          showFallback={true}
                        /></td>
                        <td>{row.name}</td>
                        <td>{formatDateTime(row.created_at)}</td>
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
      <CoreActivityModals
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
        fileName={getDeleted ? "Core Activity Remove Export.xlsx" : "Core Activity Export.xlsx"}
        data={coreActivityData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default CoreActivityList;