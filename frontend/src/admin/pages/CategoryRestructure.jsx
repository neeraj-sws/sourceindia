import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AsyncSelect from "react-select/async";
import Breadcrumb from "../common/Breadcrumb";
import DataTable from "../common/DataTable";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import { formatDateTime } from "../../utils/formatDate";
import "./CategoryRestructure.css";

const LEVELS = [
  { value: "category", label: "Category", plural: "Categories", parent: null, child: "sub categories", icon: "bx bx-category" },
  { value: "sub_category", label: "Sub Category", plural: "Sub Categories", parent: "category", child: "item categories", icon: "bx bx-folder" },
  { value: "item_category", label: "Item Category", plural: "Item Categories", parent: "sub_category", child: "item sub categories", icon: "bx bx-collection" },
  { value: "item_sub_category", label: "Item Sub Category", plural: "Item Sub Categories", parent: "item_category", child: "items", icon: "bx bx-layer" },
  { value: "item", label: "Item", plural: "Items", parent: "item_sub_category", child: null, icon: "bx bx-cube" },
];
const levelOf = (value) => LEVELS.find((l) => l.value === value) || {};

const ACTIONS = {
  move: {
    title: "Move",
    icon: "bx bx-transfer",
    text: "Shift a record, with everything under it, to a different parent. It stays at the same level.",
    example: "e.g. move Sub Category “Mobile” from Electronics to Telecom",
  },
  merge: {
    title: "Merge / Replace",
    icon: "bx bx-git-merge",
    text: "Replace one record with another existing record of the same level. Everything linked moves to the target.",
    example: "e.g. replace “Mobile” with the existing “Smartphone”",
  },
};

const AFFECTED_LABELS = {
  sub_categories: "Sub categories",
  item_category: "Item categories",
  item_subcategory: "Item sub categories",
  items: "Items",
  products: "Products",
  seller_categories: "Seller mappings",
  buyer_sourcing_interests: "Buyer interests",
  product_keywords: "Keywords",
  seller_categories_added: "Seller mappings added",
  seller_categories_duplicates_removed: "Duplicate seller mappings removed",
  buyer_sourcing_interests_duplicates_removed: "Duplicate buyer interests removed",
  product_keywords_main_removed: "Main keyword removed",
};

// Public website page for a node; matches the links used by the category browse pages.
const websiteUrl = (level, n) => {
  if (!n) return null;
  switch (level) {
    case "category":
      return n.category_slug ? `/categories/${n.category_slug}` : null;
    case "sub_category":
      return n.category_slug && n.sub_category_slug ? `/categories/${n.category_slug}/${n.sub_category_slug}` : null;
    case "item_category":
      return n.category_slug && n.sub_category_slug && n.item_category_slug
        ? `/categories/${n.category_slug}/${n.sub_category_slug}/${n.item_category_slug}`
        : null;
    case "item_sub_category":
      // The product list resolves the full hierarchy from this one id.
      return `/products?item_subcategory_id=${n.item_sub_category}`;
    case "item":
      return `/products?item_id=${n.item}`;
    default:
      return null;
  }
};

const ADMIN_LIST_URLS = {
  category: "/admin/product_categories",
  sub_category: "/admin/product_sub_categories",
  item_category: "/admin/item_category",
  item_sub_category: "/admin/item_sub_category",
  item: "/admin/new_items",
};

const ExtLink = ({ href, children, className = "" }) => (
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} <i className="bx bx-link-external small" />
    </a>
  ) : null
);

// History path where each part opens its own website page; deleted parts (e.g. a merged source) stay plain.
const PathLinks = ({ segments, fallback }) => {
  if (!segments?.length) return <span>{fallback}</span>;
  return (
    <span>
      {segments.map((seg, i) => {
        const href = seg.node ? websiteUrl(seg.level, seg.node) : null;
        return (
          <span key={i}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="crs-path-link" title={`Open ${levelOf(seg.level).label} on website`}>
                {seg.name}
              </a>
            ) : (
              <span className="text-muted" title="No longer exists (merged or deleted)">
                <s>{seg.name}</s>
              </span>
            )}
            {i < segments.length - 1 && <i className="bx bx-chevron-right mx-1 text-muted" />}
          </span>
        );
      })}
    </span>
  );
};

const productStatus = (p) => {
  if (Number(p.is_approve) !== 1) return { label: "Not approved", cls: "bg-warning text-dark" };
  if (Number(p.status) !== 1) return { label: "Inactive", cls: "bg-secondary" };
  return { label: "Live", cls: "bg-success" };
};

const ProductLinks = ({ products, title }) => {
  if (!products || products.total === 0) return null;
  return (
    <div className="mb-3">
      <div className="fw-semibold small mb-2">
        {title} <span className="text-muted fw-normal">({products.rows.length < products.total ? `showing ${products.rows.length} of ${products.total}` : products.total})</span>
      </div>
      <div className="border rounded bg-white" style={{ maxHeight: 260, overflowY: "auto" }}>
        <table className="table table-sm table-hover mb-0 align-middle">
          <thead className="table-light" style={{ position: "sticky", top: 0 }}>
            <tr><th>Product</th><th>Status</th><th className="text-end">Open</th></tr>
          </thead>
          <tbody>
            {products.rows.map((p) => {
              const st = productStatus(p);
              return (
                <tr key={p.id}>
                  <td className="small">{p.title}</td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td className="text-end text-nowrap small">
                    <ExtLink href={`/products/${p.slug || p.id}`} className="me-3">Website</ExtLink>
                    <ExtLink href={`/admin/edit_product/${p.id}`}>Admin</ExtLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="small text-muted mt-1">Only “Live” products are visible on the website.</div>
    </div>
  );
};

// After applying: the pages to open to confirm the change, each with what you should see there.
const VerifyPanel = ({ result, onClose }) => {
  const { links, action, products } = result;
  const levelInfo = levelOf(links.level);
  const parentInfo = levelOf(links.parentLevel);
  const name = links.before.name;
  const checks = [];
  if (links.oldParent) {
    checks.push({ href: websiteUrl(links.parentLevel, links.oldParent), page: `Old ${parentInfo.label}: ${links.oldParent.path}`, expect: `“${name}” should no longer be listed here.` });
  }
  if (action === "move") {
    checks.push({ href: websiteUrl(links.parentLevel, links.newParent), page: `New ${parentInfo.label}: ${links.newParent.path}`, expect: `“${name}” should now be listed here.` });
    checks.push({ href: websiteUrl(links.level, links.after), page: `${levelInfo.label}: ${links.after.path}`, expect: "Its page should open at the new path, with its items and products." });
  } else {
    checks.push({ href: websiteUrl(links.level, links.after), page: `${levelInfo.label}: ${links.after.path}`, expect: `Should now include everything that was under “${name}”.` });
  }
  checks.push({ href: ADMIN_LIST_URLS[links.level], page: `Admin: ${levelInfo.plural} list`, expect: action === "move" ? "Search the name; the parent columns should show the new path." : `“${name}” should be in Recently Deleted.` });

  return (
    <div className="alert alert-success">
      <div className="d-flex justify-content-between align-items-start">
        <h6 className="alert-heading mb-2"><i className="bx bx-check-circle me-1" /> Done. Open these pages to check the result</h6>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
      </div>
      <ol className="mb-3 ps-3">
        {checks.filter((c) => c.href).map((c) => (
          <li key={c.page} className="mb-1">
            <ExtLink href={c.href} className="fw-semibold">{c.page}</ExtLink>
            <div className="small text-dark">{c.expect}</div>
          </li>
        ))}
      </ol>
      <ProductLinks products={products} title="Moved products: open one, its category should show the new path" />
    </div>
  );
};

const getAdminId = () => {
  try {
    const admin = JSON.parse(localStorage.getItem("admin") || "null");
    return admin?.id || admin?.admin_id || null;
  } catch {
    return null;
  }
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderColor: state.isFocused ? "#00449c" : base.borderColor,
    boxShadow: state.isFocused ? "0 0 0 .2rem rgba(0,68,156,.12)" : "none",
    "&:hover": { borderColor: "#00449c" },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#00449c" : state.isFocused ? "#e8f0fb" : "white",
    color: state.isSelected ? "white" : "#212529",
    padding: "8px 12px",
  }),
  menu: (base) => ({ ...base, zIndex: 20 }),
};

// Option row: name + counts on the first line, where it currently sits on the second.
const OptionLabel = ({ option, context, level }) => {
  if (context === "value") {
    return (
      <span>
        <strong>{option.name}</strong>
        {option.parent_path && <span className="text-muted small ms-2">in {option.parent_path}</span>}
      </span>
    );
  }
  const childLabel = levelOf(level).child;
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center gap-2">
        <span className="fw-semibold">{option.name}</span>
        <span className="d-flex gap-1 flex-shrink-0">
          {childLabel && option.child_count > 0 && (
            <span className="crs-badge">{option.child_count} {childLabel}</span>
          )}
          <span className={`crs-badge ${option.product_count ? "is-primary" : ""}`}>
            {option.product_count} products
          </span>
        </span>
      </div>
      {option.parent_path && (
        <div className="small opacity-75"><i className="bx bx-subdirectory-right" /> {option.parent_path}</div>
      )}
    </div>
  );
};

// Debounced loader so typing does not fire a request per keystroke.
const useOptionLoader = (level, excludeId, onError) => {
  const timer = useRef(null);
  return useMemo(() => (input, callback) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/category_restructure/options`, {
          params: { level, search: input, limit: 50 },
        });
        callback((res.data || [])
          .filter((row) => row.id !== excludeId)
          .map((row) => ({ ...row, value: row.id, label: row.path })));
      } catch (err) {
        onError(`Could not load options from ${API_BASE_URL} (${err.response?.status || err.message}). Is the backend running with the latest code?`);
        callback([]);
      }
    }, input ? 300 : 0);
  }, [level, excludeId, onError]);
};

const PathBox = ({ title, path, highlight, tone }) => (
  <div className={`crs-path-box ${tone === "new" ? "is-new" : ""}`}>
    <div className="crs-path-title">{title}</div>
    <div className="text-break">
      {path.split(" > ").map((part, i, all) => (
        <span key={i}>
          <span className={part === highlight ? "fw-bold text-dark" : "text-secondary"}>{part}</span>
          {i < all.length - 1 && <i className="bx bx-chevron-right mx-1 text-muted" />}
        </span>
      ))}
    </div>
  </div>
);

const Step = ({ number, title, done, children }) => (
  <div className="mb-4">
    <div className="d-flex align-items-center mb-2">
      <span className={`crs-step-num me-2 ${done ? "is-done" : ""}`}>
        {done ? <i className="bx bx-check" /> : number}
      </span>
      <h6 className="mb-0">{title}</h6>
    </div>
    <div className="ps-md-5">{children}</div>
  </div>
);

const CategoryRestructure = () => {
  const { showNotification } = useAlert();
  const [action, setAction] = useState("move");
  const [level, setLevel] = useState("sub_category");
  const [source, setSource] = useState(null);
  const [target, setTarget] = useState(null);
  const [addSellerMappings, setAddSellerMappings] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const [logs, setLogs] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [logAction, setLogAction] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [logCategory, setLogCategory] = useState("");
  const [logAdmin, setLogAdmin] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [adminOptions, setAdminOptions] = useState([]);
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const availableLevels = action === "move" ? LEVELS.filter((l) => l.parent) : LEVELS;
  const targetLevel = action === "move" ? levelOf(level).parent : level;
  const levelInfo = levelOf(level);
  const targetInfo = levelOf(targetLevel);

  const loadSource = useOptionLoader(level, undefined, setError);
  const loadTarget = useOptionLoader(targetLevel, action === "merge" ? source?.value : undefined, setError);

  const startOver = () => {
    setSource(null);
    setTarget(null);
    setPreview(null);
    setError("");
    setAddSellerMappings(true);
  };

  const changeAction = (next) => {
    setAction(next);
    if (next === "move" && level === "category") setLevel("sub_category");
    startOver();
  };

  const changeLevel = (next) => {
    setLevel(next);
    startOver();
  };

  const swap = () => {
    setSource(target);
    setTarget(source);
  };

  // Preview runs as soon as both sides are chosen, so the impact is visible before anything is applied.
  useEffect(() => {
    setPreview(null);
    if (!source || !target) return;
    let cancelled = false;
    setPreviewLoading(true);
    setError("");
    axios.post(`${API_BASE_URL}/category_restructure/preview`, {
      action, level, source_id: source.value, target_id: target.value,
    })
      .then((res) => { if (!cancelled) setPreview(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || "Failed to preview changes."); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [action, level, source?.value, target?.value]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/category_restructure/logs/server-side`, {
        params: {
          page, limit, search, sortBy, sort: sortDirection,
          action: logAction, level: logLevel, category_id: logCategory, admin_id: logAdmin,
          dateRange: logDate,
          ...(logDate === "customrange" ? { startDate: logStart, endDate: logEnd } : {}),
        },
      });
      setLogs(res.data.data || []);
      setTotalRecords(res.data.totalRecords || 0);
      setFilteredRecords(res.data.filteredRecords || 0);
    } catch (err) {
      setError(`Could not load history from ${API_BASE_URL} (${err.response?.status || err.message}).`);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, limit, search, sortBy, sortDirection, logAction, logLevel, logDate, logStart, logEnd, logCategory, logAdmin]);

  // Dropdown sources for the history filters; admins are refreshed after each apply.
  const fetchFilterOptions = () => {
    axios.get(`${API_BASE_URL}/category_restructure/options`, { params: { level: "category", limit: 200 } })
      .then((res) => setCategoryOptions(res.data || []))
      .catch(() => setCategoryOptions([]));
    axios.get(`${API_BASE_URL}/category_restructure/logs/admins`)
      .then((res) => setAdminOptions(res.data || []))
      .catch(() => setAdminOptions([]));
  };
  useEffect(() => { fetchFilterOptions(); }, []);

  const activeFilterCount = [logDate, logAction, logLevel, logCategory, logAdmin, search.trim()].filter(Boolean).length;
  const setFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };
  const clearLogFilters = () => {
    setLogDate(""); setLogStart(""); setLogEnd("");
    setLogAction(""); setLogLevel(""); setLogCategory(""); setLogAdmin("");
    setSearch("");
    setPage(1);
  };

  const handleApply = async () => {
    setApplying(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/category_restructure/apply`, {
        action,
        level,
        source_id: source.value,
        target_id: target.value,
        add_seller_mappings: addSellerMappings,
        admin_id: getAdminId(),
      });
      showNotification(res.data.message, "success");
      setLastResult({ action, links: preview.links, products: preview.products });
      setShowConfirm(false);
      startOver();
      setPage(1);
      fetchLogs();
      fetchFilterOptions();
    } catch (err) {
      setShowConfirm(false);
      setError(err.response?.data?.error || "Failed to apply changes.");
    } finally {
      setApplying(false);
    }
  };

  const totalUpdated = preview?.counts.reduce((sum, c) => sum + c.count, 0) || 0;
  const newPath = preview
    ? (action === "move" ? `${preview.target.path} > ${preview.source.name}` : preview.target.path)
    : "";

  const getRangeText = () => {
    if (!filteredRecords) return "Showing 0 to 0 of 0 entries";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, filteredRecords);
    return `Showing ${start} to ${end} of ${filteredRecords} entries`;
  };

  return (
    <div className="page-wrapper crs">
      <div className="page-content">
        <Breadcrumb mainhead="Move / Merge Categories" page="Category Master" title="Move / Merge" />

        <div className="card">
          <div className="card-body p-4">
            {/* Step 1 */}
            <Step number={1} title="What do you want to do?" done={!!source}>
              <div className="row g-3">
                {Object.entries(ACTIONS).map(([key, a]) => (
                  <div className="col-md-6" key={key}>
                    <button
                      type="button"
                      onClick={() => changeAction(key)}
                      className={`crs-action-card ${action === key ? "is-active" : ""}`}
                    >
                      <div className="d-flex align-items-center">
                        <span className="crs-action-icon"><i className={a.icon} /></span>
                        <span className="crs-action-title">{a.title}</span>
                        {action === key && <i className="bx bxs-check-circle crs-action-check" />}
                      </div>
                      <div className="crs-action-text">{a.text}</div>
                      <div className="crs-action-example">{a.example}</div>
                    </button>
                  </div>
                ))}
              </div>
              {action === "merge" && (
                <div className="small text-muted mt-2">
                  <i className="bx bx-info-circle me-1" />
                  Only want to change a name? Use <strong>Edit</strong> on the list page instead: everything is linked by ID, so a rename shows everywhere automatically.
                </div>
              )}
            </Step>

            {/* Step 2 */}
            <Step number={2} title="Choose the level" done={!!source}>
              <div className="d-flex flex-wrap gap-2">
                {availableLevels.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => changeLevel(l.value)}
                    className={`crs-level ${level === l.value ? "is-active" : ""}`}
                  >
                    <i className={`${l.icon} me-1`} /> {l.label}
                  </button>
                ))}
              </div>
              {action === "move" && (
                <div className="small text-muted mt-2">
                  <i className="bx bx-info-circle me-1" />
                  A Category is the top level, so it can only be merged, not moved.
                </div>
              )}
            </Step>

            {/* Step 3 */}
            <Step number={3} title={`Select the ${levelInfo.label} and where it should go`} done={!!preview}>
              <div className="row g-3 align-items-end">
                <div className="col-lg-5">
                  <label className="form-label fw-semibold">
                    {action === "move" ? `${levelInfo.label} to move` : `${levelInfo.label} to replace`}
                  </label>
                  <AsyncSelect
                    key={`source-${level}`}
                    cacheOptions
                    defaultOptions
                    loadOptions={loadSource}
                    value={source}
                    onChange={(opt) => { setSource(opt); setTarget(null); setError(""); }}
                    formatOptionLabel={(option, { context }) => <OptionLabel option={option} context={context} level={level} />}
                    placeholder={`Type name, path or ID of ${levelInfo.label}...`}
                    noOptionsMessage={({ inputValue }) => inputValue ? `No ${levelInfo.label} found for "${inputValue}"` : "Start typing to search"}
                    loadingMessage={() => "Searching..."}
                    styles={selectStyles}
                    isClearable
                  />
                </div>

                <div className="col-lg-2 text-center pb-2">
                  {action === "merge" && source && target ? (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={swap} title="Swap source and target">
                      <i className="bx bx-transfer-alt" /> Swap
                    </button>
                  ) : (
                    <i className="bx bx-right-arrow-alt fs-2 text-muted" />
                  )}
                </div>

                <div className="col-lg-5">
                  <label className="form-label fw-semibold">
                    {action === "move" ? `New parent ${targetInfo.label}` : `Replace with ${targetInfo.label}`}
                  </label>
                  <AsyncSelect
                    key={`target-${action}-${targetLevel}-${source?.value || ""}`}
                    cacheOptions
                    defaultOptions={!!source}
                    loadOptions={loadTarget}
                    value={target}
                    onChange={(opt) => { setTarget(opt); setError(""); }}
                    formatOptionLabel={(option, { context }) => <OptionLabel option={option} context={context} level={targetLevel} />}
                    placeholder={source ? `Type name, path or ID of ${targetInfo.label}...` : `Select a ${levelInfo.label} first`}
                    noOptionsMessage={({ inputValue }) => inputValue ? `No ${targetInfo.label} found for "${inputValue}"` : "Start typing to search"}
                    loadingMessage={() => "Searching..."}
                    styles={selectStyles}
                    isDisabled={!source}
                    isClearable
                  />
                </div>
              </div>

              {source && (
                <div className="small text-muted mt-2">
                  <i className="bx bx-map-pin me-1" />
                  <strong>{source.name}</strong> is currently in <strong>{source.parent_path || "top level"}</strong>
                  {" · "}{source.product_count} products
                  {levelInfo.child && <>{" · "}{source.child_count} {levelInfo.child}</>}
                </div>
              )}
            </Step>

            {lastResult && !source && <VerifyPanel result={lastResult} onClose={() => setLastResult(null)} />}

            {error && (
              <div className="alert alert-danger d-flex align-items-start">
                <i className="bx bx-error-circle fs-5 me-2" />
                <div>{error}</div>
              </div>
            )}

            {/* Step 4 */}
            {(previewLoading || preview) && (
              <Step number={4} title="Review the impact and apply">
                {previewLoading && (
                  <div className="text-muted"><span className="spinner-border spinner-border-sm me-2" />Calculating what will change...</div>
                )}

                {preview && !previewLoading && (
                  <div className="crs-panel">
                    <div className="d-flex flex-column flex-md-row align-items-stretch gap-2 mb-3">
                      <PathBox title="Now" path={preview.source.path} highlight={preview.source.name} />
                      <div className="d-flex align-items-center justify-content-center">
                        <i className="bx bx-right-arrow-alt crs-arrow d-none d-md-inline" />
                        <i className="bx bx-down-arrow-alt crs-arrow d-md-none" />
                      </div>
                      <PathBox title="After" path={newPath} highlight={action === "move" ? preview.source.name : preview.target.name} tone="new" />
                    </div>

                    <ul className="small mb-2">
                      {preview.changes.map((c) => <li key={c}>{c}</li>)}
                    </ul>

                    <div className="small mb-3 d-flex flex-wrap gap-3">
                      <span className="text-muted">Check before applying:</span>
                      <ExtLink href={websiteUrl(level, preview.links.before)}>Current {levelInfo.label} page</ExtLink>
                      {preview.links.oldParent && (
                        <ExtLink href={websiteUrl(preview.links.parentLevel, preview.links.oldParent)}>Current parent page</ExtLink>
                      )}
                      {action === "move"
                        ? <ExtLink href={websiteUrl(preview.links.parentLevel, preview.links.newParent)}>New parent page</ExtLink>
                        : <ExtLink href={websiteUrl(level, preview.links.after)}>Target {levelInfo.label} page</ExtLink>}
                      <ExtLink href={ADMIN_LIST_URLS[level]}>Admin {levelInfo.plural} list</ExtLink>
                    </div>

                    <div className="fw-semibold small mb-2">Records that will be updated</div>
                    {preview.counts.length === 0 ? (
                      <div className="text-muted small mb-3">No linked records. Only the {levelInfo.label} itself changes.</div>
                    ) : (
                      <div className="row g-2 mb-3">
                        {preview.counts.map((c) => (
                          <div className="col-6 col-md-4 col-xl-3" key={c.table}>
                            <div className="crs-tile">
                              <div className="crs-tile-num">{c.count}</div>
                              <div className="crs-tile-label">{c.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <ProductLinks products={preview.products} title="Products that will move" />

                    {preview.sellerMappings !== null && (
                      <div className="form-check mb-3">
                        <input
                          id="addSellerMappings"
                          type="checkbox"
                          className="form-check-input"
                          checked={addSellerMappings}
                          onChange={(e) => setAddSellerMappings(e.target.checked)}
                        />
                        <label htmlFor="addSellerMappings" className="form-check-label">
                          Also add the new category / sub category to the profile of sellers whose products move
                          <span className="text-muted"> ({preview.sellerMappings} seller{preview.sellerMappings === 1 ? "" : "s"} not mapped yet)</span>
                        </label>
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-2">
                      <button type="button" className="btn btn-primary" onClick={() => setShowConfirm(true)}>
                        <i className="bx bx-check-double me-1" />
                        {action === "move" ? "Move" : "Merge"} {totalUpdated} records
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={startOver}>
                        <i className="bx bx-reset me-1" /> Start over
                      </button>
                    </div>
                  </div>
                )}
              </Step>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0"><i className="bx bx-history me-1" /> History</h6>
              {activeFilterCount > 0 && (
                <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={clearLogFilters}>
                  <i className="bx bx-x-circle me-1" />Clear filters ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="crs-filters mb-3">
              <div className="row g-2">
                <div className="col-6 col-md-4 col-xl-2">
                  <label className="crs-filter-label">Date</label>
                  <select className="form-select form-select-sm" value={logDate} onChange={setFilter(setLogDate)}>
                    <option value="">All time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 days</option>
                    <option value="last30days">Last 30 days</option>
                    <option value="thismonth">This month</option>
                    <option value="lastmonth">Last month</option>
                    <option value="customrange">Custom range...</option>
                  </select>
                </div>
                {logDate === "customrange" && (
                  <>
                    <div className="col-6 col-md-4 col-xl-2">
                      <label className="crs-filter-label">From date</label>
                      <input type="date" className="form-control form-control-sm" value={logStart} max={logEnd || undefined} onChange={setFilter(setLogStart)} />
                    </div>
                    <div className="col-6 col-md-4 col-xl-2">
                      <label className="crs-filter-label">To date</label>
                      <input type="date" className="form-control form-control-sm" value={logEnd} min={logStart || undefined} onChange={setFilter(setLogEnd)} />
                    </div>
                  </>
                )}
                <div className="col-6 col-md-4 col-xl-2">
                  <label className="crs-filter-label">Action</label>
                  <select className="form-select form-select-sm" value={logAction} onChange={setFilter(setLogAction)}>
                    <option value="">All actions</option>
                    <option value="move">Move</option>
                    <option value="merge">Merge / Replace</option>
                  </select>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <label className="crs-filter-label">Level</label>
                  <select className="form-select form-select-sm" value={logLevel} onChange={setFilter(setLogLevel)}>
                    <option value="">All levels</option>
                    {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <label className="crs-filter-label">Category</label>
                  <select className="form-select form-select-sm" value={logCategory} onChange={setFilter(setLogCategory)}>
                    <option value="">All categories</option>
                    {categoryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <label className="crs-filter-label">Done by</label>
                  <select className="form-select form-select-sm" value={logAdmin} onChange={setFilter(setLogAdmin)}>
                    <option value="">Anyone</option>
                    {adminOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "id", label: "S.No.", sortable: true },
                { key: "action", label: "Action", sortable: true },
                { key: "level", label: "Level", sortable: true },
                { key: "source_name", label: "From", sortable: true },
                { key: "target_name", label: "To", sortable: true },
                { key: "affected", label: "Records updated", sortable: false },
                { key: "admin_id", label: "Done by", sortable: true },
                { key: "created_at", label: "Date", sortable: true },
                { key: "view", label: "View", sortable: false },
              ]}
              data={logs}
              loading={logsLoading}
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
                    <span className={`crs-tag ${row.action === "move" ? "is-move" : "is-merge"}`}>
                      <i className={`${ACTIONS[row.action]?.icon || ""} me-1`} />{ACTIONS[row.action]?.title || row.action}
                    </span>
                  </td>
                  <td>{row.level_label}</td>
                  <td className="small"><PathLinks segments={row.from_segments} fallback={row.from_parent || row.source_name} /></td>
                  <td className="small"><PathLinks segments={row.to_segments} fallback={row.target_name} /></td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {Object.entries(row.affected || {}).filter(([, n]) => n > 0).map(([key, n]) => (
                        <span key={key} className="crs-badge">
                          {AFFECTED_LABELS[key] || key.replace(/_/g, " ")}: {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="small">{row.admin_name || <span className="text-muted">-</span>}</td>
                  <td className="small">{formatDateTime(row.created_at)}</td>
                  <td className="small text-nowrap">
                    {row.view
                      ? <ExtLink href={websiteUrl(row.level, row.view)}>Website</ExtLink>
                      : <span className="text-muted">Deleted</span>}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      {showConfirm && preview && (
        <>
          <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className={`${ACTIONS[action].icon} me-2`} />
                    Confirm {action === "move" ? "move" : "merge"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowConfirm(false)} disabled={applying} aria-label="Close" />
                </div>
                <div className="modal-body">
                  <div className="d-flex flex-column flex-md-row gap-2 mb-3">
                    <PathBox title="Now" path={preview.source.path} highlight={preview.source.name} />
                    <div className="d-flex align-items-center justify-content-center">
                      <i className="bx bx-right-arrow-alt crs-arrow" />
                    </div>
                    <PathBox title="After" path={newPath} highlight={action === "move" ? preview.source.name : preview.target.name} tone="new" />
                  </div>
                  <p className="mb-2">
                    <strong>{totalUpdated}</strong> linked records will be updated
                    {preview.counts.length > 0 && ` (${preview.counts.map((c) => `${c.count} ${c.label.toLowerCase()}`).join(", ")})`}.
                  </p>
                  {action === "merge" && (
                    <p className="mb-2">“{preview.source.name}” will be moved to Recently Deleted.</p>
                  )}
                  <div className="alert alert-warning small mb-0">
                    <i className="bx bx-error me-1" />
                    This cannot be undone automatically. To reverse it you would have to move it back by hand.
                  </div>
                </div>
                <div className="modal-footer justify-content-between">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)} disabled={applying}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleApply} disabled={applying}>
                    {applying
                      ? <><span className="spinner-border spinner-border-sm me-2" />Applying...</>
                      : <>Yes, {action === "move" ? "move" : "merge"} now</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
};

export default CategoryRestructure;
