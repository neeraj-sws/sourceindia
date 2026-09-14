import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { formatDateTime } from "../utils/formatDate";
import { Link } from "react-router-dom";

const DataTable = lazy(() => import("../admin/common/DataTable"));

const reqStatusMap = {
  1: { label: "Assigned", class: "warning" },
  2: { label: "Accepted", class: "success" },
  3: { label: "Completed", class: "success" },
  4: { label: "Closed", class: "dark" },
  5: { label: "No Seller Found", class: "danger" },
  6: { label: "Product Not Available", class: "danger" },
};

const MyBuyRequirements = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
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
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/my`, {
        params: { page, limit, search },
      });
      setData(res.data.data);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching my requirements", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="page-wrapper">
        <div className="page-content">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">My Buy Requirements</h4>
            <Link className="btn btn-primary" to="/post-buy-requirement">+ New Requirement</Link>
          </div>
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "ID", sortable: true },
                  { key: "product", label: "Product", sortable: false },
                  { key: "category", label: "Category", sortable: false },
                  { key: "quantity", label: "Quantity", sortable: false },
                  { key: "created_at", label: "Posted", sortable: true },
                  { key: "status", label: "Status", sortable: false },
                  { key: "assignments", label: "Assigned Sellers", sortable: false },
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
                  const sellers = (row.assignments || []).filter(a => a.status === 3);
                  return (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.product_name_snapshot}</td>
                      <td>{row.category?.name || "-"}</td>
                      <td>{row.quantity || "-"}{row.quantity_unit ? ` ${row.quantity_unit}` : ""}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                      <td><span className={`badge bg-${st.class}`}>{st.label}</span></td>
                      <td>
                        {sellers.length
                          ? sellers.map(s => s.seller ? <div key={s.id}>{s.seller.fname} {s.seller.lname} {s.seller.company_info?.organization_name ? `(${s.seller.company_info.organization_name})` : ""}</div> : null)
                          : (row.assignments?.length || 0) > 0 ? `${row.assignments.length} assigned` : "None"}
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

export default MyBuyRequirements;
