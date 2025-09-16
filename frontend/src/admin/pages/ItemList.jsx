import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import ItemModals from "./modal/ItemModals";
const initialForm = { id: null, name: "", category: "", sub_category: "", status: "1" };

const ItemList = () => {
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
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sub_sub_categories/server-side`, {
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
      setFormData({ ...editData, status: String(editData.status) });
      setSelectedCategory(editData.category);
      try {
        const res = await axios.get(`${API_BASE_URL}/interest_sub_categories/category/${editData.category}`);
        setSubCategories(res.data);
      } catch (error) {
        console.error("Error fetching sub categories:", error);
        setSubCategories([]);
      }
      setSelectedSubCategory(editData.sub_category);
    } else {
      setFormData(initialForm);
      setSelectedCategory('');
      setSelectedSubCategory('');
      setSubCategories([]);
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setErrors({}); };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!selectedCategory) errs.category = "Category is required";
    if (!selectedSubCategory) errs.sub_category = "Sub category is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const sCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
    const ssCategory = subcategories.find((c) => c.id.toString() === selectedSubCategory.toString());
    const payload = { ...formData, category: selectedCategory, category_name: sCategory?.name || "", sub_category: selectedSubCategory, sub_category_name: ssCategory?.name || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/sub_sub_categories/${formData.id}`, payload);
        setData((d) => d.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/sub_sub_categories`, payload);
        const payload1 = { ...res.data.subSubCategories, category_name: sCategory?.name || "", sub_category_name: ssCategory?.name || "" };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      setShowModal(false);
      showNotification(`Item ${isEditing ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Item.", "error");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/interest_categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    try {
      const res = await axios.get(`${API_BASE_URL}/interest_sub_categories/category/${categoryId}`);
      setSubCategories(res.data);
      setSelectedSubCategory('');
    } catch (error) {
      console.error("Error fetching sub categories:", error);
    }
  };

  const handleSubCategoryChange = (event) => {
    setSelectedSubCategory(event.target.value);
  };

  const openDeleteModal = (subSubCategoriesId) => { setItemToDelete(subSubCategoriesId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setItemToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/sub_sub_categories/${itemToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== itemToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Item deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Item:", error);
      showNotification("Failed to delete Item.", "error");
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/sub_sub_categories/${id}/status`, { status: newStatus });
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
          <Breadcrumb page="Settings" title="Item" add_button="Add Item" add_link="#" onClick={openAddModal} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "name", label: "Name", sortable: true },
                  { key: "category_name", label: "Category", sortable: true },
                  { key: "sub_category_name", label: "Sub Category", sortable: true },
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
                    <td>{row.category_name}</td>
                    <td>{row.sub_category_name}</td>
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
      <ItemModals
        showModal={showModal}
        closeModal={closeModal}
        isEditing={isEditing}
        formData={formData}
        errors={errors}
        categories={categories}
        subcategories={subcategories}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        handleCategoryChange={handleCategoryChange}
        handleSubCategoryChange={handleSubCategoryChange}
        handleChange={handleChange}
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

export default ItemList;