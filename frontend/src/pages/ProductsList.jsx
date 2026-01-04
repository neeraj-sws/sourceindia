import React, { useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
import { Link, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

const ProductsList = () => {
  const [productsData, setProductsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [subCategorySearchTerm, setSubCategorySearchTerm] = useState("");
  const [itemCategories, setItemCategories] = useState([]);
  const [selectedItemCategories, setSelectedItemCategories] = useState([]);
  const [itemCategorySearchTerm, setItemCategorySearchTerm] = useState('');

  // Item sub-category filters
  const [itemSubCategories, setItemSubCategories] = useState([]);
  const [selectedItemSubCategories, setSelectedItemSubCategories] = useState([]);
  const [itemSubCategorySearchTerm, setItemSubCategorySearchTerm] = useState('');

  // Items filters
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [states, setStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [statesSearchTerm, setStatesSearchTerm] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companiesSearchTerm, setCompaniesSearchTerm] = useState("");
  const [productsTotal, setProductsTotal] = useState(0);
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [isListView, setIsListView] = useState(false);

  const location = useLocation();
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const itemIdParam = queryParams.get("item_id");
    const cateIdParam = queryParams.get("category_id");
    const subcateIdParam = queryParams.get("subcategory_id");
    const itemcateIdParam = queryParams.get("item_category_id");
    const itemsubcateIdParam = queryParams.get("item_subcategory_id");

    if (cateIdParam) {
      setSelectedCategories([Number(cateIdParam)]);
    }
    if (subcateIdParam) {
      setSelectedSubCategories([Number(subcateIdParam)]);
    }
    if (itemcateIdParam) {

      setSelectedItemCategories([Number(itemcateIdParam)]);
    }
    if (itemsubcateIdParam) {
      setSelectedItemSubCategories([Number(itemsubcateIdParam)]);
    }

    // if (itemIdParam) {

    const itemId = parseInt(itemsubcateIdParam, 10);
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/item-hierarchy/${itemId}`);
        const data = res.data;
        setSelectedCategories(data.category_id ? [data.category_id] : []);
        setSelectedSubCategories(data.sub_category_id ? [data.sub_category_id] : []);
        setSelectedItemCategories(data.item_category_id ? [data.item_category_id] : []);
        setSelectedItemSubCategories(data.item_subcategory_id ? [data.item_subcategory_id] : []);
        setSelectedItems(data.item_id ? [data.item_id] : [Number(itemId)]);
      } catch (err) {
        console.error("Error fetching item hierarchy:", err);
      }
    })();
    // }
  }, [location.search]);




  useEffect(() => {
    const searchValue = searchParams.get("search");
    if (searchValue) {
      setSearchTerm(searchValue); // Set state if search param exists
    }
  }, [searchParams]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cateParam = queryParams.get("cate");

    if (cateParam) {
      // For URLs like ?cate=3 or ?cate=3,5
      const selectedFromUrl = cateParam
        .split(",")
        .map((v) => parseInt(v.trim(), 10));
      setSelectedCategories(selectedFromUrl);
    }
  }, [location.search]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm)
  );
  const filteredSubCategories = subCategories.filter((sub) =>
    sub.name.toLowerCase().includes(subCategorySearchTerm)
  );
  const filteredStates = states.filter((state) =>
    state.name.toLowerCase().includes(statesSearchTerm)
  );
  const filteredCompanies = companies.filter((company) =>
    company.organization_name.toLowerCase().includes(companiesSearchTerm)
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0`);
        const cats = res.data || [];
        const filtered = cats.filter((cat) => cat.product_count > 0);
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
        const filtered = subs.filter((sub) => sub.product_count > 0);
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

  // Fetch Item Categories by selected Category & SubCategory
  useEffect(() => {
    const fetchItemCategories = async () => {
      try {
        if (selectedCategories.length === 0 || selectedSubCategories.length === 0) {
          setItemCategories([]);
          setSelectedItemCategories([]);
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/item_category/by-selected-category-subcategory`, {
          categories: selectedCategories,
          subcategories: selectedSubCategories,
        });
        const data = res.data || [];
        setItemCategories(data);
        // Filter out unselected
        setSelectedItemCategories(prev =>
          prev.filter(id => data.some(cat => cat.id === id))
        );
      } catch (err) {
        console.error("Error fetching item categories:", err);
      }
    };
    fetchItemCategories();
  }, [selectedCategories, selectedSubCategories]);

  // Fetch Item SubCategories by selected Item Categories
  useEffect(() => {
    const fetchItemSubCategories = async () => {
      try {
        if (
          selectedCategories.length === 0 ||
          selectedSubCategories.length === 0 ||
          selectedItemCategories.length === 0
        ) {
          setItemSubCategories([]);
          setSelectedItemSubCategories([]);
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/item_sub_category/by-selected-category-subcategory-itemcategory`, {
          categories: selectedCategories,
          subcategories: selectedSubCategories,
          itemCategories: selectedItemCategories,
        });
        const data = res.data || [];
        setItemSubCategories(data);
        setSelectedItemSubCategories(prev =>
          prev.filter(id => data.some(sub => sub.id === id))
        );
      } catch (err) {
        console.error("Error fetching item subcategories:", err);
      }
    };
    fetchItemSubCategories();
  }, [selectedCategories, selectedSubCategories, selectedItemCategories]);

  // Fetch Items by selected Item SubCategories
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (
          selectedCategories.length === 0 ||
          selectedSubCategories.length === 0 ||
          selectedItemCategories.length === 0 ||
          selectedItemSubCategories.length === 0
        ) {
          setItems([]);
          setSelectedItems([]);
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/items/by-selected-category-subcategory-itemcategory-itemsubcategory`, {
          categories: selectedCategories,
          subcategories: selectedSubCategories,
          itemCategories: selectedItemCategories,
          itemSubCategories: selectedItemSubCategories,
        });
        const data = res.data || [];
        setItems(data);
        setSelectedItems(prev =>
          prev.filter(id => data.some(item => item.id === id))
        );
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    fetchItems();
  }, [selectedCategories, selectedSubCategories, selectedItemCategories, selectedItemSubCategories]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/states/101?category_ids=${selectedCategories}&subcategory_ids=${selectedSubCategories}&item_category_ids=${selectedItemCategories}&item_subcategory_ids=${selectedItemSubCategories}`);
        const states = res.data || [];
        const filtered = states.filter((state) => state.product_count > 0);
        setStates(filtered);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };
    fetchStates();
  }, [selectedCategories, selectedSubCategories, selectedItemCategories, selectedItemSubCategories]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/products/companies?is_delete=0`
        );
        const cats = res.data.companies || [];
        const filtered = cats.filter((company) => company.product_count > 0);
        setCompanies(filtered);
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchProducts = async (pageNumber = 1, append = false) => {
    if ((append && scrollLoading) || (!append && loading)) return;
    if (append) {
      setScrollLoading(true);
    } else {
      setLoading(true);
    }
    try {
      let url = `${API_BASE_URL}/products?is_delete=0&status=1&is_approve=1&limit=9&page=${pageNumber}`;
      if (selectedCategories.length > 0) {
        url += `&category=${selectedCategories.join(",")}`;
      }
      if (selectedSubCategories.length > 0) {
        url += `&sub_category=${selectedSubCategories.join(",")}`;
      }
      if (selectedItemCategories.length > 0) {
        url += `&item_category_id=${selectedItemCategories.join(",")}`;
      }
      if (selectedItemSubCategories.length > 0) {
        url += `&item_subcategory_id=${selectedItemSubCategories.join(",")}`;
      }

      console.log('selectedItems-' + selectedItems);
      if (selectedItems.length > 0) {
        url += `&item_id=${selectedItems.join(",")}`;
      }
      if (selectedStates.length > 0) {
        url += `&user_state=${selectedStates.join(",")}`;
      }
      if (selectedCompanies.length > 0) {
        url += `&company_id=${selectedCompanies.join(",")}`;
      }
      if (sortBy) {
        url += `&sort_by=${sortBy}`;
      }
      const res = await axios.get(url);
      const newProducts = res.data.products || [];
      setProductsTotal(res.data.total);
      if (append) {
        setProductsData((prev) => [...prev, ...newProducts]);
      } else {
        setProductsData(newProducts);
      }
      if (
        newProducts.length === 0 ||
        (!append && newProducts.length < 9) ||
        (append && productsData.length + newProducts.length >= res.data.total)
      ) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      await sleep(1000);

      if (append) {
        setScrollLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [
    selectedCategories,
    selectedSubCategories,
    selectedItemCategories,
    selectedItemSubCategories,
    selectedItems,
    selectedStates,
    selectedCompanies,
    sortBy
  ]);

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
        fetchProducts(nextPage, true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, hasMore, scrollLoading, loading]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
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

  const handleStatesCheckboxChange = (statesId) => {
    setSelectedStates((prev) =>
      prev.includes(statesId)
        ? prev.filter((id) => id !== statesId)
        : [...prev, statesId]
    );
  };

  const handleCompaniesCheckboxChange = (companiesId) => {
    setSelectedCompanies((prev) =>
      prev.includes(companiesId)
        ? prev.filter((id) => id !== companiesId)
        : [...prev, companiesId]
    );
  };

  const filteredProducts = productsData.filter((product) =>
    product.title.toLowerCase().includes(searchTerm)
  );

  const getNameById = (array, id) => {
    const item = array.find((el) => el.id === id);
    return item ? item.name || item.organization_name : "";
  };
  const ProductSkeletonLoader = ({ count = 9, isListView = false }) => {
    const items = Array.from({ length: count });

    return (
      <>
        {items.map((_, i) => (
          <div key={i} className={isListView ? "col-md-6 mb-4" : "col-sm-4 mb-4"}>
            <div
              className={`card products-list-cards border overflow-hidden ${isListView ? "flex-row" : "h-100"
                }`}
              style={{ height: isListView ? 200 : "auto" }}
            >
              {/* Image Skeleton */}
              <div
                className={`d-flex justify-content-center align-items-center ${isListView ? "border-end listviewimg" : "border-bottom gridviewimg"
                  }`}
                style={{
                  width: isListView ? "200px" : "100%",
                  height: isListView ? "100%" : "200px",
                  background: "#eee",
                }}
              >
                <span
                  className="content-placeholder rounded-circle"
                  style={{ width: 100, height: 100 }}
                ></span>
              </div>

              {/* Content Skeleton */}
              <div className="card-body py-3 px-3" style={{ flex: 1 }}>
                <p>
                  <span
                    className="content-placeholder"
                    style={{ width: "70%", height: 12, display: "block", marginBottom: 10 }}
                  ></span>
                </p>

                <p>
                  <span
                    className="content-placeholder"
                    style={{ width: "40%", height: 10, display: "block", marginBottom: 6 }}
                  ></span>
                  <span
                    className="content-placeholder"
                    style={{ width: "30%", height: 10, display: "block", marginBottom: 6 }}
                  ></span>
                </p>

                {!isListView && (
                  <p>
                    <span
                      className="content-placeholder"
                      style={{ width: "100%", height: 30, display: "block" }}
                    ></span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <Suspense fallback={<div></div>}>
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
                <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                  Product Title
                </h3>
                <div className="input-group flex-nowrap ps-2 pe-4">
                  <i className="bx bx-search input-group-text" />
                  <input
                    type="text"
                    className="form-control"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search products..."
                  />
                </div>
              </div>
              <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                  Category
                </h3>
                <div className="d-flex flex-column gap-2">
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      onChange={(e) =>
                        setCategorySearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY:
                        filteredCategories.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {filteredCategories.map((cat) => (
                      <div className="form-check mb-2" key={cat.id}>
                        <input
                          type="checkbox"
                          id={`cat-${cat.id}`}
                          className="form-check-input"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => handleCategoryCheckboxChange(cat.id)}
                          disabled={cat.product_count === 0}
                        />
                        <label
                          htmlFor={`cat-${cat.id}`}
                          className="form-check-label text-capitalize"
                        >
                          {cat.name} ({cat.product_count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {filteredSubCategories.length > 0 && (
                <>
                  <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                    <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                      Sub Category
                    </h3>
                    <div className="d-flex flex-column gap-2">
                      <div className="input-group flex-nowrap ps-2 pe-4">
                        <i className="bx bx-search input-group-text" />
                        <input
                          type="text"
                          placeholder="Search sub-categories..."
                          onChange={(e) =>
                            setSubCategorySearchTerm(e.target.value.toLowerCase())
                          }
                          className="form-control"

                        />
                      </div>
                      <div
                        className="px-2"
                        style={{
                          maxHeight: "190px",
                          overflowY:
                            filteredSubCategories.length >= 5
                              ? "auto"
                              : "visible",
                        }}
                      >
                        {filteredSubCategories.map((sub) => (
                          <div className="form-check mb-2" key={sub.id}>
                            <input
                              type="checkbox"
                              id={`subcat-${sub.id}`}
                              className="form-check-input"
                              checked={selectedSubCategories.includes(sub.id)}
                              disabled={sub.product_count === 0}
                              onChange={() =>
                                handleSubCategoryCheckboxChange(sub.id)
                              }
                            />
                            <label
                              htmlFor={`subcat-${sub.id}`}
                              className="form-check-label text-capitalize"
                            >
                              {sub.name} ({sub.product_count})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* Item Category Filter */}
              {itemCategories.length > 0 && (
                <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                  <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                    Item Category
                  </h3>
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search item categories..."
                      onChange={(e) =>
                        setItemCategorySearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY: itemCategories.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {itemCategories
                      .filter((itemCat) =>
                        itemCat.name
                          .toLowerCase()
                          .includes(itemCategorySearchTerm)
                      )
                      .map((itemCat) => (
                        <div className="form-check mb-2" key={itemCat.id}>
                          <input
                            type="checkbox"
                            id={`itemCat-${itemCat.id}`}
                            className="form-check-input"
                            checked={selectedItemCategories.includes(itemCat.id)}
                            disabled={itemCat.product_count === 0}
                            onChange={() =>
                              setSelectedItemCategories((prev) =>
                                prev.includes(itemCat.id)
                                  ? prev.filter((id) => id !== itemCat.id)
                                  : [...prev, itemCat.id]
                              )
                            }
                          />
                          <label
                            htmlFor={`itemCat-${itemCat.id}`}
                            className="form-check-label text-capitalize"
                          >
                            {itemCat.name} ({itemCat.product_count || 0})
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Item Sub Category Filter */}
              {itemSubCategories.length > 0 && (
                <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                  <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                    Item Sub Category
                  </h3>
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search item sub-categories..."
                      onChange={(e) =>
                        setItemSubCategorySearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY:
                        itemSubCategories.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {itemSubCategories
                      .filter((itemSub) =>
                        itemSub.name
                          .toLowerCase()
                          .includes(itemSubCategorySearchTerm)
                      )
                      .map((itemSub) => (
                        <div className="form-check mb-2" key={itemSub.id}>
                          <input
                            type="checkbox"
                            id={`itemSub-${itemSub.id}`}
                            className="form-check-input"
                            disabled={itemSub.product_count === 0}
                            checked={selectedItemSubCategories.includes(
                              itemSub.id
                            )}
                            onChange={() =>
                              setSelectedItemSubCategories((prev) =>
                                prev.includes(itemSub.id)
                                  ? prev.filter((id) => id !== itemSub.id)
                                  : [...prev, itemSub.id]
                              )
                            }
                          />
                          <label
                            htmlFor={`itemSub-${itemSub.id}`}
                            className="form-check-label text-capitalize"
                          >
                            {itemSub.name} ({itemSub.product_count || 0})
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Items Filter */}
              {items.length > 0 && (
                <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside d-none">
                  <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                    Items
                  </h3>
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      onChange={(e) =>
                        setItemSearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY: items.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {items
                      .filter((item) =>
                        item.name.toLowerCase().includes(itemSearchTerm)
                      )
                      .map((item) => (
                        <div className="form-check mb-2" key={item.id}>
                          <input
                            type="checkbox"
                            id={`item-${item.id}`}
                            className="form-check-input"
                            checked={selectedItems.includes(item.id)}
                            onChange={() =>
                              setSelectedItems((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              )
                            }
                          />
                          <label
                            htmlFor={`item-${item.id}`}
                            className="form-check-label text-capitalize"
                          >
                            {item.name} ({item.product_count || 0})
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                  State
                </h3>
                <div className="d-flex flex-column gap-2">
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search states..."
                      onChange={(e) =>
                        setStatesSearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY: filteredStates.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {filteredStates.map((state) => (
                      <div className="form-check mb-2" key={state.id}>
                        <input
                          type="checkbox"
                          id={`state-${state.id}`}
                          className="form-check-input"
                          checked={selectedStates.includes(state.id)}
                          onChange={() => handleStatesCheckboxChange(state.id)}
                          disabled={state.product_count === 0}
                        />
                        <label
                          htmlFor={`state-${state.id}`}
                          className="form-check-label text-capitalize"
                        >
                          {state.name} ({state.product_count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-4 border pb-2 rounded-2 bg-white borderbox-aside">
                <h3 className="fs-6 mb-2 primary-color-bg text-white p-2 rounded-top-2">
                  Companies
                </h3>
                <div className="d-flex flex-column gap-2">
                  <div className="input-group flex-nowrap ps-2 pe-4">
                    <i className="bx bx-search input-group-text" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      onChange={(e) =>
                        setCompaniesSearchTerm(e.target.value.toLowerCase())
                      }
                      className="form-control"
                    />
                  </div>
                  <div
                    className="px-2"
                    style={{
                      maxHeight: "190px",
                      overflowY:
                        filteredCompanies.length >= 5 ? "auto" : "visible",
                    }}
                  >
                    {filteredCompanies.map((company) => (
                      <div className="form-check mb-2" key={company.id}>
                        <input
                          type="checkbox"
                          id={`company-${company.id}`}
                          className="form-check-input"
                          checked={selectedCompanies.includes(company.id)}
                          disabled={company.product_count === 0}
                          onChange={() =>
                            handleCompaniesCheckboxChange(company.id)
                          }
                        />
                        <label
                          htmlFor={`company-${company.id}`}
                          className="form-check-label text-capitalize"
                        >
                          {company.organization_name} ({company.product_count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {showFilter && (
              <div
                className="filter-overlay"
                onClick={() => setShowFilter(false)}
              ></div>
            )}
          </div>
          {/* Products grid */}
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
              <div className="d-flex mobileblock mb-0">
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
                <p className="mb-0 text-nowrap">{productsTotal} Products</p>
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
                    className={`btn btn-sm text-nowrap ${!isListView ? "btn-orange" : "btn-outline-white text-white"
                      }`}
                    style={{ padding: "0.188rem 0.625rem" }}
                    onClick={() => setIsListView(false)}
                  >
                    <i className="bx bx-grid-alt me-2"></i> Grid View
                  </button>

                  <button
                    className={`btn btn-sm text-nowrap ${isListView ? "btn-orange" : "btn-outline-white text-white"
                      }`}
                    style={{ padding: "0.188rem 0.625rem" }}
                    onClick={() => setIsListView(true)}
                  >
                    <i className="bx bx-list-ul me-2"></i> List View
                  </button>
                </div>
              </div>
            </div>
            {(selectedCategories.length > 0 ||
              selectedSubCategories.length > 0 ||
              selectedStates.length > 0 ||
              selectedCompanies.length > 0) && (
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
                      {selectedItemCategories.map(id => (
                        <span key={`itemcat-${id}`} className="badge bg-warning text-dark d-flex align-items-center">
                          {getNameById(itemCategories, id)}
                          <button
                            onClick={() => setSelectedItemCategories(prev => prev.filter(cid => cid !== id))}
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: '0.6em' }}
                            aria-label="Remove"
                          />
                        </span>
                      ))}
                      {selectedItemSubCategories.map(id => (
                        <span key={`itemsub-${id}`} className="badge bg-info text-white d-flex align-items-center">
                          {getNameById(itemSubCategories, id)}
                          <button
                            onClick={() => setSelectedItemSubCategories(prev => prev.filter(cid => cid !== id))}
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: '0.6em' }}
                            aria-label="Remove"
                          />
                        </span>
                      ))}
                      {selectedItems.map(id => (
                        <span key={`itm-${id}`} className="badge bg-dark text-white d-flex align-items-center">
                          {getNameById(items, id)}
                          <button
                            onClick={() => setSelectedItems(prev => prev.filter(cid => cid !== id))}
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
                      {selectedCompanies.map(id => (
                        <span key={`comp-${id}`} className="badge bg-info text-white d-flex align-items-center">
                          {getNameById(companies, id)}
                          <button
                            onClick={() => handleCompaniesCheckboxChange(id)}
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
                        setSelectedItemCategories([]);
                        setSelectedItemSubCategories([]);
                        setSelectedItems([]);
                        setSelectedStates([]);
                        setSelectedCompanies([]);
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
            <div className="py-3 rounded-2 pb-0 mt-2">
              <div className="row">
                {loading ? (
                  <ProductSkeletonLoader count={9} isListView={isListView} />
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (

                    <div key={product.id} className={isListView ? "col-md-6 mb-4" : "col-lg-4 col-sm-6 mb-4"}>
                      <div
                        className={`card text-dark border overflow-hidden products-list-cards ${isListView ? "flex-row" : "h-100"
                          }`}
                        style={{ height: isListView ? 200 : "auto" }}
                      >
                        <div
                          className={`d-flex justify-content-center align-items-center ${isListView
                            ? "border-end listviewimg"
                            : "border-bottom gridviewimg"
                            }`}
                          style={{
                            width: isListView ? "200px" : "100%",
                            height: isListView ? "100%" : "200px",
                          }}
                        >
                          <ImageWithFallback
                            src={`${ROOT_URL}/${product.file_name}`}
                            width={180}
                            height={180}
                            showFallback={true}
                          />
                        </div>

                        <div
                          className={`card-body ${isListView
                            ? "d-flex flex-column justify-content-between py-2 px-3"
                            : "pb-0"
                            }`}
                          style={{ flex: 1 }}
                        >
                          <h5 className="card-title">{product.title}</h5>
                          <p className="card-text">
                            <i className="bx bx-building" />{" "}
                            {product.company_name}
                          </p>
                          <p className="card-text">
                            <i className="bx bx-map" /> {product.state_name}
                          </p>

                          {isListView ? (
                            <div className="mt-auto">
                              <button className="btn btn-sm btn-orange text-white w-100 text-nowrap py-1 fw-medium orange-hoverbtn">
                                View Details
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {!isListView && (
                          <div className="card-footer">
                            <Link
                              to={`/products/${product.slug}`}
                              className="btn btn-sm btn-orange text-white w-100 text-nowrap py-1 fw-medium orange-hoverbtn d-inline-block pt-2"
                            >
                              <span className="pe-2">View</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <p className="text-center">No products found.</p>
                  </div>
                )}
                {!loading && scrollLoading && (
                  <ProductSkeletonLoader count={3} isListView={isListView} />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Suspense>
  );
};

export default ProductsList;
