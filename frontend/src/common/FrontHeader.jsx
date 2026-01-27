import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import "../css/home.css";

const FrontHeader = () => {
  const { isLoggedIn, logout, user, setUser } = useAuth();
  const token = localStorage.getItem("user_token");
  const navigate = useNavigate();

  const [searchType, setSearchType] = useState("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [mobile, setMobile] = useState("+91-11-41615985");
  const [menuItems, setMenuItems] = useState([]);
  const [dropdownItems, setDropdownItems] = useState({});
  const [searchFocused, setSearchFocused] = useState(false);

  /* ================= SITE SETTINGS ================= */
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/front_menu`);
        const mainMenu = response.data.filter((item) => item.parent_id === 0);
        setMenuItems(mainMenu);
        mainMenu.forEach(async (menu) => {
          if (menu.type === 1) {
            const dropdownResponse = await axios.get(
              `${API_BASE_URL}/front_menu?parent_id=${menu.id}`
            );
            setDropdownItems((prev) => ({
              ...prev,
              [menu.id]: dropdownResponse.data,
            }));
          }
        });
      } catch (err) {
        console.error("Error fetching menu data:", err);
      }
    };
    fetchMenu();
  }, []);
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/site`);
        const data = res.data;

        if (data?.logo_file) {
          setLogoUrl(`${ROOT_URL}/${data.logo_file}`);
        }
        if (data?.mobile) {
          setMobile(data.mobile);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSiteSettings();
  }, []);

  /* ================= PROFILE ================= */
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
        logout();           // 🔥 force logout
        navigate("/login"); // optional redirect
      }
      }
    };

    fetchProfile();
  }, [token]);

  /* ================= AUTOCOMPLETE ================= */
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/front_menu/main-search?q=${searchQuery}&type=${searchType}`
        );

        setSuggestions(res.data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim().length < 3) {
      alert("Enter Product / Service Keyword(s) at least three characters");
      return;
    }

    const path =
      searchType === "product"
        ? "/products"
        : searchType === "seller"
          ? "/company-list"
          : "/buyer-list";

    navigate(`${path}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="mainHeader">
        <div className="container-xl">
          <div className="top-bar px-xl-3 d-flex justify-content-between align-items-center">
            <div className="welcomeBox d-lg-flex d-block">
              {isLoggedIn && user ? (
                <span>
                  Welcome{" "}
                  <b className="text-orange">
                    {user.is_seller ? "Seller" : "Buyer"}
                  </b>
                  !
                </span>
              ) : (
                <span className="text-nowrap">Welcome User!</span>
              )}
              <div className="text-center text-md-start d-none d-md-block">
                <span className="ms-xl-3 text-nowrap">Support: {mobile}</span>
              </div>
            </div>
            <div className="middleBox">
              <form onSubmit={handleSubmit} className="d-flex align-items-center flex-grow-1 position-relative w-100">
                <div className="search-bar-front d-flex w-100">
                  <select
                    className="form-select w-auto  px-3"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="product">Products</option>
                    <option value="seller">Seller</option>
                    <option value="buyer">Buyer</option>
                  </select>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter product / service to search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}

                    onFocus={() => {
                      setSearchFocused(true);                  // ⭐ body dark
                      if (searchQuery.length >= 3) {
                        setShowDropdown(true);
                      }
                    }}

                    onBlur={() => {
                      setTimeout(() => {
                        setSearchFocused(false);               // ⭐ remove overlay
                        setShowDropdown(false);
                      }, 2000); // click allow for suggestions
                    }}
                  />

                  <button className="btn search-btn" type="submit">
                    Search
                  </button>

                  {showDropdown && suggestions.length > 0 && (
                    <ul className="search-suggestion-box list-unstyled">
                      {suggestions.map((item) => (
                        <li
                          key={item.id}
                        >
                          <Link to={`${item.url}`}>
                            <div className="d-flex align-items-center gap-2">
                              <i className="bx bx-history"></i> {item.name}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>
            </div>
            <div className="lastbox">
              <div className="d-flex align-items-center gap-2">
                <Link
                  to="/get-support"
                  className="thLink text-center me-2 lh-1 d-flex flex-column"
                >
                  <i className="lni lni-question-circle d-block"></i>Support
                </Link>
                {isLoggedIn && user ? (
                  <div className="dropdown">
                    <div
                      className="d-flex align-items-center dropdown-toggle"
                      id="userDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      role="button"
                    >
                      <div className="position-relative me-2 user-img-login">
                        <ImageWithFallback
                          src={user.file && `${ROOT_URL}/${user.file.file}`}
                          width={50}
                          height={50}
                          showFallback={true}
                          className="user-img"
                        />
                        {/* <span className="badge bg-primary text-white position-absolute badge-sm userbadge">
                          {user.is_seller ? 'Seller' : 'Buyer'}
                        </span> */}
                      </div>
                      {/* <div className="text-start lh-sm">
                        <div className="fw-medium">{user.fname}</div>
                        <div className="fw-medium">{user.lname}</div>
                      </div> */}
                      <div className="text-start lh-sm">
                        <p className="user-name mb-0">
                          {user.fname}
                          {/* {user?.lname?.charAt(0)?.toUpperCase()} */}
                        </p>
                      </div>
                    </div>
                    <ul
                      className="dropdown-menu dropdown-menu-end mt-2"
                      aria-labelledby="userDropdown"
                    >
                      <li>
                        <Link className="dropdown-item" to="/dashboard">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="#"
                          onClick={handleLogout}
                        >
                          Logout
                        </Link>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="lastboxbtns d-flex flex-md-row flex-column gap-1">
                      <Link
                        to="/login"
                        className="btn btn-sm btnType1 text-nowrap"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/registration"
                        className="btn btn-sm btn-primary text-nowrap"
                      >
                        Join Free
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-3">
          <div className="container-xl">
            <nav className="navbar navbar-expand-lg py-0">
              <div className="container-fluid px-0">
                {/* LOGO */}
                <Link to="/" className="navbar-brand">
                  <img
                    src={logoUrl}
                    alt="Site Logo"
                    height="40"
                    className="me-2"
                    style={{ width: "auto" }}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/logo.png";
                    }}
                  />
                </Link>

                {/* DESKTOP BUTTON */}
                <a
                  href="https://elcina.com"
                  target="_blank"
                  rel="noreferrer"
                  className="post-btn d-inline-block ms-auto me-2 order-lg-3"
                >
                  ELCINA Website
                </a>

                {/* HAMBURGER */}
                <button
                  className="navbar-toggler border-0 p-0 position-relative"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#mainNavbar"
                  aria-controls="mainNavbar"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                  style={{
                    boxShadow: "unset",
                  }}
                >
                  <span className="bx bx-menu fs-1"></span>
                </button>
                {/* MENU */}
                <div
                  className="collapse navbar-collapse px-3 py-2 rounded-2 centerMenu"
                  id="mainNavbar"
                >
                  <ul className="navbar-nav mx-auto mt-0">
                    {menuItems
                      .filter(
                        (menuItem) =>
                          menuItem.is_show === 1 &&
                          menuItem.status === 1 &&
                          menuItem.type === 1
                      )
                      .map((menuItem) => {
                        const hasDropdown =
                          dropdownItems[menuItem.id] &&
                          dropdownItems[menuItem.id].length > 0;
                        return (
                          <li
                            className={`nav-item ${hasDropdown ? "dropdown" : ""
                              }`}
                            key={menuItem.id}
                          >
                            {hasDropdown ? (
                              <>
                                <a
                                  className="nav-link dropdown-toggle"
                                  href="#"
                                  id={`dropdown-${menuItem.id}`}
                                  role="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  {menuItem.name}
                                </a>
                                <ul
                                  className="dropdown-menu"
                                  aria-labelledby={`dropdown-${menuItem.id}`}
                                >
                                  {dropdownItems[menuItem.id].map((subItem) => (
                                    <li key={subItem.id}>
                                      <Link
                                        className="dropdown-item"
                                        to={subItem.link}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <Link className="nav-link" to={menuItem.link}>
                                {menuItem.name}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header >
      {searchFocused && <div className="search-overlay"></div>
      }
    </>
  );
};

export default FrontHeader;
