import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../config";
import DataTable from "../common/DataTable";
import { formatDateTime } from "../../utils/formatDate";

const UserOpenLeads = ({ user_id }) => {
  const { sellerId } = useParams();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/open_enquiries/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, user_id: sellerId },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, user_id]);

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
    <DataTable
      columns={[
        { key: "id", label: "S.No.", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "title", label: "Title", sortable: true },
        { key: "description", label: "Description", sortable: true },
        { key: "created_at", label: "Created At", sortable: true },
        { key: "updated_at", label: "Updated At", sortable: true },
        { key: "is_home", label: "Show Home", sortable: false },
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
            <td>{(page - 1) * limit + index + 1}</td>
            <td>{row.name}<br />{row.email}</td>
            <td>{row.title}</td>
            <td>{row.description}</td>
            <td>{formatDateTime(row.created_at)}</td>
            <td>{formatDateTime(row.updated_at)}</td>
            <td>{row.is_home == 1 ? "Yes" : "No"}</td>
        </tr>
      )}
    />
  );
};

export default UserOpenLeads;