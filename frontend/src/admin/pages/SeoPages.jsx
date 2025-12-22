import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import MetaKeywordsInput from "../common/MetaKeywordsInput";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import SeoPagesModals from "./modal/SeoPagesModals";
const initialForm = { id: null, title: "", slug: "", meta_title: "", meta_keywords: "", meta_description: "", meta_image: null };

const SeoPages = () => {
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
  const [seoPagesToDelete, setSeoPagesToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const openForm = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/seo_pages/${editData.id}`);
      setFormData({ ...editData, meta_image: res.data.meta_image });
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
    if (!formData.slug?.trim()) {
      errs.slug = "Slug is required";
    } else {
      const slugRegex = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
      if (!slugRegex.test(formData.slug.trim())) {
        errs.slug = "Slug must be lowercase, contain only letters, numbers, and hyphens (no spaces or special characters)";
      }
    }
    // if (!formData.meta_title?.trim()) errs.meta_title = "Meta Title is required";
    // if (!formData.meta_keywords?.trim()) errs.meta_keywords = "Meta keywords is required";
    // if (!formData.meta_description?.trim()) errs.meta_description = "Meta description is required";
    // if (!formData.file && !isEditing) {
    //   errs.file = "Image is required";
    // }
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (formData.file) {
      if (!allowedImageTypes.includes(formData.file.type)) {
        errs.file = "Invalid image format (only JPG/PNG allowed)";
      } else if (formData.file.size > 2 * 1024 * 1024) {
        errs.file = "Image size must be under 2MB";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const form = new FormData();
    form.append("title", formData.title);
    form.append("slug", formData.slug);
    form.append("meta_title", formData.meta_title);
    form.append("meta_keywords", formData.meta_keywords);
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
      showNotification(`Seo Pages ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Seo Pages.", "error");
    } finally {
      setSubmitting(false);
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
          <Breadcrumb mainhead="Seo Pages" maincount={totalRecords}  page="" title="Seo Pages" add_button="Add Seo Pages" add_link="#" onClick={() => openForm()} />
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Seo Pages" : "Add Seo Pages"}</h5>
                  <form className="row" onSubmit={handleSubmit} noValidate>
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
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="slug" className="form-label required">Slug</label>
                      <input
                        type="text"
                        className={`form-control ${errors.slug ? "is-invalid" : ""}`}
                        id="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="Slug"
                      />
                      {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="meta_title" className="form-label">Meta Title</label>
                      <input
                        type="text"
                        className="form-control"
                        id="meta_title"
                        value={formData.meta_title}
                        onChange={handleChange}
                        placeholder="Meta Title"
                      />
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="meta_keywords" className="form-label">Meta Keywords</label>
                      <MetaKeywordsInput
                        value={formData.meta_keywords}
                        onChange={(val) =>
                          setFormData(prev => ({ ...prev, meta_keywords: val }))
                        }
                      />
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="meta_description" className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        id="meta_description"
                        onChange={handleChange}
                        placeholder="Description"
                        value={formData.meta_description}
                      />
                    </div>
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="file" className="form-label">Meta Image</label>
                      <input
                        type="file"
                        className={`form-control ${errors.file ? "is-invalid" : ""}`}
                        id="file"
                        onChange={handleFileChange}
                      />
                      {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                      {formData.file ? (
                        <img
                          src={URL.createObjectURL(formData.file)}
                          className="img-preview object-fit-cover mt-3"
                          width={150}
                          height={150}
                          alt="Preview"
                        />
                      ) : formData.meta_image ? (
                        <ImageWithFallback
                          src={`${ROOT_URL}/${formData.meta_image}`}
                          width={150}
                          height={150}
                          showFallback={false}
                        />
                      ) : null}
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
                      { key: "image", label: "Image", sortable: false },
                      { key: "title", label: "Title", sortable: true },
                      { key: "slug", label: "Slug", sortable: true },
                      { key: "meta_title", label: "Meta Title", sortable: true },
                      { key: "meta_keywords", label: "Meta Keywords", sortable: true },
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
                        <td>{row.slug}</td>
                        <td>{row.meta_title}</td>
                        <td>{row.meta_keywords}</td>
                        <td>{row.meta_description}</td>
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
      <SeoPagesModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default SeoPages;