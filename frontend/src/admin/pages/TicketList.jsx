import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import TicketModals from "./modal/TicketModals";
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
  const openAddModal = () => openModal();
  const { showNotification } = useAlert();
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const listStatus = ["Pending", "In Progress", "Resolved", "Cancel"];

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

  const openModal = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/tickets/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), attachment: res.data.attachment });
    } else {
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setErrors({}); };

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
    const selectedCategory = categories.find((c) => c.id.toString() === formData.category.toString());
    const selectedUser = users.find((u) => u.id.toString() === formData.user_id.toString());
    const payload = { ...formData, category_name: selectedCategory?.name || "", user_name: selectedUser?.fname+" "+selectedUser?.lname };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/tickets/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setData((d) => d.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/tickets`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const payload1 = { ...res.data.ticket, category_name: selectedCategory?.name || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      setShowModal(false);
      showNotification(`Ticket ${isEditing ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Ticket.", "error");
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

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Ticket" add_button="Add Ticket" add_link="#" onClick={openAddModal} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "title", label: "Title", sortable: true },
                  { key: "priority", label: "Priority", sortable: true },
                  { key: "category_name", label: "Ticket Category", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
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
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>{listStatus.map((s,i) => (row.status == i ? s : ""))}</td>
                    <td>
                      <div className="dropdown">
                        <button  className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={() => openModal(row)}>
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
      <TicketModals
        showModal={showModal}
        closeModal={closeModal}
        isEditing={isEditing}
        formData={formData}
        errors={errors}
        users={users}
        categories={categories}
        listStatus={listStatus}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default TicketList;