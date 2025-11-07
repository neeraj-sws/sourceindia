import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import RoleModals from "./modal/RoleModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", ticket_category: "", status: "1" };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const RolesList = () => {
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
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [roleData, setRoleData] = useState([]);
  const excelExportRef = useRef();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/roles/server-side`, {
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

  const openForm = (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const categoryId = editData.ticket_category ? String(editData.ticket_category) : "";
      setFormData({ ...editData, status: String(editData.status) });
      setSelectedCategory(categoryId);
      setTimeout(() => {
        if ($("#ticket_category").data("select2")) {
          $("#ticket_category").val(categoryId).trigger("change");
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
    setTimeout(() => {
    if ($("#ticket_category").data("select2")) {
      $("#ticket_category").val(null).trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sCategory = categories.find((c) => c.id.toString() === selectedCategory.toString());
    const payload = { ...formData, ticket_category: selectedCategory, category_name: sCategory?.name || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/roles/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/roles`, payload);
        const payload1 = { ...res.data.roles, category_name: sCategory?.name || "" };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Roles ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err);
      showNotification("Failed to save roles.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/ticket_categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching ticket categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  useEffect(() => {
        $('#ticket_category').select2({
          theme: "bootstrap",
          width: '100%',
          placeholder: "Select Category"
        }).on("change", function () {
          const categoryId = $(this).val();
          handleCategoryChange({ target: { value: categoryId } });
        });
    
        return () => {
          if ($('#ticket_category').data('select2')) {$('#ticket_category').select2('destroy') };
        };
      }, [categories]);

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/roles/${id}/status`, { status: newStatus });
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

  const openDeleteModal = (roleId) => { setRoleToDelete(roleId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setRoleToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setRoleToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/roles/delete-selected`, {
          data: { ids: selectedRoles }
        });
        setData((prevData) => prevData.filter((item) => !selectedRoles.includes(item.id)));
        setTotalRecords((prev) => prev - selectedRoles.length);
        setFilteredRecords((prev) => prev - selectedRoles.length);
        setSelectedRoles([]);
        showNotification(res.data?.message || "Selected roles deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected roles:", error);
        showNotification("Failed to delete selected roles.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        const res = await axios.delete(`${API_BASE_URL}/roles/${roleToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== roleToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification(res.data?.message || "Role deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Role:", error);
        showNotification("Failed to delete Role.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRoles(data?.map((item) => item.id));
    } else {
      setSelectedRoles([]);
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoles((prevSelectedRoles) =>
      prevSelectedRoles.includes(roleId)
        ? prevSelectedRoles.filter((id) => id !== roleId)
        : [...prevSelectedRoles, roleId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/roles`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === 0);
      setRoleData(filtered);
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
        <Breadcrumb mainhead="Roles" maincount={totalRecords} page="Settings" title="Roles" add_button={<><i className="bx bxs-plus-square me-1" /> Add Roles</>} add_link="#" onClick={() => openForm()}
        actions={
          <>
          <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
          <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedRoles.length === 0}>
            <i className="bx bx-trash me-1" /> Delete Selected
          </button>
          </>
        }
        />
        <div className="row">
          <div className="col-md-5">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">{isEditing ? "Edit Role" : "Add Role"}</h5>
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
                    <label htmlFor="ticket_category" className="form-label">Ticket Category</label>
                    <select
                        className={`form-control ${errors.category ? "is-invalid" : ""}`}
                        id="ticket_category"
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
                    {errors.status && (<div className="invalid-feedback">{errors.status}</div>)}
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
                {/* <h5 className="card-title mb-3">Roles List</h5> */}
                <DataTable
                  columns={[
                    ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                    { key: "id", label: "S.No.", sortable: true },
                    { key: "name", label: "Name", sortable: true },
                    { key: "category_name", label: "Ticket Category", sortable: true },
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
                      <td>                    
                        <input type="checkbox" checked={selectedRoles.includes(row.id)} onChange={() => handleSelectRole(row.id)} />
                      </td>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.category_name}</td>
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
                    </tr>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <RoleModals
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
      fileName="Roles Export.xlsx"
      data={roleData}
      columns={[
        { label: "Name", key: "name" },
        { label: "Status", key: "getStatus" },
        { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
      ]}
    />
    </>
  );
};

export default RolesList;