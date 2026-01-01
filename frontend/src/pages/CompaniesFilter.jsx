import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import UseAuth from "../sections/UseAuth";
import ConnectForm from "./ConnectForm";

const CompaniesFilter = ({ isSeller, isTrading }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
  const [coreActivities, setCoreActivities] = useState([]);
  const [selectedCoreActivities, setSelectedCoreActivities] = useState(null);
  const [coreactivitySearchTerm, setCoreActivitiySearchTerm] = useState('');
  const [activities, setActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState(null);
  const [activitiySearchTerm, setActivitiySearchTerm] = useState('');

  const [itemcategories, setItemCategories] = useState([]);
  const [selectedItemCategories, setSelectedItemCategories] = useState(null);
  const [itemcategorySearchTerm, setItemCategorySearchTerm] = useState('');
  const [itemsubCategories, setItemSubCategories] = useState([]);
  const [selectedItemSubCategories, setSelectedItemSubCategories] = useState([]);
  const [itemsubCategorySearchTerm, setItemSubCategorySearchTerm] = useState('');

  const [states, setStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [statesSearchTerm, setStatesSearchTerm] = useState("");
  const [sourcingInterest, setSourcingInterest] = useState([]);
  const [selectedSourcingInterest, setSelectedSourcingInterest] = useState([]);
  const [sourcingInterestSearchTerm, setSourcingInterestSearchTerm] =
    useState("");
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const { user } = UseAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const searchValue = searchParams.get("search");
    if (searchValue) {
      setSearchTerm(searchValue); // Set state if search param exists
    }

    const queryParams = new URLSearchParams(location.search);
    const cateIdParam = queryParams.get("category_id");
    const subcateIdParam = queryParams.get("subcategory_id");
    // const itemcateIdParam = queryParams.get("item_category_id");
    // const itemsubcateIdParam = queryParams.get("item_subcategory_id");

    if (cateIdParam) {
      setSelectedCategories([Number(cateIdParam)]);
    }
    if (subcateIdParam) {
      setSelectedSubCategories([Number(subcateIdParam)]);
    }
    // if (itemcateIdParam) {
    //   setSelectedItemCategories([Number(itemcateIdParam)]);
    // }
    // if (itemsubcateIdParam) {
    //   setSelectedItemSubCategories([Number(itemsubcateIdParam)]);
    // }



  }, [searchParams]);

  const filteredCoreActivities = coreActivities.filter(core =>
    core.name.toLowerCase().includes(coreactivitySearchTerm)
  );
  const filteredActivities = activities.filter(act =>
    act.name.toLowerCase().includes(activitiySearchTerm)
  );

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm)
  );
  const filteredSubCategories = subCategories.filter((sub) =>
    sub.name.toLowerCase().includes(subCategorySearchTerm)
  );

  const filteredItemCategories = itemcategories.filter(cat =>
    cat.name.toLowerCase().includes(itemcategorySearchTerm)
  );

  const filteredItemSubCategories = itemsubCategories.filter(sub =>
    sub.name.toLowerCase().includes(itemsubCategorySearchTerm)
  );

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(statesSearchTerm)
  );
  const filteredSourcingInterest = sourcingInterest.filter((sic) =>
    sic.name.toLowerCase().includes(sourcingInterestSearchTerm)
  );


  useEffect(() => {
    const fetchCoreActivities = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/core_activities?is_delete=0&status=1`
        );
        const coreact = res.data || [];
        const filtered = coreact.filter(cat => cat.company_count > 0);
        setCoreActivities(filtered);
      } catch (err) {
        console.error('Error fetching coreactivities:', err);
      }
    };
    fetchCoreActivities();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // 🧹 nothing selected
        if (!selectedCoreActivities) {
          setActivities([]);
          setSelectedActivities([]);
          return;
        }

        // ✅ single core id
        const res = await axios.get(
          `${API_BASE_URL}/activities/coreactivity/${selectedCoreActivities}`
        );

        const acts = res.data || [];
        const filtered = acts.filter(act => act.company_count > 0);

        setActivities(filtered);

        // remove invalid selected activities
        setSelectedActivities(prev =>
          filtered.some(act => act.id === prev) ? prev : null
        );

      } catch (err) {
        console.error('Error fetching Activity by Core Activity:', err);
      }
    };

    fetchActivities();
  }, [selectedCoreActivities]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/categories?is_delete=0&status=1`
        );
        const cats = res.data || [];
        const filtered = cats.filter((cat) => cat.company_count > 0);
        setCategories(filtered);
      } catch (err) {
        console.error("Error fetching categories:", err);
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
        const res = await axios.post(
          `${API_BASE_URL}/sub_categories/categories`,
          {
            categories: selectedCategories,
          }
        );
        const subs = res.data || [];
        const filtered = subs.filter((sub) => sub.company_count > 0);
        setSubCategories(filtered);
        setSelectedSubCategories((prevSelected) =>
          prevSelected.filter((id) => filtered.some((sub) => sub.id === id))
        );
      } catch (err) {
        console.error("Error fetching sub-categories by categories:", err);
      }
    };
    fetchSubCategoriesByCategories();
  }, [selectedCategories]);


  useEffect(() => {
    const fetchItemCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/item_category/getitem?status=1`);
        const cats = res.data || [];
        const filtered = cats.filter(cat => cat.company_count > 0);
        setItemCategories(filtered);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchItemCategories();
  }, []);

  useEffect(() => {
    const fetchItemSubCategoriesByCategories = async () => {
      try {
        if (typeof selectedItemCategories !== "number") {
          setItemSubCategories([]);
          setSelectedItemSubCategories([]);
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/item_category/getitemtype/${selectedItemCategories}`, {
          item_category: selectedItemCategories,
        });
        const subs = res.data || [];
        const filtered = subs.filter(sub => sub.company_count > 0);
        setItemSubCategories(filtered);
        setSelectedItemSubCategories(prevSelected =>
          prevSelected.filter(id => filtered.some(sub => sub.id === id))
        );
      } catch (err) {
        console.error('Error fetching item sub categories by item categories:', err);
      }
    };
    fetchItemSubCategoriesByCategories();
  }, [selectedItemCategories]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/states/101`);
        const sts = res.data || [];
        const filtered = sts.filter((state) => state.company_count > 0);
        setStates(filtered);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchSourcingInterest = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/interest_sub_categories/count_relation`
        );
        const isc = res.data || [];
        const filtered = isc.filter((si) => si.company_count > 0);
        setSourcingInterest(filtered);
      } catch (err) {
        console.error("Error fetching Sourcing Interest:", err);
      }
    };
    fetchSourcingInterest();
  }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchCompanies = async (pageNumber = 1, append = false) => {
    if ((append && scrollLoading) || (!append && loading)) return;

    append ? setScrollLoading(true) : setLoading(true);
    console.log(selectedCoreActivities);
    try {
      let url = `${API_BASE_URL}/products/companies?is_delete=0&status=1&limit=9&page=${pageNumber}`;
      if (typeof isSeller !== 'undefined') url += `&is_seller=${isSeller}`;
      if (typeof isTrading !== 'undefined') url += `&is_trading=${isTrading}`;
      if (selectedCoreActivities) url += `&core_activity=${selectedCoreActivities}`;
      if (selectedActivities) url += `&activity=${selectedActivities}`;
      if (selectedCategories.length > 0) url += `&category=${selectedCategories.join(',')}`;
      if (selectedSubCategories.length > 0) url += `&sub_category=${selectedSubCategories.join(',')}`;
      if (selectedItemCategories) url += `&item_category=${selectedItemCategories}`;
      if (selectedItemSubCategories.length > 0) url += `&item_subcategory=${selectedItemSubCategories.join(',')}`;
      if (selectedStates.length > 0) url += `&user_state=${selectedStates.join(',')}`;
      if (selectedSourcingInterest.length > 0) url += `&interest_sub_categories=${selectedSourcingInterest.join(',')}`;
      if (sortBy) url += `&sort_by=${sortBy}`;
      if (searchTerm) url += `&title=${encodeURIComponent(searchTerm)}`;
      const res = await axios.get(url);
      const newCompanies = res.data.companies || [];
      setCompaniesTotal(res.data.total);
      if (append) {
        setCompanies((prev) => [...prev, ...newCompanies]);
      } else {
        setCompanies(newCompanies);
      }

      if (
        newCompanies.length === 0 ||
        (!append && newCompanies.length < 9) ||
        (append && companies.length + newCompanies.length >= res.data.total)
      ) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      await sleep(1000);
      append ? setScrollLoading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchCompanies(1, false);
  }, [searchTerm, selectedCategories, selectedSubCategories, selectedStates, selectedSourcingInterest, selectedCoreActivities,   // ✅ ADD
    selectedActivities, selectedItemSubCategories,   // ✅ ADD
    selectedActivities, sortBy, isSeller, isTrading]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY + 100 >=
        document.documentElement.scrollHeight &&
        hasMore &&
        !scrollLoading &&
        !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCompanies(nextPage, true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, scrollLoading, loading]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCoreActivitiyCheckboxChange = (coreactivitiesId) => {
    setSelectedCoreActivities(coreactivitiesId);
  };

  const handleActivitiyCheckboxChange = (coreactivitiesId) => {
    setSelectedActivities(coreactivitiesId);
  };

  const handleCategoryCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubCategoryCheckboxChange = (subCategoryId) => {
    setSelectedSubCategories((prev) =>
      prev.includes(subCategoryId)
        ? prev.filter((id) => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const handleItemCategoryCheckboxChange = (itemcategoryId) => {
    setSelectedItemCategories(itemcategoryId);
  };

  const handleItemSubCategoryCheckboxChange = (itemsubCategoryId) => {
    setSelectedItemSubCategories(prev =>
      prev.includes(itemsubCategoryId)
        ? prev.filter(id => id !== itemsubCategoryId)
        : [...prev, itemsubCategoryId]
    );
  };

  const handleStatesCheckboxChange = (stateId) => {
    setSelectedStates((prev) =>
      prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId]
    );
  };

  const handleSourcingInterestCheckboxChange = (sicId) => {
    setSelectedSourcingInterest((prev) =>
      prev.includes(sicId)
        ? prev.filter((id) => id !== sicId)
        : [...prev, sicId]
    );
  };

  // Filter companies by search term
  const filteredCompanies = (companies || []).filter((company) =>
    (company?.organization_name || "")
      .toLowerCase()
      .includes((searchTerm || "").toLowerCase())
  );

  const getNameById = (array, id) => {
    const item = array.find((el) => el.id === id);
    return item ? item.name : "";
  };

  const CompanySkeletonLoader = ({ count = 6, viewMode = "grid" }) => {
    const items = Array.from({ length: count });

    return (
      <>
        {items.map((_, index) => (
          <div
            key={index}
            className={viewMode === "grid" ? "col-12 col-sm-6" : "col-12"}
          >
            <div
              className={`card shadow-sm border p-3 h-100 ${viewMode === "list" ? "flex-row" : ""
                }`}
            >
              {/* Logo */}
              <div className="me-3 text-center">
                <div
                  className="content-placeholder rounded"
                  style={{
                    width: viewMode === "list" ? 100 : 180,
                    height: viewMode === "list" ? 100 : 180,
                  }}
                />
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div
                  className="content-placeholder mb-2"
                  style={{ width: "60%", height: 14 }}
                ></div>

                <div
                  className="content-placeholder mb-2"
                  style={{ width: "40%", height: 12 }}
                ></div>

                <div
                  className="content-placeholder mb-2"
                  style={{ width: "70%", height: 12 }}
                ></div>

                <div
                  className="content-placeholder mb-2"
                  style={{ width: "50%", height: 12 }}
                ></div>

                <div
                  className="content-placeholder mb-3"
                  style={{ width: "80%", height: 12 }}
                ></div>

                <div
                  className="content-placeholder"
                  style={{ width: "100%", height: 35 }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="container-xl my-4">
      <div className="row">
        {/* Filters */}
        <div className="col-12 col-lg-3">
          {/* <aside className="filter-sidebar d-lg-inline-block d-none mb-4"> */}
          <aside className={`filter-sidebar mb-4 ${showFilter ? "show" : ""}`}>
            <div className="d-flex align-items-center justify-content-between mb-3 d-lg-none">
              <h6 className="mb-0 fw-semibold text-dark">Filters:</h6>
              <button
                type="button"
                className="filter-close-btn fs-2 bg-white border-0"
                onClick={() => setShowFilter(false)}
                aria-label="Close filters"
              >
                &times;
              </button>
            </div>
            <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
              <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Company Name</h3>
              <div className="input-group flex-nowrap ps-2 pe-4">
                <i className="bx bx-search input-group-text" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            {isSeller == 1 && (
              <>
                <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                  <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Core Activity</h3>
                  <div className="d-flex flex-column gap-2">
                    <div className="input-group flex-nowrap ps-2 pe-4">
                      <i className="bx bx-search input-group-text" />
                      <input
                        type="text"
                        placeholder="Search Core Activity..."
                        onChange={(e) => setCoreActivitiySearchTerm(e.target.value.toLowerCase())}
                        className="form-control"
                      />
                    </div>
                    <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredCoreActivities.length >= 5 ? 'auto' : 'visible' }}>
                      {filteredCoreActivities.map(core => (
                        <div className="form-check mb-2" key={core.id}>
                          <input
                            type="radio"
                            id={`core-${core.id}`}
                            name="coreActivity"
                            className="form-check-input"
                            checked={selectedCoreActivities === core.id}
                            onChange={() => handleCoreActivitiyCheckboxChange(core.id)}
                          />
                          <label htmlFor={`core-${core.id}`} className="form-check-label text-capitalize">
                            {core.name} ({core.company_count})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {filteredActivities.length > 0 && (
                  <>
                    <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                      <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Activitiy</h3>
                      <div className="d-flex flex-column gap-2">
                        <div className="input-group flex-nowrap ps-2 pe-4">
                          <i className="bx bx-search input-group-text" />
                          <input
                            type="text"
                            placeholder="Search Activitiy..."
                            onChange={(e) => setActivitiySearchTerm(e.target.value.toLowerCase())}
                            className="form-control"
                          />
                        </div>
                        <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredActivities.length >= 5 ? 'auto' : 'visible' }}>
                          {filteredActivities.map(activity => (
                            <div className="form-check mb-2" key={activity.id}>
                              <input
                                type="radio"
                                name="activity"
                                id={`activity-${activity.id}`}
                                className="form-check-input"
                                checked={selectedActivities === activity.id}
                                onChange={() => handleActivitiyCheckboxChange(activity.id)}
                              />
                              <label htmlFor={`activity-${activity.id}`} className="form-check-label text-capitalize">
                                {activity.name} ({activity.company_count})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}


                {/* Category */}
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
            {isSeller == 0 && (

              <div>
                {/* Category */}
                <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                  <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Item Category</h3>
                  <div className="d-flex flex-column gap-2">
                    <div className="input-group flex-nowrap ps-2 pe-4">
                      <i className="bx bx-search input-group-text" />
                      <input
                        type="text"
                        placeholder="Search Item Category..."
                        onChange={(e) => setItemCategorySearchTerm(e.target.value.toLowerCase())}
                        className="form-control"
                      />
                    </div>
                    <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredItemCategories.length >= 5 ? 'auto' : 'visible' }}>

                      {filteredItemCategories.map(itemcat => (
                        <div className="form-check mb-2" key={itemcat.id}>
                          <input
                            type="radio"
                            name="itemCategory"
                            id={`itemCat-${itemcat.id}`}
                            className="form-check-input"
                            checked={selectedItemCategories === itemcat.id}
                            onChange={() => handleItemCategoryCheckboxChange(itemcat.id)}
                          />
                          <label htmlFor={`itemCat-${itemcat.id}`} className="form-check-label text-capitalize">
                            {itemcat.name} ({itemcat.company_count})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {filteredItemSubCategories.length > 0 && (
                  <>
                    <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                      <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">Item Type</h3>
                      <div className="d-flex flex-column gap-2">
                        <div className="input-group flex-nowrap ps-2 pe-4">
                          <i className="bx bx-search input-group-text" />
                          <input
                            type="text"
                            placeholder="Search Type..."
                            onChange={(e) => setItemSubCategorySearchTerm(e.target.value.toLowerCase())}
                            className="form-control"
                          />
                        </div>
                        <div className="px-2" style={{ maxHeight: '190px', overflowY: filteredItemSubCategories.length >= 5 ? 'auto' : 'visible' }}>
                          {filteredItemSubCategories.map(sub => (
                            <div className="form-check mb-2">
                              <input
                                type="checkbox"
                                id={`itemsubcat-${sub.id}`}
                                className="form-check-input"
                                checked={selectedItemSubCategories.includes(sub.id)}
                                onChange={() => handleItemSubCategoryCheckboxChange(sub.id)}
                              />
                              <label htmlFor={`itemsubcat-${sub.id}`} className="form-check-label text-capitalize">
                                {sub.name} ({sub.company_count})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

            )}

          </aside>
        </div>
        {/* Companies grid */}
        <section className="col-12 col-lg-9 mb-4">
          <div className="mb-2 text-end d-sm-none d-block">
            <button
              className="filterbutton btn btn-primary w-100"
              type="button"
              onClick={() => setShowFilter(true)}
            >
              <i className="bx bx-filter-alt pe-2"></i> Filters
            </button>
          </div>

          <div className="d-sm-flex align-items-center justify-content-between mb-2 primary-color-bg px-3 py-2 rounded-2 text-white">
            <div className="d-flex mb-0 mobileblock">
              <strong>Sort By :</strong>
              <ul className="list-unstyled filterLst d-flex flex-wrap mb-0">
                <li className="sortPopular px-sm-2 ps-0 pe-2">
                  <label
                    htmlFor="sortByPopularAtoZ"
                    className="m-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      className="invisible d-none"
                      id="sortByPopularAtoZ"
                      name="sortBy"
                      value="a_to_z"
                      checked={sortBy === "a_to_z"}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    A to Z
                    <i className="bx bx-sort-a-z ms-1" aria-hidden="true" />
                  </label>
                </li>
                <li className="sortPopular px-2 border-0 border-start border-end">
                  <label
                    htmlFor="sortByPopularZtoA"
                    className="m-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      className="invisible d-none"
                      id="sortByPopularZtoA"
                      name="sortBy"
                      value="z_to_a"
                      checked={sortBy === "z_to_a"}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    Z to A
                    <i className="bx bx-sort-z-a ms-1" aria-hidden="true" />
                  </label>
                </li>
                <li className="sortPopular px-2">
                  <label
                    htmlFor="sortByPopularNewest"
                    className="m-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      className="invisible d-none"
                      id="sortByPopularNewest"
                      name="sortBy"
                      value="newest"
                      checked={sortBy === "newest"}
                      onChange={(e) => setSortBy(e.target.value)}
                    />
                    Newest First
                    <i className="bx bx-sort ms-1" aria-hidden="true" />
                  </label>
                </li>
              </ul>
            </div>

            <div className="ms-auto d-flex gap-2 align-items-center justify-content-between mobileblock">
              <p className="mb-0 text-nowrap">{companiesTotal} Companies</p>
              <div className="text-end d-lg-none d-sm-block d-none">
                <button
                  className="filterbutton btn btn-primary"
                  type="button"
                  onClick={() => setShowFilter(true)}
                >
                  <i className="bx bx-filter-alt pe-2"></i> Filters
                </button>
              </div>
              <div className="d-lg-flex d-none gap-2 align-items-center">
                <button
                  className={`btn btn-sm text-nowrap ${viewMode === "grid"
                    ? "btn-orange"
                    : "btn-outline-white text-white"
                    }`}
                  style={{ padding: "0.188rem 0.625rem" }}
                  onClick={() => setViewMode("grid")}
                >
                  <i className="bx bx-grid-alt me-2"></i>Grid View
                </button>

                <button
                  className={`btn btn-sm text-nowrap ${viewMode === "list"
                    ? "btn-orange"
                    : "btn-outline-white text-white"
                    }`}
                  style={{ padding: "0.188rem 0.625rem" }}
                  onClick={() => setViewMode("list")}
                >
                  <i className="bx bx-list-ul me-2"></i>List View
                </button>
              </div>
            </div>
          </div>
          {(
            selectedCategories.length > 0 ||
            typeof selectedCoreActivities === 'number' ||
            typeof selectedActivities === 'number' ||
            selectedSubCategories.length > 0 ||
            typeof selectedItemCategories === 'number' || selectedItemSubCategories.length > 0 ||
            selectedStates.length > 0 ||
            selectedSourcingInterest.length > 0
          ) && (
              <div className="mb-3 border px-3 py-2 bg-white rounded-2">
                <strong className="pb-2">Filter:</strong>
                <div className="d-flex align-items-baseline justify-content-between gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {selectedCoreActivities !== null && typeof selectedCoreActivities === 'number' && (
                      <span className="badge bg-primary text-white d-flex align-items-center">
                        {getNameById(coreActivities, selectedCoreActivities)}
                        <button
                          onClick={() => setSelectedCoreActivities(null)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    )}
                    {selectedActivities !== null && typeof selectedActivities === 'number' && (
                      <span className="badge bg-primary text-white d-flex align-items-center">
                        {getNameById(activities, selectedActivities)}
                        <button
                          onClick={() => setSelectedActivities(null)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    )}

                    {selectedCategories.map(id => (
                      <span className="badge bg-primary text-white d-flex align-items-center">
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
                      <span className="badge bg-secondary text-white d-flex align-items-center">
                        {getNameById(subCategories, id)}
                        <button
                          onClick={() => handleSubCategoryCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                    {selectedItemCategories !== null && typeof selectedItemCategories === 'number' && (
                      <span className="badge bg-primary text-white d-flex align-items-center">
                        {getNameById(itemcategories, selectedItemCategories)}
                        <button
                          onClick={() => handleItemCategoryCheckboxChange(selectedItemCategories)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    )}
                    {selectedItemSubCategories.map(id => (
                      <span className="badge bg-secondary text-white d-flex align-items-center">
                        {getNameById(itemsubCategories, id)}
                        <button
                          onClick={() => handleItemSubCategoryCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                    {selectedStates.map(id => (
                      <span className="badge bg-success text-white d-flex align-items-center">
                        {getNameById(states, id)}
                        <button
                          onClick={() => handleStatesCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                    {selectedSourcingInterest.map(id => (
                      <span className="badge bg-warning text-white d-flex align-items-center">
                        {getNameById(sourcingInterest, id)}
                        <button
                          onClick={() => handleSourcingInterestCheckboxChange(id)}
                          className="btn-close btn-close-white ms-2"
                          style={{ fontSize: '0.6em' }}
                          aria-label="Remove"
                        />
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCoreActivities(null);
                      setSelectedActivities(null);
                      setSelectedCategories([]);
                      setSelectedSubCategories([]);
                      setSelectedItemCategories(null);
                      setSelectedItemSubCategories([]);
                      setSelectedStates([]);
                      setSelectedSourcingInterest([]);
                    }}
                    className="btn btn-sm btn-outline-danger text-nowrap" style={{
                      padding: '0.188rem 0.625rem'
                    }}
                  >
                    Clear All
                  </button>
                </div>

              </div>

            )
          }

          <div
            className={`row g-3 mt-3 ${viewMode === "list" ? "flex-column" : ""
              }`}
            style={{ display: "none" }}
          >
            {loading ? (
              <CompanySkeletonLoader count={6} viewMode={viewMode} />
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div
                  className={viewMode === 'grid' ? 'col-12 col-sm-6' : 'col-12'}

                  key={company.id} >
                  <div
                    className={`card shadow-sm border p-3 ${viewMode === "list" ? "list-view-card" : "h-100"
                      }`}
                  >
                    <div
                      className={`d-flex ${viewMode === "list"
                        ? "flex-column flex-md-row align-items-start gap-3"
                        : "flex-column"
                        }`}
                    >
                      {/* Company Logo */}
                      <div className="flex-shrink-0 text-center">
                        <ImageWithFallback
                          src={`${ROOT_URL}/${company.company_logo_file}`}
                          width={viewMode === "list" ? 100 : 180}
                          height={viewMode === "list" ? 100 : 180}
                          showFallback={true}
                          className="rounded border"
                        />
                      </div>

                      {/* Company Details */}
                      <div className="flex-grow-1">
                        <h5 className="mb-1">{company.organization_name}</h5>

                        <div className="companyitems companylocation d-sm-flex gap-2 mb-2">
                          <b className="fw-semibold">Location:</b>
                          <p className="mb-0">
                            {company.company_location ||
                              "4th Floor, Survey No. 8, Vijinapura Extension, Bengaluru..."}
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
                            <p className="mb-0">{company.sub_category_name}</p>
                          </div>
                          <div className="d-flex gap-2">
                            <b className="fw-semibold">Products:</b>
                            <p className="mb-0">{company.company_count || 0}</p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          <span className="badge bg-orange small">
                            PCB Assembly
                          </span>
                          <span className="badge bg-orange small">
                            Product Assembly
                          </span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="d-flex flex-column gap-2 ms-md-auto w-100 w-md-auto mt-3 mt-md-0">
                        <Link className="btn btn-sm btn-primary w-100">
                          View Details
                        </Link>
                        {isSeller == 1 || isTrading == 1 ? (
                          <Link
                            to={`/companies/${company.organization_slug}`}
                            className="d-block w-100 pt-2 btn btn-primary text-nowrap px-5"
                          >
                            View Details
                          </Link>
                        ) : (
                          <Link
                            to="/login" // or whatever your login/connect route is
                            className="d-block w-100 pt-2 btn btn-orange text-nowrap px-5"
                          >
                            Connect
                          </Link>
                        )}

                        {/* <Link className="btn btn-sm btn-orange w-100">Enquiry</Link> */}
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

          <div
            className={`row g-3 mt-1 ${viewMode === "list" ? "flex-column" : ""
              }`}
          >
            {loading ? (
              <CompanySkeletonLoader count={6} viewMode={viewMode} />
            ) : filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div
                  className={viewMode === 'grid' ? 'col-12 col-sm-6' : 'col-12'}

                  key={company.id} >
                  <div className={`card shadow-sm border comapnycardlogo h-100 ${viewMode === 'list' ? 'flex-row p-2' : ''}`}>
                    <div className={`card-header border-0 ${viewMode === 'list' ? 'p-0 ps-2 bg-white' : ''}`}>
                      <div className={`bigmobile d-sm-flex ${viewMode === 'list' ? '' : 'align-items-md-center gap-2'}`}>
                        <div className={viewMode === 'list' ? 'me-0' : 'me-xl-3 me-1 text-center mb-sm-0 mb-2'}>
                          <ImageWithFallback
                            src={`${ROOT_URL}/${company.company_logo_file}`}
                            width={viewMode === "list" ? 100 : 180}
                            height={viewMode === "list" ? 100 : 180}
                            showFallback={true}
                          />
                        </div>
                        <div className={viewMode === "list" ? "d-none" : "mt-md-0 mt--3"}>
                          <h5 className="card-title mb-1">
                            {company.organization_name}
                          </h5>
                          {isSeller == 1 || isTrading == 1 ? (
                            <div className="companyitems companylocation mb-2 d--flex gap-2">
                              <b className="fw-semibold">Location:</b>
                              <p className="mb-0">{company.company_location}</p>
                            </div>
                          ) : (
                            <div className="companyitems companylocation d-xl--flex gap-2">
                              <b className="fw-semibold">Location:</b>
                              <p className="mb-0">{company.user.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`card-body ${viewMode === "list" ? "pt-2" : ""
                        }`}
                    >
                      <div>
                        {isSeller == 1 || isTrading == 1 ? (
                          <>
                            <div
                              className={
                                viewMode === "list" ? "d-block" : "d-none"
                              }
                            >
                              <h5 className="card-title mb-1">
                                {company.organization_name}
                              </h5>
                              <div className="companyitems companylocation companylocationlist mb-2 d-sm-flex gap-2">
                                <b className="fw-semibold">Location:</b>
                                <p className="mb-0">
                                  {company.company_location}
                                </p>
                              </div>
                            </div>
                            <div className="companyitems companywebsite mb-2 d-sm-flex gap-2">
                              <b className="fw-semibold">Website:</b>
                              <p className="mb-0">{company.company_website}</p>
                            </div>

                            <div className="companyitems companycoreactivity mb-2 d-sm-flex gap-2">
                              <b className="fw-semibold">Core Activity:</b>
                              <p className="mb-0">
                                {company.core_activity_name}
                              </p>
                            </div>

                            <div className="companyitems companactivity mb-2 d-sm-flex gap-2">
                              <b className="fw-semibold">Activity:</b>
                              <p className="mb-0">{company.activity_name}</p>
                            </div>

                            <div className="companyitems compancatrgory mb-2 d-sm-flex gap-2">
                              <b className="fw-semibold">Category:</b>
                              <p className="mb-0">{company.category_name}</p>
                            </div>

                            <div className="companyitems compansubcatrgory mb-2 d-sm-flex gap-2">
                              <b className="fw-semibold">Sub Category:</b>
                              <p className="mb-0">
                                {company.sub_category_name}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className={
                                viewMode === "list" ? "d-block" : "d-none"
                              }
                            >
                              <h5 className="card-title mb-1">
                                {company.organization_name}
                              </h5>
                              <div className="companyitems companylocation companylocationlist mb-1 d-sm-flex gap-2">
                                <b className="fw-semibold">Location:</b>
                                <p className="mb-0">{company.user.address}</p>
                              </div>
                            </div>
                            <div className="companyitems companybuyer d-sm-flex gap-2">
                              <b className="fw-semibold">Product: </b>
                              <p className="mb-0">{company.user.products}</p>
                            </div>
                          </>
                        )}

                        <div className="featuredCompaniesPara d-flex align-items-center gap-1 flex-wrap">
                          {company.products &&
                            company.products.map((product, idx) => (
                              <Link
                                to={`/products/${product.slug}`}
                                className="small badge text-decoration-none text-white btn-orange text-start"
                                style={{
                                  whiteSpace: "pre-wrap",
                                  lineHeight: "17px",
                                  padding: "2px 6px",
                                  fontSize: "10px",
                                }}
                              >
                                {product.title}
                              </Link>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`card-footer ${viewMode === "list" ? "bg-white border-0 pe-2 pt-0" : ""
                        }`}
                    >
                      <div
                        className={`d-flex gap-2 ${viewMode === "list"
                          ? "align-items-center h-100"
                          : "flex-row"
                          }`}
                      >
                        {isSeller == 1 || isTrading == 1 ? (
                          <Link
                            to={`/companies/${company.organization_slug}`}
                            className="d-block w-100 pt-2 btn btn-primary text-nowrap px-5"
                          >
                            View Details
                          </Link>
                        ) : (
                          <Link
                            to="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!user) {
                                navigate("/login");
                              } else {
                                setSelectedCompany(company); // store entire company object
                                setShowModal(true);
                              }
                            }}
                            className="d-block w-100 pt-2 btn btn-orange text-nowrap px-5"
                          >
                            Connect
                          </Link>
                        )}

                        {/* <Link className="d-block w-100 pt-2 btn btn-orange text-nowrap px-5">
                          <span className="">Enquiry</span>
                        </Link> */}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <p className="text-center">No companies found.</p>
              </div>
            )}
            {selectedCompany && (
              <ConnectForm
                show={showModal}
                onHide={() => setShowModal(false)}
                companyId={selectedCompany.id}
                receiverName={selectedCompany.user?.fname}
                isBuyer={true}
                companyName={selectedCompany.name} // optional, for title
              />
            )}
            {!loading && scrollLoading && (
              <CompanySkeletonLoader count={2} viewMode={viewMode} />
            )}
          </div>
        </section >
      </div >
    </div >
  );
};

export default CompaniesFilter;