import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAlert } from "../../context/AlertContext";
import API_BASE_URL from "../../config";
import UseAuth from "../../sections/UseAuth";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const MyLead = ({ formData }) => {
  const { user, loading } = UseAuth();
  const [counterCount, setCounterCount] = useState(null);
  const { showNotification } = useAlert(); // ✅ Use showAlert if that's your context function
  const [processingType, setProcessingType] = useState(null); // 1 = Accept, 2 = Decline

  // ----- STATUS LOGIC -----
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

  // ----- HANDLE ACCEPT / DECLINE -----
  const handleProveEnquiry = async (enq_id, type, id) => {
    const confirmText =
      type === 1
        ? "Are you sure you want to ACCEPT this enquiry?"
        : "Are you sure you want to DECLINE this enquiry?";
    if (!window.confirm(confirmText)) return;

    setProcessingType(type);
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
        showNotification(
          type === 1
            ? "Enquiry accepted successfully!"
            : "Enquiry declined successfully!",
          "success"
        );

        // ✅ Update UI instantly (no page reload)
        formData.enquiry_status = type;
      } else {
        showNotification("Failed to update enquiry status", "error");
      }
    } catch (error) {
      console.error("Error updating enquiry:", error);
      showNotification("Something went wrong while updating enquiry", "error");
    } finally {
      setProcessingType(null);
    }
  };

  // ----- FETCH COUNTS -----
  useEffect(() => {
    if (!user?.id || !user?.company_id) return;

    axios
      .get(`${API_BASE_URL}/enquiries/lead-count?companyId=${user.company_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        const counts =
          res.data?.data || res.data || { total: 0, open: 0, closed: 0 };
        setCounterCount(counts);
        console.log("Lead Counts:", counts);
      })
      .catch((err) => {
        console.error("Error fetching lead count:", err);
        setCounterCount({ total: 0, open: 0, closed: 0 });
      });
  }, [user?.company_id]);

  // ----- RENDER -----
  return (
    <>
      <div className="card shadow-none border mb-3">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div className="w-75">
              <div className="badge rounded-pill text-dark bg-light p-2 text-uppercase px-3">
                {formData?.enquiry_number}
              </div>
              <div
                className={`badge rounded-pill text-${color} bg-light-${color} p-2 px-3`}
              >
                {status}
              </div>
            </div>

            <div className="text-end w-100">
              <div className="row align-items-center">
                <div className="col-md-12">
                  {formData?.enquiryUser?.enquiry_status == 0 && (
                    <>
                      {/* ✅ ACCEPT BUTTON */}
                      <button
                        className="btn btn-success radius-30 px-4 py-1 mt-1 btn-sm text-white small me-2"
                        disabled={processingType !== null}
                        onClick={() =>
                          handleProveEnquiry(
                            formData?.id,
                            1,
                            formData?.enquiryUser?.id
                          )
                        }
                      >
                        {processingType === 1 ? "Processing..." : "Accept"}
                      </button>


                      <button
                        className="btn btn-danger radius-30 px-4 py-1 mt-1 btn-sm text-white small"
                        disabled={processingType !== null}
                        onClick={() =>
                          handleProveEnquiry(
                            formData?.id,
                            2,
                            formData?.enquiryUser?.id
                          )
                        }
                      >
                        {processingType === 2 ? "Processing..." : "Decline"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyLead;
