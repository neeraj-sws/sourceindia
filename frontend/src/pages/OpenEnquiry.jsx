import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "./../config";
import DataTable from "../admin/common/DataTable";
import { formatDateTime } from "./../utils/formatDate";
import UseAuth from '../sections/UseAuth';

const EnquiryTable = ({ showAll = false }) => {
  const navigate = useNavigate();
  const { user, loading } = UseAuth();

  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const params = {
        page,
        limit,
        search,
        sortBy,
        sort: sortDirection,
      };

      // If not showing all, filter by user
      if (!showAll) {
        params.user_id = user.id;
      }

      const response = await axios.get(`${API_BASE_URL}/open_enquiries/server-side`, { params });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search, sortBy, sortDirection, user]);

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
      return search.trim()
        ? `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`
        : "Showing 0 to 0 of 0 entries";
    }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);

    return search.trim()
      ? `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`
      : `Showing ${start} to ${end} of ${totalRecords} entries`;
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <DataTable
              columns={[
                { key: "id", label: "S.No.", sortable: true },
                { key: "name", label: "Name", sortable: true },
                { key: "title", label: "Title", sortable: true },
                { key: "description", label: "Description", sortable: true },
                { key: "created_at", label: "Created At", sortable: true },
                { key: "updated_at", label: "Updated At", sortable: true },
                { key: "is_home", label: "Show Home", sortable: false },
                { key: "action", label: "Action", sortable: false },
              ]}
              data={data}
              loading={isLoading}
              page={page}
              totalRecords={totalRecords}
              filteredRecords={filteredRecords}
              limit={limit}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onPageChange={setPage}
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
                  <td>{row.name}<br />{row.email}</td>
                  <td>{row.title}</td>
                  <td>{row.description}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                  <td>{formatDateTime(row.updated_at)}</td>
                  <td>{row.is_home === 1 ? "Yes" : "No"}</td>
                  <td>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-light"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/Inbox/${row.id}`)}
                          >
                            <i className="bx bx-eye me-2"></i> View
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryTable;