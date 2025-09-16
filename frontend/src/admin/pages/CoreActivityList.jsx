import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import CoreActivityModals from "./modal/CoreActivityModals";
const initialForm = { id: null, name: "", color: "", status: "1", file: null };

const CoreActivityList = () => {
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
  const [colors, setColors] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [coreActivityToDelete, setCoreActivityToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/core_activities/server-side`, {
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
      const res = await axios.get(`${API_BASE_URL}/core_activities/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), file_name: res.data.file_name, file: null });
    } else {
      setFormData(initialForm);
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setErrors({}); };

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
    if (!formData.color) errs.color = "Color is required";
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
    const selectedColor = colors.find((c) => c.id.toString() === formData.color.toString());
    const payload = { ...formData, color_name: selectedColor?.title || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/core_activities/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setData((d) => d.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/core_activities`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const payload1 = { ...res.data.coreActivity, color_name: selectedColor?.title || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      setShowModal(false);
      showNotification(`Core Activity ${isEditing ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save core activity.", "error");
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

  const openDeleteModal = (coreActivityId) => { setCoreActivityToDelete(coreActivityId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setCoreActivityToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
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
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/core_activities/${id}/status`, { status: newStatus });
      setData(data.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
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
          <Breadcrumb page="Settings" title="Core Activity" add_button="Add Core Activity" add_link="#" onClick={openAddModal} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "name", label: "Name", sortable: true },
                  { key: "color_name", label: "Color", sortable: true },
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
                        <td>{row.name}</td>
                        <td>{row.color_name}</td>
                        <td>{formatDateTime(row.created_at)}</td>
                        <td>{formatDateTime(row.updated_at)}</td>
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
                          <button className="btn btn-sm btn-primary me-2 mb-2 edit-btn" onClick={() => openModal(row)}>
                            <i className="bx bx-edit me-0" />
                          </button>
                          <button className="btn btn-sm btn-danger mb-2" onClick={() => openDeleteModal(row.id)}>
                            <i className="bx bx-trash me-0" />
                          </button>
                        </td>
                      </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <CoreActivityModals
        showModal={showModal}
        closeModal={closeModal}
        isEditing={isEditing}
        formData={formData}
        errors={errors}
        colors={colors}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
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

export default CoreActivityList;