import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from "../../utils/formatDate";
import UnitModals from "./modal/UnitModals";

const initialForm = { id: null, name: "", is_active: "1" };
const MAX_NAME_LENGTH = 50;

// Mirrors the normalization used by the backend when it compares a typed unit
// against an existing row, so the duplicate check shown in the UI matches the
// one the API will run.
const normalize = (value) =>
  String(value == null ? "" : value).trim().replace(/\s+/g, " ").toLowerCase();

const UnitMaster = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  // Default to oldest-first (id ASC) so a newly added unit, which always gets
  // the highest id, lands at the END of the list. Sorting by name would drop it
  // in at whatever position its name happens to alphabetise to.
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { showNotification } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/units/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection },
        headers: getAuthHeaders(),
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
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    if (filteredRecords === 0) {
      if (search.trim()) {
        return `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`;
      }
      return "Showing 0 to 0 of 0 entries";
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    if (search.trim()) {
      return `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`;
    }
    return `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const openForm = (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      setFormData({
        id: editData.id,
        name: editData.name,
        is_active: String(editData.is_active),
      });
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
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));
  };

  const validateForm = () => {
    const errs = {};
    const name = formData.name.trim();
    if (!name) {
      errs.name = "Unit name is required";
    } else if (name.length > MAX_NAME_LENGTH) {
      errs.name = `Unit name must be ${MAX_NAME_LENGTH} characters or fewer`;
    } else if (
      data.some((u) => u.id !== formData.id && normalize(u.name) === normalize(name))
    ) {
      errs.name = "This unit already exists";
    }
    if (!["0", "1"].includes(formData.is_active)) errs.is_active = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const payload = {
      name: formData.name.trim().replace(/\s+/g, " "),
      is_active: formData.is_active,
    };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/units/${formData.id}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post(`${API_BASE_URL}/units`, payload, { headers: getAuthHeaders() });
      }
      showNotification(`Unit ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.error;
      showNotification(msg || "Failed to save Unit.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (unit) => {
    setUnitToDelete(unit);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUnitToDelete(null);
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/units/${unitToDelete.id}`, {
        headers: getAuthHeaders(),
      });
      closeDeleteModal();
      showNotification("Unit deleted successfully!", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting Unit:", error);
      const msg = error.response?.data?.message || error.response?.data?.error;
      showNotification(msg || "Failed to delete Unit.", "error");
    }
  };

  const openStatusModal = (id, currentStatus) => {
    setStatusToggleInfo({ id, currentStatus });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusToggleInfo({ id: null, currentStatus: null });
  };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/units/${id}/status`, { is_active: newStatus }, {
        headers: getAuthHeaders(),
      });
      setData(data?.map((d) => (d.id === id ? { ...d, is_active: newStatus } : d)));
      showNotification("Status updated!", "success");
    } catch (error) {
      console.error("Error updating status:", error);
      const msg = error.response?.data?.message || error.response?.data?.error;
      showNotification(msg || "Failed to update status.", "error");
    } finally {
      closeStatusModal();
      if (document.activeElement) document.activeElement.blur();
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb
            mainhead="Unit Master"
            maincount={totalRecords}
            page="Post Buy Requirement"
            title="Units"
            add_button={<><i className="bx bxs-plus-square me-1" /> Add Unit</>}
            add_link="#"
            onClick={() => openForm()}
          />
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Unit" : "Add Unit"}</h5>
                  <form className="row" onSubmit={handleSubmit} noValidate>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="name" className="form-label required">Unit Name</label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Kilogram"
                        maxLength={MAX_NAME_LENGTH}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="is_active" className="form-label required">Status</label>
                      <select
                        id="is_active"
                        className={`form-select ${errors.is_active ? "is-invalid" : ""}`}
                        value={formData.is_active}
                        onChange={handleChange}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                      {errors.is_active && <div className="invalid-feedback">{errors.is_active}</div>}
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
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "name", label: "Unit Name", sortable: true },
                      { key: "created_at", label: "Created At", sortable: true },
                      { key: "updated_at", label: "Updated At", sortable: true },
                      { key: "is_active", label: "Status", sortable: false },
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
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{formatDateTime(row.created_at)}</td>
                        <td>{formatDateTime(row.updated_at)}</td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={row.is_active == 1}
                              onClick={(e) => {
                                e.preventDefault();
                                openStatusModal(row.id, row.is_active);
                              }}
                              readOnly
                            />
                          </div>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i className="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button className="dropdown-item" onClick={() => openForm(row)}>
                                  <i className="bx bx-edit me-2"></i> Edit
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => openDeleteModal(row)}>
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
      <UnitModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        deleteUnitName={unitToDelete?.name}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
    </>
  );
};

export default UnitMaster;