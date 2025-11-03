import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { formatDateTime } from './../utils/formatDate';
import StepProgress from "./StepProgress";
import UseAuth from "../sections/UseAuth";
import DataTable from "../admin/common/DataTable";
import LeadsModals from "../admin/pages/modal/LeadsModals";

const Dashboard = () => {
  const { showNotification } = useAlert();
  const { user, updateUser, loading } = UseAuth(); // Assuming UseAuth now provides loading
  const navigate = useNavigate();
  const [todayRegisterSeller, setTodayRegisterSeller] = useState(0);
  const [openEnquiryCountData, setOpenEnquiryCountData] = useState(0);
  const [error, setError] = useState(null);
  const [interestData, setInterestData] = useState({ categories: [], subCategories: {} });
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
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [enquiriesToDelete, setEnquiriesToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

        const openEnquiryCountResponse = await axios.get(`${API_BASE_URL}/open_enquiries/count/${user.id}`);
        setOpenEnquiryCountData(openEnquiryCountResponse.data.totalOpenEnquiries);

        if (user.is_intrest === 0 && user.is_seller === 0) {
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
    if (!token || !user || !user.id) {
      showNotification("User not authenticated", "error");
      return;
    }

    if (!formData.activity || Object.keys(formData.activity).length === 0) {
      showNotification("At least one activity is required", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/store-buyer-interest`,
        { ...formData, userId: user.id },
        { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } }
      );

      if (response.data.success) {
        showNotification("Interest Added Successfully", "success");
        if (updateUser) {
          updateUser({ ...user, is_intrest: 1 });
        }
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error submitting interest:", error.response?.data || error.message);
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

  const renderBuyerInterestForm = () => {
    if (!isModalOpen) return null;

    return (
      <div className="modal" style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
        <div className="modal-dialog" style={{ maxWidth: "800px", margin: "50px auto" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Buyer Sourcing Interest</h4>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4">
                  <h5>MECHANICAL</h5>
                  {interestData.subCategories[1]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[1]`}
                        checked={formData.activity[1]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(1, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
                <div className="col-md-4">
                  <h5>ELECTRO-MECHANICAL</h5>
                  {interestData.subCategories[2]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[2]`}
                        checked={formData.activity[2]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(2, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
                <div className="col-md-4">
                  <h5>ELECTRONICS</h5>
                  {interestData.subCategories[3]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[3]`}
                        checked={formData.activity[3]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(3, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
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
              </div>}

            <div className="row">
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
                          { key: "name", label: "Name", sortable: true },
                          { key: "product_name", label: "Product Name", sortable: true },
                          { key: "category_name", label: "Category", sortable: true },
                          { key: "sub_category_name", label: "Sub Category", sortable: true },
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

                            <td>{row.category_name}</td>
                            <td>{row.sub_category_name}</td>
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