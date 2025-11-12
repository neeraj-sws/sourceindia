import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import InventoriesModals from "./modal/InventoriesModals";
import ExcelExport from "../common/ExcelExport";
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 

const Inventories = () => {
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
  const [inventoriesToDelete, setInventoriesToDelete] = useState(null);
  const [selectedInventories, setSelectedInventories] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [inventoriesData, setInventoriesData] = useState([]);
  const excelExportRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/inventories/server-side`, {
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

  const openDeleteModal = (inventoriesId) => { setInventoriesToDelete(inventoriesId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setInventoriesToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setInventoriesToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/inventories/delete-selected`, {
          data: { ids: selectedInventories }
        });
        setData((prevData) => prevData.filter((item) => !selectedInventories.includes(item.id)));
        setTotalRecords((prev) => prev - selectedInventories.length);
        setFilteredRecords((prev) => prev - selectedInventories.length);
        setSelectedInventories([]);
        showNotification(res.data?.message || "Selected inventories deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected inventories:", error);
        showNotification("Failed to delete selected inventories.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        const res = await axios.delete(`${API_BASE_URL}/inventories/${inventoriesToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== inventoriesToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification(res.data?.message || "Inventories deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Inventories:", error);
        showNotification("Failed to delete Inventories.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedInventories(data?.map((item) => item.id));
    } else {
      setSelectedInventories([]);
    }
  };

  const handleSelectInventories = (inventoriesId) => {
    setSelectedInventories((prevSelectedInventories) =>
      prevSelectedInventories.includes(inventoriesId)
        ? prevSelectedInventories.filter((id) => id !== inventoriesId)
        : [...prevSelectedInventories, inventoriesId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/inventories`).then((res) => {
      setInventoriesData(res.data);
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
          <Breadcrumb mainhead="Inventories" maincount={totalRecords} page="Settings" title="Inventories"
            actions={(
              <>
              <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
              <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedInventories.length === 0}>
                <i className="bx bx-trash me-1" /> Delete Selected
              </button>
              </>
            )}
          />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> },
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "pno", label: "P/N", sortable: true },
                  { key: "brand", label: "Brand", sortable: true },
                  { key: "qty", label: "QTY", sortable: true },
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
                    <input type="checkbox" checked={selectedInventories.includes(row.id)} onChange={() => handleSelectInventories(row.id)} />
                    </td>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>{row.pno}</td>
                    <td>{row.brand}</td>
                    <td>{row.qty}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">                          
                            <li>
                            <button className="dropdown-item text-danger" onClick={() => openDeleteModal(row.id)}>
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
      <InventoriesModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        isBulkDelete={isBulkDelete}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName="semple-invantory.xlsx"
        data={inventoriesData}
        columns={[
          { label: "P/N", key: "pno" },
          { label: "Brand", key: "brand" },
          { label: "QTY", key: "qty" },
        ]}
      />
    </>
  );
};

export default Inventories;
