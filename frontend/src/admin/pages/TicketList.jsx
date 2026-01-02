import React, { useState, useEffect, useRef, use } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import TicketModals from "./modal/TicketModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, user_id: "", title: "", message: "", priority: "", category: "", status: "", attachment: null };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";
import { DateRangePicker } from 'react-date-range';
import { format } from 'date-fns';

const TicketList = () => {
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
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const listStatus = ["Pending", "In Progress", "Resolved", "Cancel"];
  const [ticketData, setTicketData] = useState([]);
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
  const [ticketTitle, setTicketTitle] = useState("");
  const [tempTicketTitle, setTempTicketTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedPriorityFilter, setAppliedPriorityFilter] = useState('');
  const [filterCategories, setFilterCategories] = useState([]);
  const [selectedFilterCategories, setSelectedFilterCategories] = useState("");
  const [appliedFilterCategories, setAppliedFilterCategories] = useState("");
  const datePickerRef = useRef(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({
  id: null,
  newStatus: null,
});
const [statusLoading, setStatusLoading] = useState(false);
        
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
      const response = await axios.get(`${API_BASE_URL}/tickets/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, dateRange, startDate, endDate, 
        title: ticketTitle || "", status: appliedStatusFilter || "", priority: appliedPriorityFilter || "", category: appliedFilterCategories },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, dateRange, startDate, endDate, 
    ticketTitle, appliedStatusFilter, appliedPriorityFilter, appliedFilterCategories]);

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
      console.log(editData)
      const res = await axios.get(`${API_BASE_URL}/tickets/${editData.id}`);
      const categoryId = editData.category ? String(editData.category) : "";
      const userId = editData.user_id ? String(editData.user_id) : "";
      setFormData({ ...editData, status: String(editData.status), attachment: res.data.attachment });
      setSelectedCategory(categoryId);
      setSelectedUsers(userId);
      setTimeout(() => {
        if ($("#category").data("select2")) {
          $("#category").val(categoryId).trigger("change");
        }
        if ($("#user_id").data("select2")) {
          $("#user_id").val(userId).trigger("change");
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
    setSelectedCategory('');
    setSelectedUsers('');
    setTimeout(() => {
    if ($("#category").data("select2")) {
      $("#category").val(null).trigger("change");
    }
    if ($("#user_id").data("select2")) {
      $("#user_id").val('').trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value, files } = e.target;
    if (e.target.type === "file") {
      setFormData((prev) => ({ ...prev, [id]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const allowedFileTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const handleFileChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    if (!allowedFileTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        attachment:
          "Invalid file format (only JPG, JPEG, PNG, GIF, WEBP or PDF allowed)",
      }));

      // reset file
      e.target.value = "";
      setFormData((prev) => ({ ...prev, attachment: null }));
      return;
    }

    // valid file
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.attachment;
      return newErrors;
    });

    setFormData((prev) => ({
      ...prev,
      attachment: file,
      attachment_name: file.name, // optional
    }));
  }
};

  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Title is required";
    if (!selectedUsers) errs.user_id = "User is required";
    if (!formData.message.trim()) errs.message = "Message is required";
    // if (!formData.priority.trim()) errs.priority = "Priority is required";
    if (!selectedCategory) errs.category = "Category is required";
    // if (!formData.status) errs.status = "Invalid status";
    // if (!formData.attachment && !isEditing) {
    //   errs.attachment = "Attachment is required";
    // }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
    const sUser = users.find((u) => u.id.toString() === formData.user_id.toString());
    const payload = { ...formData, category: selectedCategory, category_name: sCategory?.name || "", user_id: selectedUsers, user_name: sUser?.fname + " " + sUser?.lname };
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
        const payload1 = { ...res.data.ticket, category_name: sCategory?.name || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
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

  const handleUsersChange = (event) => {
    setSelectedUsers(event.target.value);
  };

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

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  useEffect(() => {
    const fetchFilterCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/ticket_categories`);
        setFilterCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchFilterCategories();
  }, []);

  const handleFilterCategoriesChange = (event) => { setSelectedFilterCategories(event.target.value); };

  useEffect(() => {
      $("#filter_categories").select2({
        theme: "bootstrap",
        width: "100%",
        placeholder: "Select categories",
      })
      .on("change", function () {
        handleFilterCategoriesChange({ target: { value: $(this).val() } });
      });
      $('#category').select2({
        theme: "bootstrap",
        width: '100%',
        placeholder: "Select Category"
      }).on("change", function () {
        const categoryId = $(this).val();
        handleCategoryChange({ target: { value: categoryId } });
      });

      $('#user_id').select2({
        theme: "bootstrap",
        width: '100%',
        placeholder: "Select User"
      }).on("change", function () {
        const userId = $(this).val();
        handleUsersChange({ target: { value: userId } });
      });
  
      return () => {
        if ($('#filter_categories').data('select2')) {$("#filter_categories").select2("destroy") };
        if ($('#category').data('select2')) {$('#category').select2('destroy') };
        if ($('#user_id').data('select2')) {$('#user_id').select2('destroy') };
      };
    }, [filterCategories, categories, users]);

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

  const clearFilters = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setTicketTitle("");
    setTempTicketTitle("");
    setStatusFilter('');
    setPriorityFilter('');
    setAppliedStatusFilter('');
    setAppliedPriorityFilter('');
    setSelectedFilterCategories("");
    setAppliedFilterCategories("");
    setPage(1);
    $("#filter_categories").val("").trigger("change");
  };

  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, 'yyyy-MM-dd'));
    setTempEndDate(format(end, 'yyyy-MM-dd'));
    setShowPicker(false);
  };

  const openStatusModal = (id, newStatus) => {
  setStatusToggleInfo({ id, newStatus });
  setShowStatusModal(true);
};
  
    const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, newStatus: null }); };
  
    const handleStatusConfirm = async () => {
  const { id, newStatus } = statusToggleInfo;

  const statusMessage = newStatus === 2 ? "Ticket has been resolved successfully." : "Ticket has been cancelled.";
setStatusLoading(true);
  try {
    // 1️⃣ Get ticket details (needed for ticket_id)
    const ticketRes = await axios.get(`${API_BASE_URL}/tickets/${id}`);
    const ticket = ticketRes.data?.ticket || ticketRes.data;

    // 2️⃣ Send system reply
    const formData = new FormData();
    formData.append("id", ticket.ticket_id);
    formData.append("message", statusMessage);
    formData.append("added_by", "Admin");
    formData.append("type", "reply");

    await axios.post(`${API_BASE_URL}/tickets/store-support-ticket-reply`, formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    // 3️⃣ Update ticket status
    await axios.patch(`${API_BASE_URL}/tickets/${id}/status`, { status: newStatus, });

    // 4️⃣ Update UI state
    setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));

    showNotification(newStatus === 2 ? "Ticket resolved successfully!" : "Ticket cancelled successfully!", "success");
    closeStatusModal();
  } catch (error) {
    console.error(error);
    showNotification("Failed to update ticket status.", "error");
  } finally {
    setStatusLoading(false);
  }
};

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Ticket" maincount={totalRecords} page="Support System" title="Ticket" add_button={<><i className="bx bxs-plus-square me-1" /> Add Ticket</>} add_link="#" onClick={() => openForm()}
          actions={<button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>} />
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Ticket" : "Add Ticket"}</h5>
                  <form className="row" onSubmit={handleSubmit} noValidate>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="user_id" className="form-label required">On Behalf Of</label>
                      <select
                        className="form-control"
                        id="user_id"
                        value={selectedUsers}
                        onChange={handleUsersChange}
                      >
                        <option value="">Select here</option>
                        {users?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fname + " " + user.lname}
                          </option>
                        ))}
                      </select>
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
                      <label htmlFor="priority" className="form-label">Priority</label>
                      <select
                        id="priority"
                        className="form-select"
                        value={formData.priority}
                        onChange={handleChange}
                      >
                        <option value="">Select here</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="category" className="form-label required">Category</label>
                      <select
                        className="form-control"
                        id="category"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                      >
                        <option value="">Select Category</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
  <label htmlFor="attachment" className="form-label">Attachment</label>
  <input
    type="file"
    className={`form-control ${errors.attachment ? "is-invalid" : ""}`}
    id="attachment"
    onChange={handleFileChange}
    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
  />
  {errors.attachment && (
    <div className="invalid-feedback">{errors.attachment}</div>
  )}
</div>
                    {/* <div className="form-group col-md-12 mb-3">
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
                    </div> */}
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
              <div className="card mb-3">
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Title"
                        value={tempTicketTitle}
                        onChange={(e) => setTempTicketTitle(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">--Status--</option>
                        <option value="0">Pending</option>
                        <option value="1">Open</option>
                        <option value="2">Resolved</option>
                        <option value="3">Cancel</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="">--Priority--</option>
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Categories</label>
                      <select id="filter_categories" className="form-control select2" value={selectedFilterCategories} onChange={handleFilterCategoriesChange}>
                        <option value="">All</option>
                        {filterCategories.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-8">
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
                    <div className="col-md-12 mt-2 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setStartDate(tempStartDate);
                          setEndDate(tempEndDate);
                          setDateRange('customrange');
                          setTicketTitle(tempTicketTitle);
                          setAppliedStatusFilter(statusFilter);
                          setAppliedPriorityFilter(priorityFilter);
                          setAppliedFilterCategories(selectedFilterCategories);
                          setPage(1);
                        }}
                      >
                        Apply
                      </button>
                      <button className="btn btn-secondary" onClick={() => { clearFilters(); }}>Clear</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <DataTable
                    columns={[
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "ticket_id", label: "Ticket ID", sortable: true },
                      { key: "title", label: "Title", sortable: true },
                      { key: "full_name", label: "Created By", sortable: true },
                      { key: "user_id", label: "Added By", sortable: false },
                      { key: "last_reply_date", label: "Last Reply", sortable: true },
                      { key: "priority", label: "Priority", sortable: true },
                      { key: "category_name", label: "Ticket Category", sortable: true },
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
                        <td><Link to={`/admin/ticket/view/${row.id}`}>{row.ticket_id}</Link></td>
                        <td>{row.title}</td>
                        <td>
                          {row.full_name && (<><i className="bx bx-user me-1" />{row.full_name}<br /></>)}
                          {row.email && (<><i className="bx bx-envelope me-1" />{row.email}<br /></>)}
                        </td>
                        <td><span className="badge bg-success">{row.user_id==0?"Front":"Admin"}</span></td>
                        <td>{formatDateTime(row.last_reply_date)}</td>
                        <td>{row.priority}</td>
                        <td><span className="badge bg-info">{row.category_name}</span></td>
                        <td>
                          <div className="d-flex gap-2">
                            {(row.status==0 || row.status==1) &&
                            <>
                            <a href="#" className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                openStatusModal(row.id, 2); // Resolve
                              }}
                            >
                              Resolve
                            </a>
                            <a href="#" className="btn btn-danger btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                openStatusModal(row.id, 3); // Cancel
                              }}
                            >
                              Cancel
                            </a>
                            </>
                            }
                            <button className="btn btn-dark btn-sm" onClick={() => openDeleteModal(row.id)}><i className="bx bx-trash"></i></button>
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
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
        statusLoading={statusLoading}
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