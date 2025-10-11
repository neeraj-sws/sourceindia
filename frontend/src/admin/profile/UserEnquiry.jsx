import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../config";
import DataTable from "../common/DataTable";

const UserEnquiry = ({ user_id }) => {
  const { sellerId } = useParams();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/enquiries/server-side`, {
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
        { key: "enquiry_number", label: "Enquiries (created) No", sortable: true },
        { key: "from_full_name", label: "Name", sortable: true },
        { key: "enquiry_product", label: "Product Name", sortable: true },
        { key: "to_organization_name", label: "Company Name", sortable: true },
        { key: "category_name", label: "Category", sortable: true },
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
            <td><Link to={`/admin/admin-view-enquiry/${row.enquiry_number}`}>{row.enquiry_number}</Link></td>
            <td>{row.from_full_name}<br />{row.from_email}</td>
            <td>{row.enquiry_product}</td>
            <td>{row.to_organization_name}</td>
            <td>{row.category_name}</td>
        </tr>
      )}
    />
  );
};

export default UserEnquiry;