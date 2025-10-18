import React, { useState, useEffect } from 'react';
const Enquiry = () => {
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const response = await fetch('http://localhost:5000/v2/api/enquiries');
        const data = await response.json();
        setEnquiries(data);
      } catch (error) {
        console.error('Error fetching enquiries:', error);
      }
    };

    fetchEnquiries();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <div className="container my-5">
        <div className="card mb-5 commonHead border shadow-none">
          <div className="card-body py-5 text-center">
            <h1 className="text-white">Open Enquiery

            </h1>
          </div>
        </div>
      </div>
    </>
  )
}

export default Enquiry