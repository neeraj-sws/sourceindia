import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import StepProgress from "./StepProgress";
import UseAuth from "../sections/UseAuth";

const Dashboard = () => {
  const { showNotification } = useAlert();
  const { user, updateUser, loading } = UseAuth(); // Assuming UseAuth now provides loading
  const navigate = useNavigate();
  const [todayRegisterSeller, setTodayRegisterSeller] = useState(0);
  const [error, setError] = useState(null);
  const [interestData, setInterestData] = useState({ categories: [], subCategories: {} });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ activity: {} });

  useEffect(() => {
    if (loading) return; // Wait until loading is false

    const token = localStorage.getItem("user_token");
    console.log("Token:", token);
    console.log("User:", user);
    console.log("User ID in useEffect:", user?.id);

    if (!token) {
      setError("No authentication token found");
      setLoading(false); // Assuming setLoading is managed externally or remove if not needed
      navigate("/login");
      return;
    }
    if (!user || !user.id) {
      setError("User not authenticated or ID missing");
      return;
    }

    const fetchData = async () => {
      try {
        const enquiryResponse = await axios.get(`${API_BASE_URL}/enquiries/user-count?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
        });
        setTodayRegisterSeller(enquiryResponse.data.total || 0);

        const interestResponse = await axios.get(`${API_BASE_URL}/dashboard/buyer-interest?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' },
        });
        setInterestData(interestResponse.data || { categories: [], subCategories: {} });

        if (user.is_intrest === 0 && user.is_seller === 0) {
          setIsModalOpen(true);
        }
      } catch (error) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", error.response?.data || error.message);
        showNotification("Failed to fetch data", "error");
      }
    };

    fetchData();
  }, [user, loading, navigate]);

  const handleCheckboxChange = (categoryId, subCategoryId) => {
    setFormData((prevData) => {
      const newActivity = { ...prevData.activity };
      if (!newActivity[categoryId]) newActivity[categoryId] = [];
      if (newActivity[categoryId].includes(subCategoryId)) {
        newActivity[categoryId] = newActivity[categoryId].filter((id) => id !== subCategoryId);
      } else {
        newActivity[categoryId] = [...newActivity[categoryId], subCategoryId];
      }
      return { ...prevData, activity: newActivity };
    });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("user_token");
    if (!token || !user || !user.id) {
      showNotification("User not authenticated", "error");
      return;
    }

    if (!formData.activity || Object.keys(formData.activity).length === 0) {
      showNotification("At least one activity is required", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/store-buyer-interest`,
        { ...formData, userId: user.id },
        { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } }
      );

      if (response.data.success) {
        showNotification("Interest Added Successfully", "success");
        if (updateUser) {
          updateUser({ ...user, is_intrest: 1 });
        }
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error submitting interest:", error.response?.data || error.message);
      showNotification("Failed to submit interest", "error");
    }
  };

  const renderBuyerInterestForm = () => {
    if (!isModalOpen) return null;

    return (
      <div className="modal" style={{ display: "block", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000 }}>
        <div className="modal-dialog" style={{ maxWidth: "800px", margin: "50px auto" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Buyer Sourcing Interest</h4>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4">
                  <h5>MECHANICAL</h5>
                  {interestData.subCategories[1]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[1]`}
                        checked={formData.activity[1]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(1, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
                <div className="col-md-4">
                  <h5>ELECTRO-MECHANICAL</h5>
                  {interestData.subCategories[2]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[2]`}
                        checked={formData.activity[2]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(2, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
                <div className="col-md-4">
                  <h5>ELECTRONICS</h5>
                  {interestData.subCategories[3]?.map((sub) => (
                    <div className="d-flex gap-1 align-items-center" key={sub.id}>
                      <input
                        type="checkbox"
                        id={sub.id}
                        name={`activity[3]`}
                        checked={formData.activity[3]?.includes(sub.id) || false}
                        onChange={() => handleCheckboxChange(3, sub.id)}
                      />
                      <label htmlFor={sub.id}>{sub.name}</label>
                    </div>
                  )) || <p>No subcategories available</p>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit
              </button>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
          {renderBuyerInterestForm()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;