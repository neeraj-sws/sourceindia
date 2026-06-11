import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Breadcrumb from '../common/Breadcrumb';
import DataTable from '../common/DataTable';
import API_BASE_URL from '../../config';
import { formatDateTime } from '../../utils/formatDate';
import { useAlert } from '../../context/AlertContext';

const getMailTypeLabel = (type) => {
    if (Number(type) === 0) return 'Buyer';
    if (Number(type) === 1) return 'Seller';
    return type || '-';
};

const getDeliveryBadgeClass = (status) => {
    if (status === 'Success') return 'bg-success-subtle text-success';
    if (status === 'Failed') return 'bg-danger-subtle text-danger';
    return 'bg-warning-subtle text-warning';
};

const formatMailHistoryListLabel = (value) => {
    if (!value) return '-';

    return value
        .toString()
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatPersonName = (value) => {
    if (!value) return '-';

    return value
        .toString()
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const modalBackdropStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
};

const escapeHtml = (value) => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const MailHistoryDetails = () => {
    const { mailCode } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isDeletedView = searchParams.get('deleted') === 'true';
    const { showNotification } = useAlert();

    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDirection, setSortDirection] = useState('DESC');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [resendLoadingId, setResendLoadingId] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewRow, setPreviewRow] = useState(null);

    const fetchData = useCallback(async () => {
        if (!mailCode) {
            setSummary(null);
            setData([]);
            setTotalRecords(0);
            setFilteredRecords(0);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/seller_mail_histories/details/${encodeURIComponent(mailCode)}`, {
                params: {
                    page,
                    limit,
                    search,
                    sortBy,
                    sort: sortDirection,
                    getDeleted: isDeletedView ? 'true' : 'false'
                }
            });

            setSummary(response.data.summary || null);
            setData(response.data.data || []);
            setTotalRecords(response.data.totalRecords || 0);
            setFilteredRecords(response.data.filteredRecords || 0);
        } catch (error) {
            console.error('Error fetching mail history details:', error);
            setSummary(null);
            setData([]);
            setTotalRecords(0);
            setFilteredRecords(0);
        } finally {
            setLoading(false);
        }
    }, [isDeletedView, limit, mailCode, page, search, sortBy, sortDirection]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSortChange = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
            return;
        }

        setSortBy(column);
        setSortDirection('ASC');
    };

    const getRangeText = () => {
        if (filteredRecords === 0) {
            if (search.trim()) {
                return `Showing 0 to 0 of 0 entries (filtered from ${totalRecords} total entries)`;
            }

            return 'Showing 0 to 0 of 0 entries';
        }

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, filteredRecords);

        if (search.trim()) {
            return `Showing ${start} to ${end} of ${filteredRecords} entries (filtered from ${totalRecords} total entries)`;
        }

        return `Showing ${start} to ${end} of ${totalRecords} entries`;
    };

    const stats = [
        {
            key: 'pending',
            label: 'Pending',
            value: summary?.pending_count || 0,
            cardClass: 'border-warning-subtle bg-warning-subtle',
            iconClass: 'bx bx-time-five text-warning'
        },
        {
            key: 'success',
            label: 'Success',
            value: summary?.success_count || 0,
            cardClass: 'border-success-subtle bg-success-subtle',
            iconClass: 'bx bx-check-circle text-success'
        },
        {
            key: 'failed',
            label: 'Failed',
            value: summary?.failed_count || 0,
            cardClass: 'border-danger-subtle bg-danger-subtle',
            iconClass: 'bx bx-error-circle text-danger'
        },
        {
            key: 'total',
            label: 'Total',
            value: summary?.total_mail_histories || 0,
            cardClass: 'border-info-subtle bg-info-subtle',
            iconClass: 'bx bx-bar-chart-alt-2 text-info'
        }
    ];

    const handleResend = async (row) => {
        if (!row || Number(row.is_failed) !== 1) {
            return;
        }

        setResendLoadingId(row.id);
        try {
            const response = await axios.post(`${API_BASE_URL}/seller_mail_histories/${row.id}/resend`);
            showNotification(response?.data?.message || 'Mail resent successfully.', 'success');
            fetchData();
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to resend mail.';
            showNotification(message, 'error');
        } finally {
            setResendLoadingId(null);
        }
    };

    const handlePreview = async (row) => {
        if (!row?.email_id) {
            showNotification('Email template not found for this record.', 'error');
            return;
        }

        setPreviewRow(row);
        setPreviewLoading(true);
        setShowPreviewModal(true);

        try {
            const response = await axios.get(`${API_BASE_URL}/emails/${row.email_id}`);
            setPreviewData(response.data || null);
        } catch (error) {
            console.error('Error fetching template preview:', error);
            showNotification(error?.response?.data?.message || 'Failed to load template preview.', 'error');
            setPreviewData(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        setPreviewData(null);
        setPreviewRow(null);
        setPreviewLoading(false);
    };

    const getRenderedTemplateBody = () => {
        const rawTemplate = previewData?.message || '';
        if (!rawTemplate) return '';

        const userName = escapeHtml(formatPersonName(previewRow?.user_name));
        const userEmail = escapeHtml(previewRow?.user_email || previewRow?.mail || '-');

        return rawTemplate
            .replace(/\{\{\s*USER_NAME\s*\}\}/gi, userName)
            .replace(/\{\{\s*USER_EMAIL\s*\}\}/gi, userEmail);
    };

    return (
        <>
            <div className="page-wrapper">
                <div className="page-content">
                    <Breadcrumb
                        page="Mail History"
                        title="Mail History Details"
                        add_button="Back"
                        add_link="#"
                        onClick={(event) => {
                            event.preventDefault();
                            navigate(-1);
                        }}
                    />

                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6 col-xl-4">
                                    <small className="text-muted d-block mb-1">List</small>
                                    <div className="fw-semibold">{formatMailHistoryListLabel(summary?.mail_master_list)}</div>
                                </div>
                                <div className="col-md-6 col-xl-4">
                                    <small className="text-muted d-block mb-1">Code</small>
                                    <div className="fw-semibold">{summary?.mail_code || '-'}</div>
                                </div>
                                <div className="col-md-6 col-xl-4">
                                    <small className="text-muted d-block mb-1"> Type</small>
                                    <span className="badge rounded-pill bg-primary-subtle text-dark border border-primary-subtle">
                                        {getMailTypeLabel(summary?.mail_master_type)}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mb-4">
                        {stats.map((card) => (
                            <div className="col-12 col-sm-6 col-lg-3" key={card.key}>
                                <div className={`border rounded-3 p-3 h-100 shadow-sm ${card.cardClass}`}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="small text-muted fw-semibold">{card.label}</span>
                                        <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white" style={{ width: 34, height: 34 }}>
                                            <i className={`${card.iconClass} fs-5`} />
                                        </span>
                                    </div>
                                    <div className="fw-bold" style={{ fontSize: '1.65rem', lineHeight: 1 }}>
                                        {card.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <DataTable
                                columns={[
                                    { key: 'id', label: 'S.No.', sortable: true },
                                    { key: 'user_name', label: 'User Name', sortable: true },
                                    { key: 'organization_name', label: 'Company', sortable: true },
                                    { key: 'user_email', label: 'Email', sortable: true },
                                    { key: 'mail_type', label: 'Mail Type', sortable: true },
                                    { key: 'delivery_status', label: 'Status', sortable: true },
                                    { key: 'is_open', label: 'Opened', sortable: true },
                                    { key: 'open_count', label: 'Open Count', sortable: true },
                                    { key: 'opened_at', label: 'Opened At', sortable: true },
                                    { key: 'country', label: 'Country', sortable: true },
                                    { key: 'state', label: 'State', sortable: true },
                                    { key: 'city', label: 'City', sortable: true },

                                    { key: 'mail_send_time', label: 'Mail Send Time', sortable: true },
                                    { key: 'action', label: 'Action', sortable: false },

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
                                onSearchChange={(value) => {
                                    setSearch(value);
                                    setPage(1);
                                }}
                                search={search}
                                onLimitChange={(value) => {
                                    setLimit(value);
                                    setPage(1);
                                }}
                                getRangeText={getRangeText}
                                renderRow={(row, index) => (
                                    <tr key={row.id}>
                                        <td>{(page - 1) * limit + index + 1}</td>
                                        <td>{formatPersonName(row.user_name)}</td>
                                        <td>{row.organization_name || '-'}</td>
                                        <td>{row.user_email || row.mail || '-'}</td>
                                        <td>{row.mail_type_label || '-'}</td>
                                        <td>
                                            <span className={`badge rounded-pill ${getDeliveryBadgeClass(row.delivery_status)}`}>
                                                {row.delivery_status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge rounded-pill ${Number(row.is_open) === 1 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-dark'}`}>
                                                {Number(row.is_open) === 1 ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td>{Number(row.open_count || 0)}</td>
                                        <td>{row.opened_at ? formatDateTime(row.opened_at) : '-'}</td>
                                        <td>{row.country || '-'}</td>
                                        <td>{row.state || '-'}</td>
                                        <td>{row.city || '-'}</td>
                                        <td>{row.mail_send_time || '-'}</td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="d-none btn btn-sm btn-outline-primary"
                                                    onClick={() => handlePreview(row)}
                                                >
                                                    Preview
                                                </button>
                                                {Number(row.is_failed) === 1 && !isDeletedView ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        disabled={resendLoadingId === row.id}
                                                        onClick={() => handleResend(row)}
                                                    >
                                                        {resendLoadingId === row.id ? 'Resending...' : 'Resend'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {showPreviewModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div>
                                        <h5 className="modal-title mb-1">Template Preview</h5>
                                        <small className="text-muted">
                                            {previewData?.title || previewData?.subject || 'Email template'}
                                        </small>
                                    </div>
                                    <button type="button" className="btn-close" onClick={closePreviewModal} />
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-lg-4">
                                            <div className="border rounded-3 p-3 h-100 bg-light">
                                                <h6 className="mb-3">First User Detail</h6>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Name</small>
                                                    <div className="fw-semibold">{formatPersonName(previewRow?.user_name)}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Email</small>
                                                    <div className="fw-semibold">{previewRow?.user_email || previewRow?.mail || '-'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Company</small>
                                                    <div className="fw-semibold">{previewRow?.organization_name || '-'}</div>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Location</small>
                                                    <div className="fw-semibold">
                                                        {[previewRow?.city, previewRow?.state, previewRow?.country].filter(Boolean).join(', ') || '-'}
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <small className="text-muted d-block">Mail Type</small>
                                                    <div className="fw-semibold">{previewRow?.mail_type_label || '-'}</div>
                                                </div>
                                                <div className="mb-0">
                                                    <small className="text-muted d-block">Status</small>
                                                    <div className="fw-semibold">{previewRow?.delivery_status || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-8">
                                            <div className="border rounded-3 p-3 h-100">
                                                <h6 className="mb-3">Template Body</h6>
                                                <div className="alert alert-light border mb-3 py-2">
                                                    <div className="small text-muted mb-1">First User (for template context)</div>
                                                    <div className="fw-semibold">
                                                        {formatPersonName(previewRow?.user_name)}
                                                    </div>
                                                    <div className="small">
                                                        {previewRow?.user_email || previewRow?.mail || '-'}
                                                    </div>
                                                </div>
                                                {previewLoading ? (
                                                    <div className="py-5 text-center text-muted">Loading template preview...</div>
                                                ) : previewData?.message ? (
                                                    <div className="preview-email-body" dangerouslySetInnerHTML={{ __html: getRenderedTemplateBody() }} />
                                                ) : (
                                                    <div className="py-5 text-center text-muted">No template content found.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closePreviewModal}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" style={modalBackdropStyle} />
                </>
            )}
        </>
    );
};

export default MailHistoryDetails;