import React, { useEffect, useState, useRef } from 'react'
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { Link } from 'react-router-dom';
const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef();

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/products/companies?is_delete=0`, {
          params: { page, limit: 20 } // assuming backend supports these
        });
        if (res.data.companies.length === 0) {
          setHasMore(false); // no more companies to load
        } else {
          setCompanies(prev => [...prev, ...res.data.companies]);
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

  return (
    <section className="container my-5">
      <div className="firstHead text-center pb-5">
        <h1>All Companies</h1>
      </div>
      <div className="row row-cols-1 row-cols-md-3 g-4">
        {companies.map((company) => (
          <div className="col-md-2" key={company.id}>
            <div className="latest-product">
              <Link to={`/companies/${company.organization_slug}`} className="d-block h-100">
                <ImageWithFallback
                  src={`${ROOT_URL}/${company.company_logo_file}`}
                  width={180}
                  height={180}
                  showFallback={true}
                />
                <p className='mt-2'><small>{company.organization_name}</small></p>
              </Link>
            </div>

          </div>
        ))}
      </div>

      {/* Loader div observed for triggering next load */}
      <div ref={loaderRef} style={{ height: '100px', textAlign: 'center' }}>
        {loading && <img src="/loading.gif" height={20} />}
        {!hasMore && <p>No more companies to load</p>}
      </div>
    </section>
  )
}

export default Companies;
