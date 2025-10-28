import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";

const UserHeader = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout, user, setUser } = useAuth();
  // const [user, setUser] = useState(null);
  const token = localStorage.getItem('user_token');

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
        if (err.response && err.response.status === 401) {
          logout();
          navigate('/login');
        } else {
          console.error(err);
        }
      }
    };
    fetchProfile();
  }, [token, user, setUser]);

  return (
    <header>
      <div className="topbar d-flex align-items-center">
        <nav className="navbar navbar-expand">
          {isLoggedIn && user && (
            <>
              <div className="flex-grow-1">
                {user.company_info && user.company_info.organization_name}
              </div>
              <div className="top-menu ms-auto me-5">
                <Link className="btn btn-primary" to="/">
                  <i className="bx bx-arrow-back me-1" />
                  <span>Back to Home</span>
                </Link>
              </div>
              <div className="user-box dropdown">
                <a
                  className="d-flex align-items-center nav-link dropdown-toggle dropdown-toggle-nocaret"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <ImageWithFallback
                    src={user.file && `${ROOT_URL}/${user.file.file}`}
                    width={50}
                    height={50}
                    showFallback={true}
                    className="user-img"
                  />
                  <div className="user-info ps-3">
                    <p className="user-name mb-0">{user.fname} {user.lname}</p>
                  </div>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bx bx-cog" />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/dashboard">
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
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default UserHeader