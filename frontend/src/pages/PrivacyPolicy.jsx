import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./../config";

const PrivacyPolicy = () => {
  const [pageData, setPageData] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/pages/8`);
        const { title, description } = response.data?.data || response.data;
        setPageData({ title, description });
      } catch (err) {
        setError("Failed to load page data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  if (loading) return <div className="container my-5 text-center">Loading...</div>;
  if (error) return <div className="container my-5 text-center text-danger">{error}</div>;

  return (
    <div className="container-xl my-5">
      <div className="card mb-lg-5 mb-3 commonHead border shadow-none">
        <div className="card-body py-5 text-center">
          <h1 className="text-white">{pageData.title}</h1>
        </div>
      </div>
      <div className="card">
        <div className="card-body p-4">
          <div dangerouslySetInnerHTML={{ __html: pageData.description }} />
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
