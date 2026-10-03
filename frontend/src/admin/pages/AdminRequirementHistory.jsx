import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { formatDateTime } from "../../utils/formatDate";

const reqStatusMap = {
  0: { label: "Pending", class: "warning" },
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const assignStatusMap = {
  0: { label: "Assigned", class: "warning" },
  1: { label: "Viewed", class: "info" },
  2: { label: "Responded", class: "primary" },
  3: { label: "Accepted", class: "success" },
  4: { label: "Rejected", class: "danger" },
  5: { label: "Auto Cancelled", class: "dark" },
  6: { label: "Completed", class: "success" },
};

const sellerLocationNote = (seller, row) => {
  if (!seller || (!seller.city && !seller.state)) return "";
  const pref = row.supplier_preference || "";
  const sellerCity = (seller.city || "").toLowerCase();
  const sellerState = (seller.state || "").toLowerCase();
  const buyerCity = (row.buyer_city || "").toLowerCase();
  const buyerState = (row.buyer_state || "").toLowerCase();
  if (pref === "Within My City" && buyerCity && sellerCity && sellerCity !== buyerCity) {
    return `Same-city requirement (${row.buyer_city}) - no seller found in ${row.buyer_city}, assigned nearest seller from ${seller.city}.`;
  }
  if (pref === "Within My State" && buyerState && sellerState && sellerState !== buyerState) {
    return `Same-state requirement (${row.buyer_state}) - no seller found in ${row.buyer_state}, assigned nearest seller from ${seller.state}.`;
  }
  return "";
};

export function AdminRequirementHistory() {
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
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buyer-requirements/history`, {
        params: { page, limit, search, status: status || undefined },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, status]);

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Requirement History" maincount={totalRecords} page="Post Buy Requirement" title="Requirement History" />

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
                { key: "buyer", label: "Requested by", sortable: false },
                { key: "city", label: "City", sortable: false },
                { key: "created_at", label: "Posted", sortable: true },
                { key: "status", label: "Status", sortable: false },
                // { key: "sellers", label: "Assigned Sellers", sortable: false },
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
                const st = reqStatusMap[row.status] || { label: `Status ${row.status}`, class: "secondary" };
                const buyerName = row.buyer_name || row.buyer_email || row.buyer_company || "-";
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <div className="text-capitalize">{row.product_name_snapshot}</div>
                      {row.category?.name ? <div className="text-muted small text-capitalize">{row.category.name}</div> : null}
                      {row.quantity ? <div className="text-muted small">Qty: {row.quantity}{row.quantity_unit || ""}</div> : null}
                    </td>
                    <td>
                      <span className="text-capitalize">{buyerName}</span>
                      {buyerName === "-" ? <span className="badge bg-warning ms-1 text-capitalize">Guest</span> : null}
                      {row.buyer_email ? <div className="text-muted small ">{row.buyer_email}</div> : null}
                      {row.buyer_company ? <div className="text-muted small">{row.buyer_company}</div> : null}
                    </td>
                    <td>{[row.buyer_city, row.buyer_state].filter(Boolean).join(", ") || "-"}</td>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td><span className={`badge bg-${st.class}`}>{st.label}</span></td>
                    {/* <td>
                      {row.assignments?.length ? row.assignments.map((a) => {
                        const ast = assignStatusMap[a.status] || { label: `Status ${a.status}`, class: "secondary" };
                        const sname = a.seller
                          ? `${a.seller.fname || ""} ${a.seller.lname || ""}`.trim()
                          : "-";
                        const note = sellerLocationNote(a.seller, row);
                        return (
                          <div key={a.id} className="mb-1">
                            <span>{sname}</span>
                            {a.seller?.company_info?.organization_name
                              ? <div className="text-muted small">{a.seller.company_info.organization_name}</div>
                              : null}
                            <span className={`badge bg-${ast.class} ms-1`}>{ast.label}</span>
                            {a.seller?.city ? <span className="text-muted small ms-1">({a.seller.city})</span> : null}
                            {a.product_match_score ? <span className="text-muted small ms-1">match {a.product_match_score}</span> : null}
                            {note ? <div className="text-warning small">{note}</div> : null}
                            {a.reassignment_reason ? <div className="text-muted small">{a.reassignment_reason}</div> : null}
                          </div>
                        );
                      }) : <span className="text-muted">-</span>}
                    </td> */}
                    <td>
                      <Link className="btn btn-sm btn-primary" to={`/admin/buy-requirements/${row.id}`}>View</Link>
                    </td>
                  </tr>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRequirementHistory;