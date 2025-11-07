import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from "../../config";
import axios from "axios";

const Header = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/shortcut/shortcut_menus`, {
        params: { status: 1 },
      });
      setData(response.data);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  return (
    <header>
      <div className="topbar d-flex align-items-center">
        <nav className="navbar navbar-expand">
          <div className="mobile-toggle-menu">
            <i className="bx bx-menu" />
          </div>
          <div className="search-bar flex--grow-1">
            <div className="position-relative search-bar-box w-100">
              <input
                type="text"
                className="form--control search-control"
                placeholder="Type to search..."
              />{" "}
              <span className="position-absolute top-50 search-show translate-middle-y">
                <i className="bx bx-search" />
              </span>
              <span className="position-absolute top-50 search-close translate-middle-y">
                <i className="bx bx-x" />
              </span>
            </div>
          </div>
          <div className="top-menu ms-auto">
            <ul className="navbar-nav align-items-center">
              <li className="nav-item mobile-search-icon">
                <a className="nav-link" href="#">
                  {" "}
                  <i className="bx bx-search" />
                </a>
              </li>
            </ul>
          </div>
          <div className="user-box dropdown pe-2">
            <a
              className="d-flex align-items-center nav-link dropdown-toggle dropdown-toggle-nocaret"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className='grid-alt'>
                <i className="bx bx-grid-alt"></i>
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end  py-2">

              {loading ? (
                <li className="dropdown-item text-center px-3">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading...
                </li>
              ) : data.length > 0 ? (
                data.map((menu) => (
                  <li key={menu.id} className="px-3">
                    <Link className="dropdown-item d-flex align-items-center justify-content-between" to={menu.link || "#"}>
                      <div className="">
                        <h6 className="mb-0 text-dark">{menu.name}</h6>
                        <small>{menu.name}</small>
                      </div>
                      <i className="fadeIn animated bx bx-last-page  me-0 ps-5" />

                    </Link>
                  </li>
                ))
              ) : (
                <li className="dropdown-item text-muted text-center">No shortcuts found</li>
              )}


            </ul>
          </div>
          <div className="user-box dropdown">
            <a
              className="d-flex align-items-center nav-link dropdown-toggle dropdown-toggle-nocaret"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img src="/user.png" className="user-img" alt="user avatar" />
              <div className="user-info ps-3">
                <p className="user-name mb-0">Admin</p>
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <Link className="dropdown-item" to="/admin/site_settings">
                  <i className="bx bx-cog" />
                  <span>Settings</span>
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" to="/admin">
                  <i className="bx bx-home-circle" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <div className="dropdown-divider mb-0" />
              </li>
              <li>
                <a className="dropdown-item" href="#" onClick={handleLogout}>
                  <i className="bx bx-log-out-circle" />
                  <span>Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header