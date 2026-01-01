import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import ItemCategoryModals from "./modal/ItemCategoryModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", category_id: "", subcategory_id: "", status: "1", file: null };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";
import { formatDateTime } from '../../utils/formatDate';

const ItemCategory = ({excludeItemCategories}) => {
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
  const [subcategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemCategoryToDelete, setItemCategoryToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItemCategory, setSelectedItemCategory] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [itemCategoryData, setItemCategoryData] = useState([]);
  const excelExportRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/item_category/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, excludeItemCategories: excludeItemCategories ? 'true' : 'false' },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, excludeItemCategories]);

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
      const res = await axios.get(`${API_BASE_URL}/item_category/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), file_name: res.data.file_name, file: null });
      setSelectedCategory(editData.category_id);
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${editData.category_id}`);
        setSubCategories(res.data);
      } catch (error) {
        console.error("Error fetching sub categories:", error);
        setSubCategories([]);
      }
      setSelectedSubCategory(editData.subcategory_id);
    } else {
      setFormData(initialForm);
      setSelectedCategory('');
      setSelectedSubCategory('');
      setSubCategories([]);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setErrors({});
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSubCategories([]);
    setTimeout(() => {
  if ($("#category_id").data("select2")) $("#category_id").val(null);
  if ($("#subcategory_id").data("select2")) $("#subcategory_id").val(null);
}, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, file: "Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)", }));
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
    if (!selectedCategory) errs.category_id = "Category is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      // Prepare FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category_id', selectedCategory);
      formDataToSend.append('subcategory_id', selectedSubCategory);
      formDataToSend.append('status', formData.status);

      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      if (isEditing) {
        // await axios.put(`${API_BASE_URL}/item_category/${formData.id}`, formDataToSend, {
        //   headers: { "Content-Type": "multipart/form-data" },
        // });

        // showNotification("Item category updated successfully!", "success");
        await axios.put(`${API_BASE_URL}/item_category/${formData.id}`, formDataToSend, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // --- 2. Get updated item (to get new file_id) ---
  const updatedItem = await axios.get(`${API_BASE_URL}/item_category/${formData.id}`);
  const newFileId = updatedItem.data.file_id;

  let updatedFileName = formData.file_name || null;

  // --- 3. If backend assigned new file id, fetch image file record ---
  if (newFileId && newFileId !== 0) {
    try {
      const img = await axios.get(`${API_BASE_URL}/files/${newFileId}`);
      updatedFileName = img.data.file;
    } catch (error) {
      console.warn("File record not found:", error);
    }
  }

  // --- 4. Update DataTable without refresh ---
  setData((prev) =>
    prev.map((item) =>
      item.id === formData.id
        ? {
            ...item,
            name: formData.name,
            category_id: selectedCategory,
            subcategory_id: selectedSubCategory,
            status: Number(formData.status),
            file_id: newFileId,
            file_name: updatedFileName,
            updated_at: new Date().toISOString(),
          }
        : item
    )
  );

  showNotification("Item category updated successfully!", "success");
  resetForm();
      } else {
        await axios.post(`${API_BASE_URL}/item_category`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        showNotification("Item category added successfully!", "success");
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error submitting form:", err);
      showNotification("Failed to save item category.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching interest categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (event) => {
      const categoryId = event.target.value;
      setSelectedCategory(categoryId);
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${categoryId}`);
        setSubCategories(res.data);
        setSelectedSubCategory('');
      } catch (error) {
        console.error("Error fetching sub categories:", error);
      }
    };
  
    const handleSubCategoryChange = (event) => {
      setSelectedSubCategory(event.target.value);
    };

  useEffect(() => {
          $('#category_id').select2({
            theme: "bootstrap",
            width: '100%',
            placeholder: "Select category"
          }).on("change", function () {
            const icId = $(this).val();
            handleCategoryChange({ target: { value: icId } });
          });
      $('#subcategory_id').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Sub Category"
    }).on("change", function () {
      const subCategoryId = $(this).val();
      handleSubCategoryChange({ target: { value: subCategoryId } });
    });
          return () => {
            if ($('#category_id').data('select2')) {$('#category_id').select2('destroy') };
            if ($('#subcategory_id').data('select2')) {$('#subcategory_id').select2('destroy')};
          };
        }, [categories, subcategories]);

  const openDeleteModal = (itemCategoryId) => { setItemCategoryToDelete(itemCategoryId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setItemCategoryToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setItemCategoryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/item_category/delete-selected`, {
          data: { ids: selectedItemCategory }
        });
        setData((prevData) => prevData.filter((item) => !selectedItemCategory.includes(item.id)));
        setTotalRecords((prev) => prev - selectedItemCategory.length);
        setFilteredRecords((prev) => prev - selectedItemCategory.length);
        setSelectedItemCategory([]);
        showNotification(res.data?.message || "Selected category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected category:", error);
        showNotification("Failed to delete selected category.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/item_category/${itemCategoryToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== itemCategoryToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting item category:", error);
        showNotification("Failed to delete item category.", "error");
      }
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/item_category/${id}/status`, { status: newStatus });
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
      setSelectedItemCategory(data?.map((item) => item.id));
    } else {
      setSelectedItemCategory([]);
    }
  };

  const handleSelectItemCategory = (itemCategoryId) => {
    setSelectedItemCategory((prevSelectedItemCategory) =>
      prevSelectedItemCategory.includes(itemCategoryId)
        ? prevSelectedItemCategory.filter((id) => id !== itemCategoryId)
        : [...prevSelectedItemCategory, itemCategoryId]
    );
  };

  useEffect(() => {
    // axios.get(`${API_BASE_URL}/item_category`).then((res) => {
    //   setItemCategoryData(res.data);
    // });
    axios.get(`${API_BASE_URL}/item_category`, {
  params: { excludeItemCategories: excludeItemCategories ? 'true' : 'false' }
}).then((res) => {
  setItemCategoryData(res.data);
});
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  return (
    <>
      <div className={excludeItemCategories ? "page-wrapper h-auto my-3" : "page-wrapper"}>
        <div className="page-content">
          {!excludeItemCategories &&
          <Breadcrumb mainhead="Item Category" maincount={totalRecords} page="Category Master" title="Item Category" add_button={<><i className="bx bxs-plus-square me-1" /> Add Item Category</>} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedItemCategory.length === 0}>
              <i className="bx bx-trash me-1" /> Delete Selected
            </button>
            </>
          }
          />
        }
          <div className="row">
            {!excludeItemCategories && (
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Item Category" : "Add Item Category"}</h5>
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
                      <label htmlFor="category_id" className="form-label required">Category</label>
                      <select
                        className="form-control select2"
                        id="category_id"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                      >
                        <option value="">Select Category</option>
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.category_id && (<div className="text-danger small mt-1">{errors.category_id} </div>
                      )}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="subcategory_id" className="form-label required">Sub Category</label>
                      <select
                        className="form-control select2"
                        id="subcategory_id"
                        value={selectedSubCategory}
                        onChange={handleSubCategoryChange}
                        disabled={!selectedCategory}
                      >
                        <option value="">Select Sub Category</option>
                        {subcategories?.map((subcategory_id) => (
                          <option key={subcategory_id.id} value={subcategory_id.id}>
                            {subcategory_id.name}
                          </option>
                        ))}
                      </select>
                      {errors.subcategory_id && (<div className="text-danger small mt-1">{errors.subcategory_id} </div>
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
                    <div className="form-group col-md-12 mb-3">
                      <label htmlFor="file" className="form-label required">Item Category Image</label>
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
                      ) : formData.file_name ? (
                        <ImageWithFallback
                          src={`${ROOT_URL}/${formData.file_name}`}
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
            )}
            <div className={!excludeItemCategories ? "col-md-8" : "col-md-12"}>
              {excludeItemCategories && (
                  <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <h5 className="card-title mb-3">Unused Item Category List of Product</h5>
                    <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                    </div>
                    </div>
                    </div>
                  )}
              <div className="card">
                <div className="card-body">
                  <DataTable
                    columns={[
                      ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "image", label: "Image", sortable: false },
                      { key: "name", label: "Name", sortable: true },
                      { key: "category_name", label: "Category", sortable: true },
                      { key: "subcategory_name", label: "Sub Category", sortable: true },
                      ...(!excludeItemCategories ? [{ key: "status", label: "Status", sortable: false }]:[]),
                      ...(!excludeItemCategories ? [{ key: "action", label: "Action", sortable: false }]:[]),
                      ...(excludeItemCategories ? [{ key: "created_at", label: "Created", sortable: true }]:[]),
                      ...(excludeItemCategories ? [{ key: "updated_at", label: "Last Update", sortable: true }]:[]),
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
                          <input type="checkbox" checked={selectedItemCategory.includes(row.id)} onChange={() => handleSelectItemCategory(row.id)} />
                        </td>
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td><ImageWithFallback
                          src={`${ROOT_URL}/${row.file_name}`}
                          width={50}
                          height={50}
                          showFallback={true}
                        /></td>
                        <td>{row.name}</td>
                        <td>{row.category_name}</td>
                        <td>{row.subcategory_name}</td>
                        {!excludeItemCategories && (
                          <>
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
                        </>
                        )}
                        {excludeItemCategories && (
                                                                        <>
                                                                      <td>{formatDateTime(row.created_at)}</td>
                                                                                          <td>{formatDateTime(row.updated_at)}</td>
                                                                                          </>
                                                                      )}
                      </tr>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ItemCategoryModals
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
        fileName={excludeItemCategories ? "Unused Item Category.xlsx" : "Item Category Export.xlsx"}
        data={itemCategoryData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Category", key: "category_name" },
          { label: "SubCategory", key: "subcategory_name" },
          { label: "Status", key: "getStatus" },
          { label: "Created At", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Updated At", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default ItemCategory;