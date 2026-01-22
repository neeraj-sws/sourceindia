

import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import UseAuth from '../sections/UseAuth';
import API_BASE_URL from '../config';

const DataTable = lazy(() => import('../admin/common/DataTable'));

const MyBuyerEnquiries = () => {
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
    const { user } = UseAuth();
    const [data, setData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDirection, setSortDirection] = useState('DESC');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [filterType, setFilterType] = useState('all'); // 'all', 'send', 'received'

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const params = { user_id: user.id, page, limit, search, sortBy, sort: sortDirection };
            const response = await axios.get(`${API_BASE_URL}/buyerenquiry/user`, { params });
            let records = response.data.data || [];
            // Filter on client side for send/received
            if (filterType == 'send') {
                records = records.filter(row => user.id === row.user_id);
            } else if (filterType == 'received') {
                records = records.filter(row => user.id === row.reciever_id);
            }
            setData(records);
            setTotalRecords(response.data.totalRecords || response.data.filteredRecords || 0);
            setFilteredRecords(records.length);
        } catch (error) {
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [user, page, limit, search, sortBy, sortDirection, filterType]);

    if (!user) return <p>Loading...</p>;

    return (
        <Suspense fallback={<div>Loading table...</div>}>
            <div className="page-wrapper">
                <div className="page-content">
                    <h4 className="mb-3">My Buyer Enquiries</h4>
                    <div className="card">
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-4 mb-2">
                                    <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <select className="form-select w-auto" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
                                        <option value="all">All</option>
                                        <option value="send">Send</option>
                                        <option value="received">Received</option>
                                    </select>
                                </div>
                            </div>
                            <DataTable
                                columns={[
                                    { key: "id", label: "S.No.", sortable: true },
                                    { key: "title", label: "Title", sortable: true },
                                    { key: "message", label: "Message", sortable: true },
                                    { key: "company_name", label: "Company Name", sortable: true },
                                    { key: "created_at", label: "Date", sortable: true },

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
                                        <td>{row.title}</td>
                                        <td>{row.message}</td>
                                        <td>
                                            <Link to={`/companies/${row.receiver?.company_info?.organization_slug}`}>{row.receiver?.company_info?.organization_name ?? '-'}
                                            </Link><br />
                                            {(user.id == row.user_id) ? (
                                                <span className="badge bg-success mt-1">Send</span>
                                            ) : (user.id == row.reciever_id) ? (
                                                <span className="badge bg-primary mt-1 small">Received</span>
                                            ) : (
                                                <span className="text-muted small">-</span>
                                            )}
                                        </td>
                                        <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}</td>

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

export default MyBuyerEnquiries;
