import React, { useState, useEffect, useRef } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import dayjs from "dayjs";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import ExcelExport from "../common/ExcelExport";
import API_BASE_URL from "../../config";
import { formatDateTime } from '../../utils/formatDate';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const UserActivities = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [userStats, setUserStats] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [userActivityData, setUserActivityData] = useState([]);
  const excelExportRef = useRef();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/user_activity/count`)
      .then((res) => {
        setUserStats(res.data);
        setChartLoading(false);
      })
      .catch((err) => {
        console.error('API error:', err);
        setChartLoading(false);
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/user_activity/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection }
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

  useEffect(() => {
    axios.get(`${API_BASE_URL}/user_activity`).then((res) => {
      setUserActivityData(res.data);
    });
  }, []);

  const handleDownload = () => {
    if (excelExportRef.current) {
      excelExportRef.current.exportToExcel();
    }
  };

  if (chartLoading) {
    return <div>Loading chart...</div>;
  }

  if (!userStats) {
    return <div>Failed to load data.</div>;
  }

  const countData = {
    labels: ['Inactive', 'Active', 'Approved', 'Deleted'],
    datasets: [{
      data: [
        userStats.UserInactiveStatus,
        userStats.UserActiveStatus,
        userStats.UserApprove,
        userStats.UserDeleted
      ],
      backgroundColor: [
        getComputedStyle(document.documentElement).getPropertyValue('--bs-primary'), // Inactive
        getComputedStyle(document.documentElement).getPropertyValue('--bs-warning'), // Active
        getComputedStyle(document.documentElement).getPropertyValue('--bs-success'), // Approved
        getComputedStyle(document.documentElement).getPropertyValue('--bs-danger'),  // Deleted
      ],
      borderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

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

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="User Activities" maincount={totalRecords} page="Settings" title="User Activities" actions={
            <button className="btn btn-sm btn-primary mb-2 me-2" onClick={handleDownload}><i className="bx bx-download me-1" /> Excel</button>
          } />
          <div className="row mb-3">
            <div className="col-md-6">
              <div id="accordionCount">
                <div className="card">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center cursor-pointer"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseCount"
                    aria-expanded="true"
                    aria-controls="collapseCount">
                    <span className="fw-bolder">Count</span>
                    <i className='bx bx-chevron-down'></i>
                  </div>
                  <div id="collapseCount" className="collapse show" data-bs-parent="#accordionCount">
                    <div className="row p-3">
                      <div className="col-sm-6">
                        <div className="card radius-10 mb-3">
                          <div className="card-body bg-light shadow-sm rounded h-100">
                            <div className="d-flex align-items-center">
                              <div>
                                <p className="mb-0 text-secondary">Inactive</p>
                                <h4 className="my-1">{userStats.UserInactiveStatus}</h4>
                              </div>
                              <div className="widgets-icons bg-light-primary text-primary ms-auto">
                                <i className="bx bxs-user-x" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="card radius-10 mb-3">
                          <div className="card-body bg-light shadow-sm rounded">
                            <div className="d-flex align-items-center">
                              <div>
                                <p className="mb-0 text-secondary">Active</p>
                                <h4 className="my-1">{userStats.UserActiveStatus}</h4>
                              </div>
                              <div className="widgets-icons bg-light-warning text-warning ms-auto">
                                <i className="bx bxs-user-check" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="card radius-10 mb-3">
                          <div className="card-body bg-light shadow-sm rounded">
                            <div className="d-flex align-items-center">
                              <div>
                                <p className="mb-0 text-secondary">Approved</p>
                                <h4 className="my-1">{userStats.UserApprove}</h4>
                              </div>
                              <div className="widgets-icons bg-light-success text-success ms-auto">
                                <i className="bx bxs-user-plus" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="card radius-10 mb-3">
                          <div className="card-body bg-light shadow-sm rounded">
                            <div className="d-flex align-items-center">
                              <div>
                                <p className="mb-0 text-secondary">Deleted</p>
                                <h4 className="my-1">{userStats.UserDeleted}</h4>
                              </div>
                              <div className="widgets-icons bg-light-danger text-danger ms-auto">
                                <i className="bx bxs-trash" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div id="accordionChart">
                <div className="card">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center cursor-pointer h-100"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapseChart"
                    aria-expanded="true"
                    aria-controls="collapseChart">
                    <span className="fw-bolder">Pie Chart</span>
                    <i className='bx bx-chevron-down'></i>
                  </div>
                  <div id="collapseChart" className="collapse show" data-bs-parent="#accordionChart">
                    <div className="card-body text-center">
                      <div className="mb-3">
                        <span className="badge bg-primary me-2">Inactive: {userStats.UserInactiveStatus}</span>
                        <span className="badge bg-warning me-2">Active: {userStats.UserActiveStatus}</span>
                        <span className="badge bg-success me-2">Approved: {userStats.UserApprove}</span>
                        <span className="badge bg-danger">Deleted: {userStats.UserDeleted}</span>
                      </div>
                      <div style={{ maxWidth: '180px', margin: '0 auto' }}>
                        <Pie data={countData} options={options} />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "user_company_name", label: "Lead Number", sortable: true },
                  { key: "user_status", label: "Status", sortable: true },
                  { key: "user_is_seller", label: "Is Seller", sortable: true },
                  { key: "created_at", label: "Created At", sortable: true },
                  { key: "updated_at", label: "Updated At", sortable: true },
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
                    <td><Link to={`/admin/user-activity-details/${row.user_id}`}>{(page - 1) * limit + index + 1}</Link></td>
                    <td>{row.user_company_name && (<h6 className="username">{row.user_company_name}</h6>)}
                      {row.user_name && (<><i className='bx bx-user' /> {row.user_name}<br /></>)}
                      {row.user_email && (<><i className='bx bx-envelope' /> {row.user_email}<br /></>)}
                      {row.user_mobile && (<><i className='bx bx-mobile' /> {row.user_mobile}<br /></>)}
                    </td>
                    <td><span className="badge bg-primary">{row.user_status == 1 ? "Active" : row.user_status == 0 ? "Inactive" : ""}</span></td>
                    <td><span className="badge bg-primary">{row.user_is_seller == 1 ? "Seller" : row.user_is_seller == 0 ? "Buyer" : ""}</span></td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{formatDateTime(row.updated_at)}</td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <ExcelExport
        ref={excelExportRef}
        columnWidth={34.29}
        fileName="User Activity Export.xlsx"
        data={userActivityData}
        columns={[
          { label: "Organization Name", key: "company_name" },
          { label: "Fname", key: "user_fname" },
          { label: "Lname", key: "user_lname" },
          { label: "Email", key: "user_email" },
          { label: "Mobile", key: "user_mobile" },
          { label: "Is Seller", key: "user_type" },
          { label: "Created", key: "created_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
          { label: "Last Update", key: "updated_at", format: (val) => dayjs(val).format("YYYY-MM-DD hh:mm A") },
        ]}
      />
    </>
  );
};

export default UserActivities;