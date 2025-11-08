import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import ProductModals from "./modal/ProductModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 
import { format } from 'date-fns';

const ProductList = ({ getDeleted, isApprove }) => {
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
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '', });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [productsData, setProductsData] = useState([]);
  const excelExportRef = useRef();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {startDate: new Date(), endDate: new Date(), key: 'selection'}
  ]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [appliedSubCategory, setAppliedSubCategory] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState("");
  const [appliedCompanies, setAppliedCompanies] = useState("");
  const [productStatus, setProductStatus] = useState([]);
  const [selectedProductStatus, setSelectedProductStatus] = useState("");
  const [appliedProductStatus, setAppliedProductStatus] = useState("");
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    try {
      if (categoryId) {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${categoryId}`);
        setSubCategories(res.data);
      } else {
        setSubCategories([]);
      }
      setSelectedSubCategory("");
    } catch (err) {
      console.error("Error fetching sub categories:", err);
    }
  };

  const handleSubCategoryChange = (event) => { setSelectedSubCategory(event.target.value); };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies`);
        setCompanies(res.data.companies);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompaniesChange = (event) => { setSelectedCompanies(event.target.value); };

  useEffect(() => {
    setProductStatus([{id:2,name:"Private"}, {id:1,name:"Public"}, {id:0,name:"Draft"}]);
  }, []);

  const handleProductStatusChange = (event) => { setSelectedProductStatus(event.target.value); };

  useEffect(() => {
    $("#category").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Category",
    })
    .on("change", function () {
      handleCategoryChange({ target: { value: $(this).val() } });
    });
    $("#sub_category").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select Sub Category",
    })
    .on("change", function () {
      handleSubCategoryChange({ target: { value: $(this).val() } });
    });
    $("#company").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select companies",
    })
    .on("change", function () {
      handleCompaniesChange({ target: { value: $(this).val() } });
    });
    $("#product_status").select2({
      theme: "bootstrap",
      width: "100%",
      placeholder: "Select elcina member",
    })
    .on("change", function () {
      handleProductStatusChange({ target: { value: $(this).val() } });
    });
    return () => {
      $("#category").off("change").select2("destroy");
      $("#sub_category").off("change").select2("destroy");
      $("#company").off("change").select2("destroy");
      $("#product_status").off("change").select2("destroy");
    };
  }, [categories, subCategories, companies, productStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/products/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, getDeleted: getDeleted ? 'true' : 'false',
        dateRange, startDate, endDate, category: appliedCategory || "", sub_category: appliedSubCategory || "",
        company: appliedCompanies || "", product_status: appliedProductStatus, is_approve: isApprove
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getDeleted,
    dateRange, startDate, endDate, appliedCategory, appliedSubCategory, appliedCompanies, appliedProductStatus, isApprove]);

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

  const openDeleteModal = (productId) => { setProductToDelete(productId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setProductToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setProductToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/products/delete-selected`, {
          data: { ids: selectedProducts }
        });
        setData((prevData) => prevData.filter((item) => !selectedProducts.includes(item.id)));
        setTotalRecords((prev) => prev - selectedProducts.length);
        setFilteredRecords((prev) => prev - selectedProducts.length);
        setSelectedProducts([]);
        showNotification(res.data?.message || "Selected products deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected products:", error);
        showNotification("Failed to delete selected products.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
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
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts(data?.map((item) => item.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProducts = (productsId) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.includes(productsId)
        ? prevSelectedProducts.filter((id) => id !== productsId)
        : [...prevSelectedProducts, productsId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/products`).then((res) => {
      let filtered = res.data.products;
      if (getDeleted) {
        filtered = filtered.filter((c) => c.is_delete === 1);
      } else if (isApprove==1) {
        filtered = filtered.filter((c) => c.is_approve === 1 && c.is_delete === 0);
      } else if (isApprove==0) {
        filtered = filtered.filter((c) => c.is_approve === 0 && c.is_delete === 0);
      } else {
        filtered = filtered.filter((c) => c.is_delete === 0);
      }
      setProductsData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  const openStatusModal = (id, currentStatus, field, valueKey) => {
    setStatusToggleInfo({ id, currentStatus, field, valueKey });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/products/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map(d => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if(field=="delete_status"){
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
    setDateRange('');
    setStartDate(null);
    setEndDate(null);
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSubCategories([]);
    setAppliedCategory("");
    setAppliedSubCategory("");
    setSelectedCompanies("");
    setAppliedCompanies("");
    setSelectedProductStatus("");
    setAppliedProductStatus("");
    setPage(1);
    $("#category").val("").trigger("change");
    $("#sub_category").val("").trigger("change");
    $("#company").val("").trigger("change");
    $("#product_status").val("").trigger("change");
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
          <Breadcrumb mainhead="Products" maincount={totalRecords} page="Shop" title={getDeleted ? "Recently Deleted Product" : "Products"}
          add_button={!getDeleted && (<><i className="bx bxs-plus-square me-1" /> Add Product</>)} add_link="/admin/add_product"
          actions={
            <>
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
            {!getDeleted ? (
              <>
                <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedProducts.length === 0}>
                  <i className="bx bx-trash me-1" /> Delete Selected
                </button>
                <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/product-remove">
                  Recently Deleted Product
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
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                {!getDeleted && (
                <>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Category</label>
                  <select id="category" className="form-control select2" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">All</option>
                    {categories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Sub Category</label>
                  <select id="sub_category" className="form-control select2" value={selectedSubCategory} onChange={handleSubCategoryChange}>
                    <option value="">All</option>
                    {subCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Company</label>
                  <select id="company" className="form-control select2" value={selectedCompanies} onChange={handleCompaniesChange}>
                    <option value="">All</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.organization_name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Status</label>
                  <select id="product_status" className="form-control select2">
                    <option value="">-- Select --</option>
                    {productStatus.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                </>
                )}
                <div className={!getDeleted ? "col-md-6 mb-3" : "col-md-8 d-flex align-items-center gap-2"}>
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
                <div className={!getDeleted ? "col-md-12 d-flex justify-content-end gap-2" : "col-md-4 d-flex justify-content-end gap-2"}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange('customrange');
                      setAppliedCategory(selectedCategory);
                      setAppliedSubCategory(selectedSubCategory);
                      setAppliedCompanies(selectedCompanies);
                      setAppliedProductStatus(selectedProductStatus);
                      setPage(1);
                    }}
                  >
                    Apply
                  </button>
                  <button className="btn btn-secondary" onClick={() => { clearFilters(); }}>Clear</button>
                </div>
              </div>
              </div>
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }]:[]),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "image", label: "Image", sortable: false },
                  { key: "title", label: "Product", sortable: true },
                  { key: "category_name", label: "Category", sortable: true },
                  { key: "company_name", label: "Company", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  { key: "status", label: "Status", sortable: false },
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
                      <input type="checkbox" checked={selectedProducts.includes(row.id)} onChange={() => handleSelectProducts(row.id)} />
                    </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td><ImageWithFallback
                      src={`${ROOT_URL}/${row.file_name}`}
                      width={40}
                      height={40}
                      showFallback={true}
                    /></td>
                    <td><a href={`/products/${row.slug}`} target="_blank">{row.title}</a></td>
                    <td>{row.category_name}</td>
                    <td><a href={`/companies/${row.company_slug}`} target="_blank">{row.company_name}</a></td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
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
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                          <>
                          <li>
                            <button className="dropdown-item" onClick={(e) => navigate(`/admin/edit_product/${row.id}`)}>
                              <i className="bx bx-edit me-2"></i> Edit
                            </button>
                          </li>
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
      <ProductModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        deleteType="product"
        isBulkDelete={isBulkDelete}
        showStatusModal={showStatusModal}
        statusToggleInfo={statusToggleInfo}
        closeStatusModal={closeStatusModal}
        handleStatusConfirm={handleStatusConfirm}
      />
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName={`${getDeleted ? "Product Remove List" : isApprove==1 ? "Approve Product" : isApprove==0 ? "Not Approve Product" : "Products"} Export.xlsx`}
        data={productsData}
        columns={[
          { label: "Title", key: "title" },
          { label: "Code", key: "code" },
          { label: "Category", key: "category_name" },
          { label: "SubCategory", key: "sub_category_name" },
          { label: "Color", key: "color_name" },
          { label: "Status", key: "getStatus" },
          { label: "Organization Name", key: "company_name" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default ProductList;