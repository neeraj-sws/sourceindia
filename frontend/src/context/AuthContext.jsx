// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from "../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const login = (token) => {
    localStorage.setItem('user_token', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    setIsLoggedIn(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("user_token");

    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching profile:", error);
          if (error.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    setLoadingUser(true);
    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, user, setUser, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ This must be exported
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
