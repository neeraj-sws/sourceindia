import React from "react";

const DataTable = ({
  columns,
  data,
  loading,
  page,
  totalRecords,
  filteredRecords,
  limit,
  onPageChange,
  onSortChange,
  sortBy,
  sortDirection,
  onSearchChange,
  search,
  onLimitChange,
  getRangeText,
  renderRow,
}) => {
  const totalPages = Math.ceil(filteredRecords / limit);
  const isPaginationDisabled = totalRecords === 0;

  const getPageNumbers = () => {
    const pageRange = 5;
    let startPage = Math.max(1, page - Math.floor(pageRange / 2));
    let endPage = Math.min(totalPages, startPage + pageRange - 1);
    if (endPage - startPage < pageRange - 1) {
      startPage = Math.max(1, endPage - pageRange + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();

  return (
    <>
      <div className="row mt-2 justify-content-between">
        <div className="d-md-flex align-items-center col-md-auto me-auto">
          <select
            className="form-select form-select-sm me-2 w-auto"
            id="limitDatatable"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <label htmlFor="limitDatatable" className="d-block">entries per page</label>
        </div>
        <div className="d-md-flex align-items-center col-md-auto ms-auto">
          <label htmlFor="searchDatatable" className="d-block">Search:</label>
          <input
            type="text"
            id="searchDatatable"
            className="form-control form-control-sm ms-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ padding: "6px 12px", width: "200px" }}
          />
        </div>
      </div>

      <table className="table table-striped table-responsive dataTable mt-2">
        <thead>
        <tr>
          {columns?.map((col, colIndex) => {
            const isSorted = sortBy === col.key;
            const isAsc = isSorted && sortDirection === "ASC";
            const isDesc = isSorted && sortDirection === "DESC";
            const thClassList = col.sortable ? [
              "dt-orderable-asc",
              "dt-orderable-desc",
              "dt-type-numeric",
              isAsc ? "dt-ordering-asc" : "",
              isDesc ? "dt-ordering-desc" : ""
            ]
              .filter(Boolean)
              .join(" ") : "dt-orderable-none";
            const ariaSort = isAsc ? "ascending" : isDesc ? "descending" : undefined;
            return (
              <th
              key={col.key}
              data-dt-column={colIndex}
              rowSpan="1"
              colSpan="1"
              className={thClassList}
              aria-sort={ariaSort}
              onClick={col.sortable ? () => onSortChange(col.key) : undefined}
              onKeyDown={col.sortable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSortChange(col.key);
                }
              } : undefined}
              tabIndex={col.sortable ? 0 : undefined}
              role={col.sortable ? "button" : undefined}
            >
              <div className="dt-column-header">
                <span className="dt-column-title">{col.label}</span>
                {col.sortable && (
                  <span
                    className="dt-column-order"
                    aria-label={`${col.label}: Activate to ${
                      isSorted ? isAsc ? "invert sorting" : isDesc ? "remove sorting" : "sort" : "sort"
                    }`}
                  />
                )}
              </div>
            </th>
            );
          })}
        </tr>
      </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center"><img src="/loading.gif" className="img-fluid" alt="Loading" width={50} /></td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center">
                No records found.
              </td>
            </tr>
          ) : (
            data?.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>

      <div className="row mt-2 justify-content-between">
        <div className="col-md-auto me-auto">{getRangeText()}</div>
        <div className="col-md-auto ms-auto">
          <ul className="pagination">
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(1)}
                disabled={page === 1 || isPaginationDisabled}
              >
                <i className="bx bx-chevrons-left" />
              </button>
            </li>
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || isPaginationDisabled}
              >
                <i className="bx bx-chevron-left" />
              </button>
            </li>
            {pageNumbers?.map((p) => (
              <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                <button className="page-link" onClick={() => onPageChange(p)} disabled={isPaginationDisabled}>
                  {p}
                </button>
              </li>
            ))}
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || isPaginationDisabled}
              >
                <i className="bx bx-chevron-right" />
              </button>
            </li>
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages || isPaginationDisabled}
              >
                <i className="bx bx-chevrons-right" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DataTable;
