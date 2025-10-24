import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageFront from "../admin/common/ImageFront";
import axios from "axios";

const Company = ({ limit }) => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies?is_delete=0&limit=${limit}&page=1`);
        const data = res.data;
        // Adjust based on real API shape
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.companies)
              ? data.companies
              : [];
        setCompanies(list);
      } catch (err) {
        console.error("Error fetching companies:", err);
        setCompanies([]); // prevent map() crash
      }
    };
    fetchCompanies();
  }, [limit]);

  return (
    <>
      <section className="companySection py-5 my-4">
        <div className="container">
          <div className="firstHead text-center pb-5">
            <h1>FEATURED COMPANIES</h1>
          </div>
          <div className="companyGrid">
            <div className="row gx-3">
              {companies.map((item, index) => (
                <div className="col-md-2 mb-3" key={index}>
                  <Link to={`/companies/${item.organization_slug}`} className="d-block h-100">
                    <div key={item.id} className="companyBox px-3 py-4 bg-white border h-100 d-flex align-items-center justify-content-center">
                      <div className="ComImg">
                        <ImageFront
                          src={`${ROOT_URL}/${item.company_logo_file}`}
                          width={180}
                          height={180}
                          showFallback={true}
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              <div className="col-md-2 mb-3">
                <Link to="/companies" className="d-block h-100">
                  <div className="companyBox px-3 py-4 bg-white border text-center h-100">
                    <div className="ComImg">
                      <img src="/morecompany.jpg" alt="company" className="img-fluid p-3" />
                      <p>More Companies</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section >
    </>
  );
};

export default Company;
