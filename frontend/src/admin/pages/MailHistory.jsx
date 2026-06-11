import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

const modalBackdropStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.45)",
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const MailHistory = ({ getDeleted }) => {
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewRow, setPreviewRow] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/seller_mail_histories/server-side`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false',
          dateRange, startDate, endDate
        },
      });
      setData(response.data.data);
      setMailHistoryData(response.data.data || []);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDirection, getDeleted, dateRange, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    setPage(1);
  };

  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    setRange([item.selection]);
    setTempStartDate(format(start, "yyyy-MM-dd"));
    setTempEndDate(format(end, "yyyy-MM-dd"));
    setShowPicker(false);
  };

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewLoading(false);
    setPreviewData(null);
    setPreviewRow(null);
    setPreviewSummary(null);
  };

  const handlePreview = async (row) => {
    if (!row?.mail_code) {
      showNotification("Mail code not found for preview.", "error");
      return;
    }

    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewData(null);
    setPreviewRow(null);
    setPreviewSummary(row);

    try {
      const detailsResponse = await axios.get(`${API_BASE_URL}/seller_mail_histories/details/${encodeURIComponent(row.mail_code)}`, {
        params: {
          page: 1,
          limit: 1,
          sortBy: "id",
          sort: "ASC",
          getDeleted: getDeleted ? "true" : "false",
        },
      });

      const firstRow = detailsResponse?.data?.data?.[0] || null;
      setPreviewRow(firstRow);

      if (!firstRow?.email_id) {
        showNotification("Template not mapped for this mail batch.", "error");
        return;
      }

      const templateResponse = await axios.get(`${API_BASE_URL}/emails/${firstRow.email_id}`);
      setPreviewData(templateResponse.data || null);
    } catch (error) {
      console.error("Error loading mail preview:", error);
      showNotification(error?.response?.data?.message || "Failed to load mail preview.", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const getMailTypeLabel = (type) => {
    if (Number(type) === 0) return "Buyer";
    if (Number(type) === 1) return "Seller";
    return type || "-";
  };

  const getMailTypeBadgeClass = (type) => {
    if (Number(type) === 0) return "bg-primary-subtle text-dark border border-primary-subtle";
    if (Number(type) === 1) return "bg-success-subtle text-dark border border-success-subtle";
    return "bg-secondary-subtle text-dark border border-secondary-subtle";
  };

  const formatMailHistoryListLabel = (value) => {
    if (!value) return "-";

    return value
      .toString()
      .replace(/_/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRenderedPreviewTemplateBody = () => {
    const rawTemplate = previewData?.message || "";
    if (!rawTemplate) return "";

    const userName = escapeHtml(previewRow?.user_name || "-");
    const userEmail = escapeHtml(previewRow?.user_email || previewRow?.mail || "-");

    return rawTemplate
      .replace(/\{\{\s*USER_NAME\s*\}\}/gi, userName)
      .replace(/\{\{\s*USER_EMAIL\s*\}\}/gi, userEmail);
  };

  const pageSummary = useMemo(() => {
    return data.reduce((acc, row) => {
      acc.pending += Number(row.pending_count || 0);
      acc.success += Number(row.success_count || 0);
      acc.failed += Number(row.failed_count || 0);
      acc.opened += Number(row.opened_count || 0);
      acc.notOpened += Number(row.not_opened_count || 0);
      acc.total += Number(row.total_mail_histories || 0);
      return acc;
    }, { pending: 0, success: 0, failed: 0, opened: 0, notOpened: 0, total: 0 });
  }, [data]);

  const renderCountBadge = (value, variantClass) => (
    <span className={`badge rounded-pill ${variantClass}`}>{Number(value || 0)}</span>
  );

  const counterCards = [
    {
      key: "pending",
      label: "Pending",
      value: pageSummary.pending,
      cardClass: "border-warning-subtle bg-warning-subtle",
      iconClass: "bx bx-time-five text-warning",
    },
    {
      key: "success",
      label: "Success",
      value: pageSummary.success,
      cardClass: "border-success-subtle bg-success-subtle",
      iconClass: "bx bx-check-circle text-success",
    },
    {
      key: "failed",
      label: "Failed",
      value: pageSummary.failed,
      cardClass: "border-danger-subtle bg-danger-subtle",
      iconClass: "bx bx-error-circle text-danger",
    },
    {
      key: "opened",
      label: "Opened",
      value: pageSummary.opened,
      cardClass: "border-success-subtle bg-success-subtle",
      iconClass: "bx bx-envelope-open text-success",
    },
    {
      key: "notOpened",
      label: "Not Opened",
      value: pageSummary.notOpened,
      cardClass: "border-secondary-subtle bg-secondary-subtle",
      iconClass: "bx bx-envelope text-secondary",
    },
    {
      key: "total",
      label: "Total",
      value: pageSummary.total,
      cardClass: "border-info-subtle bg-info-subtle",
      iconClass: "bx bx-bar-chart-alt-2 text-info",
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Mail History" maincount={totalRecords} page="" title={getDeleted ? "Recently Deleted Mail History" : "Mail History List"}
            actions={
              <>
                <button className="btn  btn-primary mb-2 me-2 d-none" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <button className="btn btn-sm btn-danger mb-2 me-2 d-none" onClick={openBulkDeleteModal} disabled={selectedMailHistory.length === 0}>
                      <i className="bx bx-trash me-1" /> Delete Selected
                    </button>
                    <Link className="btn  btn-primary mb-2 d-none" to="/admin/mail-history-remove-list">
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

          <div className="row g-3 mb-4">
            {counterCards.map((card) => (
              <div className="col-12 col-sm-6 col-lg-3" key={card.key}>
                <div className={`border rounded-3 p-3 h-100 shadow-sm ${card.cardClass}`}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-semibold">{card.label}</span>
                    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white" style={{ width: 34, height: 34 }}>
                      <i className={`${card.iconClass} fs-5`} />
                    </span>
                  </div>
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="fw-bold" style={{ fontSize: "1.65rem", lineHeight: 1 }}>
                      {card.value}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-body">
              <div className="row mb-3 align-items-center">
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
                <div className="col-md-6 d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange("customrange");
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
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "mail_master_list", label: "List", sortable: true },
                  { key: "mail_master_type", label: "Type", sortable: true },
                  { key: "total_mail_histories", label: "Total", sortable: true },

                  { key: "pending_count", label: "Pending", sortable: true },
                  { key: "success_count", label: "Success", sortable: true },
                  { key: "failed_count", label: "Failed", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
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
                    <td>
                      <Link to={`/admin/mail_history_details/${encodeURIComponent(row.mail_code)}${getDeleted ? '?deleted=true' : ''}`}>
                        {formatMailHistoryListLabel(row.mail_master_list)}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${getMailTypeBadgeClass(row.mail_master_type)}`}>
                        {getMailTypeLabel(row.mail_master_type)}
                      </span>
                    </td>
                    <td>{renderCountBadge(row.total_mail_histories, "bg-info-subtle text-info")}</td>
                    <td>{renderCountBadge(row.pending_count, "bg-warning-subtle text-warning")}</td>
                    <td>{renderCountBadge(row.success_count, "bg-success-subtle text-success")}</td>
                    <td>{renderCountBadge(row.failed_count, "bg-danger-subtle text-danger")}</td>

                    <td>{formatDateTime(row.created_at)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handlePreview(row)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/admin/mail_history_details/${encodeURIComponent(row.mail_code)}${getDeleted ? '?deleted=true' : ''}`)}
                        >
                          <i className="bx bx-show me-1"></i>
                        </button>
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
          { label: "Code", key: "mail_code" },
          { label: "List", key: "mail_master_list" },
          { label: "Mail Type", key: "mail_master_type", format: (val) => getMailTypeLabel(val) },
          { label: "Pending", key: "pending_count" },
          { label: "Success", key: "success_count" },
          { label: "Failed", key: "failed_count" },
          { label: "Total Details", key: "total_mail_histories" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />

      {showPreviewModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Template Preview</h5>
                    <small className="text-muted d-none">
                      {previewData?.title || previewData?.subject || formatMailHistoryListLabel(previewSummary?.mail_master_list)}
                    </small>
                  </div>
                  <button type="button" className="btn-close" onClick={closePreviewModal} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-lg-4 d-none">
                      <div className="border rounded-3 p-3 h-100 bg-light">
                        <h6 className="mb-3">First User Detail</h6>
                        <div className="mb-2">
                          <small className="text-muted d-block">List</small>
                          <div className="fw-semibold">{formatMailHistoryListLabel(previewSummary?.mail_master_list)}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Code</small>
                          <div className="fw-semibold">{previewSummary?.mail_code || "-"}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Name</small>
                          <div className="fw-semibold">{previewRow?.user_name || "-"}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Email</small>
                          <div className="fw-semibold">{previewRow?.user_email || previewRow?.mail || "-"}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Company</small>
                          <div className="fw-semibold">{previewRow?.organization_name || "-"}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block">Location</small>
                          <div className="fw-semibold">
                            {[previewRow?.city, previewRow?.state, previewRow?.country].filter(Boolean).join(", ") || "-"}
                          </div>
                        </div>
                        <div className="mb-0">
                          <small className="text-muted d-block">Status</small>
                          <div className="fw-semibold">{previewRow?.delivery_status || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="border rounded-3 p-3 h-100">
                        <h6 className="mb-3">Template Body</h6>
                        {previewLoading ? (
                          <div className="py-5 text-center text-muted">Loading template preview...</div>
                        ) : previewData?.message ? (
                          <div className="preview-email-body" dangerouslySetInnerHTML={{ __html: getRenderedPreviewTemplateBody() }} />
                        ) : (
                          <div className="py-5 text-center text-muted">No template content found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closePreviewModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={modalBackdropStyle} />
        </>
      )}
    </>
  );
};

export default MailHistory;