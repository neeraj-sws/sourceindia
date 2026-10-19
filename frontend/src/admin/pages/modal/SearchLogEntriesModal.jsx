import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatDateTime } from "../../../utils/formatDate";

const PAGE_SIZE = 10;

const SearchLogEntriesModal = ({ searchLog, apiBase, token, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  useEffect(() => {
    let active = true;
    const fetchEntries = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${apiBase}/search_synonyms/logs/${searchLog.id}/entries`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit: PAGE_SIZE },
        });
        if (!active) return;
        setEntries(res.data.data || []);
        setTotalRecords(res.data.totalRecords || 0);
      } catch (err) {
        if (!active) return;
        console.error("Error fetching search log entries:", err);
        setError("Could not load search details. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchEntries();
    return () => { active = false; };
  }, [apiBase, page, searchLog.id, token]);

  return (
    <>
      <div className="modal fade show" tabIndex="-1" style={{ display: "block" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Search history: {searchLog.query}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
              <div className="table-responsive border rounded-2">
                <table className="table table-striped table-hover align-middle dataTable mb-0">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Searched at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" className="text-center">Loading...</td></tr>
                    ) : entries.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">No search entries found.</td></tr>
                    ) : entries.map((entry, index) => (
                      <tr key={`${entry.user_id || "guest"}-${entry.searched_at}-${index}`}>
                        <td>{entry.user_name || "Guest"}</td>
                        <td>{entry.email || "Guest"}</td>
                        <td>{formatDateTime(entry.searched_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && totalRecords > PAGE_SIZE && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="small text-muted">Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalRecords)} of {totalRecords} entries</span>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Search history pages">
                    <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
};

export default SearchLogEntriesModal;
