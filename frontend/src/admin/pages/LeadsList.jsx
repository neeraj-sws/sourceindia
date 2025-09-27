import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";

const LeadsList = ({ getPublic, getApprove, viewType }) => {
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
        params: {
          page, limit, search, sortBy, sort: sortDirection,
          getPublic: getPublic ? 'true' : 'false', getApprove: getApprove ? 'true' : 'false', viewType: 'leads'
        },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, getPublic, getApprove, viewType]);

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
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb mainhead="Leads" maincount={totalRecords} page="" title={getPublic ? "Public Enquiries" : getApprove ? "Approve Leads" : "Leads"} />
          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "enquiry_number", label: "Lead Number", sortable: true },
                  { key: "from_full_name", label: "Name", sortable: true },
                  { key: "to_organization_name", label: "To", sortable: true },
                  { key: "from_organization_name", label: "From", sortable: true },
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
                    <td>{row.to_organization_name}<br />{row.to_full_name}<br />{row.to_email}<br />{row.to_mobile}</td>
                    <td>{row.from_organization_name}<br />{row.from_full_name}<br />{row.from_email}<br />{row.from_mobile}</td>
                    <td>{row.category_name}</td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadsList;