import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from './../config';
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { Link } from "react-router-dom";

const CompaniesFilter = ({ isSeller, isTrading }) => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
  const [states, setStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [statesSearchTerm, setStatesSearchTerm] = useState('');
  const [sourcingInterest, setSourcingInterest] = useState([]);
  const [selectedSourcingInterest, setSelectedSourcingInterest] = useState([]);
  const [sourcingInterestSearchTerm, setSourcingInterestSearchTerm] = useState('');
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [viewMode, setViewMode] = useState("grid");

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm)
  );
  const filteredSubCategories = subCategories.filter(sub =>
    sub.name.toLowerCase().includes(subCategorySearchTerm)
  );
  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(statesSearchTerm)
  );
  const filteredSourcingInterest = sourcingInterest.filter(sic =>
    sic.category_name.toLowerCase().includes(sourcingInterestSearchTerm)
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1`);
        const cats = res.data || [];
        const filtered = cats.filter(cat => cat.company_count > 0);
        setCategories(filtered);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategoriesByCategories = async () => {
      try {
        if (selectedCategories.length === 0) {
          setSubCategories([]);
          setSelectedSubCategories([]);
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
          categories: selectedCategories,
        });
        const subs = res.data || [];
        const filtered = subs.filter(sub => sub.company_count > 0);
        setSubCategories(filtered);
        setSelectedSubCategories(prevSelected =>
          prevSelected.filter(id => filtered.some(sub => sub.id === id))
        );
      } catch (err) {
        console.error('Error fetching sub-categories by categories:', err);
      }
    };
    fetchSubCategoriesByCategories();
  }, [selectedCategories]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/states/101`);
        const sts = res.data || [];
        const filtered = sts.filter(state => state.company_count > 0);
        setStates(filtered);
      } catch (err) {
        console.error('Error fetching states:', err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchSourcingInterest = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/interest_sub_categories/count_relation`);
        const isc = res.data || [];
        const filtered = isc.filter(si => si.product_count > 0);
        setSourcingInterest(filtered);
      } catch (err) {
        console.error('Error fetching Sourcing Interest:', err);
      }
    };
    fetchSourcingInterest();
  }, []);

  const fetchCompanies = async (pageNumber = 1, append = false) => {
    if ((append && scrollLoading) || (!append && loading)) return;

    append ? setScrollLoading(true) : setLoading(true);

    try {
      let url = `${API_BASE_URL}/products/companies?is_delete=0&status=1&limit=9&page=${pageNumber}`;
      if (typeof isSeller !== 'undefined') {
        url += `&is_seller=${isSeller}`;
      }
      if (typeof isTrading !== 'undefined') {
        url += `&is_trading=${isTrading}`;
      }
      if (selectedCategories.length > 0) {
        url += `&category=${selectedCategories.join(',')}`;
      }
      if (selectedSubCategories.length > 0) {
        url += `&sub_category=${selectedSubCategories.join(',')}`;
      }
      if (selectedStates.length > 0) {
        url += `&user_state=${selectedStates.join(',')}`;
      }
      if (sortBy) {
        url += `&sort_by=${sortBy}`;
      }
      const res = await axios.get(url);
      const newCompanies = res.data.companies || [];
      setCompaniesTotal(res.data.total);
      if (append) {
        setCompanies(prev => [...prev, ...newCompanies]);
      } else {
        setCompanies(newCompanies);
      }

      if (
        newCompanies.length === 0 ||
        (!append && newCompanies.length < 9) ||
        (append && (companies.length + newCompanies.length >= res.data.total))
      ) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      append ? setScrollLoading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchCompanies(1, false);
  }, [selectedCategories, selectedSubCategories, selectedStates, selectedSourcingInterest, sortBy, isSeller, isTrading]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY + 100 >= document.documentElement.scrollHeight &&
        hasMore &&
        !scrollLoading &&
        !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCompanies(nextPage, true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, scrollLoading, loading]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleCategoryCheckboxChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubCategoryCheckboxChange = (subCategoryId) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const handleStatesCheckboxChange = (stateId) => {
    setSelectedStates(prev =>
      prev.includes(stateId)
        ? prev.filter(id => id !== stateId)
        : [...prev, stateId]
    );
  };

  const handleSourcingInterestCheckboxChange = (sicId) => {
    setSelectedSourcingInterest(prev =>
      prev.includes(sicId)
        ? prev.filter(id => id !== sicId)
        : [...prev, sicId]
    );
  };

  // Filter companies by search term
  const filteredCompanies = companies.filter(company =>
    company.organization_name.toLowerCase().includes(searchTerm)
  );

  const getNameById = (array, id) => {
    const item = array.find(el => el.id === id);
    return item ? item.name : '';
  };

  return (
    <div className="container my-4">
      <div className="row">
        {/* Filters */}
        <aside className="col-12 col-md-3 mb-4">
          <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
            <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Company Name</h3>
            <div className="input-group flex-nowrap ps-2 pe-4">
              <i className="bx bx-search input-group-text" />
              <input
                type="text"
                className="form-control"
                placeholder="Search companies..."
                onChange={handleSearch}
              />
            </div>
          </div>
          {isSeller==1 && (
          <>
          <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
            <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Category</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap ps-2 pe-4">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  onChange={(e) => setCategorySearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredCategories.length >= 5 ? 'auto' : 'visible' }}>
                {filteredCategories.map(cat => (
                  <div className="form-check mb-2" key={cat.id}>
                    <input
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      className="form-check-input"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryCheckboxChange(cat.id)}
                    />
                    <label htmlFor={`cat-${cat.id}`} className="form-check-label text-capitalize">
                      {cat.name} ({cat.company_count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {filteredSubCategories.length > 0 && (
            <>
              <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Sub Category</h3>
                <div className="d-flex flex-column gap-2">
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search sub-categories..."
                      onChange={(e) => setSubCategorySearchTerm(e.target.value.toLowerCase())}
                      className="form-control"
                    />
                  </div>
                  <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredSubCategories.length >= 5 ? 'auto' : 'visible' }}>
                    {filteredSubCategories.map(sub => (
                      <div className="form-check mb-2" key={sub.id}>
                        <input
                          type="checkbox"
                          id={`subcat-${sub.id}`}
                          className="form-check-input"
                          checked={selectedSubCategories.includes(sub.id)}
                          onChange={() => handleSubCategoryCheckboxChange(sub.id)}
                        />
                        <label htmlFor={`subcat-${sub.id}`} className="form-check-label text-capitalize">
                          {sub.name} ({sub.company_count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
            <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">State</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap ps-2 pe-4">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search states..."
                  onChange={(e) => setStatesSearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredStates.length >= 5 ? 'auto' : 'visible' }}>
                {filteredStates.map(state => (
                  <div className="form-check mb-2" key={state.id}>
                    <input
                      type="checkbox"
                      id={`state-${state.id}`}
                      className="form-check-input"
                      checked={selectedStates.includes(state.id)}
                      onChange={() => handleStatesCheckboxChange(state.id)}
                    />
                    <label htmlFor={`state-${state.id}`} className="form-check-label text-capitalize">
                      {state.name} ({state.company_count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          )}
          {isSeller==0 && (
            <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
            <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Sourcing Interest</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap ps-2 pe-4">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search sourcing interest..."
                  onChange={(e) => setSourcingInterestSearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredSourcingInterest.length >= 5 ? 'auto' : 'visible' }}>
                {filteredSourcingInterest.map(sic => (
                  <div className="form-check mb-2" key={sic.id}>
                    <input
                      type="checkbox"
                      id={`sic-${sic.id}`}
                      className="form-check-input"
                      checked={selectedSourcingInterest.includes(sic.id)}
                      onChange={() => handleSourcingInterestCheckboxChange(sic.id)}
                    />
                    <label htmlFor={`sic-${sic.id}`} className="form-check-label text-capitalize">
                      {sic.category_name} ({sic.product_count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </aside>

        {/* Companies grid */}
        <section className="col-12 col-md-9 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2 primary-color-bg px-3 py-2 rounded-2 text-white">
            <div className="d-flex justify-content-between">
              <strong>Sort By :</strong>
              <ul className="list-unstyled filterLst d-flex flex-wrap mb-0">
                <li className="sortPopular">
                  <label htmlFor="sortByPopularAtoZ" className="m-0 cursor-pointer">
                    <input
                      type="radio"
                      className="invisible"
                      id="sortByPopularAtoZ"
                      name="sortBy"
                      value="a_to_z"
                      checked={sortBy === 'a_to_z'}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    A to Z
                    <i className="bx bx-sort-a-z ms-1" aria-hidden="true" />
                  </label>
                </li>
                <li className="sortPopular">
                  <label htmlFor="sortByPopularZtoA" className="m-0 cursor-pointer">
                    <input
                      type="radio"
                      className="invisible"
                      id="sortByPopularZtoA"
                      name="sortBy"
                      value="z_to_a"
                      checked={sortBy === 'z_to_a'}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    Z to A
                    <i className="bx bx-sort-z-a ms-1" aria-hidden="true" />
                  </label>
                </li>
                <li className="sortPopular">
                  <label htmlFor="sortByPopularNewest" className="m-0 cursor-pointer">
                    <input
                      type="radio"
                      className="invisible"
                      id="sortByPopularNewest"
                      name="sortBy"
                      value="newest"
                      checked={sortBy === 'newest'}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    Newest First
                    <i className="bx bx-sort ms-1" aria-hidden="true" />
                  </label>
                </li>
              </ul>
            </div>

            <div className="ms-auto d-flex gap-2 align-items-center">
              <p className="mb-0">{companiesTotal} Products</p>

              <button
                className={`btn btn-sm text-nowrap ${viewMode === 'grid' ? 'btn-orange' : 'btn-outline-white text-white'}`}
                style={{ padding: '0.188rem 0.625rem' }}
                onClick={() => setViewMode("grid")}
              >
                <i className="bx bx-grid-alt me-2"></i>Grid View
              </button>

              <button
                className={`btn btn-sm text-nowrap ${viewMode === 'list' ? 'btn-orange' : 'btn-outline-white text-white'}`}
                style={{ padding: '0.188rem 0.625rem' }}
                onClick={() => setViewMode("list")}
              >
                <i className="bx bx-list-ul me-2"></i>List View
              </button>
            </div>


          </div>
          {(selectedCategories.length > 0 ||
            selectedSubCategories.length > 0 ||
            selectedStates.length > 0) && (
              <div className="mb-3 border px-3 py-2 bg-white rounded-2">
                <strong className="pb-2">Filter:</strong>
                <div className="d-flex align-items-baseline justify-content-between gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {selectedCategories.map(id => (
                      <span key={`cat-${id}`} className="badge bg-primary text-white d-flex align-items-center">
                        {getNameById(categories, id)}
                        <button
                          onClick={() => handleCategoryCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                    {selectedSubCategories.map(id => (
                      <span key={`sub-${id}`} className="badge bg-secondary text-white d-flex align-items-center">
                        {getNameById(subCategories, id)}
                        <button
                          onClick={() => handleSubCategoryCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                    {selectedStates.map(id => (
                      <span key={`state-${id}`} className="badge bg-success text-white d-flex align-items-center">
                        {getNameById(states, id)}
                        <button
                          onClick={() => handleStatesCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedSubCategories([]);
                      setSelectedStates([]);
                    }}
                    className="btn btn-sm btn-outline-danger text-nowrap" style={{
                      padding: '0.188rem 0.625rem'
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

          <div className={`row g-3 ${viewMode === 'list' ? 'flex-column' : ''}`} style={{ display: 'none' }}>
            {loading ? (
              <div className="text-center">
                <img src="/producfilter.gif" height={80} />
              </div>
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div
                  className={viewMode === 'grid' ? 'col-12 col-sm-6' : 'col-12'}
                  key={company.id}
                >
                  <div
                    className={`card shadow-sm border p-3 ${viewMode === 'list' ? 'list-view-card' : 'h-100'
                      }`}
                  >
                    <div
                      className={`d-flex ${viewMode === 'list'
                        ? 'flex-column flex-md-row align-items-start gap-3'
                        : 'flex-column'
                        }`}
                    >
                      {/* Company Logo */}
                      <div className="flex-shrink-0 text-center">
                        <ImageWithFallback
                          src={`${ROOT_URL}/${company.company_logo_file}`}
                          width={viewMode === 'list' ? 100 : 180}
                          height={viewMode === 'list' ? 100 : 180}
                          showFallback={true}
                          className="rounded border"
                        />
                      </div>

                      {/* Company Details */}
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{company.organization_name}</h5>

                        <div className="companyitems companylocation d-flex gap-2 mb-2">
                          <b className="fw-semibold">Location:</b>
                          <p className="mb-0">
                            {company.company_location ||
                              '4th Floor, Survey No. 8, Vijinapura Extension, Bengaluru...'}
                          </p>
                        </div>

                        <div className="d-flex flex-wrap gap-3">
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Website:</b>
                            <p className="mb-0">https://www.aaviza.com</p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Core:</b>
                            <p className="mb-0">{company.core_activity_name}</p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Activity:</b>
                            <p className="mb-0">{company.activity_name}</p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Category:</b>
                            <p className="mb-0">{company.category_name}</p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Sub Category:</b>
                            <p className="mb-0">
                              {company.sub_category_name}
                            </p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Products:</b>
                            <p className="mb-0">{company.company_count || 0}</p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          <span className="badge bg-orange small">PCB Assembly</span>
                          <span className="badge bg-orange small">Product Assembly</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="d-flex flex-column gap-2 ms-md-auto w-100 w-md-auto mt-3 mt-md-0">
                        <Link className="btn btn-sm btn-primary w-100">View Details</Link>
                        <Link className="btn btn-sm btn-orange w-100">Enquiry</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <p className="text-center">No products found.</p>
              </div>
            )}
          </div>


          <div className={`row g-3 ${viewMode === 'list' ? 'flex-column' : ''}`}>
            {loading ? (
              <div className="text-center"><img src="/producfilter.gif" height={80} /></div>
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map(company => (
                <div
                  className={viewMode === 'grid' ? 'col-12 col-sm-6' : 'col-12'}
                  key={company.id}
                >
                  <div className={`card shadow-sm border comapnycardlogo h-100 ${viewMode === 'list' ? 'flex-row p-2' : ''}`}>
                    <div className={`card-header border-0 ${viewMode === 'list' ? 'p-0 ps-2 bg-white' : ''}`}>
                      <div className={`d-flex ${viewMode === 'list' ? '' : 'align-items-center gap-2'}`}>
                        <div className={viewMode === 'list' ? 'me-0' : 'me-3'}>
                          <ImageWithFallback
                            src={`${ROOT_URL}/${company.company_logo_file}`}
                            width={viewMode === 'list' ? 100 : 180}
                            height={viewMode === 'list' ? 100 : 180}
                            showFallback={true}
                          />
                        </div>
                        <div className={viewMode === 'list' ? 'd-none' : ''}>
                          <h5 className="card-title mb-1">{company.organization_name}</h5>
                          <div className="companyitems companylocation mb-2 d-flex gap-2">
                            <b className="fw-semibold">Location:</b>
                            <p className="mb-0">
                              {company.company_location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`card-body ${viewMode === 'list' ? 'pt-2' : ''}`}>
                      <div>
                        <div className={viewMode === 'list' ? 'd-block' : 'd-none'}>

                          <h5 className="card-title mb-1">{company.organization_name}</h5>
                          <div className="companyitems companylocation companylocationlist mb-2 d-flex gap-2">
                            <b className="fw-semibold">Location:</b>
                            <p className="mb-0">
                              {company.company_location}
                            </p>
                          </div>
                        </div>
                        <div className="companyitems companywebsite mb-2 d-flex gap-2">
                          <b className="fw-semibold">Website:</b>
                          <p className="mb-0">{company.company_website}</p>
                        </div>

                        <div className="companyitems companycoreactivity mb-2 d-flex gap-2">
                          <b className="fw-semibold">Core Activity:</b>
                          <p className="mb-0">{company.core_activity_name}</p>
                        </div>

                        <div className="companyitems companactivity mb-2 d-flex gap-2">
                          <b className="fw-semibold">Activity:</b>
                          <p className="mb-0">{company.activity_name}</p>
                        </div>

                        <div className="companyitems compancatrgory mb-2 d-flex gap-2">
                          <b className="fw-semibold">Category:</b>
                          <p className="mb-0">{company.category_name}</p>
                        </div>

                        <div className="companyitems compansubcatrgory mb-2 d-flex gap-2">
                          <b className="fw-semibold">Sub Category:</b>
                          <p className="mb-0">{company.sub_category_name}</p>
                        </div>

                        <div className="featuredCompaniesPara d-flex align-items-center gap-1 flex-wrap">
                          {company.products && company.products.map((product, idx) => (
                            <Link
                            key={product.id || product.slug || idx}
                            to={`/products/${product.slug}`}
                            className="small badge text-decoration-none text-white btn-orange text-start"
                            style={{
                              whiteSpace: "pre-wrap",
                              lineHeight: "17px",
                              padding: "2px 6px",
                              fontSize: "10px"
                            }}
                          >
                            {product.title}
                          </Link>
                          ))}
                        </div>

                      </div>
                    </div>

                    <div className={`card-footer ${viewMode === 'list' ? 'bg-white border-0 pe-2 pt-0' : ''}`}>
                      <div className={`d-flex gap-2 ${viewMode === 'list' ? 'flex-column' : 'flex-row'}`}>
                        <Link to={`/companies/${company.organization_slug}`} className="d-block w-100 pt-2 btn btn-primary text-nowrap px-5">
                          <span className="">View Details</span>
                        </Link>
                        <Link className="d-block w-100 pt-2 btn btn-orange text-nowrap px-5">
                          <span className="">Enquiry</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12"><p className="text-center">No products found.</p></div>
            )}
            {!loading && scrollLoading && (
              <div className="text-center my-4">
                <img src="/producfilter.gif" alt="Loading..." height={60} />
              </div>
            )}
          </div>

        </section>
      </div >
    </div >
  );
};

export default CompaniesFilter;