import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { formatDateTime } from '../../utils/formatDate';

const TotalRegisterSellers = () => {
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [todayOnly, setTodayOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sellers/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, todayOnly: todayOnly ? 'true' : undefined, },
      });
      setData(response.data.data);
      setTotalRecords(response.data.totalRecords);
      setFilteredRecords(response.data.filteredRecords);
      setTodayOnly(true)
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, todayOnly]);

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
      <h6 className="mb-0 text-uppercase">Today Register Seller</h6>
      <hr />
      <div className="card">
        <div className="card-body">
          <DataTable
            columns={[
              { key: "id", label: "S.No.", sortable: true },
              { key: "organization_name", label: "Company", sortable: true },
              { key: "coreactivity_name", label: "Coreactivity / Category / Segment / Sub Segment", sortable: true },
              { key: "designation", label: "Designation / Website / Quality Certification", sortable: true },
              { key: "created_at", label: "Created At", sortable: true },
              { key: "updated_at", label: "Updated At", sortable: true },
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
                <td>{row.organization_name && (<><strong><a href={`/companies/${row.organization_slug}`} target="_blank">{row.organization_name}</a></strong><br /></>)}
                      {row.elcina_member == 1 ? (<><span className="badge bg-primary mb-1 text-uppercase">Elcina Member</span><br /></>) :
                      row.elcina_member == 2 ? (<><span className="badge bg-primary mb-1 text-uppercase">Trial</span><br /></>) : "" }
                      {row.is_trading == 1 && (<><span className="badge bg-success mb-1">Trader</span><br /></>)}
                      {row.full_name && (<><i className="bx bx-user me-1" />{row.full_name}<br /></>)}
                      {row.email && (<><i className="bx bx-user me-1" />{row.email}<br /></>)}
                      {row.mobile && (<><i className="bx bx-mobile me-1" />{row.mobile}<br /></>)}
                      {row.state_name && (<><i className="bx bx-map me-1" />{row.state_name}<br /></>)}
                      {row.city_name && (<><i className="bx bx-map me-1" />{row.city_name}<br /></>)}</td>
                <td>{row.coreactivity_name}<br />{row.activity_name}<br />{row.category_name}<br />{row.sub_category_name}</td>
                <td>
                      {row.designation && (<>{row.designation}<br /></>)}
                      {row.company_website && (<>{row.company_website}<br /></>)}
                      {row.organization_quality_certification && row.organization_quality_certification}
                    </td>
                <td>{formatDateTime(row.created_at)}</td>
                <td>{formatDateTime(row.updated_at)}</td>
              </tr>
            )}
          />
        </div>
      </div>
      </>
  );
};

export default TotalRegisterSellers;