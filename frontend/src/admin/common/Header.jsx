import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <header>
      <div className="topbar d-flex align-items-center">
        <nav className="navbar navbar-expand">
          <div className="mobile-toggle-menu">
            <i className="bx bx-menu" />
          </div>
          <div className="search-bar flex-grow-1">
            <div className="position-relative search-bar-box">
              <input
                type="text"
                className="form-control search-control"
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