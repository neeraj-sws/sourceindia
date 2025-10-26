import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth for user data
import StepProgress from "./StepProgress";
const Dashboard = () => {
  const { showNotification } = useAlert();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [todayRegisterSeller, setTodayRegisterSeller] = useState(0);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const fetchEnquiryCount = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/enquiries/user-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // setUser(response.data.user);
        setTodayRegisterSeller(response.data.total);
      } catch (error) {
        setError("Failed to fetch enquiry count");
        console.error("Error fetching enquiry count:", error);
        showNotification("Failed to fetch enquiry count", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiryCount();
  }, []); // Empty dependency array to run once on mount

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="container">
          <div className="card mb-4">
            <div className="card-body">
              <StepProgress />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 col-sm-6 col-12">
              <div className="card radius-10 border-start border-0 border-3 border-danger">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">Total My Open Enquiry (created)</p>
                      <h4 className="my-1">{todayRegisterSeller}</h4>
                    </div>
                    <div className="widgets-icons-2 rounded-circle bg-gradient-bloody text-white ms-auto">
                      <i className="bx bxs-group"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;