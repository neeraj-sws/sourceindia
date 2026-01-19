import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import OpenEnquiryModals from "./modal/OpenEnquiryModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format } from 'date-fns';

const OpenEnquiry = ({ getDeleted }) => {
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
  const [openEnquiryToDelete, setOpenEnquiryToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [openEnquiryData, setOpenEnquiryData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: 'selection' }
  ]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/open_enquiries/server-side`, {
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

  const openDeleteModal = (openEnquiryId) => { setOpenEnquiryToDelete(openEnquiryId); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setOpenEnquiryToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/open_enquiries/${openEnquiryToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== openEnquiryToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Open Enquiry deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Open Enquiry:", error);
      showNotification("Failed to delete Open Enquiry.", "error");
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/open_enquiries`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === (getDeleted ? 1 : 0));
      setOpenEnquiryData(filtered);
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
      await axios.patch(`${API_BASE_URL}/open_enquiries/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if (field == "delete_status") {
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
      console.error("Error updating home status:", error);
      showNotification("Failed to update home status.", "danger");
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
          <Breadcrumb mainhead="Open Enquiries" maincount={totalRecords} page="Open Enquiries" title={getDeleted ? "Recently Deleted Open Enquiries" : "Open Enquiries List"}
            actions={
              <>
                <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/open-enquiry-remove-list">
                      Recently Deleted Open Enquiries
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
          {getDeleted && (
            <div className="card mb-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label mb-0">Date Filter:</label>
                      <div className="position-relative">
                        <button className="form-control text-start" onClick={() => setShowPicker(!showPicker)}>
                          <i className="bx bx-calendar me-2"></i>
                          {format(range[0].startDate, 'MMMM dd, yyyy')} - {format(range[0].endDate, 'MMMM dd, yyyy')}
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
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "name", label: "From", sortable: true },
                  { key: "title", label: "Title", sortable: true },
                  { key: "description", label: "Description", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  ...(!getDeleted ? [{ key: "is_home", label: "Show Home", sortable: false }] : []),
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
                    <td>{row.name && (<>{row.name}<br /></>)}
                      {row.email && (<>{row.email}<br /></>)}
                      {row.email && (<>{row.phone}<br /></>)}
                      <span className="badge bg-primary">{row.user_type == 1 ? "Seller" : row.user_type == 0 ? "Buyer" : "Public Enquery"}</span>
                    </td>
                    <td>{row.title}</td>
                    <td>{row.description}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    {!getDeleted && (
                      <>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={row.is_home == 1}
                              onClick={(e) => {
                                e.preventDefault();
                                openStatusModal(row.id, row.is_home, "home_status", "is_home");
                              }}
                              readOnly
                            />
                          </div>
                        </td>
                      </>
                    )}
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                            <>
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
                              <li>
                                <button className="dropdown-item" onClick={() => { }}>
                                  <i className="bx bx-envelope me-2"></i> Mail
                                </button>
                              </li>
                              <li>
                                <Link className="dropdown-item" to={`/admin/open-enquiries/${row.id}`}>
                                  <i className="bx bx-history me-2"></i> View
                                </Link>
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
      <OpenEnquiryModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName={getDeleted ? "Open Enquiry Remove Export.xlsx" : "Open Enquiry Export.xlsx"}
        data={openEnquiryData}
        columns={[
          {
            label: "From", key: "name", format: (val, row) => {
              const name = row.name || "";
              const email = row.email || "";
              const phone = row.phone || "";
              return `${name}\n${email}\n${phone}`;
            }
          },
          { label: "Title", key: "title" },
          { label: "Description", key: "description" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default OpenEnquiry;