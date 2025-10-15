import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import EmailModals from "./modal/EmailModals";
import ExcelExport from "../common/ExcelExport";

const EmailsList = () => {
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
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [emailData, setEmailData] = useState([]);
  const excelExportRef = useRef();
  const [emailFor, setEmailFor] = useState("");
  const [tempEmailFor, setTempEmailFor] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/emails/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, emailFor },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, emailFor]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection == "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
    const isFiltered = search.trim() || emailFor;
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

  const openDeleteModal = (emailId) => { setEmailToDelete(emailId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setEmailToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/emails/${emailToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== emailToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Email deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Email:", error);
      showNotification("Failed to delete Email.", "error");
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/emails`).then((res) => {
      setEmailData(res.data);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const clearFilters = () => {
    setEmailFor('');
    setTempEmailFor('');
    setPage(1);
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Email" 
        //   add_button="Add Email" add_link="/admin/add_email"
          actions={
              <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download" /> Excel</button>
            }
          />
          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-8">
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="emailForInput" className="form-label">Filter:</label>
                    <input
                      id="emailForInput"
                      type="text"
                      className="form-control"
                      placeholder="Email For..."
                      value={tempEmailFor}
                      onChange={(e) => setTempEmailFor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4 d-flex justify-content-end gap-2">
                  <button className="btn btn-primary" onClick={() => {
                    setEmailFor(tempEmailFor);
                    setPage(1);
                  }}>
                    Apply
                  </button>
                  <button className="btn btn-secondary" onClick={() => { clearFilters() }}>Clear</button>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "title", label: "Title", sortable: true },
                  { key: "email_for", label: "Email For", sortable: true },
                  { key: "subject", label: "Subject", sortable: true },
                  { key: "status", label: "Status", sortable: true },
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
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.title}</td>
                    <td>{row.email_for}</td>
                    <td>{row.subject}</td>
                    <td>{row.status}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={(e) => navigate(`/admin/email-edit/${row.id}`)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => openDeleteModal(row.id)}>
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
      <EmailModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName="Email Export.xlsx"
        data={emailData}
        columns={[
          { label: "Title", key: "title" },
          { label: "Email For", key: "email_for" },
          { label: "Subject", key: "subject" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default EmailsList;