import React, { useState, useRef, useEffect } from "react";

const SearchDropdown = ({ id = "", options, value, onChange, placeholder = "Search..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value ? options.find(o => o.value === value)?.label || "" : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value ? options.find(o => o.value === value)?.label || "" : "");
    }
  }, [value, options, isOpen]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => (i === 0 ? filteredOptions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm(value ? options.find(o => o.value === value)?.label || "" : "");
    }
  };

  return (
    <div className="dropdown" ref={dropdownRef} style={{ position: "relative" }}>
      <input
        id={id}
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onClick={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen && (
        <ul
          className="dropdown-menu show"
          style={{
            maxHeight: 250,
            overflowY: "auto",
            width: "100%",
            marginTop: 0,
            borderRadius: "0 0 .375rem .375rem",
          }}
        >
          {filteredOptions.length === 0 ? (
            <li className="dropdown-item disabled text-muted">No results found!</li>
          ) : (
            filteredOptions?.map((opt, idx) => (
              <li
                key={opt.value}
                className={`dropdown-item ${idx === highlightedIndex ? "active" : ""}`}
                onMouseDown={() => handleSelect(opt)}
                style={{ cursor: "pointer" }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchDropdown;
