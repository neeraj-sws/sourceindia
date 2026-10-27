import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { formatDateTime } from "../../utils/formatDate";
import SearchLogEntriesModal from "./modal/SearchLogEntriesModal";

// Keyword Master > Search Logs: what customers searched on the products page, and which searches
// found nothing (add those as keywords or synonyms).
const SearchLogs = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("searches");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [zeroOnly, setZeroOnly] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [loggedInOnly, setLoggedInOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [entriesLog, setEntriesLog] = useState(null);
  const [error, setError] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const token = localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit, search, sortBy, sort: sortDirection, zero_only: zeroOnly ? "true" : "false", dateRange };
      if (loggedInOnly) params.logged_in_only = "true";
      if (selectedUserId) params.user_id = selectedUserId;
      const res = await axios.get(`${API_BASE_URL}/search_synonyms/logs/server-side`, {
        params,
      });
      setData(res.data.data || []);
      setTotalRecords(res.data.totalRecords || 0);
      setFilteredRecords(res.data.filteredRecords || 0);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error("Error fetching search logs:", err);
      setError("Could not load search logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortDirection, zeroOnly, dateRange, loggedInOnly, selectedUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/search_synonyms/logs/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching search log users:", err);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const getRangeText = () => {
    if (!filteredRecords) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return `Showing ${start} to ${end} of ${filteredRecords} entries`;
  };
const getUserName = (value) => {
  const text = String(value || "").trim();
  const name = text.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return name || text;
};
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Search Logs" maincount={totalRecords} page="Keyword Master" title="Search Logs" />

        <div className="row g-3 mb-3">
          {[
            { label: "Total searches", value: summary?.total_searches },
            { label: "Different search texts", value: summary?.distinct_queries },
            { label: "Searches with no result", value: summary?.zero_result_searches, danger: true },
            {
              label: "Total unique searchers",
              value: summary?.total_people,
              detail: `${summary?.unique_users ?? "-"} logged-in · ${summary?.unique_guests ?? "-"} guests`,
            },
          ].map((tile) => (
            <div className="col-12 col-sm-6 col-md-3 d-flex" key={tile.label}>
              <div className="card mb-0 h-100 w-100" title={tile.detail}>
                <div className="card-body py-3">
                  <div className="small text-muted">{tile.label}</div>
                  <div className={`fs-4 fw-bold ${tile.danger ? "text-danger" : ""}`}>{tile.value ?? "-"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
              <div className="form-check form-switch mb-0">
                <input
                  id="zeroOnly"
                  className="form-check-input"
                  type="checkbox"
                  checked={zeroOnly}
                  onChange={(e) => { setZeroOnly(e.target.checked); setPage(1); }}
                />
                <label htmlFor="zeroOnly" className="form-check-label">Only searches with no result</label>
              </div>
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 180 }}
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
              >
                <option value="">All time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="thismonth">This month</option>
              </select>
              <div className="form-check form-switch mb-0">
                <input
                  id="loggedInOnly"
                  className="form-check-input"
                  type="checkbox"
                  checked={loggedInOnly}
                  onChange={(e) => { setLoggedInOnly(e.target.checked); setPage(1); }}
                />
                <label htmlFor="loggedInOnly" className="form-check-label">Logged-in users only</label>
              </div>
              {/* <select
                className="form-select form-select-sm"
                style={{ maxWidth: 240 }}
                value={selectedUserId}
                onChange={(e) => { setSelectedUserId(e.target.value); setPage(1); }}
                aria-label="Filter by user"
              >
                <option value="">All users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name || user.email} {user.email ? `(${user.email})` : ""}</option>
                ))}
              </select> */}
              
              <span className="small text-muted">
                Searches with no result: add the text as a <Link to="/admin/product_keywords">Product Keyword</Link> or
                a <Link to="/admin/search_synonyms">Search Synonym</Link>.
              </span>
            </div>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
            <DataTable
              columns={[
                { key: "id", label: "S.No.", sortable: false },
                { key: "normalized_query", label: "Search text", sortable: true },
                { key: "searches", label: "Times searched", sortable: true },
                { key: "last_result_count", label: "Results", sortable: true },
                { key: "corrected", label: "Searched as", sortable: false },
                { key: "user", label: "User", sortable: false },
                { key: "last_searched", label: "Last searched", sortable: true },
                { key: "open", label: "Open", sortable: false },
              ]}
              data={data}
              loading={loading}
              page={page}
              totalRecords={totalRecords}
              filteredRecords={filteredRecords}
              limit={limit}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onPageChange={setPage}
              onSortChange={(column) => {
                if (sortBy === column) setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                else { setSortBy(column); setSortDirection("DESC"); }
              }}
              onSearchChange={(val) => { setSearch(val); setPage(1); }}
              search={search}
              onLimitChange={(val) => { setLimit(val); setPage(1); }}
              getRangeText={getRangeText}
              renderRow={(row, index) => (
                <tr key={row.normalized_query}>
                  <td>{(page - 1) * limit + index + 1}</td>
                  <td>{row.query}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-link p-0 align-baseline text-decoration-none"
                      onClick={() => setEntriesLog({ ...row, id: row.log_id ?? row.id })}
                      aria-label={`View search entries for ${row.query}`}
                    >
                      {row.searches}
                    </button>
                  </td>
                  <td>
                    {Number(row.max_result_count) === 0
                      ? <span className="badge bg-danger">No result</span>
                      : row.max_result_count}
                  </td>
                  <td className="small text-muted">{row.corrected_query || "-"}</td>
                  <td className="small">
                    {row.user_names
                      ? (
                        <>
                          {/* {row.user_names} */}
                          {getUserName(row.user_names)}
                          {Number(row.users_count) > 1 ? (
                            <span className="text-muted"> +{Number(row.users_count) - 1} more</span>
                          ) : null}
                        </>
                      )
                      : Number(row.entries_count) > 0 ? "Guest" : "-"}
                  </td>
                  <td className="small">{formatDateTime(row.last_searched)}</td>
                  <td>
                    <a href={`/products?search=${encodeURIComponent(row.query)}`} target="_blank" rel="noopener noreferrer">
                      Website <i className="bx bx-link-external small" />
                    </a>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
        {entriesLog && (
          <SearchLogEntriesModal
            searchLog={entriesLog}
            apiBase={API_BASE_URL}
            token={token}
            onClose={() => setEntriesLog(null)}
          />
        )}
      </div>
    </div>
  );
};

export default SearchLogs;
