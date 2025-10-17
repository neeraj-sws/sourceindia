import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/login'); // Redirect if not logged in
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
      } catch (err) {
        console.error(err);
        navigate('/login'); // Redirect if token is invalid or expired
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    navigate('/login');
  };

  if (!user) return <div className="text-center mt-5">Loading profile...</div>;

  return (
    <div className="container my-5">
      <div className="card shadow-sm p-4">
        <h3 className="mb-4">User Profile</h3>
        <p><strong>Name:</strong> {user.fname} {user.lname}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Seller:</strong> {user.is_seller ? 'Yes' : 'No'}</p>
        <button className="btn btn-danger mt-3" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
