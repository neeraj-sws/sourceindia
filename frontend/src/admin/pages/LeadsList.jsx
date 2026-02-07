import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from '../../utils/formatDate';
import LeadsModals from "./modal/LeadsModals";
import ExcelExport from "../common/ExcelExport";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

const LeadsList = ({ getPublic, getApprove, getNotApprove, viewType, getDeleted }) => {
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
  const [enquiriesToDelete, setEnquiriesToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToggleInfo, setStatusToggleInfo] = useState({ id: null, currentStatus: null, field: '', valueKey: '' });
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [enquiriesData, setEnquiriesData] = useState([]);
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
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [appliedSubCategory, setAppliedSubCategory] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [tempEnquiryNo, setTempEnquiryNo] = useState("");
  const [enquiriesCount, setEnquiriesCount] = useState("");
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
    return () => {
      const $category = $("#category");
      const $subCategory = $("#sub_category");
      if ($category.data('select2')) {
        $category.off("change").select2("destroy");
      }
      if ($subCategory.data('select2')) {
        $subCategory.off("change").select2("destroy");
      }
    };
  }, [categories, subCategories]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/enquiries/server-side`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection, getPublic: getPublic ? 'true' : 'false',
          getApprove: getApprove ? 'true' : 'false', getNotApprove: getNotApprove ? 'true' : 'false', viewType: 'leads',
          dateRange, startDate, endDate, category: appliedCategory || "", sub_category: appliedSubCategory || "", enquiry_no: enquiryNo || ""
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getPublic, getApprove, getNotApprove, viewType,
    dateRange, startDate, endDate, appliedCategory, appliedSubCategory, enquiryNo
  ]);

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

  const openDeleteModal = (enquiriesId) => { setEnquiriesToDelete(enquiriesId); setIsBulkDelete(false); setShowDeleteModal(true); };
  const openBulkDeleteModal = () => { setEnquiriesToDelete(null); setIsBulkDelete(true); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setEnquiriesToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      try {
        const res = await axios.delete(`${API_BASE_URL}/enquiries/delete-selected`, {
          data: { ids: selectedEnquiries }
        });
        setData((prevData) => prevData.filter((item) => !selectedEnquiries.includes(item.id)));
        setTotalRecords((prev) => prev - selectedEnquiries.length);
        setFilteredRecords((prev) => prev - selectedEnquiries.length);
        setSelectedEnquiries([]);
        showNotification(res.data?.message || "Selected enquiries deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting selected enquiries:", error);
        showNotification("Failed to delete selected enquiries.", "error");
      } finally {
        closeDeleteModal();
      }
    } else {
      try {
        await axios.delete(`${API_BASE_URL}/enquiries/${enquiriesToDelete}`);
        setData((prevData) => prevData.filter((item) => item.id !== enquiriesToDelete));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
        showNotification("Enquiry deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting Enquiry:", error);
        showNotification("Failed to delete Enquiry.", "error");
      }
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedEnquiries(data?.map((item) => item.id));
    } else {
      setSelectedEnquiries([]);
    }
  };

  const handleSelectEnquiries = (enquiriesId) => {
    setSelectedEnquiries((prevSelectedEnquiries) =>
      prevSelectedEnquiries.includes(enquiriesId)
        ? prevSelectedEnquiries.filter((id) => id !== enquiriesId)
        : [...prevSelectedEnquiries, enquiriesId]
    );
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/enquiries`).then((res) => {
      let filtered = res.data;
      if (getDeleted) {
        filtered = filtered.filter((c) => c.is_delete === 1);
      } else if (getPublic) {
        filtered = filtered.filter((c) => c.user_id === null);
      } else if (getNotApprove) {
        filtered = filtered.filter((c) => c.is_approve === 0 && c.is_delete === 0);
      } else {
        filtered = filtered.filter((c) => c.is_approve === 1 && c.is_delete === 0);
      }
      setEnquiriesData(filtered);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/enquiries/count`).then((res) => {
      setEnquiriesCount(res.data);
    });
  }, []);

  const openStatusModal = (id, currentStatus, field, valueKey) => { setStatusToggleInfo({ id, currentStatus, field, valueKey }); setShowStatusModal(true); };

  const closeStatusModal = () => { setShowStatusModal(false); setStatusToggleInfo({ id: null, currentStatus: null, field: '', valueKey: '' }); };

  const handleStatusConfirm = async () => {
    const { id, currentStatus, field, valueKey } = statusToggleInfo;
    const newStatus = Number(currentStatus) === 1 ? 0 : 1;
    try {
      await axios.patch(`${API_BASE_URL}/enquiries/${id}/${field}`, { [valueKey]: newStatus });
      setData(data?.map((d) => (d.id === id ? { ...d, [valueKey]: newStatus } : d)));
      if (field == "account_status" || field == "delete_status") {
        setData((prevData) => prevData.filter((item) => item.id !== id));
        setTotalRecords((prev) => prev - 1);
        setFilteredRecords((prev) => prev - 1);
        closeDeleteModal();
      }
      if (field == "delete_status") {
        showNotification(newStatus == 1 ? "Removed from list" : "Restored from deleted", "success");
      } else {
        showNotification("Status Approved!", "success");
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
    setEnquiryNo("");
    setTempEnquiryNo("");
    setPage(1);
    $("#category").val("").trigger("change");
    $("#sub_category").val("").trigger("change");
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
          <Breadcrumb mainhead="Enquiry" maincount={totalRecords} page="Leads Master" title={getPublic ? "Public Enquiries" : getApprove ? "Approve Leads" : getNotApprove ? "Pending Leads" : "Leads"}
            actions={
              <>
                <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
                {!getDeleted ? (
                  <>
                    <button className="btn btn-sm btn-danger mb-2 me-2" onClick={openBulkDeleteModal} disabled={selectedEnquiries.length === 0}>
                      <i className="bx bx-trash me-1" /> Delete Selected
                    </button>
                    <Link className="btn btn-sm btn-primary mb-2 me-2" to="/admin/enquiry-remove-list">
                      Recently Deleted Enquiry
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
          {!getPublic && (
            <div className="row pb-3 pt-3 mb-3">
              <div className="col-sm-3">
                <div className="card radius-10 mb-3">
                  <div className="card-body bg-light shadow-sm rounded h-100">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">No. of Leads</p>
                        <h4 className="my-1">{enquiriesCount.getApprove}</h4>
                      </div>
                      <div className="widgets-icons bg-light-primary text-primary ms-auto">
                        <i className="bx bx-cart" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="card radius-10 mb-3">
                  <div className="card-body bg-light shadow-sm rounded">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">Open Leads</p>
                        <h4 className="my-1">{enquiriesCount.status1}</h4>
                      </div>
                      <div className="widgets-icons bg-light-primary text-primary ms-auto">
                        <i className="bx bx-cart" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="card radius-10 mb-3">
                  <div className="card-body bg-light shadow-sm rounded">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">Closed Leads</p>
                        <h4 className="my-1">{enquiriesCount.status2}</h4>
                      </div>
                      <div className="widgets-icons bg-light-primary text-primary ms-auto">
                        <i className="bx bx-cart" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-3">
                <div className="card radius-10 mb-3">
                  <div className="card-body bg-light shadow-sm rounded">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">Pending Leads</p>
                        <h4 className="my-1">{enquiriesCount.status0}</h4>
                      </div>
                      <div className="widgets-icons bg-light-primary text-primary ms-auto">
                        <i className="bx bx-cart" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row">
                {!getDeleted && (
                  <>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Enquiry No</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Enquiry No"
                        value={tempEnquiryNo}
                        onChange={(e) => setTempEnquiryNo(e.target.value)}
                      />
                    </div>
                    {!getPublic && (
                      <>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Category</label>
                          <select id="category" className="form-control select2" value={selectedCategory} onChange={handleCategoryChange}>
                            <option value="">All</option>
                            {categories.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Sub Category</label>
                          <select id="sub_category" className="form-control select2" value={selectedSubCategory} onChange={handleSubCategoryChange}>
                            <option value="">All</option>
                            {subCategories.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
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
                <div className={`${getPublic ? "col-md-2" : getDeleted ? "col-md-4" : "col-md-12"} d-flex justify-content-end gap-2`}>
                  <button
                    className={`${getPublic && "my-auto"} btn btn-primary`}
                    onClick={() => {
                      setStartDate(tempStartDate);
                      setEndDate(tempEndDate);
                      setDateRange("customrange");
                      setAppliedCategory(selectedCategory);
                      setAppliedSubCategory(selectedSubCategory);
                      setEnquiryNo(tempEnquiryNo);
                      setPage(1);
                    }}
                  >
                    Apply
                  </button>
                  <button className={`${getPublic && "my-auto"} btn btn-secondary`} onClick={() => { clearFilters(); }}>Clear</button>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  ...(!getDeleted ? [{ key: "select", label: <input type="checkbox" onChange={handleSelectAll} /> }] : []),
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "enquiry_number", label: "Lead Number", sortable: true },
                  { key: "from_organization_name", label: "Sender", sortable: true },
                  { key: "to_organization_name", label: "Receiver", sortable: true },
                  { key: "category_name", label: "Product", sortable: true },
                  { key: "quantity", label: "Quantity", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
                  ...(getNotApprove ? [{ key: "account_status", label: "Approval", sortable: false }] : []),
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
                        <input type="checkbox" checked={selectedEnquiries.includes(row.id)} onChange={() => handleSelectEnquiries(row.id)} />
                      </td>
                    )}
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td><Link to={`/admin/admin-view-enquiry/${row.enquiry_number}`}>{row.enquiry_number}</Link></td>
                    <td>
                      {row.from_organization_name && (<><a href={`/companies/${row.from_organization_slug}`} target="_blank">{row.from_organization_name}</a><br /></>)}
                      {row.from_full_name && (<>{row.from_full_name}<br /></>)}
                      {row.from_email && (<>{row.from_email}<br /></>)}
                      {row.from_mobile && (<>{row.from_mobile}<br /></>)}
                      <span className="badge bg-primary">{row.from_user_type == 1 ? "Seller" : row.from_user_type == 0 ? "Buyer" : ""}</span>
                    </td>
                    <td>
                      {row.to_organization_name && (<><a href={`/companies/${row.to_organization_slug}`} target="_blank">{row.to_organization_name}</a><br /></>)}
                      {row.to_full_name && (<>{row.to_full_name}<br /></>)}
                      {row.to_email && (<>{row.to_email}<br /></>)}
                      {row.to_mobile && (<>{row.to_mobile}<br /></>)}
                      <span className="badge bg-primary">{row.to_user_type == 1 ? "Seller" : row.to_user_type == 0 ? "Buyer" : ""}</span>
                    </td>

                    <td>
                      {row.product_slug ? (
                        <Link to={`/products/${row.product_slug}`} target="_blank">{row.product_name}</Link>
                      ) : (
                        row.product_name
                      )}
                    </td>
                    <td>{row.quantity}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                    {getNotApprove && (
                      <td>
                        <button type="button" className="btn btn-success btn-sm"
                          onClick={(e) => { e.preventDefault(); openStatusModal(row.id, row.is_approve, "account_status", "is_approve"); }}
                        >
                          Approve
                        </button>
                      </td>
                    )}
                    <td>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu">
                          {!getDeleted ? (
                            <>
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
      <LeadsModals
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
        fileName={getDeleted ? "Enquiries Remove Export.xlsx" : getNotApprove ? `Pending Leads-${new Date().toISOString().split("T")[0]}.xlsx` : `Approve Leads-${new Date().toISOString().split("T")[0]}.xlsx`}
        data={enquiriesData}
        columns={[
          { label: "Enquiry Number", key: "enquiry_number" },
          { label: "User name", key: "from_full_name" },
          { label: "User Email", key: "from_email" },
          { label: "Enquiry to First Name", key: "to_fname" },
          { label: "Enquiry to Last Name", key: "to_lname" },
          { label: "Enquiry to Email", key: "to_email" },
          { label: "Enquiry to Mobile", key: "to_mobile" },
          { label: "Enquiry from First Name", key: "from_fname" },
          { label: "Enquiry from Last Name", key: "from_lname" },
          { label: "Enquiry from Email", key: "from_email" },
          { label: "Enquiry from Mobile", key: "from_mobile" },
          { label: "Quantity", key: "quantity" },
          { label: "Category Name", key: "category_name" },
          { label: "Sub Category Name", key: "sub_category_name" },
          { label: "Status", key: "getStatus" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default LeadsList;