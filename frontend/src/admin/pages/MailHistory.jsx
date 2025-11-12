import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import MailHistoryModals from "./modal/MailHistoryModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

const MailHistory = ({getDeleted}) => {
  const navigate = useNavigate();
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
 const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [mailHistoryToDelete, setMailHistoryToDelete] = useState(null);
   const [selectedMailHistory, setSelectedMailHistory] = useState([]);
   const [showStatusModal, setShowStatusModal] = useState(false);
   const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
   const [isBulkDelete, setIsBulkDelete] = useState(false);
   const [mailHistoryData, setMailHistoryData] = useState([]);
     const excelExportRef = useRef();
  const [organizationName, setOrganizationName] = useState("");
  const [dateRange, setDateRange] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [tempStartDate, setTempStartDate] = useState(null);
    const [tempEndDate, setTempEndDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [range, setRange] = useState([
      {startDate: new Date(), endDate: new Date(), key: 'selection'}
    ]);
  const [tempOrganizationName, setTempOrganizationName] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [appliedCompanies, setAppliedCompanies] = useState("");
  const [mailType, setMailType] = useState([]);
  const [selectedMailType, setSelectedMailType] = useState("");
  const [appliedMailType, setAppliedMailType] = useState("");
  const datePickerRef = useRef(null);
        
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies`);
        setCompanies(res.data.companies);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompaniesChange = (event) => { setSelectedCompanies(event.target.value); };

  useEffect(() => {
      setMailType([{id:0,name:"Direct"}, {id:1,name:"Selected"}, {id:3,name:"All"}]);
    }, []);
  
    const handleMailTypeChange = (event) => { setSelectedMailType(event.target.value); };

  useEffect(() => {
    $("#companies_list").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select companies",
    })
    .on("change", function () {
      handleCompaniesChange({ target: { value: $(this).val() } });
    });
    $("#mail_type").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select mail type",
    })
    .on("change", function () {
      handleMailTypeChange({ target: { value: $(this).val() } });
    });
    return () => {
      $("#mail_type").off("change").select2("destroy");
    };
  }, [companies, mailType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/seller_mail_histories/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false',
        dateRange, startDate, endDate, companyId: appliedCompanies || "", mail_type: appliedMailType },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted, dateRange, startDate, endDate, appliedCompanies, appliedMailType]);

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

  const openDeleteModal = (mailHistoryId) => { setMailHistoryToDelete(mailHistoryId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setMailHistoryToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setMailHistoryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/seller_mail_histories/delete-selected`, {
          data: { ids: selectedMailHistory }
        });
        setData((prevData) => prevData.filter((item) => !selectedMailHistory.includes(item.id)));
        setTotalRecords((prev) => prev - selectedMailHistory.length);
        setFilteredRecords((prev) => prev - selectedMailHistory.length);
        setSelectedMailHistory([]);
        showNotification(res.data?.message || "Selected mail histories deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected mail histories:", error);
        showNotification("Failed to delete selected mail histories.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        const res = await axios.delete(`${API_BASE_URL}/seller_mail_histories/${mailHistoryToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== mailHistoryToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification(res.data?.message || "Mail History deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Mail History:", error);
        showNotification("Failed to delete Mail History.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedMailHistory(data?.map((item) => item.id));
    } else {
      setSelectedMailHistory([]);
    }
  };

  const handleSelectMailHistory = (mailHistoryId) => {
    setSelectedMailHistory((prevSelectedMailHistory) =>
      prevSelectedMailHistory.includes(mailHistoryId)
        ? prevSelectedMailHistory.filter((id) => id !== mailHistoryId)
        : [...prevSelectedMailHistory, mailHistoryId]
    );
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => {
    setStatusToggleInfo({ id, currentStatus, field, valueKey });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/seller_mail_histories/${id}/delete_status`, { is_delete: newStatus });
      setData((prevData) => prevData.filter((item) => item.id !== id));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
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
    setDateRange("");
    setStartDate(null);
    setEndDate(null);
    setSelectedCompanies("");
    setAppliedCompanies("");
    setSelectedMailType("");
    setAppliedMailType("");
    setPage(1);
    $("#companies_list").val("").trigger("change");
    $("#mail_type").val("").trigger("change");
  };

  const handleRangeChange = (item) => {
      const start = item.selection.startDate;
      const end = item.selection.endDate;
      setRange([item.selection]);
      setTempStartDate(format(start, "yyyy-MM-dd"));
      setTempEndDate(format(end, "yyyy-MM-dd"));
      setShowPicker(false);
    };

    useEffect(() => {
    axios.get(`${API_BASE_URL}/seller_mail_histories`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === (getDeleted ? 1 : 0));
      setMailHistoryData(filtered);
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
          <Breadcrumb mainhead="Mail History" maincount={totalRecords} page="" title={getDeleted ? "Recently Deleted Mail History" : "Mail History"}
          actions={
              <>
                <button className="btn  btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedMailHistory.length === 0}>
                      <i className="bx bx-trash me-1" /> Delete Selected
                    </button>
                    <Link className="btn  btn-primary mb-2" to="/admin/mail-history-remove-list">
                      Recently Deleted Mail History
                    </Link>
                  </>
                ) : (
                  <button className="btn  btn-primary mb-2 me-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                    Back
                  </button>
                )}
              </>
            } />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Company</label>
                  <select id="companies_list" className="form-control select2" value={selectedCompanies} onChange={handleCompaniesChange}>
                    <option value="">-- Select --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.organization_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Mail Type</label>
                  <select id="mail_type" className="form-control select2">
                    <option value="">-- Select --</option>
                    {mailType.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date Filter:</label>
                  <div className="position-relative">
                    <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                      <i className="bx bx-calendar me-2"></i>
                      {format(range[0].startDate, "MMMM dd, yyyy")} - {format(range[0].endDate, "MMMM dd, yyyy")}
                    </button>
                    {showPicker && (
                      <div
                        ref={datePickerRef}
                        className="position-absolute z-3 bg-white shadow p-3 rounded"
                        style={{ top: '100%', left: 0, minWidth: '300px' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">Select Date Range</h6>
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={() => setShowPicker(false)}
                          ></button>
                        </div>
                        <DateRangePicker
                          ranges={range}
                          onChange={handleRangeChange}
                          showSelectionPreview={true}
                          moveRangeOnFirstSelection={false}
                          editableDateInputs={true}
                        />
                        <div className="text-end mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setShowPicker(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-12 d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange("customrange");
                      setAppliedCompanies(selectedCompanies);
                      setAppliedMailType(selectedMailType);
                      setPage(1);
                    }}
                  >
                    Apply
                  </button>
                  <button className="btn btn-secondary" onClick={() => { clearFilters(); }}>Clear</button>
                </div>
              </div>
              <DataTable
                columns={[
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "user_name", label: "Company", sortable: true },
                  { key: "mail_type", label: "Mail type", sortable: true },
                  { key: "user_is_seller", label: "Is Seller", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
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
                        <input type="checkbox" checked={selectedMailHistory.includes(row.id)} onChange={() => handleSelectMailHistory(row.id)} />
                      </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.user_name}</td>
                    <td>{row.mail_type==0 ? "Direct" : row.mail_type==1 ? "Selected" : row.mail_type==3 ? "All" : ""}</td>
                    <td>{row.user_company_name}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                            <>
                              <li>
                                <button className="dropdown-item"
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
                                <button className="dropdown-item" onClick={() => openDeleteModal(row.id)}>
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
      <MailHistoryModals
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
        fileName="Mail History Export.xlsx"
        data={mailHistoryData}
        columns={[
          { label: "Fname", key: "fname" },
          { label: "Lname", key: "lname" },
          { label: "Email", key: "email" },
          { label: "Mail Type", key: "mail_type" },
          { label: "Company Name", key: "user_company_name" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default MailHistory;