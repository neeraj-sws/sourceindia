import React, { useEffect, useState } from "react";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from "../../utils/formatDate";

const emptyForm = { id: null, terms: "", status: "1" };

// Keyword Master > Search Synonyms: words that mean the same thing in product search.
const SearchSynonyms = () => {
  const { showNotification } = useAlert();
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/search_synonyms/server-side`, {
        params: { page, limit, search, sortBy, sort: sortDirection },
      });
      setData(res.data.data || []);
      setTotalRecords(res.data.totalRecords || 0);
      setFilteredRecords(res.data.filteredRecords || 0);
    } catch {
      showNotification("Failed to load synonyms.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, limit, search, sortBy, sortDirection]);

  const openForm = (row = null) => {
    setForm(row ? { id: row.id, terms: row.terms, status: String(row.status) } : emptyForm);
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { terms: form.terms, status: Number(form.status) };
      if (form.id) await axios.put(`${API_BASE_URL}/search_synonyms/${form.id}`, payload);
      else await axios.post(`${API_BASE_URL}/search_synonyms`, payload);
      showNotification(form.id ? "Synonym group updated." : "Synonym group added.", "success");
      setShowForm(false);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await axios.patch(`${API_BASE_URL}/search_synonyms/${row.id}/status`, { status: row.status === 1 ? 0 : 1 });
      setData((rows) => rows.map((r) => (r.id === row.id ? { ...r, status: row.status === 1 ? 0 : 1 } : r)));
    } catch {
      showNotification("Failed to update status.", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/search_synonyms/${deleteId}`);
      showNotification("Synonym group deleted.", "success");
      setDeleteId(null);
      fetchData();
    } catch {
      showNotification("Failed to delete.", "error");
    }
  };

  const runTest = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/search_synonyms/preview`, { params: { q: testQuery } });
      setTestResult(res.data);
    } catch {
      setTestResult(null);
    }
  };

  const getRangeText = () => {
    if (!filteredRecords) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return `Showing ${start} to ${end} of ${filteredRecords} entries`;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb
            mainhead="Search Synonyms"
            maincount={totalRecords}
            page="Keyword Master"
            title="Search Synonyms"
            add_button={<><i className="bx bxs-plus-square me-1" /> Add Synonym Group</>}
            add_link="#"
            onClick={() => openForm()}
          />

          <div className="card">
            <div className="card-body">
              <p className="text-muted small mb-2">
                Each group lists words that mean the same thing for product search. Searching any word of a
                group also searches the others, e.g. <strong>smps, switch mode power supply</strong> or
                <strong> wire, cable, taar</strong>. Spelling mistakes are corrected automatically and need no entry.
              </p>
              <form className="d-flex flex-wrap gap-2 align-items-center" onSubmit={runTest}>
                <input
                  className="form-control form-control-sm"
                  style={{ maxWidth: 320 }}
                  placeholder="Test a search, e.g. smps or transister"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-outline-primary">Test</button>
                {testResult && (
                  <span className="small">
                    Searched as:{" "}
                    {testResult.variants.map((v) => (
                      <span key={v} className="badge bg-light text-dark border me-1">{v}</span>
                    ))}
                  </span>
                )}
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <DataTable
                columns={[
                  { key: "id", label: "S.No.", sortable: true },
                  { key: "terms", label: "Terms (same meaning)", sortable: true },
                  { key: "status", label: "Status", sortable: true },
                  { key: "updated_at", label: "Updated", sortable: true },
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
                onPageChange={setPage}
                onSortChange={(column) => {
                  if (sortBy === column) setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
                  else { setSortBy(column); setSortDirection("ASC"); }
                }}
                onSearchChange={(val) => { setSearch(val); setPage(1); }}
                search={search}
                onLimitChange={(val) => { setLimit(val); setPage(1); }}
                getRangeText={getRangeText}
                renderRow={(row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * limit + index + 1}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(row.term_list || []).map((term) => (
                          <span key={term} className="badge bg-light text-dark border fw-normal">{term}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={row.status === 1}
                          onChange={() => toggleStatus(row)}
                        />
                      </div>
                    </td>
                    <td className="small">{formatDateTime(row.updated_at)}</td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-primary me-1" title="Edit" onClick={() => openForm(row)}>
                        <i className="bx bx-edit" />
                      </button>
                      <button className="btn btn-sm btn-danger" title="Delete" onClick={() => setDeleteId(row.id)}>
                        <i className="bx bx-trash" />
                      </button>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={save}>
                <div className="modal-header">
                  <h5 className="modal-title">{form.id ? "Edit Synonym Group" : "Add Synonym Group"}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
                </div>
                <div className="modal-body">
                  <label className="form-label required">Terms</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                    placeholder="smps, switch mode power supply, switching power supply"
                  />
                  <div className="form-text">Separate with commas. At least two terms. Phrases are allowed.</div>
                  <label className="form-label mt-3">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="modal-footer justify-content-between">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <>
          <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete synonym group?</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteId(null)} />
                </div>
                <div className="modal-body">Searches will no longer treat these terms as the same.</div>
                <div className="modal-footer justify-content-between">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
};

export default SearchSynonyms;
