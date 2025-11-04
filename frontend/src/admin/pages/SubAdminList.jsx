import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import SubAdminModals from "./modal/SubAdminModals";
import ExcelExport from "../common/ExcelExport";
const initialForm = { id: null, name: "", email: "", mobile: "", role: "", status: "1" };
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const SubAdminList = () => {
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
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subAdminToDelete, setSubAdminToDelete] = useState(null);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [subAdminData, setSubAdminData] = useState([]);
  const excelExportRef = useRef();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sub_admin/server-side`, {
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
      const roleId = editData.role ? String(editData.role) : "";
      setFormData({ ...editData, status: String(editData.status) });
      setSelectedRoles(roleId);
      setTimeout(() => {
        if ($("#role").data("select2")) {
          $("#role").val(roleId).trigger("change");
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
    setSelectedRoles('');
    setTimeout(() => {
    if ($("#role").data("select2")) {
      $("#role").val(null).trigger("change");
    }
  }, 100);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.toString() }));
  };

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email) errs.email = "Email is required";
    else if (!emailRegex.test(formData.email)) errs.email = "Email is invalid";
    if (!formData.mobile) errs.mobile = "Mobile Number is required";
    else if (!mobileRegex.test(formData.mobile)) errs.mobile = "Mobile Number is invalid";
    if (!selectedRoles) errs.role = "Role is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
    if (!isEditing) {
      if (!formData.password || formData.password.trim().length < 6) {
        errs.password = "Password is required and must be at least 6 characters";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const sRole = roles.find((c) => c.id.toString() === selectedRoles.toString());
    const payload = { ...formData, role: selectedRoles, role_name: sRole?.name || "" };
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/sub_admin/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/sub_admin`, payload);
        const payload1 = { ...res.data.subAdmin, role_name: sRole?.name || "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setData((d) => [payload1, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      showNotification(`Sub Admin ${isEditing ? "updated" : "added"} successfully!`, "success");
      resetForm();
    } catch (err) {
      console.error(err.response.data.error);
      showNotification("Failed to save Sub Admin.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/roles`);
        setRoles(res.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleRolesChange = (event) => {
    setSelectedRoles(event.target.value);
  };

  useEffect(() => {
        $('#role').select2({
          theme: "bootstrap",
          width: '100%',
          placeholder: "Select Role"
        }).on("change", function () {
          const roleId = $(this).val();
          handleRolesChange({ target: { value: roleId } });
        });
    
        return () => {
          if ($('#role').data('select2')) {$('#role').select2('destroy') };
        };
      }, [roles]);

  const openDeleteModal = (subAdminId) => { setSubAdminToDelete(subAdminId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setSubAdminToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setSubAdminToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/sub_admin/delete-selected`, {
          data: { ids: selectedSubAdmin }
        });
        setData((prevData) => prevData.filter((item) => !selectedSubAdmin.includes(item.id)));
        setTotalRecords((prev) => prev - selectedSubAdmin.length);
        setFilteredRecords((prev) => prev - selectedSubAdmin.length);
        setSelectedSubAdmin([]);
        showNotification(res.data?.message || "Selected Sub Admin deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected Sub Admin:", error);
        showNotification("Failed to delete selected Sub Admin.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        const res = await axios.delete(`${API_BASE_URL}/sub_admin/${subAdminToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== subAdminToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification(res.data?.message || "Sub Admin deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Sub Admin:", error);
        showNotification("Failed to delete Sub Admin.", "error");
      }
    }
  };

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/sub_admin/${id}/status`, { status: newStatus });
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
      setSelectedSubAdmin(data?.map((item) => item.id));
    } else {
      setSelectedSubAdmin([]);
    }
  };

  const handleSelectSubAdmin = (subAdminId) => {
    setSelectedSubAdmin((prevSelectedSubAdmin) =>
      prevSelectedSubAdmin.includes(subAdminId)
        ? prevSelectedSubAdmin.filter((id) => id !== subAdminId)
        : [...prevSelectedSubAdmin, subAdminId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/sub_admin`).then((res) => {
      setSubAdminData(res.data);
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
          <Breadcrumb page="Settings" title="Sub Admin" add_button={<><i className="bx bxs-plus-square"></i> Add Sub Admin</>} add_link="#" onClick={() => openForm()}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download" /> Excel</button>
            <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedSubAdmin.length === 0}>
              <i className="bx bx-trash"></i> Delete Selected
            </button>
            </>
          }
          />          
          <div className="row">
            <div className="col-md-5">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">{isEditing ? "Edit Sub Admin" : "Add Sub Admin"}</h5>
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
                      <label htmlFor="mobile" className="form-label required">Mobile</label>
                      <input
                        type="text"
                        className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                        id="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="Mobile"
                      />
                      {errors.mobile && (<div className="invalid-feedback">{errors.mobile}</div>)}
                    </div>
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="email" className="form-label required">Email</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                      />
                      {errors.email && (<div className="invalid-feedback">{errors.email}</div>)}
                    </div>
                    {!isEditing &&
                      <div className="form-group mb-3 col-md-12">
                        <label htmlFor="password" className="form-label required">Password</label>
                        <input
                          type="text"
                          className={`form-control ${errors.password ? "is-invalid" : ""}`}
                          id="password"
                          value={formData.password || ""}
                          onChange={handleChange}
                          placeholder="Password"
                        />
                        {errors.password && (<div className="invalid-feedback">{errors.password}</div>)}
                      </div>
                    }
                    <div className="form-group mb-3 col-md-12">
                      <label htmlFor="role" className="form-label required">Role</label>
                      <select
                        className={`form-control ${errors.role ? "is-invalid" : ""}`}
                        id="role"
                        value={selectedRoles}
                        onChange={handleRolesChange}
                      >
                        <option value="">Select Role</option>
                        {roles?.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors.role && <div className="text-danger small mt-1">{errors.role}</div>}
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
            <div className="col-md-7">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-3">Sub Admin List</h5>
                  <DataTable
                    columns={[
                      ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                      { key: "id", label: "S.No.", sortable: true },
                      { key: "name", label: "Name", sortable: true },
                      { key: "role_name", label: "Role", sortable: true },
                      { key: "created_at", label: "Created At", sortable: true },
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
                          <input type="checkbox" checked={selectedSubAdmin.includes(row.id)} onChange={() => handleSelectSubAdmin(row.id)} />
                        </td>
                        <td>{(page - 1) * limit + index + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.role_name}</td>
                        <td>{formatDateTime(row.created_at)}</td>
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
      <SubAdminModals
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
        fileName="User Export.xlsx"
        data={subAdminData}
        columns={[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "mobile" },
          { label: "Address", key: "address" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default SubAdminList;