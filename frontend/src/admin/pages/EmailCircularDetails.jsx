import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom'
import axios from "axios";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import Breadcrumb from '../common/Breadcrumb';

const EmailCircularDetails = ({newsLatter_id}) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const { newsletterId } = useParams();
  const [counts, setCounts] = useState({all: 0, mailSent: 0, mailUnSent: 0, mailOpen: 0, mailNotOpen: 0});
  const [formData, setFormData] = useState({ user_type: '', title: '', subject: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/newsletter_histories/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection, newsLatter_id: newsletterId },
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

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection, newsLatter_id]);

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

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/newsletters/${newsletterId}`);
        const data = res.data;
        setFormData({
          user_type: data.user_type || '',
          title: data.title || '',
          subject: data.subject || '',
          description: data.description || '',
          images: data.images || [],
        });
      } catch (error) {
        console.error('Error fetching Newsletter:', error);
      }
    };
    fetchNewsletter();
  }, [newsletterId]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (!newsletterId) return;
        const countData = await axios.get(`${API_BASE_URL}/newsletter_histories/count`, {
          params: { newsLatter_id: newsletterId }
        });
        setCounts({
          all: countData.data.all,
          mailSent: countData.data.mailSent,
          mailUnSent: countData.data.mailUnSent,
          mailOpen: countData.data.mailOpen,
          mailNotOpen: countData.data.mailNotOpen,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchCounts(newsletterId);
  }, []);

  const stats = [
    { label: "All Users", colorClass: "success", value: counts?.all, icon: "bx bxs-user" },
    { label: "Sent Mail", colorClass: "info", value: counts?.mailSent, icon: "bx bx-mail-send" },
    { label: "Un Sent Mail", colorClass: "danger", value: counts?.mailUnSent, icon: "bx bx-mail-send" },
    { label: "Open Mail", colorClass: "warning", value: counts?.mailOpen, icon: "bx bx-mail-send" },
    { label: "Not Open Mail", colorClass: "warning", value: counts?.mailNotOpen, icon: "bx bx-mail-send" },
  ]

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Email Circular Details" add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
          <div className="card mb-3">
            <div className="card-body">
              <h2>{formData.subject}</h2>
              <div dangerouslySetInnerHTML={{ __html: formData.description }} />
            </div>
          </div>

          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
            {stats.map((stat, index) => (
              <div className="col" key={index}>
                <div className="card radius-10 mb-3">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div>
                        <p className="mb-0 text-secondary">{stat.label}</p>
                        <h4 className="my-1">{stat.value}</h4>
                      </div>
                      <div className={`widgets-icons bg-light-${stat.colorClass} text-${stat.colorClass} ms-auto`}>
                        <i className={stat.icon} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DataTable
            columns={[
              { key: "id", label: "S.No.", sortable: true },
              { key: "user_name", label: "User Name", sortable: true },
              { key: "is_mail", label: "User Type", sortable: false },
              { key: "email_view_count", label: "Is Mail Open", sortable: false },
              { key: "action", label: "Action", sortable: false },
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
                <td><Link to={`/admin/${row.user_is_seller==1 ? 'seller' : 'buyer'}/user-profile/${row.user_id}`}>{row.user_name}</Link></td>
                <td>{row.is_mail && row.is_mail == 1 ? (<span className="badge bg-success">Yes</span>) : (<span className="badge bg-danger">No</span>)}</td>
                <td>{row.email_view_count && row.email_view_count == 1 ? (<span className="badge bg-success">Yes</span>) : (<span className="badge bg-danger">No</span>)}</td>
                <td><button className="btn btn-primary btn-sm btn-sm">Resend</button></td>
              </tr>
            )}
          />
        </div>
      </div>
    </>
  )
}

export default EmailCircularDetails