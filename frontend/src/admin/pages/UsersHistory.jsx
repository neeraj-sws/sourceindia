import React, { useState, useEffect } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import UsersHistoryModals from "./modal/UsersHistoryModals";

const UsersHistory = () => {
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/seller_mail_histories/server-side`, {
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

  const openStatusModal = (id, currentStatus) => { setStatusToggleInfo({ id, currentStatus }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/seller_mail_histories/${id}/status`, { status: newStatus });
      setData(data.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
      showNotification("Status updated", "success");
    } catch (error) {
      console.error("Error updating Status:", error);
      showNotification("Failed to update Status.", "danger");
    } finally {
      closeStatusModal();
      document.activeElement.blur();
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="User History" />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "user_company_name", label: "Company Name", sortable: true },
                  { key: "user_status", label: "Steps", sortable: true },
                  { key: "user_is_seller", label: "Is Seller", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  { key: "status", label: "Status", sortable: false },
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
                    <td>{row.user_company_name && (<h6 className="username">{row.user_company_name}</h6>)}
                    {row.user_elcina_member == 1 ? ( <><span className="badge bg-primary">Elcina Member</span><br /></> ) : ("")}
                    {row.user_name && (<><i className='bx bx-user' /> {row.user_name}<br /></>)}
                    {row.user_email && (<><i className='bx bx-envelope' /> {row.user_email}<br /></>)}
                    {row.user_mobile && (<><i className='bx bx-mobile' /> {row.user_mobile}<br /></>)}
                    {row.country && (<><i className='bx bx-globe' /> {row.country}<br /></>)}
                    {row.state && (<><i className='bx bx-map' /> {row.state}<br /></>)}
                    {row.city && (<><i className='bx bx-map' /> {row.city}</>)}
                    </td>
                    <td><span className="badge bg-primary">{row.user_status==1 ? "Active Seller" : row.user_status==0 ? "Inactive Seller" : ""}</span></td>
                    <td><span className="badge bg-primary">{row.user_is_seller==1 ? "Seller" : row.user_is_seller==0 ? "Buyer" : ""}</span></td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={row.status == 1}
                          onClick={(e) => {
                            e.preventDefault();
                            openStatusModal(row.id, row.status);
                          }}
                          readOnly
                        />
                      </div>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <UsersHistoryModals
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
    </>
  );
};

export default UsersHistory;