import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import MembershipPlanModals from "./modal/MembershipPlanModals";
const initialForm = { id: null, name: "", sub_title: "", price: "", user: "", category: "", product: "", 
  expire_days: "", is_default: "", free: "", elcina_plan: "", status: "1" };
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';  

const MembershipPlan = ({ getDeleted }) => {
  const navigate = useNavigate();
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
  const [membershipPlanToDelete, setMembershipPlanToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedMembershipPlan, setSelectedMembershipPlan] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [membershipPlanData, setMembershipPlanData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {startDate: new Date(), endDate: new Date(), key: 'selection'}
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/membership_plan/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false', dateRange, startDate, endDate },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted, dateRange, startDate, endDate]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection == "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    const isFiltered = search.trim() || dateRange || (startDate && endDate);
    if (filteredRecords === 0) {
      return isFiltered
        ? `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`
        : "Showing 0 to 0 of 0 entries";
    }
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return isFiltered
      ? `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`
      : `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const openModal = async (editData = null) => {
    setIsEditing(!!editData);
    setErrors({});
    if (editData) {
      const res = await axios.get(`${API_BASE_URL}/membership_plan/${editData.id}`);
      setFormData({ ...editData, status: String(editData.status), expire_days: String(res.data.expire_days), 
        is_default: String(res.data.is_default), free: String(res.data.free), elcina_plan: String(res.data.elcina_plan) });
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

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.sub_title) errs.sub_title = "Sub title is required";
    if (!formData.price) errs.price = "Price is required";
    if (!formData.user) errs.user = "No. of user is required";
    if (!formData.category) errs.category = "No. of category is required";
    if (!formData.product) errs.product = "No. of product is required";
    if (!formData.expire_days) errs.expire_days = "Validity is required";
    if (!["0", "1"].includes(formData.is_default)) errs.is_default = "Is default is required";
    if (!["0", "1"].includes(formData.free)) errs.free = "Plan type is required";
    if (!["0", "1"].includes(formData.elcina_plan)) errs.elcina_plan = "Elcina plan is required";
    if (!["0", "1"].includes(formData.status)) errs.status = "Invalid status";
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
        await axios.put(`${API_BASE_URL}/membership_plan/${formData.id}`, payload);
        setData((d) => d?.map((item) => (item.id === formData.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item)));
      } else {
        const res = await axios.post(`${API_BASE_URL}/membership_plan`, payload);
        setData((d) => [res.data.membershipPlan, ...d]);
        setTotalRecords((c) => c + 1);
        setFilteredRecords((c) => c + 1);
      }
      setShowModal(false);
      showNotification(`Membership Plan ${isEditing ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save Membership Plan.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (membershipPlanId) => { setMembershipPlanToDelete(membershipPlanId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setMembershipPlanToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setMembershipPlanToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/membership_plan/delete-selected`, {
          data: { ids: selectedMembershipPlan }
        });
        setData((prevData) => prevData.filter((item) => !selectedMembershipPlan.includes(item.id)));
        setTotalRecords((prev) => prev - selectedMembershipPlan.length);
        setFilteredRecords((prev) => prev - selectedMembershipPlan.length);
        setSelectedMembershipPlan([]);
        showNotification(res.data?.message || "Selected membership plan deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected membership plan:", error);
        showNotification("Failed to delete selected membership plan.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/membership_plan/${membershipPlanToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== membershipPlanToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Membership Plan deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Membership Plan:", error);
        showNotification("Failed to delete Membership Plan.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedMembershipPlan(data?.map((item) => item.id));
    } else {
      setSelectedMembershipPlan([]);
    }
  };

  const handleSelectMembershipPlan = (membershipPlanId) => {
    setSelectedMembershipPlan((prevSelectedMembershipPlan) =>
      prevSelectedMembershipPlan.includes(membershipPlanId)
        ? prevSelectedMembershipPlan.filter((id) => id !== membershipPlanId)
        : [...prevSelectedMembershipPlan, membershipPlanId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/membership_plan`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete=== (getDeleted ? 1 : 0));
      setMembershipPlanData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => { setStatusToggleInfo({ id, currentStatus, field, valueKey }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/membership_plan/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if(field=="delete_status"){
        setData((prevData) => prevData.filter((item) => item.id !== id));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
      }
      if (field == "delete_status") {
        showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
      } else {
        showNotification("Status updated!", "success");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  const clearFilters = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };
  
  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, 'yyyy-MM-dd'));
    setTempEndDate(format(end, 'yyyy-MM-dd'));
    setShowPicker(false);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title={getDeleted ? "Recently Deleted Membership Plan" : "Membership Plan"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square"></i> Add Membership Plan</>)} add_link="#" onClick={openAddModal}
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download" /> Excel</button>
            {!getDeleted ? (
              <>
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedMembershipPlan.length === 0}>
                  <i className="bx bx-trash"></i> Delete Selected
                </button>
                <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/membership-plan-remove-list">
                  Recently Deleted Contact
                </Link>
              </>
            ) : (
              <button className="btn btn-sm btn-primary mb-2 me-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                Back
              </button>
            )}
            </>
          }
          />
          <div className="card">
            <div className="card-body">
              {getDeleted && (
                <div className="row mb-3">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label mb-0">Date Filter:</label>
                      <div className="position-relative">
                        <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                          <i className="bx bx-calendar me-2"></i>
                          {format(range[0].startDate, 'MMMM dd, yyyy')} - {format(range[0].endDate, 'MMMM dd, yyyy')}
                        </button>
                        {showPicker && (
                          <div className="position-absolute z-3 bg-white shadow p-2" style={{ top: '100%', left: 0 }}>
                            <DateRangePicker
                              ranges={range}
                              onChange={handleRangeChange}
                              showSelectionPreview={true}
                              moveRangeOnFirstSelection={false}
                              editableDateInputs={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 d-flex justify-content-end gap-2">
                    <button className="btn btn-primary" onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange('customrange');
                      setPage(1);
                    }}>
                      Apply
                    </button>
                    <button className="btn btn-secondary" onClick={() => { clearFilters() }}>Clear</button>
                  </div>
                </div>
              )}
              <DataTable
                columns={[
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]:[]),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "name", label: "Name", sortable: true },
                  { key: "user", label: "No. of users", sortable: true },
                  { key: "category", label: "No. of category", sortable: true },
                  { key: "product", label: "No. of product", sortable: true },
                  { key: "price", label: "Price", sortable: true },
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
                    {!getDeleted && (
                    <td>                    
                      <input type="checkbox" checked={selectedMembershipPlan.includes(row.id)} onChange={() => handleSelectMembershipPlan(row.id)} />
                    </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.user}</td>
                    <td>{row.category}</td>
                    <td>{row.product}</td>
                    <td>{row.price}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      {!getDeleted ? (
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={row.status == 1}
                          onClick={(e) => {
                            e.preventDefault();
                            openStatusModal(row.id, row.status, "status", "status");
                          }}
                          readOnly
                        />
                      </div>
                      ):(
                        row.status == 1 ? (<span className="badge bg-success">Active</span>) : (<span className="badge bg-danger">InActive</span>)
                      )}
                    </td>
                    <td>
                      <div className="dropdown">
                        <button  className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                        {!getDeleted ? (
                          <>
                          <li>
                            <button className="dropdown-item" onClick={() => openModal(row)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" 
                              onClick={(e) => {
                                e.preventDefault(); 
                                openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                              }}
                            >
                              <i className="bx bx-trash me-2"></i> Delete
                            </button>
                          </li>
                          </>                          
                          ) : (
                          <>
                          <li>
                            <button className="dropdown-item" 
                              onClick={(e) => {
                                e.preventDefault(); 
                                openStatusModal(row.id, row.is_delete, "delete_status", "is_delete");
                              }}
                            >
                              <i className="bx bx-windows me-2"></i> Restore
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => openDeleteModal(row.id)}>
                              <i className="bx bx-trash me-2"></i> Delete
                            </button>
                          </li>
                          </>
                        )}
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
      <MembershipPlanModals
        showModal={showModal}
        closeModal={closeModal}
        isEditing={isEditing}
        formData={formData}
        errors={errors}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitting={submitting}
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
        fileName="Member Ship Plan Export.xlsx"
        data={membershipPlanData}
        columns={[
          { label: "Name", key: "name" },
          { label: "No. of users", key: "user" },
          { label: "No. of categories", key: "category" },
          { label: "No. of products", key: "product" },
          { label: "Price", key: "price" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default MembershipPlan;