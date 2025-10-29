import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from "./../config"; // adjust path as needed

const UseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Optionally log out the user if the token is invalid
        localStorage.removeItem('user_token');
        // navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  return { user, loading };
};

export default UseAuth;
