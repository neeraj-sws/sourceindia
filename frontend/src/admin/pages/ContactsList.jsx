import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import ContactModals from "./modal/ContactModals";
import ExcelExport from "../common/ExcelExport";

const ContactsList = ({ getDeleted }) => {
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
  const { showNotification } = useAlert();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [contactData, setContactData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempDateRange, setTempDateRange] = useState('');
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/contacts/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false', dateRange, startDate, endDate, },
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

  const openDeleteModal = (contactId) => { setContactToDelete(contactId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setContactToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setContactToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/contacts/delete-selected`, {
          data: { ids: selectedContacts }
        });
        setData((prevData) => prevData.filter((item) => !selectedContacts.includes(item.id)));
        setTotalRecords((prev) => prev - selectedContacts.length);
        setFilteredRecords((prev) => prev - selectedContacts.length);
        setSelectedContacts([]);
        showNotification("Selected contacts deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected contacts:", error);
        showNotification("Failed to delete selected contacts.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/contacts/${contactToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== contactToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Contact deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Contact:", error);
        showNotification("Failed to delete Contact.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedContacts(data?.map((item) => item.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts((prevSelectedContacts) =>
      prevSelectedContacts.includes(contactId)
        ? prevSelectedContacts.filter((id) => id !== contactId)
        : [...prevSelectedContacts, contactId]
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
      await axios.patch(`${API_BASE_URL}/contacts/${id}/delete_status`, { is_delete: newStatus });
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

  useEffect(() => {
    axios.get(`${API_BASE_URL}/contacts`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === (getDeleted ? 1 : 0));
      setContactData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const clearFilters = () => {
    setTempDateRange('');
    setTempStartDate(null);
    setTempEndDate(null);
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Contact List" maincount={totalRecords} page="" title={getDeleted ? "Recently Deleted Contact Us" : "Contact Us"}
            actions={
              <>
                <button className="btn  btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedContacts.length === 0}>
                      Delete Selected
                    </button>
                    <Link className="btn  btn-primary mb-2" to="/admin/contact-remove-list">
                      Recently Deleted Contact
                    </Link>
                  </>
                ) : (
                  <button className="btn  btn-primary mb-2 me-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
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
                      <select
                        className="form-select"
                        style={{ width: '200px' }}
                        value={tempDateRange}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempDateRange(val);
                          if (val !== 'customrange') {
                            setTempStartDate(null);
                            setTempEndDate(null);
                          }
                        }}
                      >
                        <option value="">All</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="thismonth">This Month</option>
                        <option value="lastmonth">Last Month</option>
                        <option value="customrange">Custom Range</option>
                      </select>
                      {tempDateRange === 'customrange' && (
                        <>
                          <input
                            type="date"
                            className="form-control"
                            value={tempStartDate || ''}
                            onChange={(e) => setTempStartDate(e.target.value)}
                          />
                          <input
                            type="date"
                            className="form-control"
                            value={tempEndDate || ''}
                            onChange={(e) => setTempEndDate(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 d-flex justify-content-end gap-2">
                    <button className="btn btn-primary" onClick={() => {
                      setDateRange(tempDateRange);
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
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
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "full_name", label: "User", sortable: true },
                  { key: "email", label: "Email", sortable: true },
                  { key: "subject", label: "Subject", sortable: true },
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
                        <input type="checkbox" checked={selectedContacts.includes(row.id)} onChange={() => handleSelectContact(row.id)} />
                      </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.full_name}</td>
                    <td>{row.email}</td>
                    <td>{row.subject}</td>
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
      <ContactModals
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
        fileName="Contacts Export.xlsx"
        data={contactData}
        columns={[
          { label: "Fname", key: "fname" },
          { label: "Lname", key: "lname" },
          { label: "Email", key: "email" },
          { label: "Subject", key: "subject" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default ContactsList;
