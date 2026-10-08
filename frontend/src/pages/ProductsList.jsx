import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import API_BASE_URL, { ROOT_URL } from "./../config";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
import { Link, useSearchParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import EnquiryForm from "./EnquiryForm";

// Sidebar filters and sort kept in the URL (?cat=1,2&state=5&sort=newest) so Back, refresh and
// shared links show the same list.
const URL_FILTER_KEYS = ["cat", "sub", "icat", "isub", "state", "company", "sort"];
const parseIdList = (value) => String(value || "")
  .split(",")
  .map(Number)
  .filter((id) => Number.isInteger(id) && id > 0);

// Lower-case words without a plural "s", so "Transistors" and "Power Transistor" share "transistor".
const keywordWords = (value = "") => String(value).toLowerCase().split(/[^a-z0-9]+/)
  .filter(Boolean)
  .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word));

// A keyword picked in the header/home dropdown comes as ?keyword_id=. While the search text is
// unchanged, use that keyword plus the keywords naming all words of it or of one of its synonyms
// ("Transistors" keeps "Power Transistor", "PCBA" keeps "PCB Assembly", "Rain Sensor" keeps only
// rain sensors). Typed searches use every matching keyword, as before.
const resolveProductKeywordIds = async ({
  searchTerm,
  picked = null,
}) => {
  const trimmedSearch = searchTerm.trim();
  if (trimmedSearch.length < 2) return [];
  const usePicked = picked && picked.search === trimmedSearch;

  try {
    const res = await axios.post(
      `${API_BASE_URL}/front_menu/main-search?q=${encodeURIComponent(trimmedSearch)}&type=product`
    );
    const suggestions = Array.isArray(res.data) ? res.data : [];

    const keywordSuggestions = suggestions.filter((item) => item?.type !== 'product');
    if (usePicked) {
      const preview = await axios.get(`${API_BASE_URL}/search_synonyms/preview`, { params: { q: trimmedSearch } })
        .catch(() => null);
      const pickedForms = [trimmedSearch, ...(preview?.data?.variants || [])].map(keywordWords);
      return [...new Set([
        picked.id,
        ...keywordSuggestions
          .filter((item) => {
            const words = keywordWords(item?.name);
            return pickedForms.some((form) => form.length > 0 && form.every((word) => words.includes(word)));
          })
          .map((item) => Number(item?.keyword_id ?? item?.id)),
      ].filter((id) => Number.isInteger(id) && id > 0))];
    }

    return [...new Set(
      keywordSuggestions
        .map((item) => Number(item?.keyword_id ?? item?.id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )];
  } catch (err) {
    console.error('Error resolving product keyword IDs:', err);
    return usePicked ? [picked.id] : [];
  }
};

const ProductsList = () => {
  const [productsData, setProductsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [, setResolvedKeywordIds] = useState([]);
  const [suggestedItemSubCategories, setSuggestedItemSubCategories] = useState([]);
  // Item Category of an Item Category keyword search, offered as an "All <name>" chip.
  const [suggestedItemCategory, setSuggestedItemCategory] = useState(null);
  const [itemCategoryChipActive, setItemCategoryChipActive] = useState(false);
  const debounceTimeout = useRef();
  const suggestionRequestIdRef = useRef(0);
  const productsRequestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const scrollLoadingRef = useRef(false);
  const pickedKeywordRef = useRef(null);
  const [searchParams] = useSearchParams();
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
  // What the search actually looked for (spelling fix / synonyms), from the products API.
  const [searchMeta, setSearchMeta] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [scrollLoading, setScrollLoading] = useState(false);
  const [isListView, setIsListView] = useState(false);

  const location = useLocation();
  const [showFilter, setShowFilter] = useState(false);
  // Product whose "Send Enquiry" was clicked on a card.
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [filtersReady, setFiltersReady] = useState(false);

  const selectedSuggestedItemSubCategorySet = new Set(
    selectedItemSubCategories.map((id) => Number(id))
  );

  useEffect(() => {
    const searchValue = (searchParams.get("search") || "").trim();
    const pickedKeywordId = Number(searchParams.get("keyword_id"));
    pickedKeywordRef.current = searchValue && Number.isInteger(pickedKeywordId) && pickedKeywordId > 0
      ? { id: pickedKeywordId, search: searchValue }
      : null;

    setSearchTerm(searchValue);
    setSearchInput(searchValue);

    // Prevent stale suggestion filter from previous search term.
    setSelectedItemSubCategories([]);
    setSelectedItems([]);
    setResolvedKeywordIds([]);
    setSuggestedItemSubCategories([]);
    setSuggestedItemCategory(null);
    setItemCategoryChipActive(false);
  }, [searchParams]);

  useEffect(() => {
    setFiltersReady(false);

    const queryParams = new URLSearchParams(location.search);

    // Filters saved by this page (see the URL sync below). Applied after the first render's
    // effects, which clear dependent selections while the category lists are still empty.
    if (URL_FILTER_KEYS.some((key) => queryParams.has(key))) {
      let cancelled = false;
      (async () => {
        await Promise.resolve();
        if (cancelled) return;
        setSelectedCategories(parseIdList(queryParams.get("cat")));
        setSelectedSubCategories(parseIdList(queryParams.get("sub")));
        setSelectedItemCategories(parseIdList(queryParams.get("icat")));
        setSelectedItemSubCategories(parseIdList(queryParams.get("isub")));
        setSelectedItems([]);
        setSelectedStates(parseIdList(queryParams.get("state")));
        setSelectedCompanies(parseIdList(queryParams.get("company")));
        const sort = queryParams.get("sort") || "";
        setSortBy(["a_to_z", "z_to_a", "newest"].includes(sort) ? sort : "");
        setFiltersReady(true);
      })();
      return () => { cancelled = true; };
    }

    const mapping = [
      { key: 'item_id', type: 'item' },
      { key: 'item_subcategory_id', type: 'item_subcategory' },
      { key: 'item_category_id', type: 'item_category' },
      { key: 'subcategory_id', type: 'subcategory' },
      { key: 'category_id', type: 'category' }
    ];

    const found = mapping.find(m => queryParams.get(m.key));

    if (!found) {
      setSelectedCategories([]);
      setSelectedSubCategories([]);
      setSelectedItemCategories([]);
      setSelectedItemSubCategories([]);
      setSelectedItems([]);
      setSelectedStates([]);
      setSelectedCompanies([]);
      setFiltersReady(true); // no URL filters
      return;
    }

    const id = Number(queryParams.get(found.key));

    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/products/item-hierarchy/${found.type}/${id}`
        );

        const data = res.data;

        setSelectedCategories(data.category_id ? [data.category_id] : []);
        setSelectedSubCategories(data.sub_category_id ? [data.sub_category_id] : []);
        setSelectedItemCategories(data.item_category_id ? [data.item_category_id] : []);
        setSelectedItemSubCategories(
          data.item_subcategory_id ? [data.item_subcategory_id] : []
        );
        setSelectedItems(data.item_id ? [data.item_id] : []);
        setSelectedStates([]);
        setSelectedCompanies([]);
      } catch (err) {
        console.error(err);
      } finally {
        setFiltersReady(true); // ✅ important
      }
    })();
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
          return;
        }
        const res = await axios.post(`${API_BASE_URL}/item_sub_category/by-selected-category-subcategory-itemcategory`, {
          categories: selectedCategories,
          subcategories: selectedSubCategories,
          itemCategories: selectedItemCategories,
        });
        const data = res.data || [];
        setItemSubCategories(data);
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

  useEffect(() => {
    const fetchSuggestedItemSubCategories = async () => {
      const trimmedSearch = searchTerm.trim();
      const requestId = ++suggestionRequestIdRef.current;

      if (trimmedSearch.length < 2) {
        setSuggestedItemSubCategories([]);
        setSuggestedItemCategory(null);
        return;
      }

      try {
        const keywordIds = await resolveProductKeywordIds({ searchTerm: trimmedSearch, picked: pickedKeywordRef.current });
        if (requestId !== suggestionRequestIdRef.current) return;

        const params = new URLSearchParams({
          search: trimmedSearch,
          limit: '8',
        });

        if (keywordIds.length > 0) {
          params.set('keyword_ids', keywordIds.join(','));
        }

        const res = await axios.get(`${API_BASE_URL}/products/suggested-item-subcategories?${params.toString()}`);
        if (requestId !== suggestionRequestIdRef.current) return;
        const suggestions = Array.isArray(res.data?.data) ? res.data.data : [];
        const matchedKeywords = Array.isArray(res.data?.matched_keywords) ? res.data.matched_keywords : [];

        const subCategoryOrderMap = new Map();
        matchedKeywords.forEach((keyword, index) => {
          const subId = Number(keyword?.item_subcategory_id);
          if (Number.isInteger(subId) && subId > 0 && !subCategoryOrderMap.has(subId)) {
            subCategoryOrderMap.set(subId, index);
          }
        });

        const normalizedSearch = trimmedSearch.toLowerCase();
        const searchTokens = normalizedSearch
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length > 1);

        const getSearchSignals = (name) => {
          const normalizedName = String(name || '').toLowerCase().trim();
          if (!normalizedName) {
            return {
              phraseRank: 3,
              tokenMatchCount: 0,
              startsWithFirstToken: false,
            };
          }

          const matchedTokens = new Set();
          searchTokens.forEach((token) => {
            if (normalizedName.includes(token)) {
              matchedTokens.add(token);
            }
          });

          let phraseRank = 3;
          if (normalizedName === normalizedSearch) phraseRank = 0;
          else if (normalizedName.startsWith(normalizedSearch)) phraseRank = 1;
          else if (normalizedName.includes(normalizedSearch)) phraseRank = 2;

          const startsWithFirstToken =
            searchTokens.length > 0 && normalizedName.startsWith(searchTokens[0]);

          return {
            phraseRank,
            tokenMatchCount: matchedTokens.size,
            startsWithFirstToken,
          };
        };

        const orderedSuggestions = [...suggestions].sort((a, b) => {
          const aId = Number(a?.id);
          const bId = Number(b?.id);

          const aRank = subCategoryOrderMap.has(aId)
            ? subCategoryOrderMap.get(aId)
            : Number.MAX_SAFE_INTEGER;
          const bRank = subCategoryOrderMap.has(bId)
            ? subCategoryOrderMap.get(bId)
            : Number.MAX_SAFE_INTEGER;

          if (aRank !== bRank) return aRank - bRank;

          const aSignals = getSearchSignals(a?.name);
          const bSignals = getSearchSignals(b?.name);

          if (aSignals.phraseRank !== bSignals.phraseRank) {
            return aSignals.phraseRank - bSignals.phraseRank;
          }

          if (aSignals.tokenMatchCount !== bSignals.tokenMatchCount) {
            return bSignals.tokenMatchCount - aSignals.tokenMatchCount;
          }

          if (aSignals.startsWithFirstToken !== bSignals.startsWithFirstToken) {
            return aSignals.startsWithFirstToken ? -1 : 1;
          }

          const aCount = Number(a?.product_count) || 0;
          const bCount = Number(b?.product_count) || 0;
          if (aCount !== bCount) return bCount - aCount;

          return String(a?.name || '').localeCompare(String(b?.name || ''));
        });

        setSuggestedItemSubCategories(orderedSuggestions);
        setSuggestedItemCategory(res.data?.matched_item_category || null);
      } catch (err) {
        if (requestId !== suggestionRequestIdRef.current) return;
        console.error('Error fetching suggested item subcategories:', err);
        setSuggestedItemSubCategories([]);
        setSuggestedItemCategory(null);
      }
    };

    fetchSuggestedItemSubCategories();
  }, [
    searchTerm,
  ]);

  useEffect(() => {
    if (searchTerm.trim().length < 2 || suggestedItemSubCategories.length === 0) return;
    if (selectedItemSubCategories.length > 0) return;

    const validSuggestedIds = new Set(
      suggestedItemSubCategories
        .map((item) => Number(item?.id))
        .filter((id) => Number.isInteger(id) && id > 0)
    );

    setSelectedItemSubCategories((prev) => {
      const next = prev.filter((id) => validSuggestedIds.has(Number(id)));
      return next.length === prev.length ? prev : next;
    });
  }, [suggestedItemSubCategories, searchTerm, selectedItemSubCategories.length]);

  const fetchProducts = useCallback(async (pageNumber = 1, append = false) => {
    if ((append && scrollLoadingRef.current) || (!append && loadingRef.current)) return;
    const requestId = ++productsRequestIdRef.current;

    if (append) {
      scrollLoadingRef.current = true;
      setScrollLoading(true);
    } else {
      loadingRef.current = true;
      setLoading(true);
    }
    try {
      let url = `${API_BASE_URL}/products?is_delete=0&status=1&is_approve=1&is_front=1&limit=15&page=${pageNumber}`;
      const hasSuggestedSubcategorySelection = selectedItemSubCategories.length > 0;
      const effectiveSearchTerm = hasSuggestedSubcategorySelection ? '' : searchTerm;
      const shouldApplyKeywordIds = !hasSuggestedSubcategorySelection;

      const nextResolvedKeywordIds = shouldApplyKeywordIds
        ? await resolveProductKeywordIds({
          searchTerm,
          picked: pickedKeywordRef.current,
        })
        : [];
      if (requestId !== productsRequestIdRef.current) return;
      if (shouldApplyKeywordIds) {
        setResolvedKeywordIds(nextResolvedKeywordIds);
      }

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
      // Add searchTerm to server-side query
      if (effectiveSearchTerm && effectiveSearchTerm.trim() !== "") {
        url += `&search=${encodeURIComponent(effectiveSearchTerm)}`;
      }
      if (shouldApplyKeywordIds && nextResolvedKeywordIds.length > 0) {
        url += `&keyword_ids=${nextResolvedKeywordIds.join(',')}`;
      }
      const res = await axios.get(url);
      if (requestId !== productsRequestIdRef.current) return;
      const newProducts = res.data.products || [];
      setProductsTotal(res.data.total);
      if (!append) setSearchMeta(res.data.search_meta || null);
      if (append) {
        setProductsData((prev) => [...prev, ...newProducts]);
      } else {
        setProductsData(newProducts);
      }
      const loadedSoFar = pageNumber * 15;
      if (newProducts.length === 0 || newProducts.length < 15 || loadedSoFar >= res.data.total) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      if (requestId !== productsRequestIdRef.current) return;
      console.error("Error fetching products:", err);
    } finally {
      if (requestId === productsRequestIdRef.current) {
        if (append) {
          scrollLoadingRef.current = false;
          setScrollLoading(false);
        } else {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }
  }, [
    searchTerm,
    selectedCategories,
    selectedSubCategories,
    selectedItemCategories,
    selectedItemSubCategories,
    selectedItems,
    selectedStates,
    selectedCompanies,
    sortBy,
  ]);

  useEffect(() => {
    if (!filtersReady) return; // 🚫 block early call

    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [
    filtersReady,
    fetchProducts,
    selectedCategories,
    selectedSubCategories,
    selectedItemCategories,
    selectedItemSubCategories,
    selectedItems,
    selectedStates,
    selectedCompanies,
    sortBy,
    searchTerm // <-- add searchTerm here
  ]);

  // Keep the URL in step with the filters without reloading the page (React Router is not told,
  // so this does not re-run the URL reading above).
  useEffect(() => {
    if (!filtersReady) return;
    const url = new URL(window.location.href);
    const params = url.searchParams;
    ["category_id", "subcategory_id", "item_category_id", "item_subcategory_id", "item_id", ...URL_FILTER_KEYS]
      .forEach((key) => params.delete(key));
    const setList = (key, ids) => { if (ids.length > 0) params.set(key, ids.join(",")); };
    setList("cat", selectedCategories);
    setList("sub", selectedSubCategories);
    setList("icat", selectedItemCategories);
    setList("isub", selectedItemSubCategories);
    setList("state", selectedStates);
    setList("company", selectedCompanies);
    if (sortBy) params.set("sort", sortBy);

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) params.set("search", trimmedSearch);
    else params.delete("search");
    const picked = pickedKeywordRef.current;
    if (!(picked && picked.search === trimmedSearch)) params.delete("keyword_id");

    const next = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [filtersReady, selectedCategories, selectedSubCategories, selectedItemCategories, selectedItemSubCategories,
    selectedStates, selectedCompanies, sortBy, searchTerm]);

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
  }, [page, hasMore, scrollLoading, loading, fetchProducts]);

  // Debounced search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setSearchTerm(value);
    }, 700); // 700ms debounce
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

  // Server-side search, so no need to filter client-side
  const filteredProducts = productsData;

  const hasActiveFilters = selectedCategories.length > 0 || selectedSubCategories.length > 0
    || selectedItemCategories.length > 0 || selectedItemSubCategories.length > 0 || selectedItems.length > 0
    || selectedStates.length > 0 || selectedCompanies.length > 0;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedItemCategories([]);
    setSelectedItemSubCategories([]);
    setSelectedItems([]);
    setSelectedStates([]);
    setSelectedCompanies([]);
    setItemCategoryChipActive(false);
  };

  const getNameById = (array, id) => {
    const item = array.find((el) => el.id === id);
    return item ? item.name || item.organization_name : "";
  };

  const getItemSubCategoryName = (id) => {
    const fromFilter = getNameById(itemSubCategories, id);
    if (fromFilter) return fromFilter;

    const fromSuggested = suggestedItemSubCategories.find(
      (item) => Number(item.id) === Number(id)
    );

    return fromSuggested?.name || '';
  };

  const getItemCategoryName = (id) => {
    const fromFilter = getNameById(itemCategories, id);
    if (fromFilter) return fromFilter;

    const fromSuggested = suggestedItemSubCategories.find(
      (item) => Number(item.item_category_id) === Number(id)
    );

    return fromSuggested?.item_category_name || '';
  };
  const ProductSkeletonLoader = ({ count = 15, isListView = false }) => {
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
      <div className="container-xxl my-4">
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
                    value={searchInput}
                    onInput={handleSearch}
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
                    {filteredCategories
                      .filter((cat) => cat.product_count > 0)
                      .map((cat) => (
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
                        {filteredSubCategories
                          .filter((sub) => sub.product_count > 0)
                          .map((sub) => (
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
                      .filter((itemCat) => itemCat.product_count > 0)
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
                      .filter((itemSub) => itemSub.product_count > 0)
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
                    {filteredStates
                      .filter((state) => state.product_count > 0)
                      .map((state) => (
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
                    {filteredCompanies
                      .filter((company) => company.product_count > 0)
                      .map((company) => (
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
                <strong className="text-nowrap me-1">Sort By :</strong>
                <ul className="list-unstyled filterLst d-flex flex-wrap mb-0">
                  <li className="sortPopular px-sm-2 ps-0 pe-2 border-0 border-end">
                    <label
                      htmlFor="sortByDefault"
                      className="m-0 cursor-pointer sort-label"
                      title={searchTerm.trim() ? "Best match for your search first" : "Default order"}
                    >
                      <input
                        type="radio"
                        className="invisible d-none"
                        id="sortByDefault"
                        name="sortBy"
                        value=""
                        checked={sortBy === ""}
                        onChange={() => setSortBy("")}
                      />
                      <span>{searchTerm.trim() ? "Relevance" : "Default"}</span>
                    </label>
                  </li>
                  <li className="sortPopular px-2">
                    <label
                      htmlFor="sortByPopularAtoZ"
                      className="m-0 cursor-pointer sort-label"
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
                      <span>A to
                        <i className="bx bx-sort-a-z ms-1" aria-hidden="true" />Z</span>
                    </label>
                  </li>
                  <li className="sortPopular px-2 border-0 border-start border-end">
                    <label
                      htmlFor="sortByPopularZtoA"
                      className="m-0 cursor-pointer sort-label"
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
                      <span>Z to A
                        <i className="bx bx-sort-z-a ms-1" aria-hidden="true" /></span>
                    </label>
                  </li>
                  <li className="sortPopular px-2">
                    <label
                      htmlFor="sortByPopularNewest"
                      className="m-0 cursor-pointer sort-label"
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
                      <span>Newest First
                        <i className="fadeIn animated bx bx-sort-up ms-1" aria-hidden="true" /></span>
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

            {searchTerm.trim() && searchMeta?.corrected_query && (
              <div className="mb-3 px-3 py-2 bg-white border rounded-2 small">
                Showing results for <strong>{searchMeta.corrected_query}</strong>
                <span className="text-muted"> (you searched &quot;{searchTerm.trim()}&quot;)</span>
              </div>
            )}

            {searchTerm.trim().length >= 2 && (suggestedItemSubCategories.length > 0 || selectedItemSubCategories.length > 0 || suggestedItemCategory) && (
              <div className="mb-3 border px-3 py-2 bg-white rounded-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <strong>Suggested</strong>
                  {suggestedItemCategory && (() => {
                    // Whole Item Category, including products that have no Item Sub Category.
                    const itemCategoryId = Number(suggestedItemCategory.id);
                    const isActive = itemCategoryChipActive
                      && selectedItemSubCategories.length === 0
                      && selectedItemCategories.map(Number).includes(itemCategoryId);

                    return (
                      <button
                        key={`suggest-item-cat-${itemCategoryId}`}
                        type="button"
                        className={`btn btn-sm rounded-pill ${isActive ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                          if (isActive) {
                            setSelectedCategories([]);
                            setSelectedSubCategories([]);
                            setSelectedItemCategories([]);
                            setItemCategoryChipActive(false);
                            return;
                          }
                          const categoryId = Number(suggestedItemCategory.category_id);
                          const subCategoryId = Number(suggestedItemCategory.subcategory_id);
                          setSelectedCategories(Number.isInteger(categoryId) && categoryId > 0 ? [categoryId] : []);
                          setSelectedSubCategories(Number.isInteger(subCategoryId) && subCategoryId > 0 ? [subCategoryId] : []);
                          setSelectedItemCategories([itemCategoryId]);
                          setSelectedItemSubCategories([]);
                          setSelectedItems([]);
                          setItemCategoryChipActive(true);
                        }}
                      >
                        All {suggestedItemCategory.name}
                      </button>
                    );
                  })()}
                  {suggestedItemSubCategories.map((suggestion) => {
                    const isActive = selectedSuggestedItemSubCategorySet.has(Number(suggestion.id));

                    return (
                      <button
                        key={`suggest-item-sub-${suggestion.id}`}
                        type="button"
                        className={`btn btn-sm rounded-pill ${isActive ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                          const targetId = Number(suggestion.id);
                          if (!Number.isInteger(targetId) || targetId <= 0) return;

                          const targetCategoryId = Number(suggestion.category_id);
                          const targetSubCategoryId = Number(suggestion.subcategory_id);
                          const targetItemCategoryId = Number(suggestion.item_category_id);

                          const isSameSelection =
                            selectedItemSubCategories.length === 1 &&
                            selectedItemSubCategories[0] === targetId;

                          if (isSameSelection) {
                            setSelectedItemSubCategories([]);
                            setSelectedItems([]);
                            return;
                          }

                          // Keep suggested chips single-select, and sync sidebar parent filters.
                          setItemCategoryChipActive(false);
                          if (Number.isInteger(targetCategoryId) && targetCategoryId > 0) {
                            setSelectedCategories([targetCategoryId]);
                          }
                          if (Number.isInteger(targetSubCategoryId) && targetSubCategoryId > 0) {
                            setSelectedSubCategories([targetSubCategoryId]);
                          }
                          if (Number.isInteger(targetItemCategoryId) && targetItemCategoryId > 0) {
                            setSelectedItemCategories([targetItemCategoryId]);
                          }

                          setSelectedItemSubCategories((prev) =>
                            prev.length === 1 && prev[0] === targetId ? [] : [targetId]
                          );
                          setSelectedItems([]);
                        }}
                      >
                        {suggestion.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(selectedCategories.length > 0 ||
              selectedSubCategories.length > 0 ||
              selectedItemCategories.length > 0 ||
              selectedItemSubCategories.length > 0 ||
              selectedItems.length > 0 ||
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
                          {getItemCategoryName(id)}
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
                          {getItemSubCategoryName(id)}
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
                      onClick={clearAllFilters}
                      className="btn btn-sm btn-outline-danger text-nowrap"
                      style={{
                        padding: '0.188rem 0.625rem',
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
                  <ProductSkeletonLoader count={15} isListView={isListView} />
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
                          <img
                            src={product.file_name ? `${ROOT_URL}/${product.file_name}` : '/default.png'}
                            className="img-fluid p-2"
                            alt={product.title || 'Product Image'}
                            style={{ objectFit: 'cover', borderRadius: '4px' }}
                            onError={e => { if (e.currentTarget.dataset.fallback) return; e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = '/default.png'; }}
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
                          {String(product.article_number || "").trim() && (
                            <p className="card-text small text-muted mb-1">Part No: {product.article_number}</p>
                          )}
                          {String(product.short_description || "").trim() && (
                            <p
                              className="card-text small text-muted mb-2"
                              style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                              title={product.short_description}
                            >
                              {product.short_description}
                            </p>
                          )}
                          <p className="card-text">
                            <i className="bx bx-building" />{" "}
                            {product.company_name}
                          </p>
                          <p className="card-text">
                            <i className="bx bx-map" /> {product.state_name}
                          </p>

                          {isListView ? (
                            <div className="mt-auto d-flex gap-2">
                              <Link
                                to={`/products/${product.slug}`}
                                className="btn btn-sm btn-orange text-white w-50 text-nowrap py-1 fw-medium orange-hoverbtn"
                              >
                                View Details
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary w-50 text-nowrap py-1 fw-medium"
                                onClick={() => setEnquiryProduct(product)}
                              >
                                Send Enquiry
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {!isListView && (
                          <div className="card-footer d-flex gap-2">
                            <Link
                              to={`/products/${product.slug}`}
                              className="btn btn-sm btn-orange text-white w-50 text-nowrap py-1 fw-medium orange-hoverbtn d-inline-block pt-2"
                            >
                              <span>View</span>
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary w-50 text-nowrap py-1 fw-medium"
                              onClick={() => setEnquiryProduct(product)}
                            >
                              Send Enquiry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <p className="text-center">
                      {hasActiveFilters ? "No products match the selected filters." : "No products found."}
                    </p>
                    {hasActiveFilters && (
                      <p className="text-center">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={clearAllFilters}>
                          Remove all filters
                        </button>
                      </p>
                    )}
                    {searchTerm.trim() && (searchMeta?.variants || []).length > 1 && (
                      <p className="text-center small">
                        Try:{' '}
                        {searchMeta.variants.slice(1, 4).map((variant, index) => (
                          <React.Fragment key={variant}>
                            {index > 0 && ', '}
                            <Link to={`/products?search=${encodeURIComponent(variant)}`}>{variant}</Link>
                          </React.Fragment>
                        ))}
                      </p>
                    )}
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
      {enquiryProduct && (
        <EnquiryForm
          show={Boolean(enquiryProduct)}
          onHide={() => setEnquiryProduct(null)}
          productId={`${enquiryProduct.id}`}
          companyId={`${enquiryProduct.company_id}`}
          productTitle={`${enquiryProduct.title}`}
          companyName={`${enquiryProduct.company_name}`}
        />
      )}
    </Suspense>
  );
};

export default ProductsList;
