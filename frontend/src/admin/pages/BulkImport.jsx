import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { utils, writeFile } from "xlsx";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import "./BulkImport.css";

// Columns, required flags and aliases must stay in sync with backend/utils/bulkImport.js. Example rows exist only here.
const BULK_IMPORT_LEVELS = {
  item_category: {
    label: "Item Category",
    fileName: "item_category_sample.xlsx",
    columns: [
      { name: "Category", required: true },
      { name: "Sub Category", required: true },
      { name: "Item Category", required: true },
      { name: "Status", required: false },
    ],
    examples: [
      ["Example Category 1", "Example Sub Category 1", "Example Item Category 1", "Active"],
      ["Example Category 2", "Example Sub Category 2", "Example Item Category 2", "Active"],
    ],
  },
  item_sub_category: {
    label: "Item Sub Category",
    fileName: "item_sub_category_sample.xlsx",
    columns: [
      { name: "Category", required: true },
      { name: "Sub Category", required: true },
      { name: "Item Category", required: true },
      { name: "Item Sub Category", required: true },
      { name: "Status", required: false },
    ],
    examples: [
      ["Example Category 1", "Example Sub Category 1", "Example Item Category 1", "Example Item Sub Category 1", "Active"],
      ["Example Category 2", "Example Sub Category 2", "Example Item Category 2", "Example Item Sub Category 2", "Active"],
    ],
  },
};

const LEVELS = Object.entries(BULK_IMPORT_LEVELS).map(([value, definition]) => ({
  value,
  label: definition.label,
  columns: definition.columns.map((column) => column.name),
}));
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const getErrorMessage = async (error, fallback) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch {
      // The response was not a JSON error body.
    }
  } else if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed?.message) return parsed.message;
    } catch {
      // The response was not a JSON error body.
    }
  } else if (data?.message) {
    return data.message;
  }
  return fallback;
};

const logRequestError = (action, error) => {
  const url = error?.config?.url || "unknown URL";
  const statusCode = error?.response?.status || "no response";
  console.error(`Bulk import ${action} failed: ${url} (HTTP ${statusCode})`, error);
};

const Step = ({ number, title, children }) => (
  <section className="bi-step">
    <h5 className="d-flex align-items-center mb-3">
      <span className="bi-step-num me-2">{number}</span>{title}
    </h5>
    {children}
  </section>
);

function BulkImport() {
  const { showNotification } = useAlert();
  const [selectedLevel, setSelectedLevel] = useState("item_category");
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [commitResult, setCommitResult] = useState(null);
  const [rowFilter, setRowFilter] = useState("all");
  const [rowPage, setRowPage] = useState(1);
  const [rowLimit, setRowLimit] = useState(25);
  const [rowSearch, setRowSearch] = useState("");
  const [pageRows, setPageRows] = useState([]);
  const [rowTotal, setRowTotal] = useState(0);
  const [rowCounts, setRowCounts] = useState({});
  const [sheetCount, setSheetCount] = useState(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const commitInFlightRef = useRef(false);
  const submittedCommitJobRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const validationRequestRef = useRef(0);
  const rowsRequestRef = useRef(0);
  const commitDialogRef = useRef(null);
  const cancelCommitButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const [reportJobId, setReportJobId] = useState(null);
  const [commitFailure, setCommitFailure] = useState(null);
  const selected = LEVELS.find((level) => level.value === selectedLevel);
  const counts = validationResult?.counts || {};
  const rows = pageRows;
  const skippedRows = [
    { label: "Already exists", value: Number(counts.exists || 0) },
    { label: "Exists inactive", value: Number(counts.existsInactive || 0) },
    { label: "Duplicates in file", value: Number(counts.duplicateInFile || 0) },
    { label: "Name conflicts", value: Number(counts.nameConflict || 0) },
  ].filter((item) => item.value > 0);

  useEffect(() => {
    if (!showCommitModal) return undefined;
    const previousFocus = document.activeElement;
    cancelCommitButtonRef.current?.focus();
    const handleModalKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!commitInFlightRef.current) setShowCommitModal(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = commitDialogRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) {
        event.preventDefault();
        commitDialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleModalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [showCommitModal]);

  const resetPreview = () => {
    validationRequestRef.current += 1;
    rowsRequestRef.current += 1;
    activeJobIdRef.current = null;
    setValidationResult(null);
    setPageRows([]);
    setRowTotal(0);
    setRowCounts({});
    setSheetCount(0);
    setRowPage(1);
    setRowLimit(25);
    setRowSearch("");
    setRowFilter("all");
    setRowsLoading(false);
    setCommitResult(null);
    setCommitFailure(null);
    setReportJobId(null);
    setRowFilter("all");
    setStatus("idle");
    setShowCommitModal(false);
  };

  const loadRows = async (jobId, options = {}) => {
    if (!jobId) return;
    const requestedPage = options.page ?? rowPage;
    const requestedLimit = options.limit ?? rowLimit;
    const requestedFilter = options.filter ?? rowFilter;
    const requestedSearch = options.search ?? rowSearch;
    const requestId = ++rowsRequestRef.current;
    setRowsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/bulk-import/${jobId}/rows`, {
        params: { page: requestedPage, limit: requestedLimit, filter: requestedFilter, search: requestedSearch },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (rowsRequestRef.current !== requestId) return;
      setPageRows(response.data?.rows || []);
      setRowTotal(Number(response.data?.total || 0));
      setRowCounts(response.data?.counts || {});
      setRowPage(Number(response.data?.page || requestedPage));
      setRowLimit(Number(response.data?.limit || requestedLimit));
    } catch (error) {
      if (rowsRequestRef.current !== requestId) return;
      logRequestError("rows", error);
      showNotification(await getErrorMessage(error, "Unable to load import rows."), "error");
    } finally {
      if (rowsRequestRef.current === requestId) setRowsLoading(false);
    }
  };

  const resetImportFlow = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    resetPreview();
    submittedCommitJobRef.current = null;
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    resetPreview();
    if (!nextFile) {
      setFile(null);
      event.target.value = "";
      return;
    }
    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv"].includes(extension)) {
      setFile(null);
      event.target.value = "";
      showNotification("Choose an .xlsx or .csv file.", "error");
      return;
    }
    const mime = String(nextFile.type || "").toLowerCase();
    const allowedMimeTypes = extension === "csv"
      ? ["", "text/csv", "text/plain", "text/x-csv", "text/comma-separated-values", "application/csv", "application/x-csv", "application/vnd.ms-excel", "application/octet-stream"]
      : ["", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/octet-stream", "application/zip"];
    if (!allowedMimeTypes.includes(mime)) {
      setFile(null);
      event.target.value = "";
      showNotification("The selected file type does not match its extension.", "error");
      return;
    }
    if (nextFile.size === 0 || nextFile.size > MAX_FILE_BYTES) {
      setFile(null);
      event.target.value = "";
      showNotification(nextFile.size === 0 ? "The selected file is empty." : "The file must be 5 MB or smaller.", "error");
      return;
    }
    setFile(nextFile);
  };

  const downloadSample = () => {
    setStatus("downloading");
    try {
      const definition = BULK_IMPORT_LEVELS[selectedLevel];
      const headers = definition.columns.map((column) => column.name);
      const dataSheet = utils.aoa_to_sheet([headers, ...definition.examples]);
      dataSheet["!cols"] = definition.columns.map((column) => ({ wch: Math.max(column.name.length + 4, 22) }));
      const instructions = [
        ["Column", "Required", "Instructions"],
        ...definition.columns.map((column) => [
          column.name,
          column.required ? "Yes" : "No",
          column.name === "Status"
            ? "Accepts Active or Inactive. Defaults to Active when blank."
            : "Required. Match the existing parent/category name; names are matched case-insensitively and extra spaces are ignored.",
        ]),
        [],
        ["General instructions", "", "All columns except Status are required. Parent Category, Sub Category and Item Category must already exist for the selected level."],
        ["", "", "Names are unique across Category Master by default. Repeated names under the same parent are skipped; a name used under a different parent or level is a conflict."],
      ];
      const instructionsSheet = utils.aoa_to_sheet(instructions);
      instructionsSheet["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 100 }];
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, dataSheet, "Data");
      utils.book_append_sheet(workbook, instructionsSheet, "Instructions");
      writeFile(workbook, definition.fileName);
      setStatus("idle");
    } catch {
      setStatus("idle");
      showNotification("Unable to download the sample file.", "error");
    }
  };

  const handleValidate = async () => {
    if (!file) {
      showNotification("Choose an .xlsx or .csv file first.", "error");
      return;
    }
    const data = new FormData();
    data.append("level", selectedLevel);
    data.append("file", file);
    setStatus("validating");
    setValidationResult(null);
    setPageRows([]);
    setRowTotal(0);
    setRowCounts({});
    setSheetCount(0);
    setRowPage(1);
    setRowLimit(25);
    setRowSearch("");
    setRowFilter("all");
    setRowsLoading(false);
    setCommitResult(null);
    setCommitFailure(null);
    setReportJobId(null);
    setShowCommitModal(false);
    submittedCommitJobRef.current = null;
    activeJobIdRef.current = null;
    rowsRequestRef.current += 1;
    const requestId = ++validationRequestRef.current;
    try {
      const response = await axios.post(`${API_BASE_URL}/bulk-import/validate`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (validationRequestRef.current !== requestId) return;
      activeJobIdRef.current = response.data?.jobId || null;
      setValidationResult(response.data);
      setSheetCount(Number(response.data?.sheetCount ?? new Set((response.data?.rows || []).map((row) => row.sheet)).size));
      setPageRows(response.data?.rows || []);
      setRowTotal(Number(response.data?.total || 0));
      setRowCounts({
        all: Number(response.data?.counts?.total || 0),
        errors: Number(response.data?.counts?.error || 0),
        skipped: Number(response.data?.counts?.exists || 0) + Number(response.data?.counts?.existsInactive || 0)
          + Number(response.data?.counts?.duplicateInFile || 0) + Number(response.data?.counts?.nameConflict || 0),
        name_conflict: Number(response.data?.counts?.nameConflict || 0),
        create: Number(response.data?.counts?.create || 0),
        created: 0,
        failed: 0,
      });
      setRowPage(1);
      setRowLimit(25);
      setRowSearch("");
      setRowFilter("all");
      setStatus("validated");
      const errorCount = Number(response.data?.counts?.error || 0);
      showNotification(errorCount ? "Validation completed with errors. Review the preview." : "Validation completed.", errorCount ? "warning" : "success");
    } catch (error) {
      if (validationRequestRef.current !== requestId) return;
      logRequestError("validation", error);
      setStatus("error");
      showNotification(await getErrorMessage(error, "Unable to validate this file."), "error");
    }
  };

  const downloadErrorReport = async () => {
    const jobId = reportJobId || validationResult?.jobId;
    if (!jobId) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/bulk-import/${jobId}/report`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      saveAs(new Blob([response.data]), `${selectedLevel}_errors.xlsx`);
    } catch (error) {
      logRequestError("report download", error);
      showNotification(await getErrorMessage(error, "Unable to download the error report."), "error");
    }
  };

  const openCommitModal = () => {
    const createCount = Number(counts.create || 0);
    if (!validationResult?.jobId || validationResult.jobId !== activeJobIdRef.current || (createCount < 1 && !validationResult?.alreadyImportedBefore) || status === "committing" || commitResult) return;
    setShowCommitModal(true);
  };

  const closeCommitModal = () => {
    if (!commitInFlightRef.current) setShowCommitModal(false);
  };

  const handleCommit = async () => {
    const jobId = activeJobIdRef.current;
    if (!jobId || jobId !== validationResult?.jobId) return;
    if (commitInFlightRef.current || !jobId || Number(counts.create || 0) < 1 || commitResult || submittedCommitJobRef.current === jobId) return;
    commitInFlightRef.current = true;
    submittedCommitJobRef.current = jobId;
    setStatus("committing");
    window.requestAnimationFrame(() => commitDialogRef.current?.focus());
    try {
      const response = await axios.post(`${API_BASE_URL}/bulk-import/${jobId}/commit`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCommitResult(response.data);
      setCommitFailure(null);
      setReportJobId(jobId);
      activeJobIdRef.current = null;
      setValidationResult(null);
      setPageRows([]);
      setRowTotal(0);
      setRowCounts({});
      setRowPage(1);
      setRowLimit(25);
      setRowSearch("");
      setRowFilter("all");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("committed");
      setShowCommitModal(false);
      await loadRows(jobId, { page: 1, limit: 25, filter: "all", search: "" });
      window.dispatchEvent(new CustomEvent("bulk-import:committed"));
      showNotification("Import completed.", "success");
    } catch (error) {
      logRequestError("commit", error);
      const code = error?.response?.data?.code;
      const message = await getErrorMessage(error, "Unable to complete the import.");
      if (["JOB_FAILED", "JOB_EXPIRED", "JOB_NOT_FOUND", "JOB_NOT_COMMITTABLE"].includes(code)) {
        resetImportFlow();
        if (code === "JOB_FAILED") {
          setCommitFailure({
            errorCode: error?.response?.data?.errorCode || "UNKNOWN",
            message,
            errorRow: error?.response?.data?.errorRow || null,
          });
          setReportJobId(jobId);
        }
        showNotification(`${message} Select the file and validate it again.`, "warning");
      } else if (code === "JOB_IN_PROGRESS") {
        resetImportFlow();
        showNotification("Import already in progress. Validate the file again after it finishes.", "warning");
      } else {
        setStatus("validated");
        submittedCommitJobRef.current = null;
        showNotification(message, error?.response?.status === 409 ? "warning" : "error");
      }
    } finally {
      commitInFlightRef.current = false;
    }
  };

  const importAnother = resetImportFlow;

  const createCount = Number(counts.create || 0);
  const totalCount = Number(counts.total || 0);
  const errorCount = Number(counts.error || 0);
  const existsCount = Number(counts.exists || 0) + Number(counts.existsInactive || 0);
  const duplicateCount = Number(counts.duplicateInFile || 0);
  const conflictCount = Number(counts.nameConflict || 0);
  const nonCreateCount = Math.max(totalCount - createCount, 0);
  const reportAvailable = commitResult
    ? Number(rowCounts.all || 0) > Number(commitResult.created || 0)
    : nonCreateCount > 0;
  const noCreateMessage = createCount > 0 ? "" : errorCount === totalCount && totalCount > 0
    ? "Nothing to import: all rows have errors, fix the file and validate again."
    : existsCount === totalCount && totalCount > 0
      ? `Nothing to import: all ${totalCount} valid rows already exist.`
      : `0 rows to create (${[
        existsCount ? `${existsCount} already exist` : null,
        duplicateCount ? `${duplicateCount} duplicates in the file` : null,
        conflictCount ? `${conflictCount} name conflicts` : null,
        errorCount ? `${errorCount} errors` : null,
      ].filter(Boolean).join(", ") || "no importable rows"}).`;

  const activeRowsJobId = validationResult?.jobId || reportJobId;
  const handleRowFilter = (filter) => {
    setRowFilter(filter);
    setRowPage(1);
    loadRows(activeRowsJobId, { page: 1, filter });
  };
  const handleRowPage = (page) => {
    setRowPage(page);
    loadRows(activeRowsJobId, { page });
  };
  const handleRowLimit = (limit) => {
    setRowLimit(limit);
    setRowPage(1);
    loadRows(activeRowsJobId, { page: 1, limit });
  };
  const handleRowSearch = (search) => {
    setRowSearch(search);
    setRowPage(1);
    loadRows(activeRowsJobId, { page: 1, search });
  };
  const getRowsRangeText = () => {
    if (!rowTotal) return "Showing 0 to 0 of 0 entries";
    const start = (rowPage - 1) * rowLimit + 1;
    return `Showing ${start} to ${Math.min(start + rows.length - 1, rowTotal)} of ${rowTotal} entries`;
  };
  const statusLabel = (value) => ({
    create: "To create",
    exists: "Already exists",
    exists_inactive: "Exists inactive",
    duplicate_in_file: "Duplicate in file",
    name_conflict: "Name conflict",
    error: "Error",
  }[value] || value);
  const statusClass = (value) => ({
    create: "success",
    exists: "secondary",
    exists_inactive: "warning",
    duplicate_in_file: "info",
    name_conflict: "danger",
    error: "danger",
  }[value] || "secondary");

  return (
    <div className="page-wrapper bi-page">
      <div className="page-content">
        <Breadcrumb mainhead="Bulk Import" page="Category Master" title="Bulk Import" />
        <div className="card">
          <div className="card-body p-4">
            <p className="text-muted mb-4">Import Item Categories or Item Sub Categories from a structured Excel or CSV file.</p>

            <Step number={1} title="Choose the level">
              <div className="d-flex flex-wrap gap-2" role="group" aria-label="Import level">
                {LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    className={`bi-level ${selectedLevel === level.value ? "is-active" : ""}`}
                    aria-pressed={selectedLevel === level.value}
                    onClick={() => {
                      if (status === "committing") return;
                      if (selectedLevel === level.value) return;
                      resetImportFlow();
                      setSelectedLevel(level.value);
                    }}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </Step>

            <Step number={2} title="Prepare your file">
              <div className="bi-columns mb-3">
                <span className="fw-semibold">Expected columns:</span>{" "}
                {selected.columns.map((column, index) => (
                  <React.Fragment key={column}>
                    <span>{column}</span>{index < selected.columns.length - 1 ? <span className="text-muted">, </span> : null}
                  </React.Fragment>
                ))}
              </div>
              <button type="button" className="btn btn-outline-primary" onClick={downloadSample} disabled={status === "downloading" || status === "validating" || status === "committing"}>
                <i className="bx bx-download me-1" />
                {status === "downloading" ? "Preparing sample..." : "Download Sample File"}
              </button>
            </Step>

            <Step number={3} title="Upload file">
              <div className="bi-upload-placeholder">
                <label htmlFor="bulkImportFile" className="form-label fw-semibold">Select an Excel or CSV file</label>
                <input ref={fileInputRef} className="form-control" type="file" id="bulkImportFile" accept=".xlsx,.csv" onChange={handleFileChange} disabled={status === "committing"} />
                <div className="form-text">Maximum size 5 MB. Files are limited to 2,000 non-empty data rows across visible sheets.</div>
                {file && <div className="small mt-2">Selected file: {file.name}</div>}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" className="btn btn-primary" onClick={handleValidate} disabled={!file || status === "validating" || status === "committing"}>
                    {status === "validating" ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Validating...</> : "Validate file"}
                  </button>
                  <button type="button" className="btn btn-outline-primary" disabled={!validationResult?.jobId || nonCreateCount === 0 || status === "committing"} onClick={downloadErrorReport}>
                    <i className="bx bx-download me-1" />Download error report
                  </button>
                  <button type="button" className="btn btn-success" title={createCount < 1 ? noCreateMessage : undefined} disabled={!validationResult?.jobId || createCount < 1 || status === "committing" || Boolean(commitResult)} onClick={openCommitModal}>
                    Import {createCount} valid rows
                  </button>
                </div>
                {validationResult && createCount === 0 && (
                  <div className="alert alert-info mt-3 mb-0" role="status">{noCreateMessage}</div>
                )}
              </div>
            </Step>

            {(validationResult || commitResult) && (
              <section className="bi-preview mt-4" aria-live="polite">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h5 className="mb-0">{commitResult ? "Import results" : "Validation preview"}</h5>
                </div>
                {validationResult?.alreadyImportedBefore && (
                  <div className="alert alert-warning py-2" role="alert">A file with identical content was already imported before.</div>
                )}
                {validationResult && <div className="row g-3 mb-3">
                  {[
                    { label: "To create", value: counts.create, color: "success" },
                    { label: "Already exists", value: Number(counts.exists || 0) + Number(counts.existsInactive || 0), color: "secondary" },
                    { label: "Duplicates in file", value: counts.duplicateInFile, color: "info" },
                    { label: "Name conflicts", value: counts.nameConflict, color: "danger" },
                    { label: "Errors", value: counts.error, color: "danger" },
                  ].map((tile) => (
                    <div className="col-6 col-xl-3" key={tile.label}>
                      <div className="bi-count-card">
                        <div className={`bi-count-value text-${tile.color}`}>{Number(tile.value || 0)}</div>
                        <div className="small text-muted">{tile.label}</div>
                      </div>
                    </div>
                  ))}
                </div>}
                {Array.isArray(validationResult?.warnings) && validationResult.warnings.filter((warning) => !(
                  validationResult.alreadyImportedBefore && warning === "This file was committed before for the selected level."
                )).length > 0 && (
                  <div className="alert alert-warning py-2">
                    <div className="fw-semibold mb-1">Warnings</div>
                    <ul className="mb-0 ps-3">{validationResult.warnings.filter((warning) => !(
                      validationResult.alreadyImportedBefore && warning === "This file was committed before for the selected level."
                    )).map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul>
                  </div>
                )}
                <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter validation rows">
                  {(commitResult ? [
                    ["all", `All (${rowCounts.all || 0})`],
                    ["created", `Created (${rowCounts.created || 0})`],
                    ["skipped", `Skipped (${rowCounts.skipped || 0})`],
                    ["failed", `Failed (${rowCounts.failed || 0})`],
                  ] : [
                    ["all", `All (${counts.total || 0})`],
                    ["errors", `Errors (${counts.error || 0})`],
                    ["skipped", `Skipped (${Number(counts.exists || 0) + Number(counts.existsInactive || 0) + Number(counts.duplicateInFile || 0) + Number(counts.nameConflict || 0)})`],
                    ["name_conflict", `Name conflicts (${counts.nameConflict || 0})`],
                    ["create", `To create (${counts.create || 0})`],
                  ]).map(([filter, label]) => (
                    <button type="button" key={filter} className={`bi-filter ${rowFilter === filter ? "is-active" : ""}`} onClick={() => handleRowFilter(filter)}>{label}</button>
                  ))}
                </div>
                <p className="small text-muted mb-2">Excel Row is the row number in your file (row 1 is the header).</p>
                <DataTable
                  columns={[
                    { key: "serialNumber", label: "S.No.", sortable: false },
                    ...(sheetCount > 1 ? [{ key: "sheet", label: "Sheet", sortable: false }] : []),
                    { key: "rowNumber", label: "Excel Row", sortable: false },
                    { key: "values", label: "Values", sortable: false },
                    { key: "status", label: "Status", sortable: false },
                    ...(commitResult ? [{ key: "commitStatus", label: "Commit result", sortable: false }] : []),
                    { key: "message", label: "Message", sortable: false },
                  ]}
                  data={rows}
                  loading={rowsLoading}
                  page={rowPage}
                  totalRecords={rowTotal}
                  filteredRecords={rowTotal}
                  limit={rowLimit}
                  onPageChange={handleRowPage}
                  onSortChange={() => {}}
                  onSearchChange={handleRowSearch}
                  search={rowSearch}
                  onLimitChange={handleRowLimit}
                  getRangeText={getRowsRangeText}
                  renderRow={(row, index) => (
                    <tr key={`${row.sheet}-${row.rowNumber}-${index}`}>
                      <td>{(rowPage - 1) * rowLimit + index + 1}</td>
                      {sheetCount > 1 && <td>{row.sheet}</td>}
                      <td>{row.rowNumber}</td>
                      <td className="bi-values">{selected.columns.map((column) => <div key={column}><strong>{column}:</strong> {row.rawValues?.[column] ?? <span className="text-muted">—</span>}</div>)}</td>
                      <td><span className={`badge bg-${statusClass(row.status)} ${row.status === "exists_inactive" ? "text-dark" : ""}`}>{statusLabel(row.status)}</span></td>
                      {commitResult && <td>{row.commitStatus?.replaceAll("_", " ") || "Not imported"}</td>}
                      <td className="bi-message">{row.commitMessage || row.message || "—"}</td>
                    </tr>
                  )}
                />
              </section>
            )}
            {commitResult && (
              <section className="alert alert-success mt-4 mb-0" aria-live="polite">
                <div className="fw-semibold">Import complete</div>
                <div>Created: {commitResult.created || 0} | Skipped as exists: {commitResult.skippedExists || 0} | Skipped as name conflict: {commitResult.skippedNameConflict || 0} | Failed: {commitResult.failed || 0}</div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button type="button" className="btn btn-outline-primary btn-sm" disabled={!reportJobId || !reportAvailable} onClick={downloadErrorReport}><i className="bx bx-download me-1" />Download report</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={importAnother}>Import another file</button>
                </div>
              </section>
            )}
            {commitFailure && (
              <section className="alert alert-danger mt-4 mb-0" role="alert" aria-live="assertive">
                <div className="fw-semibold">Import failed ({commitFailure.errorCode})</div>
                <div>{commitFailure.message}</div>
                {commitFailure.errorRow && <div className="small mt-1">Row {commitFailure.errorRow.rowNumber || "?"}{commitFailure.errorRow.name ? `: ${commitFailure.errorRow.name}` : ""}</div>}
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button type="button" className="btn btn-outline-primary btn-sm" disabled={!reportJobId} onClick={downloadErrorReport}><i className="bx bx-download me-1" />Download report</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={importAnother}>Choose file and validate again</button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
      {showCommitModal && (
        <div className="modal fade show d-block bi-confirm-backdrop" onClick={(event) => { if (event.target === event.currentTarget) closeCommitModal(); }}>
          <div
            ref={commitDialogRef}
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable bi-confirm-dialog"
            role="dialog"
            tabIndex="-1"
            aria-modal="true"
            aria-labelledby="bulkImportConfirmTitle"
            aria-describedby="bulkImportConfirmDescription"
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="bulkImportConfirmTitle">Confirm Import</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeCommitModal} disabled={status === "committing"} />
              </div>
              <div className="modal-body">
                <p id="bulkImportConfirmDescription" className="mb-3">You are about to import {selected.label} records.</p>
                <dl className="bi-confirm-summary mb-3">
                  <div><dt>Rows to create</dt><dd className="text-success">{Number(counts.create || 0)}</dd></div>
                  {skippedRows.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                  {Number(counts.error || 0) > 0 && (
                    <div><dt>Errors</dt><dd className="text-danger">{Number(counts.error || 0)}</dd></div>
                  )}
                </dl>
                {Number(counts.error || 0) > 0 && (
                  <p className="small text-danger mb-3">Rows with errors will not be imported.</p>
                )}
                {selectedLevel === "item_category" && (
                  <p className="small text-muted mb-3">Imported Item Categories will use the default image.</p>
                )}
                {validationResult?.alreadyImportedBefore && (
                  <div className="alert alert-warning mb-0" role="alert">A file with identical content was already imported before.</div>
                )}
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeCommitModal} disabled={status === "committing"}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCommit} disabled={status === "committing" || Number(counts.create || 0) < 1}>
                  {status === "committing" ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Importing...</> : "Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkImport;
