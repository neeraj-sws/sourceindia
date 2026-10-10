import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

// Filter for the admin Category Master lists (Category, Sub Category, Item Category,
// Item Sub Category, Items). Each list filters by the levels above it; a level's options depend
// on the level chosen before it, so only options that fit are offered.
//
//   const filter = useCategoryListFilter({ levels: ["category", "subcategory"], rowFields, onChange });
//   axios.get(url, { params: { ...other, ...filter.params } })        // server-side list
//   <DataTable toolbar={filter.toolbar} filterPanel={filter.panel} />  // button + panel + chips
//   filter.filterRows(allRows)                                         // same filter for the Excel export

const LEVELS = [
  { key: "category", param: "category_id", label: "Category", plural: "Categories" },
  { key: "subcategory", param: "subcategory_id", label: "Sub Category", plural: "Sub Categories" },
  { key: "itemCategory", param: "item_category_id", label: "Item Category", plural: "Item Categories" },
  { key: "itemSubCategory", param: "item_subcategory_id", label: "Item Sub Category", plural: "Item Sub Categories" },
];
const STATUS_OPTIONS = [{ id: "1", name: "Active" }, { id: "0", name: "Inactive" }];
const EMPTY = { category_id: "", subcategory_id: "", item_category_id: "", item_subcategory_id: "", status: "" };

const fetchList = async (url) => {
  try {
    const res = await axios.get(url);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

const useCategoryListFilter = ({ levels = [], rowFields = {}, onChange } = {}) => {
  const [values, setValues] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({ category: [], subcategory: [], itemCategory: [], itemSubCategory: [] });

  const activeLevels = LEVELS.filter((level) => levels.includes(level.key));
  const uses = (key) => levels.includes(key);
  const { category_id: categoryId, subcategory_id: subCategoryId, item_category_id: itemCategoryId } = values;

  useEffect(() => {
    if (!uses("category")) return;
    fetchList(`${API_BASE_URL}/categories?is_delete=0`).then((rows) => setOptions((prev) => ({ ...prev, category: rows })));
  }, []);

  useEffect(() => {
    if (!uses("subcategory")) return;
    if (!categoryId) { setOptions((prev) => ({ ...prev, subcategory: [] })); return; }
    fetchList(`${API_BASE_URL}/sub_categories/category/${categoryId}`)
      .then((rows) => setOptions((prev) => ({ ...prev, subcategory: rows })));
  }, [categoryId]);

  useEffect(() => {
    if (!uses("itemCategory")) return;
    if (!categoryId || !subCategoryId) { setOptions((prev) => ({ ...prev, itemCategory: [] })); return; }
    fetchList(`${API_BASE_URL}/item_category/by-category-subcategory/${categoryId}/${subCategoryId}`)
      .then((rows) => setOptions((prev) => ({ ...prev, itemCategory: rows })));
  }, [categoryId, subCategoryId]);

  useEffect(() => {
    if (!uses("itemSubCategory")) return;
    if (!categoryId || !subCategoryId || !itemCategoryId) { setOptions((prev) => ({ ...prev, itemSubCategory: [] })); return; }
    fetchList(`${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${categoryId}/${subCategoryId}/${itemCategoryId}`)
      .then((rows) => setOptions((prev) => ({ ...prev, itemSubCategory: rows })));
  }, [categoryId, subCategoryId, itemCategoryId]);

  // Choosing a level clears the levels under it: their options no longer fit.
  const setValue = (param, value) => {
    setValues((prev) => {
      const next = { ...prev, [param]: value };
      const index = LEVELS.findIndex((level) => level.param === param);
      if (index >= 0) LEVELS.slice(index + 1).forEach((level) => { next[level.param] = ""; });
      return next;
    });
    if (onChange) onChange();
  };
  const clearAll = () => {
    setValues(EMPTY);
    if (onChange) onChange();
  };

  const params = useMemo(() => {
    const result = {};
    activeLevels.forEach((level) => { if (values[level.param]) result[level.param] = values[level.param]; });
    if (values.status !== "") result.status = values.status;
    return result;
  }, [values, levels.join(",")]);
  const paramsKey = JSON.stringify(params);

  const optionName = (levelKey, id) => {
    const found = options[levelKey].find((option) => String(option.id) === String(id));
    return found ? found.name : "";
  };
  const chips = [
    ...activeLevels.filter((level) => values[level.param])
      .map((level) => ({ param: level.param, text: `${level.label}: ${optionName(level.key, values[level.param])}` })),
    ...(values.status !== "" ? [{ param: "status", text: `Status: ${values.status === "1" ? "Active" : "Inactive"}` }] : []),
  ];

  // Same filter on rows already loaded (the Excel export); rowFields maps a filter to its row field.
  const filterRows = (rows = []) => rows.filter((row) => Object.entries(params).every(([param, value]) => {
    const field = rowFields[param] || param;
    return String(row[field] ?? "") === String(value);
  }));

  // Up to three filters share one row; with more, the levels fill the first row left to right
  // (Category > ... > Item Sub Category) and Status starts the next one.
  const columnClass = activeLevels.length + 1 >= 4 ? "col-sm-6 col-lg-3" : "col-sm-6 col-lg-4";

  const renderSelect = (param, label, list, disabled, placeholder) => {
    const chosen = values[param] !== "";
    const style = disabled
      ? { backgroundColor: "#f1f5f9", color: "#94a3b8", borderColor: "#e2e8f0" }
      : (chosen ? { borderColor: "#2563eb", boxShadow: "0 0 0 1px #2563eb inset" } : undefined);
    return (
      <div className={columnClass} key={param}>
        <label className="form-label small fw-semibold text-secondary mb-1" htmlFor={`list-filter-${param}`}>{label}</label>
        <select
          id={`list-filter-${param}`}
          className="form-select form-select-sm"
          style={style}
          title={chosen ? (list.find((option) => String(option.id) === String(values[param]))?.name || "") : undefined}
          value={values[param]}
          disabled={disabled}
          onChange={(e) => setValue(param, e.target.value)}
        >
          <option value="">{placeholder}</option>
          {list.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>
    );
  };

  const toolbar = (
    <button
      type="button"
      className={`btn btn-sm ms-2 text-nowrap ${chips.length ? "btn-primary" : "btn-outline-secondary"}`}
      onClick={() => setOpen((prev) => !prev)}
      aria-expanded={open}
    >
      <i className="bx bx-filter-alt me-1" />
      Filter{chips.length ? ` (${chips.length})` : ""}
      <i className={`bx ${open ? "bx-chevron-up" : "bx-chevron-down"} ms-1`} />
    </button>
  );

  const chipStyle = { backgroundColor: "#e8f0fe", color: "#0b3d91", border: "1px solid #c6d8fb" };

  const panel = (
    <>
      {open && (
        <div className="rounded-3 p-3 mt-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
            <div>
              <div className="fw-semibold"><i className="bx bx-filter-alt me-1" />Filter this list</div>
              {activeLevels.length > 1 && (
                <div className="small text-muted">Pick a level to see the options of the next one.</div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-nowrap"
              onClick={clearAll}
              disabled={chips.length === 0}
            >
              <i className="bx bx-reset me-1" />Clear filters
            </button>
          </div>
          <div className="row g-3">
            {activeLevels.map((level, index) => {
              const parent = index > 0 ? activeLevels[index - 1] : null;
              const waitingForParent = Boolean(parent) && !values[parent.param];
              return renderSelect(
                level.param,
                level.label,
                options[level.key],
                waitingForParent,
                waitingForParent ? `Select ${parent.label} first` : `All ${level.plural}`
              );
            })}
            {renderSelect("status", "Status", STATUS_OPTIONS, false, "Any status")}
          </div>
        </div>
      )}
      {chips.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
          <span className="small text-muted"><i className="bx bx-filter me-1" />Showing only:</span>
          {chips.map((chip) => (
            <span key={chip.param} className="d-inline-flex align-items-center rounded-pill small px-3 py-1" style={chipStyle}>
              {chip.text}
              <button
                type="button"
                className="btn-close ms-2"
                style={{ fontSize: "0.55em" }}
                aria-label={`Remove ${chip.text}`}
                onClick={() => setValue(chip.param, "")}
              />
            </span>
          ))}
          {!open && (
            <button type="button" className="btn btn-sm btn-link text-secondary text-decoration-none p-0" onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );

  return { values, params, paramsKey, toolbar, panel, filterRows, hasFilters: chips.length > 0 };
};

export default useCategoryListFilter;
