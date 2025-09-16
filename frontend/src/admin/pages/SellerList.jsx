import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import SellerModals from "./modal/SellerModals";

const SellerList = ({getInactive, getNotApproved, getDeleted}) => {
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
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '', });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sellers/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getInactive: getInactive ? 'true' : 'false',
          getNotApproved: getNotApproved ? 'true' : 'false', getDeleted: getDeleted ? 'true' : 'false'
        },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getInactive, getNotApproved, getDeleted]);

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

  const openDeleteModal = (sellerId) => { setSellerToDelete(sellerId); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setSellerToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/sellers/${sellerToDelete}`);
      setData((prevData) => prevData.filter((item) => item.id !== sellerToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Seller deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Seller:", error);
      showNotification("Failed to delete Seller.", "error");
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => { setStatusToggleInfo({ id, currentStatus, field, valueKey }); 
  setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/buyers/${id}/${field}`, { [valueKey]: newStatus });
      setData(data.map(d => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if(field=="delete_status"){
        setData((prevData) => prevData.filter((item) => item.id !== id));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
      }
      if(field=="delete_status"){
        showNotification(newStatus==1 ? "Removed from list" : "Restored from deleted", "success");
      }else{
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

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Users" 
          title={ getInactive ? "Inactive Sellers" : getNotApproved ? "Not Approved Sellers" : getDeleted ? "Recently Deleted Sellers" : "Sellers" }
          add_button="Add Seller" add_link="/admin/add_seller" />
          <div className="card">
            <div className="card-body">
                <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "organization_name", label: "Company Name", sortable: true },
                  { key: "coreactivity_name", label: "Coreactivity / Category / Segment / Sub Segment", sortable: true },
                  { key: "designation", label: "Designation / Website / Quality Certification", sortable: true },                  
                  { key: "created_at", label: "Created", sortable: true },
                  { key: "updated_at", label: "Last Update", sortable: true },
                  ...(!getDeleted ? [{ key: "status", label: "Status", sortable: false }] : []),
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
                    <td>{row.organization_name}<br />
                    {row.elcina_member == 1 ? ( <><span className="badge bg-primary">Elcina Member</span><br /></> ) : ("")}
                    {row.is_trading == 1 ? ( <><span className="badge bg-success">Trader</span><br /></> ) : ("")}
                    <i className="bx bx-user me-1" />{row.full_name}<br />
                    <i className="bx bx-user me-1" />{row.email}<br />
                    <i className="bx bx-mobile me-2" />{row.mobile}</td>
                    <td>{row.coreactivity_name}<br />{row.category_name}</td>
                    <td>{row.designation}<br />{row.website}</td>                    
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    {!getDeleted && (
                    <td>
                      <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={row.status == 1}
                        onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.status, "status", "status"); }}
                        readOnly
                      />
                      </div>
                    </td>
                    )}
                    <td>
                      { getDeleted ? (
                      <>
                      <button className="btn btn-sm btn-primary me-2 mb-2" title="Undo"
                      onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.is_delete, "delete_status", "is_delete"); }}>
                      <i className="bx bx-undo me-0" />
                      </button>
                      <button className="btn btn-sm btn-danger mb-2" title="Delete" onClick={() => openDeleteModal(row.id)}>
                      <i className="bx bx-trash me-0" />
                      </button>
                      </>
                      ) : (
                      <>
                      <button className="btn btn-sm btn-primary me-2 mb-2 edit-btn"  title="Edit" onClick={(e) => navigate(`/admin/edit_seller/${row.id}`)}>
                      <i className="bx bx-edit me-0" />
                      </button>
                      <button className="btn btn-sm btn-danger mb-2" title="Remove"
                      onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.is_delete, "delete_status", "is_delete"); }}>
                      <i className="bx bx-x me-0" />
                      </button>
                      </>
                      )}
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <SellerModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
    </>
  );
};

export default SellerList;