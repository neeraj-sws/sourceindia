import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import SourceInterestCategoriesModals from "./modal/SourceInterestCategoriesModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", interest_category_id: "", status: "1" };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const SourceInterestCategories = () => {
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
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sourceInterestCategoryToDelete, setSourceInterestCategoryToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedSourceInterestCategory, setSelectedSourceInterestCategory] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [sourceInterestCategoryData, setSourceInterestCategoryData] = useState([]);
  const excelExportRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/interest_sub_categories/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection]);

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

  const openForm = (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const icId = editData.interest_category_id ? String(editData.interest_category_id) : "";
      setFormData({ ...editData, status: String(editData.status) });
      setSelectedCategories(icId);
      setTimeout(() => {
        if ($("#interest_category_id").data("select2")) {
          $("#interest_category_id").val(icId).trigger("change");
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
    setSelectedCategories('');
    setTimeout(() => {
    if ($("#interest_category_id").data("select2")) {
      $("#interest_category_id").val(null).trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!selectedCategories) errs.interest_category_id = "Interest Category is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sCategory = categories.find((c) => c.id.toString() === formData.interest_category_id.toString());
    const payload = { ...formData, interest_category_id: selectedCategories, category_name: sCategory?.name || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/interest_sub_categories/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/interest_sub_categories`, payload);
        const payload1 = { ...res.data.interestSubCategories, category_name: sCategory?.name || "" };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Source interest category ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save source interest category.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/interest_categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching interest categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoriesChange = (event) => {
    setSelectedCategories(event.target.value);
  };

  useEffect(() => {
          $('#interest_category_id').select2({
            theme: "bootstrap",
            width: '100%',
            placeholder: "Select Role"
          }).on("change", function () {
            const icId = $(this).val();
            handleCategoriesChange({ target: { value: icId } });
          });
      
          return () => {
            if ($('#interest_category_id').data('select2')) {$('#interest_category_id').select2('destroy') };
          };
        }, [categories]);

  const openDeleteModal = (interestSubCategoriesId) => { setSourceInterestCategoryToDelete(interestSubCategoriesId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setSourceInterestCategoryToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setSourceInterestCategoryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/interest_sub_categories/delete-selected`, {
          data: { ids: selectedSourceInterestCategory }
        });
        setData((prevData) => prevData.filter((item) => !selectedSourceInterestCategory.includes(item.id)));
        setTotalRecords((prev) => prev - selectedSourceInterestCategory.length);
        setFilteredRecords((prev) => prev - selectedSourceInterestCategory.length);
        setSelectedSourceInterestCategory([]);
        showNotification(res.data?.message || "Selected interest category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected interest category:", error);
        showNotification("Failed to delete selected interest category.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/interest_sub_categories/${sourceInterestCategoryToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== sourceInterestCategoryToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Source interest category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting source interest category:", error);
        showNotification("Failed to delete source interest category.", "error");
      }
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/interest_sub_categories/${id}/status`, { status: newStatus });
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
      setSelectedSourceInterestCategory(data?.map((item) => item.id));
    } else {
      setSelectedSourceInterestCategory([]);
    }
  };

  const handleSelectSourceInterestCategory = (sourceInterestCategoryId) => {
    setSelectedSourceInterestCategory((prevSelectedSourceInterestCategory) =>
      prevSelectedSourceInterestCategory.includes(sourceInterestCategoryId)
        ? prevSelectedSourceInterestCategory.filter((id) => id !== sourceInterestCategoryId)
        : [...prevSelectedSourceInterestCategory, sourceInterestCategoryId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/interest_sub_categories`).then((res) => {
      setSourceInterestCategoryData(res.data);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Interest Category" maincount={totalRecords} page="Category Master" title="Source interest category" add_button={<><i className="bx bxs-plus-square me-1" /> Add source interest category</>} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedSourceInterestCategory.length === 0}>
              <i className="bx bx-trash me-1" /> Delete Selected
            </button>
            </>
          }
          />
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit source interest category" : "Add source interest category"}</h5>
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
                      <label htmlFor="interest_category_id" className="form-label required">Interest Category</label>
                      <select
                        className="form-control"
                        id="interest_category_id"
                        value={selectedCategories}
                        onChange={handleCategoriesChange}
                      >
                        <option value="">Select Category</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.interest_category_id && (<div className="text-danger small mt-1">{errors.interest_category_id} </div>
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
            <div className="col-md-8">
              <div className="card">
                <div className="card-body">
                  <DataTable
                    columns={[
                      ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "name", label: "Name", sortable: true },
                      { key: "category_name", label: "Interest Category", sortable: true },
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
                        <td>                    
                          <input type="checkbox" checked={selectedSourceInterestCategory.includes(row.id)} onChange={() => handleSelectSourceInterestCategory(row.id)} />
                        </td>
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.category_name}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`statusSwitch_${row.id}`}
                              checked={row.status == 1}
                              onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.status); }}
                              readOnly
                            />
                          </div>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button  className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button className="dropdown-item" onClick={() => openForm(row)}>
                                  <i className="bx bx-edit me-2"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item text-danger" onClick={() => openDeleteModal(row.id)}>
                                  <i className="bx bx-trash me-2"></i> Delete
                                </button>
                              </li>
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
      <SourceInterestCategoriesModals
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
        fileName="Interest SubCategory Export.xlsx"
        data={sourceInterestCategoryData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Interest Category", key: "category_name" },
          { label: "Status", key: "getStatus" },
          { label: "Created At", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Updated At", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default SourceInterestCategories;