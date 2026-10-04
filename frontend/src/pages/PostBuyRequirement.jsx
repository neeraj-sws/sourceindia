import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";

const MAX_QUANTITY_DIGITS = 8;

const PostBuyRequirement = () => {
  const { showNotification } = useAlert();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [form, setForm] = useState({
    product_name_snapshot: "",
    quantity: "",
    quantity_unit: "",
    description: "",
    supplier_preference: "Anywhere in India",
    buyer_name: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_company: "",
    country_code: "+91",
    country_iso: "in",
  });

  useEffect(() => {
    if (!user) return;
    const fullName = `${user.fname || ""} ${user.lname || ""}`.trim();
    const companyName = user.user_company || user.company_info?.organization_name || "";
    setForm((prev) => ({
      ...prev,
      buyer_name: prev.buyer_name || fullName,
      buyer_email: prev.buyer_email || user.email || "",
      buyer_phone: prev.buyer_phone || user.mobile || "",
      buyer_company: prev.buyer_company || companyName,
    }));
  }, [user]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [productKeyword, setProductKeyword] = useState({
    id: "",
    name: "",
    item_subcategory_id: null,
    item_category_id: null,
    subcategory_id: null,
    category_id: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);
  const suggestReqSeq = useRef(0);

  const [unitOptions, setUnitOptions] = useState([]);
  const [unitSuggestions, setUnitSuggestions] = useState([]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitRef = useRef(null);
  const phoneWrapRef = useRef(null);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState({ name: "", state: "" });
  const cityRef = useRef(null);
  const cityReqSeq = useRef(0);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const errKey = e.target.name === "buyer_name" ? "name"
      : e.target.name === "buyer_email" ? "email"
      : e.target.name;
    setErrors((prev) => (prev[errKey] ? { ...prev, [errKey]: "" } : prev));
  };

  // `maxLength` is ignored by browsers on <input type="number">, so the 8-digit
  // cap has to be enforced here. Only the quantity field routes through this
  // handler; every other input keeps using handleChange above.
  const handleQuantityChange = (e) => {
    // Quantity is a whole number: strip anything that is not a digit so a
    // decimal point can never reach state, and the controlled value snaps the
    // field back to the digits only.
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    // Over the cap: drop the keystroke instead of storing a truncated value, so
    // what the buyer sees always matches what is in state.
    if (digitsOnly.length > MAX_QUANTITY_DIGITS) return;
    setForm((prev) => ({ ...prev, quantity: digitsOnly }));
    setErrors((prev) => (prev.quantity ? { ...prev, quantity: "" } : prev));
  };

  const normalizeUnit = (v) => String(v == null ? "" : v).trim().replace(/\s+/g, " ");
  const normalizeUnitKey = (v) => normalizeUnit(v).toLowerCase();

  // A typed value that already exists in the unit list resolves to that entry
  // instead of becoming a custom/"other" value. Comparison is trim + case
  // insensitive so "capacitor array" and "  Capacitor   Array  " both map to
  // the same existing option. Returns the canonical list name, or null when
  // the value is not in the list.
  const findMatchingUnit = (v) => {
    const nv = normalizeUnitKey(v);
    if (!nv) return null;
    return unitOptions.find((u) => normalizeUnitKey(u) === nv) || null;
  };

  const handleUnitChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, quantity_unit: val }));
    setErrors((prev) => (prev.quantity_unit ? { ...prev, quantity_unit: "" } : prev));
    if (val.trim().length === 0) {
      setUnitSuggestions([]);
      setShowUnitDropdown(false);
      return;
    }
    const filtered = unitOptions.filter((u) =>
      u.toLowerCase().startsWith(val.toLowerCase())
    );
    setUnitSuggestions(filtered);
    setShowUnitDropdown(filtered.length > 0);

    // Exact (normalized) match on what was typed: snap the field to the
    // existing list value so the manual selection and the typed path submit
    // the same thing.
    const matched = findMatchingUnit(val);
    if (matched) {
      setForm((prev) => ({ ...prev, quantity_unit: matched }));
      setUnitSuggestions([]);
      setShowUnitDropdown(false);
    }
  };

  const handleUnitSelect = (unit) => {
    setForm((prev) => ({ ...prev, quantity_unit: unit }));
    setErrors((prev) => (prev.quantity_unit ? { ...prev, quantity_unit: "" } : prev));
    setUnitSuggestions([]);
    setShowUnitDropdown(false);
  };

  const fetchCities = async (query) => {
    const q = (query || "").trim();
    if (q.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setCityLoading(false);
      return;
    }
    const seq = ++cityReqSeq.current;
    setCityLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/buyer-requirements/cities/search`, {
        params: { q },
      });
      if (seq !== cityReqSeq.current) return;
      const list = (Array.isArray(res.data) ? res.data : []).map((c) => ({
        id: c.id,
        name: c.name,
        state: c.States?.name || "",
      }));
      setCitySuggestions(list);
      setShowCityDropdown(list.length > 0);
    } catch (err) {
      if (seq !== cityReqSeq.current) return;
      setCitySuggestions([]);
      setShowCityDropdown(false);
    } finally {
      if (seq === cityReqSeq.current) setCityLoading(false);
    }
  };

  const handleCityInput = (value) => {
    setSelectedCity({ name: value, state: "" });
    setErrors((prev) => (prev.city ? { ...prev, city: "" } : prev));
    setShowCityDropdown(true);
    fetchCities(value);
  };

  const selectCity = (city) => {
    setSelectedCity({ name: city.name, state: city.state });
    setErrors((prev) => (prev.city ? { ...prev, city: "" } : prev));
    setCitySuggestions([]);
    setShowCityDropdown(false);
  };

  const fetchSuggestions = async (query) => {
    const q = (query || "").trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setSuggestLoading(false);
      return;
    }
    const seq = ++suggestReqSeq.current;
    setSuggestLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/front_menu/main-search`, null, {
        params: {
          type: "product",
          all: 1,
          q,
        },
      });
      if (seq !== suggestReqSeq.current) return;
      setSuggestions(Array.isArray(res.data) ? res.data : []);
      setShowDropdown(true);
    } catch (err) {
      if (seq !== suggestReqSeq.current) return;
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      if (seq === suggestReqSeq.current) setSuggestLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const value = e.target.value;
    setProductKeyword((prev) => ({
      ...prev,
      name: value,
      id: "",
      item_subcategory_id: null,
      item_category_id: null,
      subcategory_id: null,
      category_id: null,
    }));
    setErrors((prev) => (prev.product ? { ...prev, product: "" } : prev));
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleProductFocus = () => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (productKeyword.name.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    fetchSuggestions(productKeyword.name);
  };

  const selectProduct = (item) => {
    setProductKeyword({
      id: item.keyword_id || item.id,
      name: item.name,
      item_subcategory_id: item.item_subcategory_id || null,
      item_category_id: item.item_category_id || null,
      subcategory_id: item.subcategory_id || null,
      category_id: item.category_id || null,
    });
    setErrors((prev) => (prev.product ? { ...prev, product: "" } : prev));
    setShowDropdown(false);
  };

  const closeSuggestions = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  useEffect(() => () => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
  }, []);

  // Unit options come from the units table so the list can be maintained on the
  // database instead of in this component.
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/buyer-requirements/units`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setUnitOptions(rows.map((u) => u.name).filter(Boolean));
      } catch (err) {
        console.error("Error fetching units", err);
      }
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (unitRef.current && !unitRef.current.contains(e.target)) {
        setShowUnitDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const wrap = phoneWrapRef.current;
    if (!wrap) return;

    const applyDirection = () => {
      const input = wrap.querySelector(".form-control");
      const list = wrap.querySelector(".country-list");
      if (!input || !list) return;
      const inputRect = input.getBoundingClientRect();
      const listHeight = list.offsetHeight || 260;
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;
      const openUp = spaceBelow < listHeight && spaceAbove >= spaceBelow;
      wrap.classList.toggle("pbr-phone-up", openUp);
    };

    const onPhoneClick = (e) => {
      if (e.target.closest(".selected-flag") || e.target.closest(".arrow")) {
        requestAnimationFrame(applyDirection);
        setTimeout(applyDirection, 60);
      }
    };

    const onViewportChange = () => {
      if (wrap.querySelector(".country-list")) applyDirection();
    };

    wrap.addEventListener("click", onPhoneClick);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      wrap.removeEventListener("click", onPhoneClick);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, []);

  const fieldIds = {
    product: "pbr-product",
    quantity: "pbr-quantity",
    quantity_unit: "pbr-unit",
    name: "pbr-name",
    email: "pbr-email",
    phone: "pbr-phone",
    city: "pbr-city",
  };

  const validate = () => {
    const e = {};
    // A product is required, but it does NOT have to come from the suggestion
    // list: a name the buyer typed themselves is accepted too. When they picked
    // a suggestion, productKeyword.id holds its keyword_id and the backend
    // records the requirement as a list ("admin") entry; when they did not, id
    // stays empty and it is recorded as their own ("other") entry.
    if (!productKeyword.name.trim()) e.product = "Please Enter Products";
    if (!form.quantity || String(form.quantity).trim() === "") {
      e.quantity = "Please Enter Quantity.";
    } else if (!/^\d+$/.test(String(form.quantity))) {
      e.quantity = "Please Enter a Whole Number Quantity.";
    } else if (String(form.quantity).length > MAX_QUANTITY_DIGITS) {
      e.quantity = `Please Enter a Quantity of up to ${MAX_QUANTITY_DIGITS} digits.`;
    } else if (Number(form.quantity) <= 0) {
      e.quantity = "Please Enter a Valid Quantity.";
    }
    if (!form.quantity_unit || form.quantity_unit.trim() === "") {
      e.quantity_unit = "Please Enter Quantity Unit.";
    }
    if (!form.buyer_name || form.buyer_name.trim() === "") {
      e.name = "Please Enter Your Name.";
    }
    const email = String(form.buyer_email || "").trim();
    if (!email) {
      e.email = "Please Enter Your Email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please Enter a Valid Email.";
    }
    const phone = String(form.buyer_phone || "").replace(/\D/g, "");
    if (!phone) {
      e.phone = "Please Enter Mobile Number.";
    } else if (phone.length !== 10) {
      e.phone = "Please Enter a Valid 10-Digit Mobile Number.";
    }
    if (!selectedCity.name.trim()) {
      e.city = "Please Select Your City.";
    } else if (!selectedCity.state) {
      e.city = "Please Select Your City From the List.";
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const matchedUnit = findMatchingUnit(form.quantity_unit);
    if (matchedUnit) {
      setForm((prev) => ({ ...prev, quantity_unit: matchedUnit }));
    }
    const v = validate();
    setErrors(v);
    const firstKey = Object.keys(v)[0];
    if (firstKey) {
      const el = document.getElementById(fieldIds[firstKey]);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const payload = {
      product_name_snapshot: productKeyword.name,
      product_keyword_id: productKeyword.id,
      item_subcategory_id: productKeyword.item_subcategory_id,
      item_category_id: productKeyword.item_category_id,
      subcategory_id: productKeyword.subcategory_id,
      category_id: productKeyword.category_id,
      quantity: form.quantity,
      // No list match: submit the buyer's own text, only trimmed/collapsed -
      // the existing custom-unit behaviour is left untouched.
      quantity_unit: matchedUnit || normalizeUnit(form.quantity_unit),
      description: form.description,
      supplier_preference: form.supplier_preference,
      buyer_name: form.buyer_name,
      buyer_email: form.buyer_email,
      buyer_phone: form.buyer_phone,
      buyer_country_code: `${form.country_iso.toUpperCase()}^${form.country_code.replace("+", "")}`,
      buyer_company: form.buyer_company,
      buyer_city: selectedCity.name,
      buyer_state: selectedCity.state,
    };
    try {
      const token = localStorage.getItem("user_token");
      await axios.post(`${API_BASE_URL}/buyer-requirements/create`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setForm({
        product_name_snapshot: "", quantity: "", quantity_unit: "", description: "",
        supplier_preference: "Anywhere in India",
        buyer_name: "", buyer_email: "", buyer_phone: "", buyer_company: "",
        country_code: "+91", country_iso: "in",
      });
      setProductKeyword({
        id: "", name: "", item_subcategory_id: null, item_category_id: null,
        subcategory_id: null, category_id: null,
      });
      setSuggestions([]);
      setShowDropdown(false);
      setSelectedCity({ name: "", state: "" });
      setCitySuggestions([]);
      setShowCityDropdown(false);
      setErrors({});
      setShowThankYouPopup(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit requirement";
      showNotification(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeThankYouPopup = () => {
     if (!isLoggedIn) {
    setShowThankYouPopup(false);
    navigate("/registration");
    return;
  }
    setShowThankYouPopup(false);
  };

  const goRegister = () => {
    setShowThankYouPopup(false);
    navigate("/registration");
  };

  return (
    <div className="pbr-page">
      {/* ============ HERO ============ */}
      <section className="pbr-hero">
        <div className="pbr-hero-inner">
          <h1>Let Us know What You Need</h1>
          <p>Just complete these simple steps. Get Instant quotes from Verified Suppliers</p>
        </div>
      </section>

      {/* ============ MAIN CARD ============ */}
      <section className="pbr-wrap">
        <div className="pbr-card">
          {/* ---------- LEFT COLUMN: FORM ---------- */}
          <div className="pbr-left">
            <h2 className="pbr-title">Requirement Details</h2>

            <form onSubmit={handleSubmit}>
              <div className="pbr-field">
                <label className="pbr-label" htmlFor="pbr-product">Product</label>
                <div className="pbr-autocomplete">
                  <input
                    id="pbr-product"
                    type="text"
                    className={`pbr-input ${errors.product ? "pbr-input-error" : ""}`}
                    style={errors.product ? { borderColor: "#e74c3c" } : undefined}
                    value={productKeyword.name}
                    onChange={handleProductChange}
                    onFocus={handleProductFocus}
                    onBlur={closeSuggestions}
                    placeholder="Products you are looking for"
                    maxLength={120}
                    autoComplete="off"
                  />
                  {suggestLoading && (
                    <span className="pbr-suggest-spinner">
                      <i className="bx bx-loader-circle bx-spin"></i>
                    </span>
                  )}
                  {showDropdown && suggestions.length > 0 && (
                    <ul className="search-suggestion-box list-unstyled">
                      {suggestions.map((item) => (
                        <li
                          key={item.id || item.keyword_id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectProduct(item);
                          }}
                          style={{ cursor: "pointer" }}
                          className="search-suggestion-item"
                        >
                          <div className="suggestion-row">
                            <span className="search-suggestion-icon">
                              <i className="bx bx-history" />
                            </span>
                            <div className="search-suggestion-content">
                              <div className="search-suggestion-title">{item.name}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {errors.product && <div className="pbr-error">{errors.product}</div>}
              </div>

              <div className="pbr-row">
                <div className="pbr-col pbr-col-qty">
                  <label className="pbr-label" htmlFor="pbr-quantity">Quantity</label>
                  <input
                    id="pbr-quantity"
                    type="number"
                    className={`pbr-input ${errors.quantity ? "pbr-input-error" : ""}`}
                    style={errors.quantity ? { borderColor: "#e74c3c" } : undefined}
                    name="quantity"
                    value={form.quantity}
                    onChange={handleQuantityChange}
                    placeholder="Quantity"
                    maxLength={MAX_QUANTITY_DIGITS}
                  />
                  {errors.quantity && <div className="pbr-error">{errors.quantity}</div>}
                </div>
                <div className="pbr-col pbr-col-unit">
                  <label className="pbr-label pbr-label-hidden">
      Unit of Measurement
    </label>
                  <div className="pbr-unit-wrap" ref={unitRef}>
                    <input
                      id="pbr-unit"
                      type="text"
                      className={`pbr-input ${errors.quantity_unit ? "pbr-input-error" : ""}`}
                      style={errors.quantity_unit ? { borderColor: "#e74c3c" } : undefined}
                      name="quantity_unit"
                      value={form.quantity_unit}
                      onChange={handleUnitChange}
                      onFocus={handleUnitChange}
                      placeholder="Unit of Measurement"
                      maxLength="30"
                      autoComplete="off"
                    />
                    {showUnitDropdown && unitSuggestions.length > 0 && (
                      <ul className="pbr-unit-list">
                        {unitSuggestions.map((u) => (
                          <li key={u} onClick={() => handleUnitSelect(u)}>
                            {u}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.quantity_unit && <div className="pbr-error">{errors.quantity_unit}</div>}
                </div>
              </div>


              {/* <div className="pbr-field">
                <label className="pbr-label">Describe your Requirement</label>
                <textarea className="pbr-input" name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Enter Additional details about your requirement..."></textarea>
              </div> */}

              <div className="pbr-field">
                <label className="pbr-label">Supplier Preference</label>
                <div className="pbr-radios">
                  {["Anywhere in India", "Within My State", "Within My City"].map((opt) => (
                    <label key={opt} className="pbr-radio">
                      <input
                        type="radio"
                        name="supplier_preference"
                        value={opt}
                        checked={form.supplier_preference === opt}
                        onChange={handleChange}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pbr-grid2">
                <div className="pbr-field">
                  <label className="pbr-label" htmlFor="pbr-name">Name</label>
                  <input
                    id="pbr-name"
                    type="text"
                    className={`pbr-input ${errors.name ? "pbr-input-error" : ""}`}
                    style={errors.name ? { borderColor: "#e74c3c" } : undefined}
                    name="buyer_name"
                    value={form.buyer_name}
                    onChange={handleChange}
                    placeholder="Enter Your Name"
                    maxLength={100}
                    autoComplete="name"
                  />
                  {errors.name && <div className="pbr-error">{errors.name}</div>}
                </div>

                <div className="pbr-field">
                  <label className="pbr-label" htmlFor="pbr-email">Email</label>
                  <input
                    id="pbr-email"
                    type="email"
                    className={`pbr-input ${errors.email ? "pbr-input-error" : ""}`}
                    style={errors.email ? { borderColor: "#e74c3c" } : undefined}
                    name="buyer_email"
                    value={form.buyer_email}
                    onChange={handleChange}
                    placeholder="Enter Your Email"
                    maxLength={150}
                    autoComplete="email"
                  />
                  {errors.email && <div className="pbr-error">{errors.email}</div>}
                </div>
              </div>

              <div className="pbr-grid2">
                  <div className="pbr-field">
                    <label className="pbr-label">Mobile Number</label>
                    <div className={`pbr-phone-outer ${errors.phone ? "pbr-phone-outer--error" : ""}`} ref={phoneWrapRef} id="pbr-phone" style={errors.phone ? { borderColor: "#e74c3c" } : undefined}>
                      <PhoneInput
                        country={form.country_iso}
                        value={form.country_code.replace("+", "") + form.buyer_phone}
                        onChange={(value, country) => {
                          const dial = country?.dialCode || "";
                          const digits = value.slice(dial.length).replace(/\D/g, "").slice(0, 10);
                          setForm((prev) => ({
                            ...prev,
                            country_code: `+${dial}`,
                            country_iso: country?.countryCode || country?.iso2 || prev.country_iso,
                            buyer_phone: digits,
                          }));
                          setErrors((prev) => (prev.phone ? { ...prev, phone: "" } : prev));
                        }}
                        containerClass="pbr-phone-wrap w-100"
                        inputClass="form-control"
                        placeholder="Enter Mobile Number"
                      />
                    </div>
                    {errors.phone && <div className="pbr-error">{errors.phone}</div>}
                  </div>

                  <div className="pbr-field">
                    <label className="pbr-label" htmlFor="pbr-city">City</label>
                    <div className="pbr-autocomplete" ref={cityRef}>
                      <input
                        id="pbr-city"
                        type="text"
                        className={`pbr-input ${errors.city ? "pbr-input-error" : ""}`}
                        style={errors.city ? { borderColor: "#e74c3c" } : undefined}
                        placeholder="Select your city"
                        value={selectedCity.name}
                        onChange={(e) => handleCityInput(e.target.value)}
                        onFocus={() => { if (selectedCity.name.trim().length >= 2) fetchCities(selectedCity.name); }}
                        autoComplete="off"
                      />
                      {cityLoading && (
                        <span className="pbr-suggest-spinner">
                          <i className="bx bx-loader-circle bx-spin"></i>
                        </span>
                      )}
                      {showCityDropdown && citySuggestions.length > 0 && (
                        <ul className="search-suggestion-box list-unstyled">
                          {citySuggestions.map((c) => (
                            <li key={c.id} onMouseDown={(e) => { e.preventDefault(); selectCity(c); }}>
                              {c.name}
                              {c.state ? <span className="text-muted"> · {c.state}</span> : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {errors.city && <div className="pbr-error">{errors.city}</div>}
                  </div>
                </div>

              <div className="pbr-submit-row">
                <button type="submit" className="pbr-submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Requirement"}
                </button>
                <p className="pbr-terms">
                  By clicking Submit Requirement, I accept the{" "}
                  <Link to="/terms_conditions">T&amp;C</Link> and{" "}
                  <Link to="/privacy_policy">Privacy Policy</Link>
                </p>
              </div>
            </form>
          </div>

          <div className="pbr-divider"></div>

          {/* ---------- RIGHT COLUMN: BUYERS ADVANTAGES ---------- */}
          <aside className="pbr-right">
            <h2 className="pbr-title">Buyers Advantages?</h2>
            <div className="pbr-divider-line"></div>

            <ul className="pbr-adv-list">
              <li className="pbr-adv-item">
                <span className="pbr-adv-icon">
                  <img src="imediate-responses.png" alt="Immediate Responses" className="pbr-adv-img" />
                </span>
                <div className="pbr-adv-text">
                  <h3>Immediate Responses</h3>
                  <p>Get Instant Feedback from Suppliers.</p>
                </div>
              </li>
              <li className="pbr-adv-divider"></li>
              <li className="pbr-adv-item">
                <span className="pbr-adv-icon">
                  <img src="genuine-suppliers.png" alt="Genuine Suppliers" className="pbr-adv-img" />
                </span>
                <div className="pbr-adv-text">
                  <h3>Genuine Suppliers</h3>
                  <p>Accredited Suppliers that Meet Your Needs.</p>
                </div>
              </li>
              <li className="pbr-adv-divider"></li>
              <li className="pbr-adv-item">
                <span className="pbr-adv-icon">
                  <img src="multiple-choices.png" alt="Multiple Choices" className="pbr-adv-img" />
                </span>
                <div className="pbr-adv-text">
                  <h3>Multiple Choices</h3>
                  <p>Get the power to choose the best!</p>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* Post-submit popup: the provided image is the whole popup content.
          Container sizing and responsiveness live in .pbr-thankyou-* (style.css). */}
      {showThankYouPopup && (
        <>
          <div
            className="modal fade show pbr-thankyou-modal"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{ display: "block" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeThankYouPopup();
            }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <button
                  type="button"
                  className="btn-close position-absolute top-0 end-0 m-2"
                  onClick={closeThankYouPopup}
                  aria-label="Close"
                ></button>
                <div className="pbr-thankyou-media">
                  <img src="/thank-u-pop-up.png" alt="Requirement submitted" />
                  {!isLoggedIn && (
                    <div className="pbr-thankyou-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={closeThankYouPopup}
                      >
                        Continue Browsing
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={goRegister}
                      >
                        Register Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop fade show pbr-thankyou-backdrop"
            aria-label="Close"
            onClick={closeThankYouPopup}
          ></button>
        </>
      )}
    </div>
  );
};

export default PostBuyRequirement;