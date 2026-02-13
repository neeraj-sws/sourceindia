import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../config";
import DataTable from "../common/DataTable";
import { formatDateTime } from "../../utils/formatDate";

const listStatus = ["Pending", "Open", "Resolved", "Cancel"];

const DashboardTicketList = ({ limit: defaultLimit = 10 }) => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/tickets/server-side`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit,
            search,
            sortBy,
            sort: sortDirection,
          },
        }
      );

      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search, sortBy, sortDirection]);

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortDirection("ASC");
    }
  };

  const getRangeText = () => {
  if (filteredRecords === 0) {
    return "Showing 0 to 0 of 0 entries";
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, filteredRecords);

  return `Showing ${start} to ${end} of ${filteredRecords} entries`;
};

  return (
    <DataTable
      columns={[
        { key: "id", label: "S.No.", sortable: true },
        { key: "ticket_id", label: "Ticket ID", sortable: true },
        { key: "title", label: "Title", sortable: true },
        { key: "full_name", label: "Created By", sortable: true },
        { key: "last_reply_date", label: "Last Reply", sortable: true },
        { key: "priority", label: "Priority", sortable: true },
        { key: "category_name", label: "Category", sortable: true },
        { key: "status", label: "Status", sortable: false },
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
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      search={search}
      onLimitChange={(val) => {
        setLimit(val);
        setPage(1);
      }}
      getRangeText={getRangeText}
      renderRow={(row, index) => (
        <tr key={row.id}>
          <td>{(page - 1) * limit + index + 1}</td>
          <td>
            <Link to={`/admin/ticket/view/${row.id}`}>
              {row.ticket_id}
            </Link>
          </td>
          <td>{row.title}</td>
          <td>{row.full_name}</td>
          <td>{formatDateTime(row.last_reply_date)}</td>
          <td>{row.priority}</td>
          <td>
            <span className="badge bg-info">{row.category_name}</span>
          </td>
          <td>
            <span
              className={`badge ${
                row.status == 0
                  ? "bg-warning"
                  : row.status == 1
                  ? "bg-primary"
                  : row.status == 2
                  ? "bg-success"
                  : "bg-danger"
              }`}
            >
              {listStatus[row.status]}
            </span>
          </td>
        </tr>
      )}
    />
  );
};

export default DashboardTicketList;
