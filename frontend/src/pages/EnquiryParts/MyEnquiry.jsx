import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../config";
import { useAlert } from "../../context/AlertContext";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import UseAuth from '../../sections/UseAuth';

const MyEnquiry = ({ formData }) => {
  const { user, loading } = UseAuth();
  const [counterCount, setcounterCount] = useState(null);
  const { showNotification } = useAlert();
  const [updating, setUpdating] = useState(false);
  let status = "Pending";
  let color = "warning";

  if (formData?.status === 3) {
    status = "Closed";
    color = "danger";
  } else if (formData?.enquiry_status === 1) {
    status = "Open";
    color = "success";
  } else if (formData?.enquiry_status === 2) {
    status = "Closed";
    color = "danger";
  }


  const handleProveEnquiry = async (enq_id, type, id) => {
    if (!window.confirm("Are you sure you want to close this enquiry?")) return;

    setUpdating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/enquiries/prove-enquiry`,
        { enq_id, type, id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success === 1) {
        showNotification("Enquiry closed successfully", "success");
        // optionally reload or update state
        window.location.reload();
      } else {
        showNotification("Failed to close enquiry", "error");
      }
    } catch (error) {
      console.error("Error closing enquiry:", error);
      showNotification("Something went wrong", "error");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !user?.company_id) return; // wait until user info is ready

    axios.get(`${API_BASE_URL}/enquiries/lead-count?companyId=${user.company_id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => {
        const counts = res.data?.data || res.data || { total: 0, open: 0, closed: 0 };
        setcounterCount(counts);
        console.log("Lead Counts:", counts);
      })
      .catch((err) => {
        console.error("Error fetching lead count:", err);
        setcounterCount({ total: 0, open: 0, closed: 0 }); // fallback
      });

  }, [user?.company_id]);
  return (
    <>
      <div className="card shadow-none border mb-3">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div className="w-75">
              <div className="badge rounded-pill text-dark bg-light  p-2 text-uppercase px-3 border me-2" >{formData?.enquiry_number} </div>

              <div className={`badge rounded-pill text-${color} bg-light-${color} p-2 px-3`}>{status}</div>

            </div>
            <div className="text-end w-100">
              <div className="row align-items-center">
                <div className="col-md-9">
                  <div className="text-end my-1">
                    <button className="btn btn-light radius-30 px-3 py-1 btn-sm border"><small>Enquiry floated to {counterCount?.enquiryFloated} users | Enquiry seen by {counterCount?.enquirySeen}  users</small> </button>
                  </div>

                </div>
                <div className="col-md-3">
                  {formData?.status === 0 && (
                    <button
                      className="btn btn-danger radius-30 px-4 py-1 mt-1 btn-sm text-white small"
                      disabled={updating}
                      onClick={() =>
                        handleProveEnquiry(formData?.enquiryUser?.id, 3, formData?.id)
                      }
                    >
                      {updating ? "Processing..." : "Mark Close"}
                    </button>

                  )}



                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default MyEnquiry;