import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import TicketCategoryModals from "./modal/TicketCategoryModals";
const initialForm = { id: null, name: "", email: "", status: "1" };

const TicketCategoryList = () => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketCategoryToDelete, setTicketCategoryToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/ticket_categories/server-side`, {
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

  const openForm = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/ticket_categories/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status) });
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

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email) errs.email = "Email is required";
    else if (!emailRegex.test(formData.email)) errs.email = "Email is invalid";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
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
        await axios.put(`${API_BASE_URL}/ticket_categories/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/ticket_categories`, payload);
        setData((d) => [res.data.ticketCategory, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Ticket Category ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Ticket Category.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (ticketCategoryId) => { setTicketCategoryToDelete(ticketCategoryId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setTicketCategoryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/ticket_categories/${ticketCategoryToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== ticketCategoryToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Ticket Category deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Ticket Category:", error);
      showNotification("Failed to delete Ticket Category.", "error");
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/ticket_categories/${id}/status`, { status: newStatus });
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

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Ticket Categories" maincount={totalRecords} page="" title="Ticket Category" add_button="Add Ticket Category" add_link="#" onClick={() => openForm()} />
          <div className="row">
            <div className="col-md-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Ticket Category" : "Add Ticket Category"}</h5>
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
                      <label htmlFor="email" className="form-label required">Email</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
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
            <div className="col-md-7">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">Ticket Category List</h5>
                  <DataTable
                    columns={[
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "name", label: "Name", sortable: true },
                      { key: "email", label: "Email", sortable: true },
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
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{formatDateTime(row.created_at)}</td>
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
      <TicketCategoryModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
    </>
  );
};

export default TicketCategoryList;