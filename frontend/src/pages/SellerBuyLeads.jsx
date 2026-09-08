import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useAuth from "../sections/UseAuth";
import API_BASE_URL from "../config";
import { formatDateTime } from "../utils/formatDate";

const DataTable = lazy(() => import("../admin/common/DataTable"));

const statusMap = {
  0: { label: "Assigned", class: "bg-secondary" },
  1: { label: "Viewed", class: "bg-info" },
  2: { label: "Responded", class: "bg-primary" },
  3: { label: "Accepted", class: "bg-success" },
  4: { label: "Rejected", class: "bg-danger" },
  5: { label: "Auto Cancelled", class: "bg-dark" },
  6: { label: "Completed", class: "bg-success" },
};

const SellerBuyLeads = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const getRangeText = () => {
    if (totalRecords === 0) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);
    return `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/buyer-requirements/seller/leads`, {
        params: { page, limit, search, status: status || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
    } catch (err) {
      console.error("Error fetching buy leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/seller/lead-counts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setCounts(res.data);
    } catch (err) {
      console.error("Error fetching counts", err);
    }
  };

  useEffect(() => { fetchCounts(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, limit, search, status, user]);

  if (loading || !user) return <p>Loading...</p>;

  const statCards = [
    { label: "Total Leads", value: counts?.total || 0, icon: "bx bx-list-ul", cls: "primary" },
    { label: "New", value: counts?.assigned || 0, icon: "bx bx-time-five", cls: "warning" },
    { label: "Accepted", value: counts?.accepted || 0, icon: "bx bx-check-double", cls: "success" },
    { label: "Rejected", value: counts?.rejected || 0, icon: "bx bx-x-circle", cls: "danger" },
    { label: "Monthly Used", value: `${counts?.monthly_used || 0}/${counts?.monthly_limit || "-"}`, icon: "bx bx-calendar-check", cls: "info" },
  ];

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <h4 className="mb-3">Buy Leads</h4>

          <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5">
            {statCards.map((s, i) => (
              <div className="col mb-3" key={i}>
                <div className="card radius-2 overflow-hidden position-relative h-100 card-border">
                  <div className="card-body ps-4 py-4">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-2">{s.label}</p>
                        <h2 className="mb-0">{s.value}</h2>
                      </div>
                      <div className={`ms-auto dashicon avatar avatar-md rounded-circle bg-soft-${s.cls} border border-${s.cls} text-${s.cls}`}>
                        <i className={s.icon}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "assignment_number", label: "Lead No", sortable: true },
                  { key: "product", label: "Product", sortable: false },
                  { key: "category", label: "Category", sortable: false },
                  { key: "buyer", label: "Buyer", sortable: false },
                  { key: "location", label: "Location", sortable: false },
                  { key: "quantity", label: "Quantity", sortable: false },
                  { key: "assigned_at", label: "Assigned", sortable: true },
                  { key: "status", label: "Status", sortable: false },
                  { key: "action", label: "Action", sortable: false },
                ]}
                data={data}
                loading={isLoading}
                page={page}
                totalRecords={totalRecords}
                filteredRecords={totalRecords}
                limit={limit}
                sortBy="assigned_at"
                sortDirection="DESC"
                onPageChange={(p) => setPage(p)}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                search={search}
                onLimitChange={(val) => { setLimit(val); setPage(1); }}
                getRangeText={getRangeText}
                renderRow={(row) => {
                  const st = statusMap[row.status] || { label: "Unknown", class: "bg-secondary" };
                  return (
                    <tr key={row.id}>
                      <td>{row.assignment_number}</td>
                      <td>{row.requirement?.product_name_snapshot}</td>
                      <td>{row.requirement?.itemSubCategory?.name || row.requirement?.itemCategory?.name || row.requirement?.subCategory?.name || row.requirement?.category?.name || "-"}</td>
                      <td>{row.requirement?.buyer_name || row.requirement?.buyer_email || row.requirement?.buyer_company || "-"}</td>
                      <td>{row.requirement?.buyer_city || "-"}{row.requirement?.buyer_state ? <div className="text-muted small">{row.requirement.buyer_state}</div> : null}</td>
                      <td>{row.requirement?.quantity || "-"}{row.requirement?.quantity_unit ? ` ${row.requirement.quantity_unit}` : ""}</td>
                      <td>{formatDateTime(row.assigned_at)}</td>
                      <td><span className={`badge ${st.class}`}>{st.label}</span></td>
                      <td>
                        <Link className="btn btn-sm btn-primary" to={`/buy-lead-detail/${row.id}`}>View</Link>
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default SellerBuyLeads;
