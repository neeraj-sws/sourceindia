import React, { useState, useEffect } from "react";
import { Suspense, lazy } from 'react';
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { formatDateTime } from './../utils/formatDate';
import StepProgress from "./StepProgress";
import UseAuth from "../sections/UseAuth";
const DataTable = lazy(() => import('../admin/common/DataTable'));
const CommonSection = lazy(() => import('../pages/CommonSection'));
const LeadsModals = lazy(() => import('../admin/pages/modal/LeadsModals'));

const Dashboard = () => {
  const { showNotification } = useAlert();
  const { user, updateUser, loading } = UseAuth(); // Assuming UseAuth now provides loading
  const navigate = useNavigate();
  const [todayRegisterSeller, setTodayRegisterSeller] = useState(0);
  const [openEnquiryCountData, setOpenEnquiryCountData] = useState(0);
  const [error, setError] = useState(null);
  const [interestData, setInterestData] = useState({ categories: [], subCategories: {} });
  const [itemCategoryData, setItemcategoryData] = useState({ categories: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ activity: {} });
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [enquiriesToDelete, setEnquiriesToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sellerMessage, setSellerMessage] = useState("");
  const [selectedSubIds, setSelectedSubIds] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");

  useEffect(() => {
    if (loading) return; // Wait until loading is false

    const token = localStorage.getItem("user_token");
    console.log("Token:", token);
    console.log("User:", user);
    console.log("User ID in useEffect:", user?.id);

    if (!token) {
      setError("No authentication token found");
      setLoading(false); // Assuming setLoading is managed externally or remove if not needed
      navigate("/login");
      return;
    }
    if (!user || !user.id) {
      setError("User not authenticated or ID missing");
      return;
    }

    const fetchData = async () => {
      try {
        const enquiryResponse = await axios.get(`${API_BASE_URL}/enquiries/user-count?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
        });
        setTodayRegisterSeller(enquiryResponse.data.total || 0);

        const interestResponse = await axios.get(`${API_BASE_URL}/dashboard/buyer-interest?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
        });
        setInterestData(interestResponse.data || { categories: [], subCategories: {} });



        const itemcatgeoryResponse = await axios.get(`${API_BASE_URL}/dashboard/get-itemtype?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
        });
        setItemcategoryData(itemcatgeoryResponse.data || { categories: [] });



        const openEnquiryCountResponse = await axios.get(`${API_BASE_URL}/open_enquiries/count/${user.id}`);
        setOpenEnquiryCountData(openEnquiryCountResponse.data.totalOpenEnquiries);

        if (user.is_intrest === 0) {
          setIsModalOpen(true);
        }
      } catch (error) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", error.response?.data || error.message);
        showNotification("Failed to fetch data", "error");
      }
    };

    fetchData();
  }, [user, loading, navigate]);

  const handleCheckboxChange = (categoryId, subCategoryId) => {
    setFormData((prevData) => {
      const newActivity = { ...prevData.activity };
      if (!newActivity[categoryId]) newActivity[categoryId] = [];
      if (newActivity[categoryId].includes(subCategoryId)) {
        newActivity[categoryId] = newActivity[categoryId].filter((id) => id !== subCategoryId);
      } else {
        newActivity[categoryId] = [...newActivity[categoryId], subCategoryId];
      }
      return { ...prevData, activity: newActivity };
    });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("user_token");

    if (!token || !user?.id) {
      showNotification("User not authenticated", "error");
      return;
    }

    if (
      !formData.activity ||
      !formData.activity.subcategory_ids ||
      formData.activity.subcategory_ids.length === 0
    ) {
      showNotification("Please select at least one sub category", "error");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/dashboard/store-item-subcategory`,
        {
          userId: user.id,
          activity: formData.activity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        showNotification("Interest Added Successfully", "success");

        if (updateUser) {
          updateUser({ ...user, is_intrest: 1 });
        }

        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to submit interest", "error");
    }
  };


  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/enquiries/by-enquiry`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection, user_id: user?.id || null,
        },
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

  useEffect(() => { if (!user || loading) return; fetchData(); },
    [page, limit, search, sortBy, sortDirection, user
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


  const openDeleteModal = (enquiriesId) => { setEnquiriesToDelete(enquiriesId); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setEnquiriesToDelete(null); setShowDeleteModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/enquiries/${enquiriesToDelete}/delete_status`);
      setData((prevData) => prevData.filter((item) => item.id !== enquiriesToDelete));
      setTotalRecords((prev) => prev - 1);
      setFilteredRecords((prev) => prev - 1);
      closeDeleteModal();
      showNotification("Enquiry deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting Enquiry:", error);
      showNotification("Failed to delete Enquiry.", "error");
    }
  };

  useEffect(() => {
    if (!user || !user.id) return;
    axios.get(`${API_BASE_URL}/sellers/seller-message/${user.id}`)
      .then((res) => {
        const msg = res.data?.data?.message;
        setSellerMessage(msg ? msg : "");
      })
      .catch(() => {
        setSellerMessage("");
      });
  }, [user]);


  useEffect(() => {
    if (selectedCategoryId && selectedSubIds.length > 0) {
      setFormData({
        activity: {
          category_id: selectedCategoryId,
          subcategory_ids: selectedSubIds,
        },
      });
    } else {
      setFormData({ activity: {} });
    }
  }, [selectedCategoryId, selectedSubIds]);


  const handleCategoryChange = async (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubIds([]);

    const token = localStorage.getItem("user_token");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/dashboard/get-item-subcategory?categoryId=${categoryId}&userId=${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubCategories(res.data?.subcategories || []);

      // auto set checked ids
      const checkedIds = res.data.subcategories
        .filter((s) => s.checked)
        .map((s) => s.id);

      setSelectedSubIds(checkedIds);
      setCategoryCounts(prev => ({
        ...prev,
        [categoryId]: checkedIds.length
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAll = async (e) => {
    if (!selectedCategoryId) return;

    const token = localStorage.getItem("user_token");
    if (!token) return;

    let updatedSubIds = [];

    if (e.target.checked) {
      updatedSubIds = subCategories.map((sub) => sub.id);
    }

    // Update local state
    setSelectedSubIds(updatedSubIds);

    // Update category count
    setCategoryCounts((prev) => ({
      ...prev,
      [selectedCategoryId]: updatedSubIds.length,
    }));

    // Send all selected or deselected IDs to backend
    try {
      await axios.post(
        `${API_BASE_URL}/dashboard/store-item-subcategory`,
        {
          userId: user.id,
          activity: {
            category_id: selectedCategoryId,
            subcategory_ids: subCategories.map((sub) => sub.id), // all IDs
            action: e.target.checked ? "add" : "remove",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error(err);
      showNotification("Failed to save all selections", "error");
    }
  };


  const handleSubCheck = async (id) => {
    const token = localStorage.getItem("user_token");
    if (!token) return;

    const isChecked = selectedSubIds.includes(id);
    let updatedSubIds;

    // Update local state
    setSelectedSubIds((prev) => {
      updatedSubIds = isChecked
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      // update category count
      setCategoryCounts((prevCounts) => ({
        ...prevCounts,
        [selectedCategoryId]: updatedSubIds.length,
      }));

      return updatedSubIds;
    });

    // Send **single ID and action** to backend
    try {
      await axios.post(
        `${API_BASE_URL}/dashboard/store-item-subcategory`,
        {
          userId: user.id,
          activity: {
            category_id: selectedCategoryId,
            subcategory_ids: [id], // only this ID
            action: isChecked ? "remove" : "add",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error(err);
      showNotification("Failed to save interest", "error");
    }
  };


  const renderBuyerInterestForm = () => {
    // if (!isModalOpen) return null;

    return (
      <Suspense fallback={<div></div>}>
        <div className="modal" id="buyerSourcing" style={{ display: isModalOpen ? "block" : "none", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: isModalOpen ? "rgba(0,0,0,0.5)" : "", zIndex: 10000 }}>
          <div className="modal-dialog modal-lg" style={{ maxWidth: "1200px", margin: "50px auto" }}>
            <div className="modal-content p-2">
              <div className="modal-header">
                <h4 className="modal-title"> Sourcing Interest</h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={() => setIsModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="">

                  <div className="row">
                    <div className="col-9 border-end">
                      <h6 className="mb-3">Category</h6>
                      <input
                        type="text"
                        className="form-control mb-3"
                        placeholder="Search category..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                      />
                      {itemCategoryData.categories.length === 0 && (
                        <p className="text-muted">No categories found</p>
                      )}
                      <div className="heightPart">
                        <div className="row">
                          {(itemCategoryData?.categories || [])
                            .filter((cat) =>
                              cat.name?.toLowerCase().includes(categorySearch.toLowerCase())
                            )
                            .map((cat) => (
                              <div className="col-lg-4">
                                <div key={cat.id} className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedCategoryId === cat.id}
                                    id={`categoryData_${cat.id}`}
                                    onChange={() => handleCategoryChange(cat.id)}
                                  />
                                  <label className="form-check-label" for={`categoryData_${cat.id}`}>
                                    {cat.name}
                                    {(categoryCounts?.[cat.id] ?? cat.count) > 0 && (
                                      <span className="ms-2 badge bg-primary">
                                        {categoryCounts?.[cat.id] ?? cat.count}
                                      </span>
                                    )}
                                  </label>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-3" style={{ background: "#ffe5e5" }}>
                      <div className="p-2 rightPart ">
                        <h6 className="mb-3 mt-2">Please Select The Type</h6>

                        {loading && <p>Loading...</p>}

                        {!loading && subCategories.length === 0 && (
                          <p className="text-muted">
                            Please select a type to see categories
                          </p>
                        )}

                        {subCategories.length > 0 && (
                          <>
                            <input
                              type="text"
                              className="form-control mb-2"
                              placeholder="Search sub-category..."
                              value={subCategorySearch}
                              onChange={(e) => setSubCategorySearch(e.target.value)}
                            />
                            <div className="subpart">
                              {/* CHECK ALL */}
                              <div className="mb-3 bg-primary p-2 rounded text-white">
                                <label htmlFor="checkAllsub" className="d-flex">
                                  <input
                                    type="checkbox"
                                    className="me-2"
                                    id="checkAllsub"
                                    checked={
                                      selectedSubIds.length === subCategories.length &&
                                      subCategories.length > 0
                                    }
                                    onChange={handleCheckAll}
                                  />
                                  Check All
                                </label>
                              </div>

                              {/* SUB CATEGORIES */}
                              {subCategories
                                .filter((sub) =>
                                  sub.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                                )
                                .map((sub) => (
                                  <div key={sub.id} className="subcate mb-3">
                                    <div className="border p-2 rounded bg-white">
                                      <label htmlFor={`itemtype_${sub.id}`}>
                                        <input
                                          type="checkbox"
                                          className="me-2"
                                          id={`itemtype_${sub.id}`}
                                          checked={selectedSubIds.includes(sub.id)}
                                          onChange={() => handleSubCheck(sub.id)}
                                        />
                                        {sub.name}
                                      </label>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {/* <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button> */}
                <button className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setIsModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="container">
            {user.is_seller == 1 &&
              <div className="card mb-4">
                <div className="card-body">
                  <StepProgress />
                </div>
              </div>
            }

            <div className="row">
              {sellerMessage && (
                <div className="col-sm-12">
                  <div className="card mb-4 border border-danger">
                    <div className="card-body text-center">
                      <div className="me-3">
                        <i className="bx bx-message-dots text-danger display-6" />
                      </div>
                      <h4 className="card-title text-danger">
                        Your profile has been declined reason.
                      </h4>
                      <div className="card-text" dangerouslySetInnerHTML={{ __html: sellerMessage }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="col-md-4 col-sm-6 col-12">
                <div className="card radius-10 border-start border-0 border-3 border-danger">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">Total My Open Enquiry (created)</p>
                        <h4 className="my-1">{openEnquiryCountData}</h4>
                      </div>
                      <div className="widgets-icons-2 rounded-circle bg-gradient-bloody text-white ms-auto">
                        <i className="bx bxs-group"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {renderBuyerInterestForm()}
            {user.is_seller == 0 &&
              <div className="card mt-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-12">
                      <DataTable
                        columns={[
                          { key: "id", label: "S.No.", sortable: true },
                          { key: "enquiry_number", label: "Enquiry No", sortable: true },
                          { key: "name", label: "Receiver", sortable: true },
                          { key: "product_name", label: "Product", sortable: true },

                          { key: "quantity", label: "Quantity", sortable: true },
                          { key: "created_at", label: "Created", sortable: true },
                          { key: "status", label: "Status", sortable: false },
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
                            <td><Link to={`/lead-detail/${row.enquiry_number}?my-enquiry=true`}>{row.enquiry_number}</Link></td>
                            <td>{row.from_user?.full_name}<br />
                              {row.from_user?.email}
                            </td>
                            <td>{row.enquiry_users[0].product_name}</td>

                            <td>{row.quantity}</td>
                            <td>{formatDateTime(row.created_at)}</td>
                            <td>{row.enquiry_users &&
                              row.enquiry_users[0].enquiry_status == 1 ? (<span className="badge bg-success">Open</span>) :
                              row.enquiry_users[0].enquiry_status == 2 ? (<span className="badge bg-danger">Closed</span>) :
                                row.enquiry_users[0].enquiry_status == 3 ? (<span className="badge bg-danger">Closed</span>) :
                                  (<span className="badge bg-soft-warning text-warning">Pending</span>)}</td>
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
            }
            <CommonSection />

          </div>
        </div>
      </div>
      {user.is_seller == 0 &&
        <LeadsModals
          showDeleteModal={showDeleteModal}
          closeDeleteModal={closeDeleteModal}
          handleDeleteConfirm={handleDeleteConfirm}
        />
      }
    </>
  );
};

export default Dashboard;