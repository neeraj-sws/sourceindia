import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import HomeBannerModals from "./modal/HomeBannerModals";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
const initialForm = { id: null, title: "", sub_title: "", description: "", button_text: "", button_url: "", status: "1", file: null };

const HomeBanners = () => {
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
  const [homeBannerToDelete, setHomeBannerToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/home_banners/server-side`, {
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
      const res = await axios.get(`${API_BASE_URL}/home_banners/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), file_name: res.data.file_name, file: null });
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
    if (!formData.title?.trim()) errs.title = "Title is required";
    if (!formData.sub_title?.trim()) errs.sub_title = "Sub Title is required";
    if (!formData.description?.trim()) errs.description = "Description is required";
    if (!formData.button_text?.trim()) errs.button_text = "Button Text is required";
    if (!formData.button_url?.trim()) {
      errs.button_url = "Button URL is required";
    } else {
      try {
        new URL(formData.button_url);
      } catch (_) {
        errs.button_url = "Please enter a valid URL (e.g. https://example.com)";
      }
    }
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
    const payload = { ...formData };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/home_banners/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const img = await axios.get(`${API_BASE_URL}/files/${formData.file_id}`);
        const updatedFileName = img.data.file;
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, file_name: updatedFileName, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/home_banners`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const img = await axios.get(`${API_BASE_URL}/files/${res.data.homeBanners.file_id}`);
        const updatedFileName = img.data.file;
        const payload1 = { ...res.data.homeBanners, file_name: updatedFileName };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Home Banner ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Home Banner.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (homeBannerId) => { setHomeBannerToDelete(homeBannerId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setHomeBannerToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/home_banners/${homeBannerToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== homeBannerToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Home Banner deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Home Banner:", error);
      showNotification("Failed to delete Home Banner.", "error");
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/home_banners/${id}/status`, { status: newStatus });
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
          <Breadcrumb mainhead="Home Banners" maincount={totalRecords} page="" title="Home Banner" add_button="Add Home Banner" add_link="#" onClick={openAddModal} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "image", label: "Image", sortable: false },
                  { key: "title", label: "Title", sortable: true },
                  { key: "button_text", label: "Button Text", sortable: true },
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
                    <td><ImageWithFallback
                      src={`${ROOT_URL}/${row.file_name}`}
                      width={50}
                      height={50}
                      showFallback={true}
                    /></td>
                    <td>{row.title}</td>
                    <td>{row.button_text}</td>
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
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={() => openModal(row)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => openDeleteModal(row.id)}>
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
      <HomeBannerModals
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

export default HomeBanners;