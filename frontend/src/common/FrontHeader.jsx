import React from 'react'
import { Link } from 'react-router-dom';

const FrontHeader = () => {
  return (
    <>
    <div className="topHeader">
    <div className="container">
      <div className="elcinTopbar d-flex align-items-center justify-content-between py-2">
        <div className="p-md-2 elcinaLogo">
          <Link className="navbar-brand headerLogo" to="/">
            <img src="/logo.png" className="img-fluid" alt="Elcina" width={200} />
          </Link>
          <div className="elicinaToggle">
            <button
              className="navbar-toggler navToggle"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapsibleNavbar"
            >
              <span className="line1" />
              <span className="line2" />
              <span className="line3" />
            </button>
          </div>
        </div>
        <div className="p-lg-2 elcinaSearchBar">
          <form id="header_search_form" action="/" method="get">
            <div className="input-group mt-3 mb-md-3 mb-1">
              <select
                className="elcinaSearchSelect"
                id="search_cat"
                name="type"
                defaultValue="product"
              >
                <option value="product">Product</option>
                <option value="company-list">Company</option>
              </select>
              <input
                type="text"
                className="form-control"
                name="search"
                placeholder="Search"
                defaultValue=""
              />
              <button className="btn btn-dark" type="submit">Search</button>
            </div>
          </form>
        </div>
        <div className="elcinTopbarRight d-flex align-items-center justify-content-lg-end justify-content-center justify-content-center">
          <div className="p-lg-2 ms-2 ms-lg-0 elcinaTopMenu">
            <div className="d-flex topHeaderInner align-items-center justify-content-lg-end justify-content-center py-sm-0 py-2">
              <div className="ms-xl-4 ms-2 topHeaderAccount">
                <Link to="/login" className="thLink">
                  <i className="bx bx-log-in pe-1" aria-hidden="true" /> Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Products
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Companies
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Registration
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Event
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Enquiry
              </a>
            </li>
            <li className="nav-item">
              <a className="btn btn-warning text-light" href="#">ELCINA Website</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    </>
  )
}

export default FrontHeader