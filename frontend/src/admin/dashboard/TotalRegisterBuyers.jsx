import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import BuyerModals from "../pages/modal/BuyerModals";

const TotalRegisterBuyers = () => {
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
  const [buyerToDelete, setBuyerToDelete] = useState(null);
  const [todayOnly, setTodayOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/buyers/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, todayOnly: todayOnly ? 'true' : undefined, },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
      setTodayOnly(true)
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, todayOnly]);

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

  const openDeleteModal = (BuyerId) => { setBuyerToDelete(BuyerId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setBuyerToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/buyers/${buyerToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== buyerToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Buyer deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Buyer:", error);
      showNotification("Failed to delete Buyer.", "error");
    }
  };

  return (
    <>
      <h6 className="mb-0 text-uppercase">Today Register Buyer</h6>
      <hr />
      <div className="card">
        <div className="card-body">
          <DataTable
            columns={[
              { key: "id", label: "S.No.", sortable: true },
              { key: "full_name", label: "Name", sortable: true },
              { key: "address", label: "Location", sortable: true },
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
                <td>{row.full_name}<br />{row.email}<br />{row.mobile}</td>
                <td>{row.address}</td>
                <td>{formatDateTime(row.created_at)}</td>
                <td>{formatDateTime(row.updated_at)}</td>
                <td>
                  <button className="btn  btn-primary me-2 mb-2 edit-btn" onClick={(e) => navigate(`/admin/edit_buyer/${row.id}`)}>
                    <i className="bx bx-edit me-0" />
                  </button>
                  <button className="btn btn-sm btn-danger mb-2" onClick={() => openDeleteModal(row.id)}>
                    <i className="bx bx-trash me-0" />
                  </button>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
      <BuyerModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default TotalRegisterBuyers;