import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { formatDateTime } from "../../utils/formatDate";

const CategoryConflictLogs = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const excelExportRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/category_conflict_logs/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection },
      });
      setData(response.data.data || []);
      setTotalRecords(response.data.totalRecords || 0);
      setFilteredRecords(response.data.filteredRecords || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection]);

  const getRangeText = () => {
    if (!filteredRecords) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return `Showing ${start} to ${end} of ${search.trim() ? filteredRecords : totalRecords} entries`;
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb mainhead="Logs" maincount={totalRecords} page="Category Master" title="Conflict Logs" />
        <div className="card">
          <div className="card-body">
            <DataTable
              columns={[
                { key: "id", label: "S.No.", sortable: true },
                { key: "source_module", label: "Source Module", sortable: true },
                { key: "conflict_module", label: "Conflict Module", sortable: true },
                { key: "conflict_flow", label: "Flow", sortable: true },
                { key: "conflict_name", label: "Name", sortable: true },
                { key: "created_at", label: "Created At", sortable: true },
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
                else { setSortBy(column); setSortDirection("ASC"); }
              }}
              onSearchChange={(val) => { setSearch(val); setPage(1); }}
              search={search}
              onLimitChange={(val) => { setLimit(val); setPage(1); }}
              getRangeText={getRangeText}
              renderRow={(row, index) => (
                <tr key={row.id}>
                  <td>{(page - 1) * limit + index + 1}</td>
                  <td>{row.source_module}</td>
                  <td>{row.conflict_module}</td>
                  <td>{row.conflict_flow}</td>
                  <td>{row.conflict_name}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryConflictLogs;
