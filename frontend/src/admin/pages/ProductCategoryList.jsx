import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import ProductCategoryModals from "./modal/ProductCategoryModals";
const initialForm = { id: null, name: "", top_category: "1", status: "1", file: null };
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';
import { formatDateTime } from '../../utils/formatDate';

const ProductCategoryList = ({ getDeleted, excludeSellerCategories, excludeProductCategories }) => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
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
      const response = await axios.get(`${API_BASE_URL}/categories/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, 
          getDeleted: getDeleted ? 'true' : 'false', 
          excludeSellerCategories: excludeSellerCategories ? 'true' : 'false', 
          excludeProductCategories: excludeProductCategories ? 'true' : 'false', 
          dateRange, startDate, endDate },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted, excludeSellerCategories, excludeProductCategories, 
    dateRange, startDate, endDate]);

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

  const openForm = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/categories/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), top_category: String(editData.top_category), file_name: res.data.file_name, file: null });
    } else {
      setFormData(initialForm);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setErrors({});
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
    if (!formData.name?.trim()) errs.name = "Name is required";
    // if (!["0", "1"].includes(formData.top_category)) errs.top_category = "Top Category is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    // if (!formData.file && !isEditing) {
    //   errs.file = "Image is required";
    // }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const payload = { ...formData };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/categories/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // const img = await axios.get(`${API_BASE_URL}/files/${formData.cat_file_id}`);
        // const updatedFileName = img.data.file;
        let updatedFileName = formData.file_name || null;
        const updatedItem = await axios.get(`${API_BASE_URL}/categories/${formData.id}`);
        const newFileId = updatedItem.data.cat_file_id;
        if (newFileId && newFileId !== 0) {
          const img = await axios.get(`${API_BASE_URL}/files/${newFileId}`);
          updatedFileName = img.data.file;
        }
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, cat_file_id: newFileId, file_name: updatedFileName, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/categories`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const img = await axios.get(`${API_BASE_URL}/files/${res.data.categories.cat_file_id}`);
        const updatedFileName = img.data.file;
        const payload1 = { ...res.data.categories, file_name: updatedFileName };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Product Category ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Product Category.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (categoriesId) => { setCategoryToDelete(categoriesId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setCategoryToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setCategoryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/categories/delete-selected`, {
          data: { ids: selectedCategory }
        });
        setData((prevData) => prevData.filter((item) => !selectedCategory.includes(item.id)));
        setTotalRecords((prev) => prev - selectedCategory.length);
        setFilteredRecords((prev) => prev - selectedCategory.length);
        setSelectedCategory([]);
        showNotification(res.data?.message || "Selected categories deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected categories:", error);
        showNotification("Failed to delete selected categories.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/categories/${categoryToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== categoryToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Product Category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Product Category:", error);
        showNotification("Failed to delete Product Category.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCategory(data?.map((item) => item.id));
    } else {
      setSelectedCategory([]);
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory((prevSelectedCategory) =>
      prevSelectedCategory.includes(categoryId)
        ? prevSelectedCategory.filter((id) => id !== categoryId)
        : [...prevSelectedCategory, categoryId]
    );
  };

  useEffect(() => {
  const fetchCategoryData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`, {
        params: {
          is_delete: getDeleted ? 1 : 0,
          excludeSellerCategories: excludeSellerCategories ? 'true' : 'false',
          excludeProductCategories: excludeProductCategories ? 'true' : 'false',
        },
      });

      setCategoryData(res.data);
    } catch (error) {
      console.error("Error fetching category export data:", error);
    }
  };

  fetchCategoryData();
}, [getDeleted, excludeSellerCategories, excludeProductCategories]);

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
      await axios.patch(`${API_BASE_URL}/categories/${id}/${field}`, { [valueKey]: newStatus });
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
      <div className={excludeSellerCategories || excludeProductCategories ? "page-wrapper h-auto my-3" : "page-wrapper"}>
        <div className="page-content">
          {!excludeSellerCategories && !excludeProductCategories &&
          <Breadcrumb mainhead="Category" maincount={totalRecords} page="Category Master" title={getDeleted ? "Recently Deleted Category" : "Category"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square me-1" /> Add Category</>)} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            {!getDeleted ? (
              <>
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedCategory.length === 0}>
                  <i className="bx bx-trash me-1" /> Delete Selected
                </button>
                <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/category-remove-list">
                  Recently Deleted Category
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
        }
          <div className="row">
            {!getDeleted && !excludeSellerCategories && !excludeProductCategories && (
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Product Category" : "Add Product Category"}</h5>
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
                      <label htmlFor="top_category" className="form-label">Top Category</label>
                      <select
                        id="top_category"
                        className="form-select"
                        value={formData.top_category}
                        onChange={handleChange}
                      >
                        <option value="">Select here</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                      {/* {errors.top_category && <div className="invalid-feedback">{errors.top_category}</div>} */}
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
                      <label htmlFor="file" className="form-label">Category Image</label>
                      <input
                        type="file"
                        className="form-control"
                        id="file"
                        onChange={handleFileChange}
                      />
                      {/* {errors.file && <div className="invalid-feedback">{errors.file}</div>} */}
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
            <div className={!getDeleted && !excludeSellerCategories && !excludeProductCategories ? "col-md-8" : "col-md-12"}>
              
                  {getDeleted && (
                    <>
                    <div className="card mb-3">
                <div className="card-body">
                    <h5 className="card-title mb-3">Recently Deleted Category List</h5>
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
                  {(excludeSellerCategories || excludeProductCategories) && (
                  <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="card-title mb-3">Unused Category List of {excludeSellerCategories ? "Seller" : "Product"}</h5>
                    <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                    </div>
                    </div>
                    </div>
                  )}
                  <div className="card">
                <div className="card-body">
                  <DataTable
                  columns={[
                    ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]:[]),
                    { key: "id", label: "S.No.", sortable: true },
                    { key: "image", label: "Image", sortable: false },
                    { key: "name", label: "Name", sortable: true },
                    ...(!getDeleted && !excludeSellerCategories && !excludeProductCategories ? [{ key: "product_count", label: "Product", sortable: true }]:[]),
                    ...(!excludeSellerCategories && !excludeProductCategories ? [{ key: "status", label: "Status", sortable: false }]:[]),
                    ...(!excludeSellerCategories && !excludeProductCategories ? [{ key: "category_status", label: "Top", sortable: false }]:[]),
                    ...(!excludeSellerCategories && !excludeProductCategories ? [{ key: "action", label: "Action", sortable: false }]:[]),
                    ...(excludeSellerCategories || excludeProductCategories ? [{ key: "created_at", label: "Created", sortable: true }]:[]),
                    ...(excludeSellerCategories || excludeProductCategories ? [{ key: "updated_at", label: "Last Update", sortable: true }]:[]),
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
                        <input type="checkbox" checked={selectedCategory.includes(row.id)} onChange={() => handleSelectCategory(row.id)} />
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
                      {!getDeleted && !excludeSellerCategories && !excludeProductCategories && (<td>{row.product_count}</td>)}
                      {!excludeSellerCategories && !excludeProductCategories && (
                        <>
                      <td>
                        {!getDeleted ? (
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={row.status == 1}
                            onClick={(e) => {
                              e.preventDefault();
                              openStatusModal(row.id, row.status, "status", "status");
                            }}
                            readOnly
                          />
                        </div>
                        ):(
                          row.status == 1 ? (<span className="badge bg-success">Active</span>) : (<span className="badge bg-danger">InActive</span>)
                        )}
                      </td>
                      <td>
                        {!getDeleted ? (
                        <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={row.top_category == 1}
                          onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.top_category, "category_status", "top_category"); }}
                          readOnly
                        />
                        </div>
                        ):(
                          row.top_category == 1 ? (<span className="badge bg-success">Yes</span>) : (<span className="badge bg-danger">No</span>)
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
                      </>
                      )}
                      {(excludeSellerCategories || excludeProductCategories) && (
                        <>
                      <td>{formatDateTime(row.created_at)}</td>
                                          <td>{formatDateTime(row.updated_at)}</td>
                                          </>
                      )}
                    </tr>
                  )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProductCategoryModals
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
        fileName={getDeleted ? "Category Remove Export.xlsx" : 
          excludeSellerCategories ? "Unused Seller Category.xlsx" : 
          excludeProductCategories ? "Unused Product Category.xlsx" : 
          "Category.xlsx"}
        data={categoryData}
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

export default ProductCategoryList;