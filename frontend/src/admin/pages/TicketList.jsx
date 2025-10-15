import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import SearchDropdown from "../common/SearchDropdown";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import TicketModals from "./modal/TicketModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, user_id: "", title: "", message: "", priority: "", category: "", status: "", attachment: null };

const TicketList = () => {
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
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const listStatus = ["Pending", "In Progress", "Resolved", "Cancel"];
  const [ticketData, setTicketData] = useState([]);
  const excelExportRef = useRef();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets/server-side`, {
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
      const res = await axios.get(`${API_BASE_URL}/tickets/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), attachment: res.data.attachment });
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
    const { id, value, files } = e.target;
    if (e.target.type === "file") {
      setFormData((prev) => ({ ...prev, [id]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (fieldName) => (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption ? selectedOption.value : "",
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!formData.user_id) errs.user_id = "User is required";
    if (!formData.message.trim()) errs.message = "Message is required";
    if (!formData.priority.trim()) errs.priority = "Priority is required";
    if (!formData.category) errs.category = "Category is required";
    if (!formData.status) errs.status = "Invalid status";
    if (!formData.attachment && !isEditing) {
      errs.attachment = "Attachment is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const selectedCategory = categories.find((c) => c.id.toString() === formData.category.toString());
    const selectedUser = users.find((u) => u.id.toString() === formData.user_id.toString());
    const payload = { ...formData, category_name: selectedCategory?.name || "", user_name: selectedUser?.fname + " " + selectedUser?.lname };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/tickets/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/tickets`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const payload1 = { ...res.data.ticket, category_name: selectedCategory?.name || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Ticket ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Ticket.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/buyers`);
        setUsers(res.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/ticket_categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const openDeleteModal = (ticketId) => { setTicketToDelete(ticketId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setTicketToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/tickets/${ticketToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== ticketToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Ticket deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Ticket:", error);
      showNotification("Failed to delete Ticket.", "error");
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/tickets`).then((res) => {
      setTicketData(res.data);
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
          <Breadcrumb page="Settings" title="Ticket" add_button={<><i className="bx bxs-plus-square"></i> Add Ticket</>} add_link="#" onClick={() => openForm()}
          actions={<button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download" /> Excel</button>}
          />
          <div className="row">
            <div className="col-md-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Ticket" : "Add Ticket"}</h5>
                  <form className="row" onSubmit={handleSubmit} noValidate>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="user_id" className="form-label required">On Behalf Of</label>
                      <SearchDropdown
                        id="user_id"
                        options={users?.map(user => ({ value: user.id, label: user.fname + " " + user.lname }))}
                        value={formData.user_id}
                        onChange={handleSelectChange("user_id")}
                        placeholder="Select here"
                        className={`form-control ${errors.user_id ? "is-invalid" : ""}`}
                      />
                      {errors.user_id && <div className="text-danger small mt-1">{errors.user_id}</div>}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="title" className="form-label required">Title</label>
                      <input
                        type="text"
                        className={`form-control ${errors.title ? "is-invalid" : ""}`}
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Title"
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="priority" className="form-label required">Priority</label>
                      <select
                        id="priority"
                        className={`form-select ${errors.priority ? "is-invalid" : ""}`}
                        value={formData.priority}
                        onChange={handleChange}
                      >
                        <option value="">Select here</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                      {errors.priority && <div className="invalid-feedback">{errors.priority}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="category" className="form-label required">Category</label>
                      <SearchDropdown
                        id="category"
                        options={categories?.map(cat => ({ value: String(cat.id), label: cat.name }))}
                        value={formData.category}
                        onChange={handleSelectChange("category")}
                        placeholder="Select category"
                        className={`form-control ${errors.category ? "is-invalid" : ""}`}
                      />
                      {errors.category && <div className="text-danger small mt-1">{errors.category}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="message" className="form-label required">Message</label>
                      <textarea
                        className={`form-control ${errors.message ? "is-invalid" : ""}`}
                        id="message"
                        onChange={handleChange}
                        placeholder="message"
                        value={formData.message}
                      />
                      {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="attachment" className="form-label required">Attachment</label>
                      <input
                        type="file"
                        className={`form-control ${errors.attachment ? "is-invalid" : ""}`}
                        id="attachment"
                        onChange={handleChange}
                      />
                      {errors.attachment && <div className="invalid-feedback">{errors.attachment}</div>}
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="status" className="form-label required">Status</label>
                      <select
                        id="status"
                        className={`form-select ${errors.status ? "is-invalid" : ""}`}
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="">Select here</option>
                        {listStatus?.map((status, key) => (<option key={key} value={key}>{status}</option>))}
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
                  <h5 className="card-title mb-3">Ticket List</h5>
                  <DataTable
                    columns={[
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "title", label: "Title", sortable: true },
                      { key: "priority", label: "Priority", sortable: true },
                      { key: "category_name", label: "Ticket Category", sortable: true },
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
                        <td>{row.title}</td>
                        <td>{row.priority}</td>
                        <td>{row.category_name}</td>
                        <td>{formatDateTime(row.created_at)}</td>
                        <td>{listStatus.map((s, i) => (row.status == i ? s : ""))}</td>
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
      <TicketModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName="Ticket Export.xlsx"
        data={ticketData}
        columns={[
          { label: "Ticket Id", key: "ticket_id" },
          { label: "Title", key: "title" },
          { label: "Priority", key: "priority" },
          { label: "Added By", key: "added_by" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default TicketList;