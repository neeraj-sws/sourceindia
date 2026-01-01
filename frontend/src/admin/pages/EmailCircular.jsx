import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import ExcelExport from "../common/ExcelExport";
import EmailCircularModals from "./modal/EmailCircularModals";

const EmailCircular = () => {
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
  const [newsletterToDelete, setNewsletterToDelete] = useState(null);
  const [selectedEmailCircular, setSelectedEmailCircular] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [emailCircularData, setEmailCircularData] = useState([]);
  const excelExportRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletters/server-side`, {
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

  const openDeleteModal = (newsletterId) => { setNewsletterToDelete(newsletterId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setNewsletterToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setNewsletterToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/newsletters/delete-selected`, {
          data: { ids: selectedEmailCircular }
        });
        setData((prevData) => prevData.filter((item) => !selectedEmailCircular.includes(item.id)));
        setTotalRecords((prev) => prev - selectedEmailCircular.length);
        setFilteredRecords((prev) => prev - selectedEmailCircular.length);
        setSelectedEmailCircular([]);
        showNotification(res.data?.message || "Selected newsletters deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected newsletters:", error);
        showNotification("Failed to delete selected newsletters.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/newsletters/${newsletterToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== newsletterToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Email Circular deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Email Circular:", error);
        showNotification("Failed to delete Email Circular.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedEmailCircular(data?.map((item) => item.id));
    } else {
      setSelectedEmailCircular([]);
    }
  };

  const handleSelectEmailCircular = (emailCircularId) => {
    setSelectedEmailCircular((prevSelectedEmailCircular) =>
      prevSelectedEmailCircular.includes(emailCircularId)
        ? prevSelectedEmailCircular.filter((id) => id !== emailCircularId)
        : [...prevSelectedEmailCircular, emailCircularId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/newsletters`).then((res) => {
      const filtered = res.data.filter((c) => c.is_delete === 0);
      setEmailCircularData(filtered);
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
          <Breadcrumb mainhead="Email Circular" maincount={totalRecords} page="Email Circular" title="Email Circular List" add_button={<><i className="bx bxs-plus-square me-1" /> Add Email Circular</>} add_link="/admin/add_email_circular"
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedEmailCircular.length === 0}>
              <i className="bx bx-trash me-1" /> Delete Selected
            </button>
            </>
          }
          />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  ...([{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "title", label: "Title", sortable: true },
                  { key: "user_type_name", label: "User Type", sortable: true },
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
                    <td>                    
                      <input type="checkbox" checked={selectedEmailCircular.includes(row.id)} onChange={() => handleSelectEmailCircular(row.id)} />
                    </td>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td><Link to={`/admin/email_circular_details/${row.id}`}>{row.title}</Link></td>
                    <td>{row.user_type_name ? row.user_type_name.charAt(0).toUpperCase() + row.user_type_name.slice(1) : ''}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={(e) => navigate(`/admin/email_circular_details/${row.id}`)}>
                              <i className="bx bx-show me-2"></i> View
                            </button>
                          </li>
                          {/* <li>
                            <button className="dropdown-item" onClick={(e) => navigate(`/admin/edit_email_circular/${row.id}`)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li> */}
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
      <EmailCircularModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        isBulkDelete={isBulkDelete}
        deleteType="newsletter"
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName="Email Circular Export.xlsx"
        data={emailCircularData}
        columns={[
          { label: "Title", key: "title" },
          { label: "User Type", key: "user_category_name" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default EmailCircular;