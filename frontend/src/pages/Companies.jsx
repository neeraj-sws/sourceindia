import React, { useEffect, useState, useRef } from 'react';
import { Suspense, lazy } from 'react';
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import './companies.css';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));

import { Link } from 'react-router-dom';
const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef();
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryCompanyId, setEnquiryCompanyId] = useState(null);
  const [enquiryCompanyName, setEnquiryCompanyName] = useState('');
  

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies?is_delete=0`, {
          params: { page, limit: 20 } // assuming backend supports these
        });
        const newCompanies = Array.isArray(res.data?.companies) ? res.data.companies : [];

        if (newCompanies.length === 0) {
          setHasMore(false); // no more companies to load
        } else {
          // merge and dedupe by organization_slug or id to avoid duplicate keys
          setCompanies(prev => {
            const merged = [...prev, ...newCompanies];
            const seen = new Set();
            const unique = [];
            for (const c of merged) {
              const key = c.organization_slug ?? String(c.id ?? '');
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(c);
              }
            }
            return unique;
          });
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
      setLoading(false);
    };
    fetchCompanies();
  }, [page]);

  // Infinite scroll: observe the loader div
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loading, hasMore]);

  const openEnquiryForCompany = (companyId, companyName) => {
    setEnquiryCompanyId(companyId);
    setEnquiryCompanyName(companyName);
    setShowEnquiry(true);
    if (window && window.gtag) window.gtag('event', 'request_quote_click', { companyId, companyName });
  };

  return (
    <section className="container my-5">
      <div className="firstHead text-start mb-3">
        <h1 className="mb-0">All Companies</h1>
        <p className="mb-0 text-muted">Browse verified electronics suppliers — view products.</p>
      </div>
      <div className="row row-cols-2 row-cols-md-6 g-4">
        {Array.isArray(companies) && companies.map((company, index) => (
          <div className="col" key={(company.organization_slug ?? company.id ?? index)}>
            <div className="card h-100 shadow-sm text-center company-card">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-3">
                <Link to={`/companies/${company.organization_slug}`} className="d-block w-100 mb-2" aria-label={`View products for ${company.organization_name}`}>
                  <div className="company-logo">
                    <ImageWithFallback
                      src={`${ROOT_URL}/${company.company_logo_file}`}
                      width={160}
                      height={80}
                      showFallback={true}
                      loading="lazy"
                      alt={company.organization_name || 'Company logo'}
                    />
                  </div>
                </Link>
                <p className='mt-2 mb-2 company-name'><small>{company.organization_name}</small></p>
              </div>
              <div className="card-footer bg-transparent border-0 company-footer">
                <button className="btn btn-sm btn-outline-primary" aria-label={`View products for ${company.organization_name}`} onClick={() => window.location.href = `/companies/${company.organization_slug}`}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loader div observed for triggering next load */}
      <div ref={loaderRef} style={{ height: '100px', textAlign: 'center' }}>
        {loading && <img src="/loading.gif" height={20} loading="lazy"
          decoding="async" />}
        {!hasMore && <p>No more companies to load</p>}
      </div>

      
    </section>
  )
}

export default Companies;
