import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import ItemSubCategoryModals from "./modal/ItemSubCategoryModals";
import ExcelExport from "../common/ExcelExport";
import { read, utils } from 'xlsx';
const initialForm = { id: null, name: "", status: "1", item_subcategory_id: "" };
import { formatDateTime } from '../../utils/formatDate';

const ProductKeywords = ({ excludeItemSubCategories }) => {
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
  const [keywordToDelete, setKeywordToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItemSubCategory, setSelectedItemSubCategory] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [itemSubCategoryData, setItemSubCategoryData] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [names, setNames] = useState([""]);
  const [showListModal, setShowListModal] = useState(false);
  const [listData, setListData] = useState([]);
  const [listSearch, setListSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listParentId, setListParentId] = useState(null);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditName, setInlineEditName] = useState("");
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const excelExportRef = useRef();

  const getApiErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage
    );
  };

  const getImportSummaryMessage = (payload, fallbackMessage) => {
    const importedCount = Number(payload?.importedCount || 0);
    const skippedCount = Number(payload?.skippedCount ?? payload?.errors?.length ?? 0);
    const baseMessage = payload?.message || fallbackMessage;

    if (importedCount > 0 && skippedCount > 0) {
      return `${importedCount} keyword(s) imported. ${skippedCount} row(s) skipped.`;
    }

    if (importedCount > 0) {
      return `${importedCount} keyword(s) imported successfully.`;
    }

    if (skippedCount > 0) {
      return payload?.errors?.[0]?.reason
        ? `${baseMessage} First issue: ${payload.errors[0].reason}`
        : baseMessage;
    }

    return baseMessage;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/keywords/server-side`, {
          params: { page, limit, search, sortBy, sort: sortDirection, excludeItemSubCategories: excludeItemSubCategories ? 'true' : 'false' },
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

    fetchData();
  }, [page, limit, search, sortBy, sortDirection, excludeItemSubCategories]);

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

  const openForm = async (editData = null, parentItemSubCategoryId = null) => {
    setIsEditing(!!editData);
    setErrors({});
    setShowFormModal(true);

    if (editData) {
      setFormData({
        id: editData.id,
        name: editData.name || "",
        status: String(editData.status ?? 1),
        item_subcategory_id: String(editData.item_subcategory_id ?? ""),
      });
    } else {
      setFormData({
        ...initialForm,
        item_subcategory_id: String(parentItemSubCategoryId ?? ""),
      });
      setNames([""]);
    }
  };
  const openList = async (parentItemSubCategoryId) => {
    setListParentId(parentItemSubCategoryId);
    setListData([]);
    setListSearch("");
    setInlineEditId(null);
    setInlineEditName("");
    setShowListModal(true);
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/keywords/by-subcategory/${parentItemSubCategoryId}`);
      setListData(res.data);
    } catch (err) {
      console.error("Error fetching keywords:", err);
    } finally {
      setListLoading(false);
    }
  };

  const closeList = () => {
    setShowListModal(false);
    setListData([]);
    setListSearch("");
    setListParentId(null);
    setInlineEditId(null);
    setInlineEditName("");
  };

  const filteredListData = listData.filter((kw) => {
    if (!listSearch.trim()) return true;
    return (kw?.name || "").toLowerCase().includes(listSearch.trim().toLowerCase());
  });

  const startInlineEdit = (keyword) => {
    if (Number(keyword.is_main) === 1) return;
    setInlineEditId(keyword.id);
    setInlineEditName(keyword.name || "");
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineEditName("");
  };

  const saveInlineEdit = async (keywordId) => {
    const trimmedName = inlineEditName.trim();
    if (!trimmedName) {
      showNotification("Keyword name is required.", "error");
      return;
    }

    setInlineSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/keywords/${keywordId}`, { name: trimmedName });
      setListData((prev) => prev.map((kw) => (kw.id === keywordId ? { ...kw, name: trimmedName } : kw)));
      showNotification("Keyword updated successfully!", "success");
      cancelInlineEdit();
    } catch (error) {
      console.error("Error updating keyword:", error);
      showNotification(getApiErrorMessage(error, "Failed to update keyword."), "error");
    } finally {
      setInlineSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setNames([""]);
    setIsEditing(false);
    setErrors({});
    setShowFormModal(false);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const validateForm = () => {
    const errs = {};
    if (!isEditing) {
      const sanitizedNames = names.map((name) => name.trim()).filter(Boolean);
      if (sanitizedNames.length === 0) errs.names = "At least one name is required";
      if (!formData.item_subcategory_id) errs.names = "Please use Add from a row action.";
    } else {
      if (!formData.name.trim()) errs.name = "Name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sanitizedNames = names.map((name) => name.trim()).filter(Boolean);
    try {
      if (isEditing) {
        const payload = { ...formData, name: formData.name.trim() };
        await axios.put(`${API_BASE_URL}/keywords/${formData.id}`, payload);
        setData((currentData) =>
          currentData?.map((item) =>
            item.id === formData.id
              ? { ...item, name: payload.name, updated_at: new Date().toISOString() }
              : item
          )
        );
      } else {
        const payload = {
          names: sanitizedNames,
          item_subcategory_id: formData.item_subcategory_id,
          status: Number(initialForm.status),
        };
        const res = await axios.post(`${API_BASE_URL}/keywords`, payload);
        const newItems = res.data.itemSubCategories || (res.data.itemSubCategory ? [res.data.itemSubCategory] : []);
        // setData((currentData) => [...newItems, ...currentData]);
        setTotalRecords((c) => c + newItems.length);
        setFilteredRecords((c) => c + newItems.length);
        const addedSubcategoryId = formData.item_subcategory_id;
        showNotification(
          sanitizedNames.length > 1
            ? `${sanitizedNames.length} keywords added successfully!`
            : "Keyword added successfully!",
          "success"
        );
        resetForm();
        openList(addedSubcategoryId);
        return;
      }
      showNotification("Keyword updated successfully!", "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification(getApiErrorMessage(err, "Failed to save keyword."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (keywordId) => { setKeywordToDelete(keywordId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setKeywordToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setKeywordToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (keywordToDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/keywords/${keywordToDelete}`);
        setListData((prevData) => prevData.filter((item) => item.id !== keywordToDelete));
        setData((prevData) => prevData.filter((item) => item.id !== keywordToDelete));
        setTotalRecords((prev) => Math.max(0, prev - 1));
        setFilteredRecords((prev) => Math.max(0, prev - 1));
        closeDeleteModal();
        showNotification("Keyword deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting keyword:", error);
        showNotification(getApiErrorMessage(error, "Failed to delete keyword."), "error");
      }
      return;
    }

    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/keywords/delete-selected`, {
          data: { ids: selectedItemSubCategory }
        });
        const deletedIds = res.data?.deletedIds || [];
        setData((prevData) => prevData.filter((item) => !deletedIds.includes(item.id)));
        setTotalRecords((prev) => Math.max(0, prev - deletedIds.length));
        setFilteredRecords((prev) => Math.max(0, prev - deletedIds.length));
        setSelectedItemSubCategory([]);
        showNotification(res.data?.message || "Selected category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected category:", error);
        showNotification(getApiErrorMessage(error, "Failed to delete selected Product Keywords."), "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      closeDeleteModal();
    }
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/keywords/${id}/status`, { status: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
      showNotification("Status updated!", "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItemSubCategory(data?.filter((item) => !item.is_parent && Number(item.is_main) !== 1).map((item) => item.id));
    } else {
      setSelectedItemSubCategory([]);
    }
  };

  const handleSelectItemSubCategory = (itemSubCategoryId) => {
    setSelectedItemSubCategory((prevSelectedItemSubCategory) =>
      prevSelectedItemSubCategory.includes(itemSubCategoryId)
        ? prevSelectedItemSubCategory.filter((id) => id !== itemSubCategoryId)
        : [...prevSelectedItemSubCategory, itemSubCategoryId]
    );
  };

  useEffect(() => {
    // axios.get(`${API_BASE_URL}/keywords`).then((res) => {
    //   setItemSubCategoryData(res.data);
    // });
    axios.get(`${API_BASE_URL}/keywords`, {
      params: { excludeItemSubCategories: excludeItemSubCategories ? 'true' : 'false' }
    }).then((res) => {
      setItemSubCategoryData(res.data);
    });
  }, [excludeItemSubCategories]);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const extension = (file.name.split('.').pop() || '').toLowerCase();
      let workbook;

      if (extension === 'csv') {
        const text = await file.text();
        if (/<!doctype|<html|<head|<body/i.test(text.slice(0, 500))) {
          throw new Error('Invalid CSV content detected. Please download template again.');
        }
        workbook = read(text, { type: 'string' });
      } else {
        const data = await file.arrayBuffer();
        workbook = read(data, { type: 'array' });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet);

      const formattedData = jsonData.map((row) => ({
        name: row.Name || row.name || row.Keyword || row.keyword,
        status: row.Status ?? row.status ?? 1,
      }));

      const response = await axios.post(`${API_BASE_URL}/keywords/import`, {
        keywords: formattedData,
        item_subcategory_id: listParentId,
      });
      const importMessage = getImportSummaryMessage(response.data, 'Keywords imported successfully!');
      const notificationType = Number(response.data?.skippedCount || 0) > 0 ? 'warning' : 'success';
      showNotification(importMessage, notificationType);
      event.target.value = '';
      if (listParentId) {
        openList(listParentId);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      const responseData = error?.response?.data;
      if (responseData?.importedCount >= 0 || Array.isArray(responseData?.errors)) {
        showNotification(
          getImportSummaryMessage(responseData, 'No keywords were imported.'),
          'error'
        );
      } else {
        showNotification(getApiErrorMessage(error, 'Failed to import keywords.'), 'error');
      }
      event.target.value = '';
    }
  };

  return (
    <>
      <div className={excludeItemSubCategories ? "page-wrapper h-auto my-3" : "page-wrapper"}>
        <div className="page-content">
          {!excludeItemSubCategories &&
            <Breadcrumb mainhead="Product Keywords" maincount={totalRecords} page="Keyword Master" title="Product Keywords"
              actions={
                <>
                  <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                  <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedItemSubCategory.length === 0}>
                    <i className="bx bx-trash me-1" /> Delete Selected
                  </button>
                </>
              }
            />
          }
          <div className="row">

            <div className="col-md-12">
              {excludeItemSubCategories && (
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-3">Unused Item Sub Category List of Product</h5>
                      <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="card">
                <div className="card-body">
                  <DataTable
                    columns={[
                      ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "image", label: "Image", sortable: false },
                      { key: "name", label: "Name", sortable: true },
                      { key: "itemcategory_name", label: "Item Category", sortable: true },
                      ...(!excludeItemSubCategories ? [{ key: "action", label: "Action", sortable: false }] : []),
                      ...(excludeItemSubCategories ? [{ key: "created_at", label: "Created", sortable: true }] : []),
                      ...(excludeItemSubCategories ? [{ key: "updated_at", label: "Last Update", sortable: true }] : []),
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
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedItemSubCategory.includes(row.id)}
                            disabled={row.is_parent || Number(row.is_main) === 1}
                            onChange={() => handleSelectItemSubCategory(row.id)}
                          />
                        </td>
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td><ImageWithFallback
                          src={`${ROOT_URL}/${row.file_name}`}
                          width={50}
                          height={50}
                          showFallback={true}
                        /></td>
                        <td>{row.name}</td>
                        <td>{row.itemcategory_name}</td>
                        {!excludeItemSubCategories && (
                          <>
                            <td>

                              <button className="btn btn-primary btn-sm" title="Add keyword for this item subcategory" onClick={() => openForm(null, row.item_subcategory_id)}>
                                <i className="bx bx-plus"></i>
                              </button>
                              <button
                                className="btn btn-info btn-sm ms-2"
                                title="Keyword list"
                                onClick={() => openList(row.item_subcategory_id)}
                              >
                                <i className="fadeIn animated bx bx-list-ul"></i>
                              </button>
                              {row.is_parent ? null : Number(row.is_main) === 1 ? (
                                <></>) : (
                                <>
                                  {/* <button className="btn btn-info btn-sm ms-2" title="Edit" onClick={() => openForm(row)}>
                                    <i className="bx bx-edit"></i>
                                  </button> */}
                                  {/* <button className="btn btn-danger btn-sm ms-2" title="Delete" onClick={() => openDeleteModal(row.id)}>
                                    <i className="bx bx-trash"></i>
                                  </button> */}
                                </>
                              )}

                            </td>

                          </>
                        )}
                        {excludeItemSubCategories && (
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
      {/* Form Modal */}
      {showFormModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? "Edit Product Keyword" : "Add Product Keyword"}</h5>
                <button type="button" className="btn-close" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit} noValidate>
                  <label className="form-label required">Name</label>
                  {isEditing ? (
                    <>
                      <input type="text" className={`form-control ${errors.name ? "is-invalid" : ""}`} id="name" value={formData.name} onChange={handleChange} placeholder="Name" />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </>
                  ) : (
                    <>
                      {names.map((n, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-2">
                          <input
                            type="text"
                            className={`form-control ${idx === 0 && errors.names ? "is-invalid" : ""}`}
                            value={n}
                            onChange={(e) => { const updated = [...names]; updated[idx] = e.target.value; setNames(updated); }}
                            placeholder={`Name ${idx + 1}`}
                          />
                          {names.length > 1 && (
                            <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => setNames(names.filter((_, i) => i !== idx))}>
                              <i className="bx bx-trash"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      {errors.names && <div className="text-danger small mb-1">{errors.names}</div>}
                      <button type="button" className="btn btn-sm btn-outline-primary mt-1" onClick={() => setNames([...names, ""])}>
                        <i className="bx bx-plus me-1"></i> Add More
                      </button>
                    </>
                  )}
                  <div className="d-flex justify-content-between mt-3">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>{isEditing ? "Cancel" : "Reset"}</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                      {submitting ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{isEditing ? "Updating..." : "Saving..."}</> : (isEditing ? "Update" : "Save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* List Modal */}
      {showListModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                {(() => {
                  let subcatName = '';
                  if (listParentId && itemSubCategoryData && Array.isArray(itemSubCategoryData)) {
                    const found = itemSubCategoryData.find(x => String(x.id) === String(listParentId));
                    if (found && found.name) subcatName = found.name;
                  }
                  return (
                    <h5 className="modal-title">
                      Product Keywords{subcatName ? ` – ${subcatName}` : ''}
                    </h5>
                  );
                })()}
                <button type="button" className="btn-close" onClick={closeList}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                  <div>
                    {(() => {
                      let subcatName = '';
                      if (listParentId && itemSubCategoryData && Array.isArray(itemSubCategoryData)) {
                        const found = itemSubCategoryData.find(x => String(x.id) === String(listParentId));
                        if (found && found.name) subcatName = found.name;
                      }
                      // Sanitize for filename (remove spaces, special chars)
                      const safeName = subcatName ? subcatName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_') : '';
                      const fileName = safeName ? `${safeName}.csv` : 'example_keywords.csv';
                      return (
                        <a className="btn btn-sm btn-outline-primary" href="/example_keywords.csv" download={fileName}>
                          <i className="bx bx-download me-1" /> Download Example CSV
                        </a>
                      );
                    })()}
                    <button className="btn btn-sm btn-success ms-2" onClick={() => document.getElementById('fileUpload').click()}>
                      <i className="bx bx-upload me-1" /> Import Keywords
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search keyword"
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    style={{ maxWidth: 220 }}
                  />
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>
                {listLoading ? (
                  <div className="text-center py-3">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Loading...
                  </div>
                ) : filteredListData.length === 0 ? (
                  <p className="text-muted text-center mb-0">No keywords found.</p>
                ) : (
                  <table className="table table-sm table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListData.map((kw, idx) => (
                        <tr key={kw.id}>
                          <td>{idx + 1}</td>
                          <td>
                            {inlineEditId === kw.id ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={inlineEditName}
                                onChange={(e) => setInlineEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    saveInlineEdit(kw.id);
                                  }
                                  if (e.key === "Escape") {
                                    cancelInlineEdit();
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              kw.name
                            )}
                          </td>
                          <td>
                            {Number(kw.is_main) === 1 ? (
                              <span className="badge bg-secondary">Managed by Item Subcategory</span>
                            ) : inlineEditId === kw.id ? (
                              <>
                                <button
                                  className="btn btn-success btn-sm me-1"
                                  onClick={() => saveInlineEdit(kw.id)}
                                  disabled={inlineSubmitting}
                                >
                                  {inlineSubmitting ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="bx bx-check"></i>}
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm me-1"
                                  onClick={cancelInlineEdit}
                                  disabled={inlineSubmitting}
                                >
                                  <i className="bx bx-x"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm me-1 px-0"
                                onClick={() => startInlineEdit(kw)}
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                            )}
                            {Number(kw.is_main) !== 1 && !kw.is_used && (
                              <button
                                className="btn pe-0 ps-1 text-danger btn-sm"
                                disabled={inlineSubmitting}
                                onClick={() => openDeleteModal(kw.id)}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { closeList(); openForm(null, listParentId); }}
                >
                  <i className="bx bx-plus me-1"></i> Add Keyword
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeList}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ItemSubCategoryModals
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
        fileName="Product Keywords.xlsx"
        data={data}
        columns={[
          { label: "Name", key: "name" },
          { label: "Item SubCategory", key: "item_subcategory_name" },
          { label: "ItemCategory", key: "itemcategory_name" },
          { label: "Status", key: "status" },
          { label: "Main", key: "is_main" },
          { label: "Created At", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Updated At", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default ProductKeywords;
