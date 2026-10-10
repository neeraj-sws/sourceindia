import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../../config";

// Text box with keyword suggestions while typing, the same suggestions the product name box and
// the website search use (spelling mistakes and synonyms included).
//   value / onChange(text)   the typed text
//   onSelect(suggestion)     a suggestion was picked: { id, title, keyword_type, ... }
//   onEnter(text)            Enter pressed without picking a suggestion
//   keywordType              "item_subcategory" | "item_category" to offer only that kind
//   source                   "admin" (default): every keyword, as in Add Product
//                            "front": what the website search suggests - only keywords that have
//                            live products, plus matching products (suggestion.type === "product")
const KeywordSuggestInput = ({
  value,
  onChange,
  onSelect,
  onEnter,
  keywordType = "",
  source = "admin",
  id,
  placeholder = "Keyword name",
  inputClassName = "form-control",
  inputStyle,
  wrapperClassName = "",
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const skipFetchRef = useRef(false); // a picked suggestion sets the text; do not suggest for it again

  useEffect(() => {
    if (skipFetchRef.current) { skipFetchRef.current = false; return undefined; }
    const text = String(value || "").trim();
    if (text.length < 2) { setSuggestions([]); setOpen(false); return undefined; }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = source === "front"
          ? await axios.post(`${API_BASE_URL}/front_menu/main-search?q=${encodeURIComponent(text)}&type=product`)
          : await axios.get(`${API_BASE_URL}/products/suggest`, { params: { query: text } });
        if (cancelled) return;
        // Website suggestions: { type: "keyword" | "product", name, keyword_id, id, url }
        const list = source === "front"
          ? (Array.isArray(res.data) ? res.data : []).map((row) => ({
            ...row,
            id: row.type === "product" ? row.id : (row.keyword_id ?? row.id),
            title: row.name,
            keyword_type: row.type === "product"
              ? "product"
              : (Number(row.item_subcategory_id) > 0 ? "item_subcategory" : "item_category"),
          }))
          : (res.data?.data || []);
        // keywordType narrows the keywords; products (website source) always stay.
        const rows = list.filter((row) => (
          !keywordType || row.type === "product" || (keywordType === "item_category"
            ? row.keyword_type === "item_category"
            : row.keyword_type !== "item_category")
        ));
        setSuggestions(rows.slice(0, 8));
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value, keywordType, source]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const pick = (suggestion) => {
    skipFetchRef.current = true;
    setOpen(false);
    setSuggestions([]);
    if (onChange) onChange(suggestion.title);
    if (onSelect) onSelect(suggestion);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) pick(suggestions[activeIndex]);
      else { setOpen(false); if (onEnter) onEnter(String(value || "").trim()); }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const level = (suggestion) => {
    if (source === "front") return suggestion.type === "product" ? "Product" : "Keyword";
    return suggestion.keyword_type === "item_category"
      ? `Item Category${suggestion.sub_category_name ? ` · ${suggestion.sub_category_name}` : ""}`
      : `Item Sub Category${suggestion.item_category_name ? ` · ${suggestion.item_category_name}` : ""}`;
  };

  return (
    <div ref={wrapperRef} className={`position-relative ${wrapperClassName}`}>
      <input
        id={id}
        type="text"
        className={inputClassName}
        style={inputStyle}
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange && onChange(event.target.value)}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {open && String(value || "").trim().length >= 2 && (
        <div
          className="position-absolute bg-white border rounded-2 shadow-sm mt-1"
          style={{ zIndex: 1050, minWidth: "100%", width: "max-content", maxWidth: 360, maxHeight: 280, overflowY: "auto", right: 0 }}
        >
          {suggestions.length === 0 ? (
            <div className="px-3 py-2 small text-muted">{loading ? "Searching..." : "No matching keyword"}</div>
          ) : suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type || suggestion.keyword_type}-${suggestion.id}`}
              type="button"
              className="d-block w-100 text-start border-0 px-3 py-2"
              style={{ backgroundColor: index === activeIndex ? "#eef4ff" : "transparent", borderBottom: "1px solid #f1f3f5" }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => { event.preventDefault(); pick(suggestion); }}
            >
              <div className="fw-semibold small text-dark">
                {source === "front" && (
                  <i className={`bx ${suggestion.type === "product" ? "bx-package" : "bx-purchase-tag-alt"} me-1 text-muted`} />
                )}
                {suggestion.title}
              </div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>{level(suggestion)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeywordSuggestInput;
