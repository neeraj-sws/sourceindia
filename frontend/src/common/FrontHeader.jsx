import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from '../config';
import ImageWithFallback from "../admin/common/ImageWithFallback";
import "../css/home.css";

const FrontHeader = () => {
  const { isLoggedIn, logout, user, setUser } = useAuth();
  // const [user, setUser] = useState(null);
  const token = localStorage.getItem('user_token');
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('product'); // Default to 'product'
  const [searchQuery, setSearchQuery] = useState(''); // Store search input value

  useEffect(() => {
    const checkToken = () => {
      setIsLoggedIn(!!localStorage.getItem('user_token'));
    };
    window.addEventListener('storage', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    // localStorage.removeItem('user_token');
    // setIsLoggedIn(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || user) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, [token, user, setUser]);


  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (searchQuery.trim()) {
      const path = searchType === 'product' ? '/products' : '/company-list';
      navigate(`${path}?search=${encodeURIComponent(searchQuery.trim())}`); // Navigate with query param
    }
  };

  return (
    <>
      <header className='mainHeader'>
        <div className='container'>
          <div className="top-bar px-3 d-flex justify-content-between align-items-center">
            <div className="welcomeBox d-flex">
              {isLoggedIn && user ? (
                <span>Welcome <b className="text-orange">{user.is_seller ? 'Seller' : 'Buyer'}</b>!</span>
              ) : (
                <span>Welcome User!</span>
              )}
              <div className="text-center text-md-start d-none d-md-block">
                <span className="ms-3">Support: +91-11-41615985</span>
              </div>
            </div>
            <div className="middleBox">
              <form className="d-flex align-items-center flex-grow-1" onSubmit={handleSubmit}>
                <div className="search-bar d-flex w-100">
                  <select
                    className="form-select w-auto px-3"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="product">Product</option>
                    <option value="company">Company</option>
                  </select>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search.."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn search-btn" type="submit">
                    Search
                  </button>
                </div>
              </form>
            </div>
            <div className="lastbox">
              <div className="d-flex align-items-center gap-2">
                <Link to="/get-support" className="thLink text-center me-2 lh-1">
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
                      <div className="position-relative me-2">
                        {/* <div className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px", border: "1px solid #ccc" }}>
                          <i className="bx bx-user"></i>
                        </div> */}
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
                      <div className="text-start lh-sm">
                        <div className="fw-medium">{user.fname}</div>
                        <div className="fw-medium">{user.lname}</div>
                      </div>
                    </div>
                    <ul className="dropdown-menu dropdown-menu-end mt-2" aria-labelledby="userDropdown">
                      <li><Link className="dropdown-item" to="/dashboard">Dashboard</Link></li>
                      <li><Link className="dropdown-item" to="#" onClick={handleLogout}>Logout</Link></li>
                    </ul>
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-sm btnType1">Sign In</Link>
                    <Link to="/registration" className="btn btn-sm btn-primary">Join Free</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-3">
          <div className="container">
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <div>
                <Link to="/" className="d-flex align-items-center text-decoration-none">
                  <img src="/logo.png" alt="Logo" height="40" className="me-2" />
                </Link>
              </div>
              <div className="centerMenu">
                <nav className="navbar navbar-expand-lg">
                  <div className="">
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
                      <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="mainNavbar">
                      <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                          <Link className="nav-link active" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                          <Link className="nav-link" to="/categories">Product Categories</Link>
                        </li>
                        <li className="nav-item dropdown">
                          <a className="nav-link dropdown-toggle" href="#" id="companyDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Companies
                          </a>
                          <ul className="dropdown-menu" aria-labelledby="companyDropdown">
                            <li><Link className="dropdown-item" to="/company-list">Seller <small><i>(Manufacturer)</i></small></Link></li>
                            <li><Link className="dropdown-item" to="/buyer-list">Buyers</Link></li>
                            <li><Link className="dropdown-item" to="/trading-list">Distributors</Link></li>
                          </ul>
                        </li>
                        <li className="nav-item">
                          <a className="nav-link" href="https://event.sourceindia-electronics.com/">Event</a>
                        </li>
                        <li className="nav-item">
                          <Link className="nav-link" to="/open-enquiry">Enquiry</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </nav>
              </div>
              <div><a href="https://elcina.com" className="post-btn" target="_blank">ELCINA Website</a></div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default FrontHeader