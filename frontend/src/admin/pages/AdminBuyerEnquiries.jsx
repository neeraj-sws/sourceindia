import React, { useEffect, useState, lazy, Suspense } from 'react';
// Capitalize first letter utility
const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
import Select from 'react-select';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { Link } from 'react-router-dom';
import { formatDateTime } from "../../utils/formatDate";

const DataTable = lazy(() => import('../common/DataTable'));

const AdminBuyerEnquiries = () => {
    const [data, setData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDirection, setSortDirection] = useState('DESC');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);

    // ...existing code...

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = { page, limit, search, sortBy, sort: sortDirection };
            if (userFilter) params.user_id = userFilter;
            if (companyFilter) params.company = companyFilter;
            const response = await axios.get(`${API_BASE_URL}/buyerenquiry/admin`, { params });
            setData(response.data.data || []);
            setTotalRecords(response.data.totalRecords || response.data.filteredRecords || 0);
            setFilteredRecords(response.data.filteredRecords || 0);
        } catch (error) {
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFilters = async () => {
        // Fetch all users and companies for filter dropdowns
        const usersRes = await axios.get(`${API_BASE_URL}/users/all`);
        setUsers(usersRes.data || []);
        const companiesRes = await axios.get(`${API_BASE_URL}/companies/all`);
        setCompanies(companiesRes.data || []);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [page, limit, search, sortBy, sortDirection, userFilter, companyFilter]);

    useEffect(() => {
        fetchFilters();
    }, []);

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

    return (
        <Suspense fallback={<div>Loading table...</div>}>
            <div className="page-wrapper">
                <div className="page-content">
                    <h4 className="mb-3">Buyer Enquiries </h4>
                    <div className="card">
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                                </div>
                                <div className="col-md-3">
                                    <Select
                                        options={[{ value: '', label: 'All Users' }, ...users.map(u => ({ value: u.id, label: `${u.fname} ${u.lname}` }))]}
                                        value={
                                            userFilter
                                                ? (() => {
                                                    const user = users.find(u => u.id === userFilter);
                                                    return user ? { value: user.id, label: `${user.fname} ${user.lname}` } : { value: '', label: 'All Users' };
                                                })()
                                                : { value: '', label: 'All Users' }
                                        }
                                        onChange={option => { setUserFilter(option.value); setPage(1); }}
                                        isClearable={true}
                                        placeholder="All Users"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <Select
                                        options={[{ value: '', label: 'All Companies' }, ...companies.map(c => ({ value: c.id, label: c.organization_name }))]}
                                        value={{ value: companyFilter, label: companies.find(c => c.id === companyFilter)?.organization_name || 'All Companies' }}
                                        onChange={option => { setCompanyFilter(option.value); setPage(1); }}
                                        isClearable={true}
                                        placeholder="All Companies"
                                    />
                                </div>
                            </div>
                            <DataTable
                                columns={[
                                    { key: "id", label: "S.No.", sortable: true },
                                    { key: "sender_name", label: "From", sortable: false },
                                    { key: "receiver_name", label: "To", sortable: false },
                                    { key: "title", label: "Title", sortable: true },
                                    { key: "message", label: "Message", sortable: true },
                                    { key: "created_at", label: "Date", sortable: true }
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
                                onSortChange={setSortBy}
                                getRangeText={getRangeText}
                                renderRow={(row, idx) => (
                                    <tr key={row.id}>
                                        <td>{(page - 1) * limit + idx + 1}</td>
                                        <td>
                                            <i className="fadeIn animated bx bx-user"></i> {capitalize(row.sender?.fname)} {capitalize(row.sender?.lname)}
                                            <Link className="d-block" to={`/companies/${row.sender?.company_info?.organization_slug}`}>
                                                <i class="fadeIn animated bx bx-building"></i>  {row.sender?.company_info?.organization_name ?? '-'}</Link>
                                        </td>
                                        <td>
                                            <i className="fadeIn animated bx bx-user"></i>  {capitalize(row.receiver?.fname)} {capitalize(row.receiver?.lname)}
                                            <Link className="d-block" to={`/companies/${row.receiver?.company_info?.organization_slug}`}>
                                                <i class="fadeIn animated bx bx-building"></i>  {row.receiver?.company_info?.organization_name ?? '-'}</Link>
                                        </td>
                                        <td>{row.title}</td>
                                        <td>{row.message}</td>
                                        <td className='text-nowrap'>{formatDateTime(row.created_at)}</td>

                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Suspense>
    );
};

export default AdminBuyerEnquiries;
