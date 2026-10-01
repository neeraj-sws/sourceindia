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

const SellerLeadHistory = () => {
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

  const outcomeTime = (row) => {
    const map = {
      1: row.viewed_at,
      2: row.responded_at,
      3: row.accepted_at,
      4: row.rejected_at,
      5: row.auto_cancelled_at,
      6: row.completed_at,
    };
    return map[row.status] || null;
  };

  const slaMinutes = data.find((r) => r && r.sla_minutes != null)?.sla_minutes ?? null;

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/buyer-requirements/seller/history`, {
        params: { page, limit, search, status: status || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem("user_token")}` },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
    } catch (err) {
      console.error("Error fetching lead history", err);
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
          <div className="d-flex flex-wrap align-items-center gap-2">
            <h4 className="mb-3">Lead History</h4>
            {slaMinutes ? (
              <span className="badge bg-light text-dark border" title="A response is counted as on time when it is sent within this many minutes of the lead being assigned.">
                SLA: {slaMinutes} min
              </span>
            ) : null}
          </div>

          <div className="card">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-3">
                  <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    {Object.entries(statusMap)
                      .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "assignment_number", label: "Lead No", sortable: true },
                  { key: "product", label: "Product", sortable: false },
                  { key: "category", label: "Category", sortable: false },
                  { key: "buyer", label: "Buyer", sortable: false },
                  { key: "location", label: "Location", sortable: false },
                  { key: "quantity", label: "Quantity", sortable: false },
                  { key: "assigned_at", label: "Assigned", sortable: true },
                  { key: "response", label: "Response", sortable: false },
                  { key: "status", label: "Status", sortable: false },
                  { key: "outcome", label: "Outcome Date", sortable: false },
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
                  const out = outcomeTime(row);
                  return (
                    <tr key={row.id}>
                      <td>{row.assignment_number}</td>
                      <td>{row.requirement?.product_name_snapshot}</td>
                      <td>{row.requirement?.itemSubCategory?.name || row.requirement?.itemCategory?.name || row.requirement?.subCategory?.name || row.requirement?.category?.name || "-"}</td>
                      <td>{row.requirement?.buyer_name || row.requirement?.buyer_email || row.requirement?.buyer_company || "-"}</td>
                      <td>{row.requirement?.buyer_city || "-"}{row.requirement?.buyer_state ? <div className="text-muted small">{row.requirement.buyer_state}</div> : null}</td>
                      <td>{row.requirement?.quantity || "-"}{row.requirement?.quantity_unit ? ` ${row.requirement.quantity_unit}` : ""}</td>
                      <td>{formatDateTime(row.assigned_at)}</td>
                      <td>
                        {row.is_on_time === true ? (
                          <span className="badge bg-success">On Time{row.response_time_minutes != null ? ` · ${row.response_time_minutes} min` : ""}</span>
                        ) : row.is_on_time === false ? (
                          <span className="badge bg-warning text-dark">Late{row.response_time_minutes != null ? ` · ${row.response_time_minutes} min` : ""}</span>
                        ) : row.status === 4 ? (
                          <span className="badge bg-secondary" title={`Responded in ${row.response_time_minutes ?? "-"} min`}>Rejected</span>
                        ) : row.status === 5 ? (
                          <span className="badge bg-dark">No Action</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td><span className={`badge ${st.class}`}>{st.label}</span></td>
                      <td>{out ? formatDateTime(out) : "-"}</td>
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

export default SellerLeadHistory;