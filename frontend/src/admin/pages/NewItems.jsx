import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import NewItemsModals from "./modal/NewItemsModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", category_id: "", subcategory_id: "", item_category_id: "", item_sub_category_id: "", status: "1", file: null };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";
import { formatDateTime } from '../../utils/formatDate';

const NewItems = ({ excludeItem }) => {
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
  const [itemsToDelete, setItemsToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [itemsData, setItemsData] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [itemSubCategories, setItemSubCategories] = useState([]);
  const [selectedItemCategory, setSelectedItemCategory] = useState('');
  const [selectedItemSubCategory, setSelectedItemSubCategory] = useState('');
  const excelExportRef = useRef();

  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${selectedCategory}/${selectedSubCategory}`)
        .then(res => setItemCategories(res.data))
        .catch(err => {
          console.error("Error fetching item categories:", err);
          setItemCategories([]);
        });
    } else {
      setItemCategories([]);
    }
  }, [selectedCategory, selectedSubCategory]);

  useEffect(() => {
    if (selectedCategory && selectedSubCategory && selectedItemCategory) {
      axios.get(
        `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}`
      )
        .then(res => setItemSubCategories(res.data))
        .catch(err => {
          console.error("Error fetching item sub categories:", err);
          setItemSubCategories([]);
        });
    } else {
      setItemSubCategories([]);
    }
  }, [selectedCategory, selectedSubCategory, selectedItemCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/items/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, excludeItem: excludeItem ? 'true' : 'false' },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, excludeItem]);

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
      try {
        // Fetch complete item details from backend
        const res = await axios.get(`${API_BASE_URL}/items/${editData.id}`);

        const item = res.data;
        setFormData({
          id: item.id,
          name: item.name,
          status: String(item.status),
          file_name: item.file_name,
          file: null,
          item_category_id: item.item_category_id || "",
          item_sub_category_id: item.item_sub_category_id || "",
        });

        // STEP 1️⃣ — Set Category + fetch its subcategories
        setSelectedCategory(item.category_id);
        const subRes = await axios.get(`${API_BASE_URL}/sub_categories/category/${item.category_id}`);
        setSubCategories(subRes.data);
        setSelectedSubCategory(item.subcategory_id);

        // STEP 2️⃣ — Fetch item categories
        const itemCatRes = await axios.get(
          `${API_BASE_URL}/item_category/by-category-subcategory/${item.category_id}/${item.subcategory_id}`
        );
        setItemCategories(itemCatRes.data);
        setSelectedItemCategory(item.item_category_id);

        // STEP 3️⃣ — Fetch item subcategories
        if (item.item_category_id) {
          const itemSubCatRes = await axios.get(
            `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${item.category_id}/${item.subcategory_id}/${item.item_category_id}`
          );
          setItemSubCategories(itemSubCatRes.data);
          setSelectedItemSubCategory(item.item_sub_category_id);
        }

        // ✅ If using select2, update dropdowns manually
        setTimeout(() => {
          if ($("#category_id").data("select2")) $("#category_id").val(item.category_id).trigger("change.select2");
          if ($("#subcategory_id").data("select2")) $("#subcategory_id").val(item.subcategory_id).trigger("change.select2");
          if ($("#item_category_id").data("select2")) $("#item_category_id").val(item.item_category_id).trigger("change.select2");
          if ($("#item_sub_category_id").data("select2")) $("#item_sub_category_id").val(item.item_sub_category_id).trigger("change.select2");
        }, 400);

      } catch (error) {
        console.error("Error loading item edit data:", error);
        showNotification("Failed to load item for editing", "error");
      }
    } else {
      // Reset for Add New
      setFormData(initialForm);
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedItemCategory("");
      setSelectedItemSubCategory("");
      setSubCategories([]);
      setItemCategories([]);
      setItemSubCategories([]);

      // Clear select2 fields
      setTimeout(() => {
        if ($("#category_id").data("select2")) $("#category_id").val(null).trigger("change.select2");
        if ($("#subcategory_id").data("select2")) $("#subcategory_id").val(null).trigger("change.select2");
        if ($("#item_category_id").data("select2")) $("#item_category_id").val(null).trigger("change.select2");
        if ($("#item_sub_category_id").data("select2")) $("#item_sub_category_id").val(null).trigger("change.select2");
      }, 300);
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

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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
    if (!selectedCategory) errs.category_id = "Category is required";
    if (!selectedItemCategory) errs.item_category_id = "Item Category is required";
    if (!selectedItemSubCategory) errs.item_sub_category_id = "Item Sub Category is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
    const ssCategory = subcategories.find((c) => c.id.toString() === selectedSubCategory.toString());
    const payload = {
      ...formData, category_id: selectedCategory, category_name: sCategory?.name || "", subcategory_id: selectedSubCategory, subcategory_name: ssCategory?.name || "", item_category_id: selectedItemCategory,
      item_sub_category_id: selectedItemSubCategory,
      status: formData.status,
    };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/items/${formData.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // const img = await axios.get(`${API_BASE_URL}/files/${formData.file_id}`);
        // const updatedFileName = img.data.file;
        let updatedFileName = formData.file_name || null;
        const updatedItem = await axios.get(`${API_BASE_URL}/items/${formData.id}`);
        const newFileId = updatedItem.data.file_id;
        if (newFileId && newFileId !== 0) {
          const img = await axios.get(`${API_BASE_URL}/files/${newFileId}`);
          updatedFileName = img.data.file;
        }
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, file_id: newFileId, file_name: updatedFileName, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/items`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const img = await axios.get(`${API_BASE_URL}/files/${res.data.items.file_id}`);
        const updatedFileName = img.data.file;
        const payload1 = { ...res.data.items, file_name: updatedFileName, category_name: sCategory?.name || "", subcategory_name: ssCategory?.name || "" };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Category ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save item sub category.", "error");
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
    $('#item_category_id')
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Category" })
      .on("change", function () {
        const val = $(this).val();
        setSelectedItemCategory(val);
        setSelectedItemSubCategory('');
      });

    $('#item_sub_category_id')
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Sub Category" })
      .on("change", function () {
        const val = $(this).val();
        setSelectedItemSubCategory(val);
      });
    return () => {
      if ($('#category_id').data('select2')) { $('#category_id').select2('destroy') };
      if ($('#subcategory_id').data('select2')) { $('#subcategory_id').select2('destroy') };
      if ($('#item_category_id').data('select2')) $('#item_category_id').select2('destroy');
      if ($('#item_sub_category_id').data('select2')) $('#item_sub_category_id').select2('destroy');
    };
  }, [categories, subcategories]);

  const openDeleteModal = (itemsId) => { setItemsToDelete(itemsId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setItemsToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setItemsToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/items/delete-selected`, {
          data: { ids: selectedItems }
        });
        setData((prevData) => prevData.filter((item) => !selectedItems.includes(item.id)));
        setTotalRecords((prev) => prev - selectedItems.length);
        setFilteredRecords((prev) => prev - selectedItems.length);
        setSelectedItems([]);
        showNotification(res.data?.message || "Selected category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected category:", error);
        showNotification("Failed to delete selected category.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/items/${itemsToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== itemsToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Category deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting item sub category:", error);
        showNotification("Failed to delete item sub category.", "error");
      }
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/items/${id}/status`, { status: newStatus });
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
      setSelectedItems(data?.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItems = (itemsId) => {
    setSelectedItems((prevSelectedItems) =>
      prevSelectedItems.includes(itemsId)
        ? prevSelectedItems.filter((id) => id !== itemsId)
        : [...prevSelectedItems, itemsId]
    );
  };

  useEffect(() => {
    // axios.get(`${API_BASE_URL}/items`).then((res) => {
    //   setItemsData(res.data);
    // });
    axios.get(`${API_BASE_URL}/items`, {
      params: { excludeItem: excludeItem ? 'true' : 'false' }
    }).then((res) => {
      setItemsData(res.data);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  return (
    <>
      <div className={excludeItem ? "page-wrapper h-auto my-3" : "page-wrapper"}>
        <div className="page-content">
          {!excludeItem &&
            <Breadcrumb mainhead="Items" maincount={totalRecords} page="Category Master" title="Items" add_button={<><i className="bx bxs-plus-square me-1" /> Add Items</>} add_link="#" onClick={() => openForm()}
              actions={
                <>
                  <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                  <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedItems.length === 0}>
                    <i className="bx bx-trash me-1" /> Delete Selected
                  </button>
                </>
              }
            />
          }
          <div className="row">
            {!excludeItem && (
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title mb-3">{isEditing ? "Edit Items" : "Add Items"}</h5>
                    <form className="row" onSubmit={handleSubmit} noValidate>
                      <div className="form-group mb-3 col-md-12">
                        <label htmlFor="name" className="form-label required">Name</label>
                        <input
                          type="text"
                          className="form-control"
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
                          className="form-control"
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
                        {errors.category_id && (<div className="text-danger small">{errors.category_id} </div>
                        )}
                      </div>
                      <div className="form-group mb-3 col-md-12">
                        <label htmlFor="subcategory_id" className="form-label required">Sub Category</label>
                        <select
                          className="form-control"
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
                        {errors.subcategory_id && (<div className="text-danger small">{errors.subcategory_id} </div>
                        )}
                      </div>
                      <div className="form-group mb-3 col-md-12">
                        <label htmlFor="item_category_id" className="form-label required">Item Category</label>
                        <select
                          className="form-control"
                          id="item_category_id"
                          value={selectedItemCategory}
                          onChange={(e) => {
                            setSelectedItemCategory(e.target.value);
                            setSelectedItemSubCategory(''); // reset subcategory when category changes
                          }}
                          disabled={!selectedCategory || !selectedSubCategory}
                        >
                          <option value="">Select Item Category</option>
                          {itemCategories.map(ic => (
                            <option key={ic.id} value={ic.id}>
                              {ic.name}
                            </option>
                          ))}
                        </select>
                        {errors.item_category_id && (
                          <div className="text-danger small">{errors.item_category_id}</div>
                        )}
                      </div>
                      <div className="form-group mb-3 col-md-12">
                        <label htmlFor="item_sub_category_id" className="form-label required">Item Sub Category</label>
                        <select
                          className="form-control"
                          id="item_sub_category_id"
                          value={selectedItemSubCategory}
                          onChange={(e) => setSelectedItemSubCategory(e.target.value)}
                          disabled={!selectedCategory || !selectedSubCategory || !selectedItemCategory}
                        >
                          <option value="">Select Item Sub Category</option>
                          {itemSubCategories.map(isc => (
                            <option key={isc.id} value={isc.id}>
                              {isc.name}
                            </option>
                          ))}
                        </select>
                        {errors.item_sub_category_id && (
                          <div className="text-danger small">{errors.item_sub_category_id}</div>
                        )}
                      </div>
                      <div className="form-group col-md-12 mb-3">
                        <label htmlFor="file" className="form-label required">Item Sub Category Image</label>
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
                            loading="lazy"
                            decoding="async"
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
            <div className={!excludeItem ? "col-md-8" : "col-md-12"}>
              {excludeItem && (
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="card-title mb-3">Unused Item List of Product</h5>
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
                      { key: "itemcategory_name", label: "Item Category", sortable: true },
                      { key: "item_subcategory_name", label: "Item Sub Category", sortable: true },
                      ...(!excludeItem ? [{ key: "status", label: "Status", sortable: false }] : []),
                      ...(!excludeItem ? [{ key: "action", label: "Action", sortable: false }] : []),
                      ...(excludeItem ? [{ key: "created_at", label: "Created", sortable: true }] : []),
                      ...(excludeItem ? [{ key: "updated_at", label: "Last Update", sortable: true }] : []),
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
                          <input type="checkbox" checked={selectedItems.includes(row.id)} onChange={() => handleSelectItems(row.id)} />
                        </td>
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td><ImageWithFallback
                          src={`${ROOT_URL}/${row.file_name}`}
                          width={50}
                          height={50}
                          showFallback={true}
                        /></td>
                        <td>{row.name}</td>
                        <td>{row.itemcategory_name}</td>
                        <td>{row.item_subcategory_name}</td>
                        {!excludeItem && (
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
                          </>
                        )}
                        {excludeItem && (
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
      <NewItemsModals
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
        fileName={excludeItem ? "Unused Item.xlsx" : "Item Export.xlsx"}
        data={itemsData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Category", key: "category_name" },
          { label: "SubCategory", key: "subcategory_name" },
          { label: "ItemCategory", key: "itemcategory_name" },
          { label: "ItemSubCategory", key: "item_subcategory_name" },
          { label: "Status", key: "getStatus" },
          { label: "Created At", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Updated At", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default NewItems;