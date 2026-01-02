import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import UseAuth from "../sections/UseAuth";

const Isinterested = () => {
  const { showNotification } = useAlert();
  const { user, updateUser, loading: userLoading } = UseAuth(); // assuming UseAuth provides a loading flag
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interestData, setInterestData] = useState({
    categories: [],
    subCategories: {},
    checked: {},
  });
  const [formData, setFormData] = useState({ activity: {} });

  // Debug logs for clarity
  console.log("User (render):", user);
  console.log("User ID (render):", user?.id);

  useEffect(() => {
    // Agar user abhi load ho raha hai to wait karo
    if (userLoading) return;

    // Agar user abhi bhi nahi mila ya invalid hai
    if (!user || !user.id) {
      setError("User not authenticated or ID missing");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const interestResponse = await axios.get(
          `${API_BASE_URL}/dashboard/get-buyer-interest?userId=${user.id}`,
          {
            headers: { "Cache-Control": "no-cache" }, // disable caching
          }
        );

        if (interestResponse.status === 200) {
          const data = interestResponse.data;
          setInterestData(data);

          // Build initial activity selections
          const initialActivity = {};
          for (const [categoryId, subIds] of Object.entries(data.checked || {})) {
            initialActivity[categoryId] = subIds;
          }
          setFormData({ activity: initialActivity });
        }
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
        showNotification("Failed to fetch data", "error");
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userLoading, navigate]);

  // Handle checkbox change
  const handleCheckboxChange = (categoryId, subCategoryId) => {
    setFormData((prevData) => {
      const newActivity = { ...prevData.activity };
      if (!newActivity[categoryId]) newActivity[categoryId] = [];

      if (newActivity[categoryId].includes(subCategoryId)) {
        newActivity[categoryId] = newActivity[categoryId].filter(
          (id) => id !== subCategoryId
        );
      } else {
        newActivity[categoryId] = [...newActivity[categoryId], subCategoryId];
      }

      return { ...prevData, activity: newActivity };
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user || !user.id) {
      showNotification("User not authenticated or ID missing", "error");
      return;
    }

    if (
      !formData.activity ||
      Object.values(formData.activity).every((ids) => !ids || ids.length === 0)
    ) {
      showNotification("At least one activity is required", "error");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/store-buyer-interest`,
        { ...formData, userId: user.id },
        { headers: { "Cache-Control": "no-cache" } }
      );

      if (response.data.success) {
        showNotification(
          response.data.message || "Interest Added Successfully",
          "success"
        );

        if (updateUser) {
          updateUser({ ...user, is_intrest: 1 });
        }
      }
    } catch (err) {
      console.error("Error submitting interest:", err.response?.data || err.message);
      showNotification("Failed to submit interest", "error");
    }
  };

  // --- UI Rendering ---
  if (userLoading || loading) return <div>Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="container">
          <div className="card mb-4">
            <div className="card-body">
              <h4>Buyer Sourcing Interest</h4>
              <div className="row mt-3">
                <div className="col-md-4">
                  <h6>MECHANICAL</h6>
                  {interestData.subCategories[3]?.length ? (
                    interestData.subCategories[3].map((sub) => (
                      <div className="d-flex align-items-center gap-1" key={sub.id}>
                        <input
                          type="checkbox"
                          id={`mech-${sub.id}`}
                          checked={formData.activity[3]?.includes(sub.id) || false}
                          onChange={() => handleCheckboxChange(3, sub.id)}
                        />
                        <label htmlFor={`mech-${sub.id}`}>{sub.name}</label>
                      </div>
                    ))
                  ) : (
                    <p>No subcategories available</p>
                  )}
                </div>

                <div className="col-md-4">
                  <h6>ELECTRO-MECHANICAL</h6>
                  {interestData.subCategories[2]?.length ? (
                    interestData.subCategories[2].map((sub) => (
                      <div className="d-flex align-items-center gap-1" key={sub.id}>
                        <input
                          type="checkbox"
                          id={`electro-${sub.id}`}
                          checked={formData.activity[2]?.includes(sub.id) || false}
                          onChange={() => handleCheckboxChange(2, sub.id)}
                        />
                        <label htmlFor={`electro-${sub.id}`}>{sub.name}</label>
                      </div>
                    ))
                  ) : (
                    <p>No subcategories available</p>
                  )}
                </div>

                <div className="col-md-4">
                  <h6>ELECTRONICS</h6>
                  {interestData.subCategories[1]?.length ? (
                    interestData.subCategories[1].map((sub) => (
                      <div className="d-flex align-items-center gap-1" key={sub.id}>
                        <input
                          type="checkbox"
                          id={`elec-${sub.id}`}
                          checked={formData.activity[1]?.includes(sub.id) || false}
                          onChange={() => handleCheckboxChange(1, sub.id)}
                        />
                        <label htmlFor={`elec-${sub.id}`}>{sub.name}</label>
                      </div>
                    ))
                  ) : (
                    <p>No subcategories available</p>
                  )}
                </div>
              </div>

              <button className="btn btn-primary mt-3" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Isinterested;
