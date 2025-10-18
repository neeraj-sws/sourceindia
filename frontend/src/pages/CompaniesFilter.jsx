import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from './../config';
import ImageWithFallback from "../admin/common/ImageWithFallback";

const CompaniesFilter = () => {
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
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [sortBy, setSortBy] = useState('');

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm)
  );
  const filteredSubCategories = subCategories.filter(sub =>
    sub.name.toLowerCase().includes(subCategorySearchTerm)
  );
  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(statesSearchTerm)
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
        const filtered = subs.filter(sub => sub.product_count > 0);
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

  const fetchCompanies = async (pageNumber = 1, append = false) => {
    if ((append && scrollLoading) || (!append && loading)) return;

    append ? setScrollLoading(true) : setLoading(true);

    try {
      let url = `${API_BASE_URL}/products/companies?is_delete=0&status=1&limit=9&page=${pageNumber}`;
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
  }, [selectedCategories, selectedSubCategories, selectedStates, sortBy]);

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
          <div className="mb-4">
            <h3 className="fs-5 mb-3">Company Name</h3>
            <div className="input-group flex-nowrap">
              <i className="bx bx-search input-group-text" />
              <input
                type="text"
                className="form-control"
                placeholder="Search companies..."
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="fs-5 mb-3">Category</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  onChange={(e) => setCategorySearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div style={{ maxHeight: '190px', overflowY: filteredCategories.length >= 5 ? 'auto' : 'visible' }}>
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
          <div className="mb-4">
            <h3 className="fs-5 mb-3">Sub Category</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search sub-categories..."
                  onChange={(e) => setSubCategorySearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div style={{ maxHeight: '190px', overflowY: filteredSubCategories.length >= 5 ? 'auto' : 'visible' }}>
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
                    {sub.name} ({sub.product_count})
                  </label>
                </div>
              ))}
              </div>
            </div>
          </div>
          </>
          )}
          <div className="mb-4">
            <h3 className="fs-5 mb-3">State</h3>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-nowrap">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  placeholder="Search states..."
                  onChange={(e) => setStatesSearchTerm(e.target.value.toLowerCase())}
                  className="form-control"
                />
              </div>
              <div style={{ maxHeight: '190px', overflowY: filteredStates.length >= 5 ? 'auto' : 'visible' }}>
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
        </aside>

        {/* Companies grid */}
        <section className="col-12 col-md-9 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
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
            <div class="ms-auto">
              <p>{companiesTotal} Products</p>
            </div>
          </div>
          {(selectedCategories.length > 0 ||
          selectedSubCategories.length > 0 ||
          selectedStates.length > 0) && (
          <div className="mb-3">
            <strong>Filter:</strong>
            <div className="d-flex align-items-center gap-2 mt-2">
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
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubCategories([]);
                  setSelectedStates([]);
                }}
                className="btn btn-sm btn-outline-danger"
              >
                Clear All
              </button>
            </div>            
          </div>
          )}
          <div className="row g-3">
            {loading ? (
              <div className="text-center"><img src="/producfilter.gif" height={80} /></div>
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map(company => (
              <div className="col-12 col-sm-6 col-lg-4" key={company.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body d-flex align-items-center gap-3">
                    <ImageWithFallback
                      src={`${ROOT_URL}/${company.company_logo_file}`}
                      width={180}
                      height={180}
                      showFallback={true}
                    />
                    <div>
                      <h5 className="card-title mb-1">{company.organization_name}</h5>
                      <p className="card-text mb-0 small text-muted">
                        Products: {company.product_count || 0}
                      </p>
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
      </div>
    </div>
  );
};

export default CompaniesFilter;
