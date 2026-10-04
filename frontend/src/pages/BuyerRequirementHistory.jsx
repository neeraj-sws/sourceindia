import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useAuth from "../sections/UseAuth";
import API_BASE_URL from "../config";
import { formatDateTime } from "../utils/formatDate";
import { renderAssignedSeller as ownerCell } from "../utils/assignedSeller";

const DataTable = lazy(() => import("../admin/common/DataTable"));

const reqStatusMap = {
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const BuyerRequirementHistory = () => {
  const { user, loading } = useAuth();
  const [data, setData] = useState([]);
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
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/buyer/history`, {
        params: { page, limit, search, status: status || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching requirement history", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, limit, search, status, user]);

  if (loading || !user) return <p>Loading...</p>;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <h4 className="mb-3">My Requirement History</h4>

          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3">
                  <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    {Object.entries(reqStatusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "id", label: "Req ID", sortable: true },
                  { key: "product", label: "Product", sortable: false },
                  { key: "category", label: "Category", sortable: false },
                  { key: "quantity", label: "Quantity", sortable: false },
                  { key: "created_at", label: "Posted", sortable: true },
                  { key: "status", label: "Status", sortable: false },
                  { key: "assignments", label: "Assigned Sellers", sortable: false },
                  { key: "action", label: "Action", sortable: false },
                ]}
                data={data}
                loading={isLoading}
                page={page}
                totalRecords={totalRecords}
                filteredRecords={totalRecords}
                limit={limit}
                sortBy="created_at"
                sortDirection="DESC"
                onPageChange={(p) => setPage(p)}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                search={search}
                onLimitChange={(val) => { setLimit(val); setPage(1); }}
                getRangeText={getRangeText}
                renderRow={(row) => {
                  const st = reqStatusMap[row.status] || { label: "Unknown", class: "secondary" };
                  return (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.product_name_snapshot}</td>
                      <td>{row.itemSubCategory?.name || row.itemCategory?.name || row.subCategory?.name || row.category?.name || "-"}</td>
                      <td>{row.quantity || "-"}{row.quantity_unit ? ` ${row.quantity_unit}` : ""}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                      <td><span className={`badge bg-${st.class}`}>{st.label}</span></td>
                      <td>{ownerCell(row)}</td>
                      <td>
                        <Link className="btn btn-sm btn-primary" to={`/my-buy-requirement-detail/${row.id}`}>View</Link>
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

export default BuyerRequirementHistory;
