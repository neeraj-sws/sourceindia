import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import SeoPagesModals from "./modal/SeoPagesModals";
const initialForm = { id: null, title: "", meta_title: "", meta_description: "", meta_image: null };

const SeoPages = () => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seoPagesToDelete, setSeoPagesToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/seo_pages/server-side`, {
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
      const res = await axios.get(`${API_BASE_URL}/seo_pages/${editData.id}`);
      setFormData({ ...editData, meta_image: res.data.meta_image });
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
    if (!formData.title?.trim()) errs.title = "Title is required";
    if (!formData.meta_title?.trim()) errs.meta_title = "Meta Title is required";
    if (!formData.meta_description?.trim()) errs.meta_description = "Meta description is required";
    if (!formData.file && !isEditing) {
      errs.file = "Image is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const form = new FormData();
    form.append("title", formData.title);
    form.append("meta_title", formData.meta_title);
    form.append("meta_description", formData.meta_description);
    if (formData.file) {
      form.append("meta_image", formData.file);
    }
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/seo_pages/${formData.id}`, form);
        fetchData();
      } else {
        const res = await axios.post(`${API_BASE_URL}/seo_pages`, form);
        fetchData();
      }
      setShowModal(false);
      showNotification(`Seo Pages ${isEditing ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Seo Pages.", "error");
    }
  };

  const openDeleteModal = (seoPagesId) => { setSeoPagesToDelete(seoPagesId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setSeoPagesToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/seo_pages/${seoPagesToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== seoPagesToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Seo Pages deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Seo Pages:", error);
      showNotification("Failed to delete Seo Pages.", "error");
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Seo Pages" add_button="Add Seo Pages" add_link="#" onClick={openAddModal} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "image", label: "Image", sortable: false },
                  { key: "title", label: "Title", sortable: true },
                  { key: "meta_title", label: "Meta Title", sortable: true },
                  { key: "meta_description", label: "Meta Description", sortable: true },
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
                      src={`${ROOT_URL}/${row.meta_image}`}
                      width={50}
                      height={50}
                      showFallback={true}
                    /></td>
                    <td>{row.title}</td>
                    <td>{row.meta_title}</td>
                    <td>{row.meta_description}</td>
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
      <SeoPagesModals
        showModal={showModal}
        closeModal={closeModal}
        isEditing={isEditing}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleSubmit}
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default SeoPages;