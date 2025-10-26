import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from "../admin/common/Breadcrumb";
import DataTable from "../admin/common/DataTable";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useAlert } from "./../context/AlertContext";
import { formatDateTime } from './../utils/formatDate';
import ProductModals from "../admin/pages/modal/ProductModals";
import UseAuth from '../sections/UseAuth';

const MyProducts = ({user_id}) => {
  const navigate = useNavigate();
  const {user, loading} = UseAuth();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { showNotification } = useAlert();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/products/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, user_id: user.id },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, user]);

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

  const openDeleteModal = (productId) => { setProductToDelete(productId); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setProductToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
    await axios.delete(`${API_BASE_URL}/products/${productToDelete}`);
    setData((prevData) => prevData.filter((item) => item.id !== productToDelete));
    setTotalRecords((prev) => prev - 1);
    setFilteredRecords((prev) => prev - 1);
    closeDeleteModal();
    showNotification("Product deleted successfully!", "success");
    } catch (error) {
    console.error("Error deleting Product:", error);
    showNotification("Failed to delete Product.", "error");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Shop" title="Products"
          add_button={(<><i className="bx bxs-plus-square"></i> Add Product</>)} add_link="/add_product"
          />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "image", label: "Image", sortable: false },
                  { key: "title", label: "Title", sortable: true },
                  { key: "category_name", label: "Category Name", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  { key: "action", label: "Action", sortable: false },
                ]}
                data={data}
                loading={isLoading}
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
                    <td><ImageWithFallback
                      src={`${ROOT_URL}/${row.file_name}`}
                      width={40}
                      height={40}
                      showFallback={true}
                    /></td>
                    <td>{row.title}</td>
                    <td>{row.category_name}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button className="dropdown-item" onClick={(e) => navigate(`/edit_product/${row.id}`)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li>
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
      <ProductModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        deleteType="product"
      />
    </>
  );
};

export default MyProducts;