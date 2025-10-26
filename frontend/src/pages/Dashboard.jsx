import React from 'react'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { isLoggedIn, logout, user, setUser } = useAuth();
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };
  return (
    <div className="page-wrapper">
      <div className="page-content">
    <div>Dashboard
      <Link className="dropdown-item" to="#" onClick={handleLogout}>Logout</Link>
    </div>
    </div>
    </div>
  )
}

export default Dashboard