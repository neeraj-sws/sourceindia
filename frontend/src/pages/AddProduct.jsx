// Product name autocomplete

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from '../admin/common/Breadcrumb';
import API_BASE_URL, { ROOT_URL } from "./../config";
import { useAlert } from "./../context/AlertContext";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ProductModals from "../admin/pages/modal/ProductModals";
import { createPortal } from 'react-dom';
import UseAuth from '../sections/UseAuth';
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const AddProduct = () => {
  const { showNotification } = useAlert();
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const { user, loading } = UseAuth();

  // Redirect to login if user is not present after loading
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [activeSuggestionKey, setActiveSuggestionKey] = useState('');
  const [selectedSuggestionTitle, setSelectedSuggestionTitle] = useState('');
  const [isOtherLabelSelected, setIsOtherLabelSelected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '', title: '', code: '', article_number: '', status: '', short_description: '', description: '', item_category_id: ''
  });
  const suppressTitleAutoSelectRef = useRef(false);

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [itemCategories, setItemCategories] = useState([]);
  const [selectedItemCategory, setSelectedItemCategory] = useState('');
  const [itemSubCategories, setItemSubCategories] = useState([]);
  const [selectedItemSubCategory, setSelectedItemSubCategory] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState('');
  const normalizeCategoryList = (payload) => {
    const rows = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.data) ? payload.data : []);

    return rows.map((category) => ({
      ...category,
      is_other: Number(category?.is_other ?? category?.isOther ?? category?.isother ?? 0),
    }));
  };

  const normalizeSuggestText = (text = '') =>
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokenizeSuggestText = (text = '', minLength = 1) =>
    normalizeSuggestText(text)
      .split(' ')
      .map((w) => w.trim())
      .filter((w) => w.length >= minLength);

  const getSuggestionKey = (suggestion = {}) =>
    `${String(suggestion?.id ?? '')}::${normalizeSuggestText(suggestion?.title || '')}`;
  const OTHER_SUGGESTION_KEY = '__other__';

  const getTokenMatchScore = (queryTokens = [], titleTokens = []) => {
    if (!queryTokens.length || !titleTokens.length) return 0;

    let score = 0;
    queryTokens.forEach((queryToken) => {
      const bestMatch = titleTokens.some((titleToken) => {
        if (!queryToken || !titleToken) return false;
        return titleToken.includes(queryToken) || titleToken.startsWith(queryToken) || queryToken.startsWith(titleToken);
      });
      if (bestMatch) score += 1;
    });

    return score;
  };

  const rankSuggestionsByQuery = (suggestions = [], query = '') => {
    const normalizedQuery = normalizeSuggestText(query);
    const queryTokens = tokenizeSuggestText(query, 3);
    if (!normalizedQuery) return suggestions;

    return [...suggestions].sort((a, b) => {
      const aTitle = normalizeSuggestText(a?.title || '');
      const bTitle = normalizeSuggestText(b?.title || '');
      const aExact = aTitle === normalizedQuery ? 1 : 0;
      const bExact = bTitle === normalizedQuery ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aTokens = tokenizeSuggestText(a?.title || '', 1);
      const bTokens = tokenizeSuggestText(b?.title || '', 1);
      const aTokenMatchScore = getTokenMatchScore(queryTokens, aTokens);
      const bTokenMatchScore = getTokenMatchScore(queryTokens, bTokens);
      if (aTokenMatchScore !== bTokenMatchScore) return bTokenMatchScore - aTokenMatchScore;

      const aPrefix = aTitle.startsWith(normalizedQuery) ? 1 : 0;
      const bPrefix = bTitle.startsWith(normalizedQuery) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;

      const aContains = aTitle.includes(normalizedQuery) ? 1 : 0;
      const bContains = bTitle.includes(normalizedQuery) ? 1 : 0;
      if (aContains !== bContains) return bContains - aContains;

      const aScore = Number(a?.match_score || 0);
      const bScore = Number(b?.match_score || 0);
      if (aScore !== bScore) return bScore - aScore;

      return aTitle.length - bTitle.length;
    });
  };

  const findOtherCategoryOption = () =>
    (Array.isArray(categories) ? categories : []).find((category) => {
      const name = String(category?.name || '').toLowerCase();
      return Number(category?.is_other) === 1 || name === 'others' || name.includes('uncategorized');
    }) || null;

  const applyOtherCategorySelection = () => {
    const otherCategory = findOtherCategoryOption();

    setSelectedCategory(otherCategory ? String(otherCategory.id) : '');
    setSelectedSubCategory('');
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setKeywords([]);
    setItems([]);
    setActiveSuggestionKey('');
    setIsOtherLabelSelected(true);
    setCategoryLabel(otherCategory?.name || 'Other');
    setErrors((prev) => {
      const next = { ...(prev || {}) };
      delete next.category;
      delete next.sub_category;
      delete next.item_category;
      return next;
    });
  };

  const getSelectedNameById = (list = [], id = '') => {
    if (!id) return '';
    const match = (Array.isArray(list) ? list : []).find((item) => String(item?.id) === String(id));
    return match?.name || '';
  };
  const getSubCategoryCategoryId = (subCategory) => subCategory?.category_id ?? subCategory?.category ?? null;
  const isSuggestionTagActive = (suggestion) => activeSuggestionKey === getSuggestionKey(suggestion);

  const isOtherCategorySelected = (() => {
    if (isOtherLabelSelected) return true;
    const selectedCategoryObj = (Array.isArray(categories) ? categories : []).find(
      (category) => String(category?.id) === String(selectedCategory)
    );
    const selectedName = String(selectedCategoryObj?.name || '').toLowerCase();
    return Number(selectedCategoryObj?.is_other) === 1 || selectedName === 'others' || selectedName.includes('uncategorized');
  })();

  const visibleSubCategories = subCategories.filter(
    (subCategory) => !selectedCategory || String(getSubCategoryCategoryId(subCategory)) === String(selectedCategory)
  );

  // Inline Category Picker state
  const [pickerData, setPickerData] = useState([]);
  const [pickerExpanded, setPickerExpanded] = useState({});
  const [pickerSubExpanded, setPickerSubExpanded] = useState({});
  const [pickerLoading, setPickerLoading] = useState(true);
  const [pickerError, setPickerError] = useState(null);
  const emptyPickerSelection = { categoryId: null, categoryName: '', subId: null, subName: '', itemCategoryId: null, itemCategoryName: '' };
  const [pickerSelection, setPickerSelection] = useState(emptyPickerSelection);
  const pickerDialogRef = React.useRef(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const subCategoriesRef = useRef([]);

  useEffect(() => {
    subCategoriesRef.current = subCategories;
  }, [subCategories]);

  const resetCategorySelections = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setActiveSuggestionKey('');
    setSelectedSuggestionTitle('');
    setIsOtherLabelSelected(false);
    setSubCategories([]);
    setItemCategories([]);
    setItemSubCategories([]);
    setKeywords([]);
    setItems([]);
    setCategoryLabel('');
    setPickerSelection(emptyPickerSelection);
  };

  useEffect(() => {
    if (selectedCategory && selectedSubCategory) {
      axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${selectedCategory}/${selectedSubCategory}`)
        .then(res => setItemCategories(res.data))
        .catch(err => {
          console.error("Error fetching item categories:", err);
          setItemCategories([]);
        });
    } else {
      setItemCategories([]);
    }
  }, [selectedCategory, selectedSubCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories?is_delete=0&status=1`);
        setCategories(normalizeCategoryList(res.data));
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([]);
      return;
    }

    const fetchSubCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sub_categories/category/${selectedCategory}`);
        setSubCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategory]);

  useEffect(() => {
    if (!(selectedCategory && selectedSubCategory && selectedItemCategory)) {
      setItemSubCategories([]);
      setKeywords([]);
      setSelectedKeyword('');
      return;
    }

    axios.get(
      `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}`
    )
      .then(res => setItemSubCategories(res.data || []))
      .catch(err => {
        console.error("Error fetching item sub categories:", err);
        setItemSubCategories([]);
      });
  }, [selectedCategory, selectedSubCategory, selectedItemCategory]);

  useEffect(() => {
    if (!(selectedCategory && selectedSubCategory && selectedItemCategory && selectedItemSubCategory)) {
      setItems([]);
      return;
    }

    axios.get(
      `${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}/${selectedItemSubCategory}`
    )
      .then(res => setItems(res.data || []))
      .catch(err => {
        console.error("Error fetching items:", err);
        setItems([]);
      });
  }, [selectedCategory, selectedSubCategory, selectedItemCategory, selectedItemSubCategory]);

  const handleSubCategoryChange = async (event) => {
    const subCategoryId = event.target.value;

    if (!subCategoryId) {
      setSelectedSubCategory('');
      setSelectedItemCategory('');
      setSelectedItemSubCategory('');
      setSelectedKeyword('');
      setSelectedItem('');
      setItemCategories([]);
      setItemSubCategories([]);
      setKeywords([]);
      setItems([]);
      return;
    }

    // Find subcategory object
    const subCat = subCategoriesRef.current.find(sc => String(sc.id) === subCategoryId);
    const subCatCategoryId = getSubCategoryCategoryId(subCat);

    setSelectedSubCategory(subCategoryId);
    setSelectedCategory(subCatCategoryId ? String(subCatCategoryId) : "");

    // Reset dependent dropdowns
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setKeywords([]);
    setItems([]);

    if (subCat && subCatCategoryId) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/item_category/by-category-subcategory/${subCatCategoryId}/${subCategoryId}`
        );
        setItemCategories(res.data);
      } catch (error) {
        console.error("Error fetching item categories:", error);
        setItemCategories([]);
      }
    }
  };

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);

    // reset dependent fields
    setSelectedSubCategory('');
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setKeywords([]);
    setItems([]);
  };

  const handleCategoryPick = async ({ category, categoryName, sub_category, subName, item_category_id, itemCategoryName }) => {
    setSelectedCategory(category || '');
    setSelectedSubCategory(sub_category || '');
    setSelectedItemCategory(item_category_id || '');
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setKeywords([]);

    const parts = [];
    if (categoryName) parts.push(categoryName);
    if (subName) parts.push(subName);
    if (itemCategoryName) parts.push(itemCategoryName);
    setCategoryLabel(parts.join(' > '));

    if (category && sub_category) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/item_category/by-category-subcategory/${category}/${sub_category}`
        );
        setItemCategories(res.data || []);
      } catch (err) {
        setItemCategories([]);
      }
    }
  };

  // Inline picker helpers
  const loadPickerData = async () => {
    setPickerLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      // Prefer seller-specific subcategories for this user
      const res = await axios.get(`${API_BASE_URL}/sellers/seller-subcategories-by-user`, {
        params: { user_id: user?.id, category_id: selectedCategory || undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Group subcategories by category to build picker structure
      const subs = res.data || [];
      const map = {};
      subs.forEach(s => {
        const cid = s.category_id || s.category || '0';
        if (!map[cid]) {
          map[cid] = { id: cid, name: s.category_name || s.category_name || s.category || 'Uncategorized', subcategories: [] };
        }
        map[cid].subcategories.push({ id: s.id, name: s.name || s.sub_name || s.subcategory || s.title || 'Subcategory', item_categories: s.item_categories || [] });
      });

      setPickerData(Object.values(map));
      // eager-load item categories for all subcategories so table shows item categories
      try {
        const subsToLoad = [];
        Object.values(map).forEach(c => {
          (c.subcategories || []).forEach(s => {
            subsToLoad.push({ catId: c.id, subId: s.id });
          });
        });

        const token = localStorage.getItem('user_token');
        await Promise.all(subsToLoad.map(async ({ catId, subId }) => {
          try {
            const resIC = await axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${catId}/${subId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const items = resIC.data || [];
            setPickerData(prev => prev.map(c => {
              if (String(c.id) !== String(catId)) return c;
              return {
                ...c,
                subcategories: c.subcategories.map(su => String(su.id) === String(subId) ? { ...su, item_categories: items } : su)
              };
            }));
          } catch (err) {
            // ignore per-sub failures
          }
        }));
      } catch (err) {
        // ignore overall eager-load failures
      }
    } catch (err) {
      console.error('Error loading picker data:', err);
      setPickerError(err.message || 'Failed to load categories');
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    if (!showCategoryPicker) return;
    loadPickerData();
  }, [showCategoryPicker]);

  useEffect(() => {
    if (showCategoryPicker) setPickerQuery('');
  }, [showCategoryPicker]);

  useEffect(() => {
    if (!showCategoryPicker) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') setShowCategoryPicker(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [showCategoryPicker]);

  useEffect(() => {
    if (showCategoryPicker && pickerDialogRef.current) try { pickerDialogRef.current.focus(); } catch (e) { }
  }, [showCategoryPicker]);

  const pickerToggle = (id) => setPickerExpanded(s => ({ ...s, [id]: !s[id] }));
  const pickerToggleSub = async (catId, subId) => {
    const currently = pickerSubExpanded[subId];
    setPickerSubExpanded(s => ({ ...s, [subId]: !s[subId] }));
    // if we are opening, load item categories for this sub if not present
    if (!currently) {
      try {
        // find existing sub in pickerData
        const cat = pickerData.find(c => String(c.id) === String(catId));
        const subObj = cat?.subcategories?.find(s => String(s.id) === String(subId));
        if (subObj && (!subObj.item_categories || subObj.item_categories.length === 0)) {
          const token = localStorage.getItem('user_token');
          const res = await axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${catId}/${subId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const items = res.data || [];
          setPickerData(prev => prev.map(c => {
            if (String(c.id) !== String(catId)) return c;
            return {
              ...c,
              subcategories: c.subcategories.map(su => String(su.id) === String(subId) ? { ...su, item_categories: items } : su)
            };
          }));
        }
      } catch (err) {
        console.error('Error loading item categories for sub:', err);
      }
    }
  };
  const pickerHandleSelect = (catId, catName, subId, subName, itemCategoryId, itemCategoryName) => {
    const selection = { categoryId: catId || null, categoryName: catName || '', subId: subId || null, subName: subName || '', itemCategoryId: itemCategoryId || null, itemCategoryName: itemCategoryName || '' };
    setPickerSelection(selection);
    // Apply immediately and close modal (no confirm required)
    handleCategoryPick({
      category: selection.categoryId || '',
      categoryName: selection.categoryName || '',
      sub_category: selection.subId || '',
      subName: selection.subName || '',
      item_category_id: selection.itemCategoryId || '',
      itemCategoryName: selection.itemCategoryName || ''
    });
    setShowCategoryPicker(false);
  };

  const pickerClear = () => setPickerSelection({ categoryId: null, categoryName: '', subId: null, subName: '', itemCategoryId: null, itemCategoryName: '' });

  const pickerConfirm = () => {
    // reuse existing handler to set form state
    handleCategoryPick({
      category: pickerSelection.categoryId || '',
      categoryName: pickerSelection.categoryName || '',
      sub_category: pickerSelection.subId || '',
      subName: pickerSelection.subName || '',
      item_category_id: pickerSelection.itemCategoryId || '',
      itemCategoryName: pickerSelection.itemCategoryName || ''
    });
    setShowCategoryPicker(false);
  };

  // Flatten pickerData into table rows: { catId, catName, subId, subName, itemId, itemName }
  const pickerRows = [];
  if (pickerData && Array.isArray(pickerData)) {
    pickerData.forEach(cat => {
      const catId = cat.id;
      const catName = cat.name || '';
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach(sub => {
          const subId = sub.id;
          const subName = sub.name || '';
          if (sub.item_categories && sub.item_categories.length > 0) {
            sub.item_categories.forEach(ic => {
              pickerRows.push({ catId, catName, subId, subName, itemId: ic.id, itemName: ic.name || '' });
            });
          } else {
            pickerRows.push({ catId, catName, subId, subName, itemId: null, itemName: '' });
          }
        });
      } else {
        pickerRows.push({ catId, catName, subId: null, subName: '', itemId: null, itemName: '' });
      }
    });
  }

  // deterministic pastel color per id
  const getColorForId = (id) => {
    if (id === undefined || id === null) return 'transparent';
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    // lighter, softer header
    return `hsl(${hue}, 55%, 94%)`;
  };

  const getRowColor = (id) => {
    if (id === undefined || id === null) return 'transparent';
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 50;
    const lightness = 94 - (Math.abs(hash) % 4); // very light variations
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };



  // Handle Item Category Change
  const handleItemCategoryChange = async (event) => {
    const itemCategoryId = event.target.value;
    setSelectedItemCategory(itemCategoryId);
    setSelectedItemSubCategory('');
    setSelectedKeyword('');
    setSelectedItem('');
    setItemSubCategories([]);
    setKeywords([]);
    setItems([]);
  };

  const handleItemSubCategoryChange = async (event) => {
    const itemSubCategoryId = event.target.value;
    setSelectedItemSubCategory(itemSubCategoryId);
    setSelectedKeyword('');
    setSelectedItem('');
    setKeywords([]);
    setItems([]);
  };

  const handleItemChange = async (event) => {
    const itemId = event.target.value;
    setSelectedItem(itemId);
  };

  useEffect(() => {
    const $category = $('#category');
    const $subCategory = $('#sub_category');
    const $itemCategory = $('#item_category_id');
    const $itemSubCategory = $('#item_sub_category_id');
    const $keyword = $('#keyword_id');
    const $item = $('#item_id');

    $category.select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Category"
    }).on("change.addProduct", function () {
      const categoryId = $(this).val();
      handleCategoryChange({ target: { value: categoryId } });
    });

    $subCategory.select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Sub Category"
    }).on("change.addProduct", function () {
      const subCategoryId = $(this).val();
      handleSubCategoryChange({ target: { value: subCategoryId } });
    });
    $itemCategory
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Category" })
      .on("change.addProduct", function () {
        handleItemCategoryChange({ target: { value: $(this).val() } });
      });

    $itemSubCategory
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Sub Category" })
      .on("change.addProduct", function () {
        handleItemSubCategoryChange({ target: { value: $(this).val() } });
      });

    $keyword
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Keyword" })
      .on("change.addProduct", function () {
        setSelectedKeyword($(this).val() || '');
      });

    $item
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item" })
      .on("change.addProduct", function () {
        handleItemChange({ target: { value: $(this).val() } });
      });

    return () => {
      if ($category.data('select2')) {
        $category.off("change.addProduct").select2('destroy');
      }
      if ($subCategory.data('select2')) {
        $subCategory.off("change.addProduct").select2('destroy');
      }
      if ($itemCategory.data('select2')) {
        $itemCategory.off("change.addProduct").select2('destroy');
      }
      if ($itemSubCategory.data('select2')) {
        $itemSubCategory.off("change.addProduct").select2('destroy');
      }
      if ($keyword.data('select2')) {
        $keyword.off("change.addProduct").select2('destroy');
      }
      if ($item.data('select2')) {
        $item.off("change.addProduct").select2('destroy');
      }
    };
  }, []);

  useEffect(() => {
    const categoryExists = categories.some(c => String(c.id) === String(selectedCategory));
    $('#category')
      .val(categoryExists ? String(selectedCategory) : '')
      .trigger('change.select2');
  }, [categories, selectedCategory]);

  useEffect(() => {
    const visibleSubCategories = subCategories.filter(
      sc => !selectedCategory || String(getSubCategoryCategoryId(sc)) === String(selectedCategory)
    );
    const subCategoryExists = visibleSubCategories.some(sc => String(sc.id) === String(selectedSubCategory));

    $('#sub_category')
      .val(subCategoryExists ? String(selectedSubCategory) : '')
      .trigger('change.select2');
  }, [subCategories, selectedSubCategory, selectedCategory]);

  useEffect(() => {
    const itemCategoryExists = itemCategories.some(ic => String(ic.id) === String(selectedItemCategory));
    $('#item_category_id')
      .val(itemCategoryExists ? String(selectedItemCategory) : '')
      .trigger('change.select2');
  }, [itemCategories, selectedItemCategory]);

  useEffect(() => {
    const itemSubCategoryExists = itemSubCategories.some(isc => String(isc.id) === String(selectedItemSubCategory));
    $('#item_sub_category_id')
      .val(itemSubCategoryExists ? String(selectedItemSubCategory) : '')
      .trigger('change.select2');
  }, [itemSubCategories, selectedItemSubCategory]);

  useEffect(() => {
    const keywordExists = keywords.some((keyword) => String(keyword.id) === String(selectedKeyword));
    $('#keyword_id')
      .val(keywordExists ? String(selectedKeyword) : '')
      .trigger('change.select2');
  }, [keywords, selectedKeyword]);

  useEffect(() => {
    const itemExists = items.some(i => String(i.id) === String(selectedItem));
    $('#item_id')
      .val(itemExists ? String(selectedItem) : '')
      .trigger('change.select2');
  }, [items, selectedItem]);

  useEffect(() => {
    if (!selectedItemSubCategory) {
      setKeywords([]);
      setSelectedKeyword('');
      return;
    }

    axios.get(`${API_BASE_URL}/keywords/by-subcategory/${selectedItemSubCategory}`)
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setKeywords(rows);
      })
      .catch((err) => {
        console.error("Error fetching keywords:", err);
        setKeywords([]);
      });
  }, [selectedItemSubCategory]);

  const fetchProductSuggestions = async (queryValue) => {
    const filteredParams = {
      query: queryValue,
      category: selectedCategory || undefined,
      sub_category: selectedSubCategory || undefined,
      item_category_id: selectedItemCategory || undefined,
      item_subcategory_id: selectedItemSubCategory || undefined,
    };

    const fetchSuggestions = async (params) => {
      const res = await axios.get(`${API_BASE_URL}/products/suggest`, { params });
      return res.data?.data || [];
    };

    let suggestions = await fetchSuggestions(filteredParams);
    const hasHierarchyFilter = !!(
      filteredParams.category ||
      filteredParams.sub_category ||
      filteredParams.item_category_id ||
      filteredParams.item_subcategory_id
    );

    if (suggestions.length === 0 && hasHierarchyFilter) {
      suggestions = await fetchSuggestions({
        query: queryValue,
      });
    }

    return rankSuggestionsByQuery(suggestions, queryValue);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Product name autocomplete logic
    if (id === 'title') {
      setActiveSuggestionKey('');
      setSelectedSuggestionTitle('');
      setIsOtherLabelSelected(false);
      if (!value.trim()) {
        resetCategorySelections();
      }
      if (value.length >= 2) {
        setSuggestionLoading(true);

        (async () => {
          try {
            const rankedSuggestions = await fetchProductSuggestions(value);
            setProductSuggestions(rankedSuggestions);
            setShowSuggestions(true);
          } catch {
            setProductSuggestions([]);
            setShowSuggestions(false);
          } finally {
            setSuggestionLoading(false);
          }
        })();
      } else {
        setProductSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  // When user selects a suggestion
  const handleSuggestionSelect = async (suggestion, options = {}) => {
    const { preserveTypedTitle = false, typedTitle = '', isAutoSelect = false } = options;
    const suggestionCategoryIsOther = Number(
      suggestion?.category_is_other ?? suggestion?.is_other ?? suggestion?.categoryIsOther ?? 0
    );
    setFormData(prev => ({
      ...prev,
      title: preserveTypedTitle ? typedTitle : suggestion.title
    }));
    setActiveSuggestionKey(getSuggestionKey(suggestion));
    setIsOtherLabelSelected(false);
    if (!isAutoSelect) {
      setSelectedSuggestionTitle(String(suggestion?.title || '').trim());
    }
    setShowSuggestions(false);

    if (suggestion.category && suggestion.category_name) {
      setCategories(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existingIndex = safePrev.findIndex(
          (cat) => String(cat.id) === String(suggestion.category)
        );
        if (existingIndex >= 0) {
          const existing = safePrev[existingIndex];
          if (
            existing?.is_other === undefined &&
            suggestionCategoryIsOther
          ) {
            const next = [...safePrev];
            next[existingIndex] = { ...existing, is_other: suggestionCategoryIsOther };
            return next;
          }
          return safePrev;
        }
        return [{
          id: suggestion.category,
          name: suggestion.category_name,
          is_other: suggestionCategoryIsOther
        }, ...safePrev];
      });
    }

    if (suggestion.sub_category && suggestion.sub_category_name) {
      setSubCategories(prev => {
        const exists = prev.some(sc => String(sc.id) === String(suggestion.sub_category));
        if (exists) return prev;
        return [{ id: suggestion.sub_category, name: suggestion.sub_category_name, category_id: suggestion.category || null }, ...prev];
      });
    }

    if (suggestion.category) {
      setSelectedCategory(String(suggestion.category));
    }
    if (suggestion.sub_category) {
      setSelectedSubCategory(String(suggestion.sub_category));
    }
    if (suggestion.item_category_id) {
      setSelectedItemCategory(String(suggestion.item_category_id));
    }
    if (suggestion.item_subcategory_id) {
      setSelectedItemSubCategory(String(suggestion.item_subcategory_id));
    }
    if (suggestion.id) {
      setSelectedKeyword(String(suggestion.id));
    }
  };

  const handleOtherSuggestionSelect = () => {
    applyOtherCategorySelection();
    setActiveSuggestionKey(OTHER_SUGGESTION_KEY);
    setSelectedSuggestionTitle('');
    setShowSuggestions(false);
  };



  const handleTitleBlur = () => {
    setTimeout(() => {
      const shouldSuppress = suppressTitleAutoSelectRef.current;
      suppressTitleAutoSelectRef.current = false;

      if (shouldSuppress) {
        setShowSuggestions(false);
        return;
      }

      if (productSuggestions.length > 0 && formData.title.trim().length >= 2) {
        const topSuggestion = productSuggestions[0];
        handleSuggestionSelect(topSuggestion, {
          preserveTypedTitle: true,
          typedTitle: formData.title,
          isAutoSelect: true
        });
        return;
      } else {
        if (formData.title.trim().length > 0) {
          applyOtherCategorySelection();
        }
        setActiveSuggestionKey('');
        setShowSuggestions(false);
      }
    }, 150);
  };



  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const validateForm = () => {
    const errs = {};
    if (!user || !user.id) errs.user = 'User not found. Please login again.';
    if (!formData.title.trim()) errs.title = 'Title is required';
    // if (!selectedCategory) errs.category = "Category is required";
    if (!isOtherCategorySelected && !selectedSubCategory) errs.sub_category = "Sub Category is required";
    if (!isOtherCategorySelected && !selectedItemCategory) errs.item_category = "Item Category is required";
    if (!formData.status) errs.status = 'Status is required';
    if (!formData.short_description) errs.short_description = 'Short description is required';

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 2 * 1024 * 1024;
    if (files.length === 0 && !isEditing) {
      errs.file = 'At least one product image is required';
    } else {
      files.forEach((file, index) => {
        if (!allowedImageTypes.includes(file.type)) {
          errs.file = `Invalid format in image ${index + 1} (only JPG/JPEG/PNG/GIF/WEBP allowed)`;
        } else if (file.size > maxSize) {
          errs.file = `Image ${index + 1} must be under 2MB`;
        }
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!isEditing) return;

    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${productId}`);
        const data = res.data;

        setFormData({
          title: data.title || '',
          code: data.code || '',
          article_number: data.article_number || '',
          status: String(data.status),
          short_description: data.short_description || '',
          description: data.description || '',
          images: data.images || [],
          is_gold: Number(data.is_gold) || 0,
          is_featured: Number(data.is_featured) || 0,
          is_recommended: Number(data.is_recommended) || 0,
          best_product: Number(data.best_product) || 0,
        });

        // Initialize hierarchy once for edit mode.
        setSelectedCategory(data.category || "");
        setSelectedSubCategory(data.sub_category ? String(data.sub_category) : "");

        let itemCatRes = [];
        if (data.category && data.sub_category) {
          const resIC = await axios.get(
            `${API_BASE_URL}/item_category/by-category-subcategory/${data.category}/${data.sub_category}`
          );
          itemCatRes = resIC.data;
          setItemCategories(itemCatRes);
        }

        setSelectedItemCategory(data.item_category_id || '');
        setSelectedItemSubCategory(data.item_subcategory_id || '');
        setSelectedKeyword(data.keyword_id ? String(data.keyword_id) : '');
        setSelectedItem(data.item_id || '');

        if (data.category && data.sub_category && data.item_category_id) {
          try {
            const subRes = await axios.get(
              `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${data.category}/${data.sub_category}/${data.item_category_id}`
            );
            setItemSubCategories(subRes.data || []);
          } catch (err) {
            setItemSubCategories([]);
          }
        }

        if (data.category && data.sub_category && data.item_category_id && data.item_subcategory_id) {
          try {
            const itemRes = await axios.get(
              `${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${data.category}/${data.sub_category}/${data.item_category_id}/${data.item_subcategory_id}`
            );
            setItems(itemRes.data || []);
          } catch (err) {
            setItems([]);
          }
        }
      } catch (error) {
        console.error('Error fetching Product:', error);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('ttt');
    if (!validateForm()) {
      console.log('Validation errors:', errors);
      Object.entries(errors).forEach(([key, value]) => {
        console.log(`Field: ${key}, Error: ${value}`);
      });
      return;
    }
    setSubmitting(true);
    console.log('sssttt');
    try {
      let endpoint, method, payload, headers;
      const userId = user?.id;
      const categoryForSubmit = selectedCategory || (isOtherCategorySelected ? '0' : '');
      if (isEditing) {
        endpoint = `${API_BASE_URL}/products/${productId}`;
        method = "put";
        payload = {
          ...formData,
          user_id: userId,
          category: categoryForSubmit,
          sub_category: selectedSubCategory,
          item_category_id: selectedItemCategory,
          item_subcategory_id: selectedItemSubCategory || '',
          keyword_id: selectedKeyword || '',
          item_id: selectedItem || '',
        };
        headers = { "Content-Type": "application/json" };
        await axios[method](endpoint, payload, { headers });
        if (files.length > 0) {
          await handleAddImages();
        }
      } else {
        endpoint = `${API_BASE_URL}/products`;
        method = "post";
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== "images") data.append(key, value);
        });
        data.append("user_id", userId);
        data.append("category", categoryForSubmit);
        data.append("sub_category", selectedSubCategory);
        data.append("item_category_id", selectedItemCategory);
        data.append("item_subcategory_id", selectedItemSubCategory || '');
        data.append("keyword_id", selectedKeyword || '');
        data.append("item_id", selectedItem || '');
        files.forEach((file) => {
          data.append("files", file);
        });
        payload = data;
        headers = { "Content-Type": "multipart/form-data" };
        await axios[method](endpoint, payload, { headers });
      }
      showNotification(`Product ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/my-product");
    } catch (error) {
      console.error("Error saving Product:", error);
      showNotification(`Failed to ${isEditing ? "update" : "add"} Product`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImages = async () => {
    if (files.length === 0) return;
    const formDataObj = new FormData();
    files.forEach(file => formDataObj.append("files", file));

    try {
      // Upload images
      await axios.post(`${API_BASE_URL}/products/${productId}/images`,
        formDataObj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Fetch updated product to get images
      const res = await axios.get(`${API_BASE_URL}/products/${productId}`);
      const data = res.data;

      setFormData(prev => ({
        ...prev,
        images: data.images || []
      }));
      setFiles([]);
      showNotification("Images added successfully!", "success");
    } catch (error) {
      console.error("Error adding images:", error);
      showNotification("Failed to add images", "error");
    }
  };

  const openDeleteModal = (id) => { setImageToDelete(id); setShowDeleteModal(true); };

  const closeDeleteModal = () => { setShowDeleteModal(false); setImageToDelete(null); };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/products/${productId}/images/${imageToDelete}`);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageToDelete)
      }));
      showNotification("Image removed successfully!", "success");
    } catch (error) {
      console.error("Error removing image:", error);
      showNotification("Failed to remove image", "error");
    } finally {
      closeDeleteModal();
    }
  };



  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Product" title={isEditing ? "Edit Product" : "Add Product"} />
          <div className="row">
            <div className="col-xl-12 mx-auto">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-body p-4">
                      <div className="row">
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="title" className="form-label required">Product/Service Name</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`}
                              id="title"
                              placeholder="Product Name"
                              value={formData.title}
                              autoComplete="off"
                              onChange={handleInputChange}
                              onFocus={() => {
                                suppressTitleAutoSelectRef.current = false;
                                const title = (formData.title || '').trim();
                                const selectedTitle = (selectedSuggestionTitle || '').trim();
                                const queryForDropdown = selectedTitle.length >= 2 ? selectedTitle : title;
                                if (queryForDropdown.length >= 2) {
                                  setSuggestionLoading(true);
                                  (async () => {
                                    try {
                                      const latestSuggestions = await fetchProductSuggestions(queryForDropdown);
                                      setProductSuggestions(latestSuggestions);
                                      setShowSuggestions(true);
                                    } catch {
                                      setProductSuggestions([]);
                                      setShowSuggestions(false);
                                    } finally {
                                      setSuggestionLoading(false);
                                    }
                                  })();
                                  return;
                                }
                                if (productSuggestions.length > 0) setShowSuggestions(true);
                              }}
                              onBlur={handleTitleBlur}
                              style={{ paddingRight: '2.5rem' }}
                            />
                            {/* Clear button for Product Name */}
                            {formData.title && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                style={{ position: 'absolute', right: 5, top: 3, zIndex: 11, padding: '0 8px', height: 28, lineHeight: 1 }}
                                onMouseDown={() => { suppressTitleAutoSelectRef.current = true; }}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, title: '' }));
                                  setProductSuggestions([]);
                                  setActiveSuggestionKey('');
                                  setSelectedSuggestionTitle('');
                                  setIsOtherLabelSelected(false);
                                  setShowSuggestions(false);
                                  resetCategorySelections();
                                }}
                                title="Clear Product Name"
                              >
                                ×
                              </button>
                            )}
                            {/* Suggestions dropdown */}
                            {showSuggestions && (
                              <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', width: '100%', maxHeight: 220, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                {suggestionLoading ? (
                                  <div className="p-2 text-muted">Loading...</div>
                                ) : (
                                  productSuggestions.length > 0 ? (
                                    productSuggestions.map(s => (
                                      <div
                                        key={s.id}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                        onMouseDown={() => {
                                          suppressTitleAutoSelectRef.current = true;
                                          handleSuggestionSelect(s);
                                        }}
                                      >
                                        <div><b>{s.title}</b></div>
                                        <div className="d-none" style={{ fontSize: 12, color: '#888' }}>
                                          {s.category_name && <span>Category: {s.category_name} </span>}
                                          {s.sub_category_name && <span> | Sub: {s.sub_category_name} </span>}
                                          {s.item_category_name && <span> | ItemCat: {s.item_category_name} </span>}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-muted">No suggestions found</div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          {formData.title.trim().length >= 2 && !suggestionLoading && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              {productSuggestions.map((suggestion) => (
                                (() => {
                                  const isActive = isSuggestionTagActive(suggestion);
                                  return (
                                <button
                                  key={`tag-${getSuggestionKey(suggestion)}`}
                                  type="button"
                                  className={`btn rounded-pill px-2 py-1 ${isActive ? 'btn-primary' : 'btn-outline-primary'}`}
                                  style={{ fontSize: '0.72rem', lineHeight: 1.4 }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    suppressTitleAutoSelectRef.current = true;
                                    handleSuggestionSelect(suggestion);
                                  }}
                                >
                                  {suggestion.title}
                                </button>
                                  );
                                })()
                              ))}
                              <button
                                type="button"
                                className={`btn rounded-pill px-2 py-1 ${activeSuggestionKey === OTHER_SUGGESTION_KEY || isOtherLabelSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                                style={{ fontSize: '0.72rem', lineHeight: 1.4 }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  suppressTitleAutoSelectRef.current = true;
                                  handleOtherSuggestionSelect();
                                }}
                              >
                                Other
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="form-group mb-3 col-md-4">
                          <label htmlFor="code" className="form-label">Sku</label>
                          <input
                            type="text" className="form-control"
                            id="code"
                            placeholder="Sku"
                            value={formData.code}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group mb-3 col-md-4">
                          <label htmlFor="article_number" className="form-label">Part Number</label>
                          <input
                            type="number" className="form-control"
                            id="article_number"
                            placeholder="Part Number"
                            value={formData.article_number}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group mb-3 col-md-4">
                          <label htmlFor="status" className="form-label required">Status</label>
                          <select
                            id="status" className={`form-control ${errors.status ? "is-invalid" : ""}`}
                            value={formData.status}
                            onChange={handleInputChange}
                          >
                            <option value="">Select here</option>
                            <option value="1">Public</option>
                            <option value="0">Draft</option>
                          </select>
                          {errors.status && (<div className="invalid-feedback">{errors.status}</div>)}
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="short_description" className="form-label">Short Description</label>
                          <textarea
                            className={`form-control ${errors.brief_company ? "is-invalid" : ""}`}
                            id="short_description"
                            placeholder="Short Description"
                            rows={3}
                            value={formData.short_description}
                            onChange={handleInputChange}
                          />
                          {errors.short_description && (<div className="invalid-feedback">{errors.short_description}</div>)}
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="description" className="form-label required">Long Description</label>
                          <CKEditor
                            editor={ClassicEditor}
                            data={formData.description || ''}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              setFormData(prev => ({ ...prev, description: data }));
                            }}
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body p-4">
                      <div className="row">
                        {/* <div className="col-12 mb-3 d-flex justify-content-end align-items-center">
                          <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setShowCategoryPicker(true)}>Category Picker</button>
                        </div> */}
                        {/* <div className="form-group mb-3 col-md-12">
                          <label htmlFor="category" className="form-label">Category</label>
                          {selectedCategory && (
                            <div className="small text-muted mb-1">
                              Selected: {getSelectedNameById(categories, selectedCategory)} 
                            </div>
                          )}
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="sub_category" className={`form-label ${isOtherCategorySelected ? '' : 'required'}`}>Sub Category</label>
                          {selectedSubCategory && (
                            <div className="small text-muted mb-1">
                              Selected: {getSelectedNameById(visibleSubCategories, selectedSubCategory)} 
                            </div>
                          )}
                          {errors.sub_category && (<div className="text-danger small">{errors.sub_category}</div>)}
                        </div> */}
                        {/* <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_category_id" className={`form-label ${isOtherCategorySelected ? '' : 'required'}`}>Item Category</label>
                          {selectedItemCategory && (
                            <div className="small text-muted mb-1">
                              Selected: {getSelectedNameById(itemCategories, selectedItemCategory)}
                            </div>
                          )}
                          {errors.item_category && (<div className="text-danger small">{errors.item_category}</div>)}
                        </div> */}
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_sub_category_id" className="form-label">Item Sub Category</label>
                          <select
                            id="item_sub_category_id"
                            className="form-control"
                            value={selectedItemSubCategory}
                            onChange={handleItemSubCategoryChange}
                            disabled={isOtherCategorySelected || !selectedCategory || !selectedSubCategory || !selectedItemCategory}
                          >
                            <option value="">Select Item Sub Category</option>
                            {itemSubCategories.map((isc) => (
                              <option key={isc.id} value={isc.id}>{isc.name}</option>
                            ))}
                          </select>
                        </div>
                        {/* <div className="form-group mb-3 col-md-12">
                          <label htmlFor="keyword_id" className="form-label">Keyword</label>
                          <select
                            id="keyword_id"
                            className="form-control"
                            value={selectedKeyword}
                            onChange={(event) => setSelectedKeyword(event.target.value)}
                            disabled={isOtherCategorySelected || !selectedItemSubCategory}
                          >
                            <option value="">Select Keyword</option>
                            {keywords.map((keyword) => (
                              <option key={keyword.id} value={keyword.id}>{keyword.name}</option>
                            ))}
                          </select>
                        </div> */}
                        {/* <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_id" className="form-label">Items</label>
                          <div className="small text-muted mb-1">
                            Selected: {getSelectedNameById(items, selectedItem) || '-'}
                          </div>
                          <select
                            id="item_id"
                            className="form-control"
                            value={selectedItem}
                            onChange={handleItemChange}
                            disabled={isOtherCategorySelected || !selectedCategory || !selectedSubCategory || !selectedItemCategory || !selectedItemSubCategory}
                          >
                            <option value="">Select Item</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>
                        </div> */}

                        {/* <div className="col-md-12">
                          <label htmlFor="file" className="form-label required">Product Images</label><br />
                          <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                            multiple
                            accept="image/png, image/jpeg"
                          />
                          <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
                            <i className="bx bxs-plus-square me-1" />Add Image
                          </button>
                          {errors.file && (<div className="text-danger small mt-1">{errors.file}</div>)}
                        </div>
                        <div className="col-md-12">
                          <div className="mt-3 d-flex flex-wrap">
                            {formData.images && formData.images.length > 0 && formData.images?.map((image, index) => (
                              <div key={index} className="position-relative m-2">
                                <img
                                  src={`${ROOT_URL}/${image.file}`}
                                  alt={`Preview ${index}`}
                                  className="object-fit-cover m-3"
                                  width={80}
                                  height={80}
                                  loading="lazy"
                                  decoding="async"
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-remove-image"
                                  style={{ width: '1.5rem', height: '1.5rem' }}
                                  onClick={() => openDeleteModal(image.id)}
                                >
                                  <i className="bx bx-x me-0" />
                                </button>
                              </div>
                            ))}
                            {files.length > 0 && files?.map((file, index) => (
                              <div key={index} className="position-relative m-2">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New Preview ${index}`}
                                  className="object-fit-cover m-3"
                                  width={80}
                                  height={80}
                                  loading="lazy"
                                  decoding="async"
                                />
                                <button
                                  variant="danger"
                                  size="sm"
                                  className="btn btn-danger btn-remove-image"
                                  style={{ width: '1.5rem', height: '1.5rem' }}
                                  onClick={() => {
                                    setFiles(prev => prev.filter((_, i) => i !== index));
                                  }}
                                >
                                  <i className="bx bx-x me-0" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                <div className="card mt-2">
                  <div className="card-body p-4">
                    <div className="row">
                                                <div className="col-md-12">
                        <label htmlFor="file" className="form-label required">Product Images</label><br />
                        <input
                          ref={fileInputRef}
                          type="file"
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                          multiple
                          accept="image/png, image/jpeg"
                        />
                        <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
                          <i className="bx bxs-plus-square me-1" />Add Image
                        </button>
                        {errors.file && (<div className="text-danger small mt-1">{errors.file}</div>)}
                      </div>
                      <div className="col-md-12">
                        <div className="mt-3 d-flex flex-wrap">
                          {formData.images && formData.images.length > 0 && formData.images?.map((image, index) => (
                            <div key={index} className="position-relative m-2">
                              <img
                                src={`${ROOT_URL}/${image.file}`}
                                alt={`Preview ${index}`}
                                className="object-fit-cover m-3"
                                width={80}
                                height={80}
                                loading="lazy"
                                decoding="async"
                              />
                              <button
                                type="button"
                                className="btn btn-danger btn-remove-image"
                                style={{ width: '1.5rem', height: '1.5rem' }}
                                onClick={() => openDeleteModal(image.id)}
                              >
                                <i className="bx bx-x me-0" />
                              </button>
                            </div>
                          ))}
                          {files.length > 0 && files?.map((file, index) => (
                            <div key={index} className="position-relative m-2">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New Preview ${index}`}
                                className="object-fit-cover m-3"
                                width={80}
                                height={80}
                                loading="lazy"
                                decoding="async"
                              />
                              <button
                                variant="danger"
                                size="sm"
                                className="btn btn-danger btn-remove-image"
                                style={{ width: '1.5rem', height: '1.5rem' }}
                                onClick={() => {
                                  setFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                <i className="bx bx-x me-0" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                <div className="col-12 text-end mt-2">
                  <button type="submit" className="btn btn-sm btn-primary px-4 mt-3" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isEditing ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      isEditing ? "Update" : "Save"
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
          {/*end row*/}
        </div>
      </div>
      <ProductModals
        showDeleteModal={showDeleteModal}
        closeDeleteModal={closeDeleteModal}
        handleDeleteConfirm={handleDeleteConfirm}
        deleteType="image"
      />
      {/* Inline Category Picker modal */}
      {showCategoryPicker && (() => {
        const filteredPickerData = (() => {
          if (!pickerQuery) return pickerData;
          const q = pickerQuery.toLowerCase();
          return (pickerData || []).map(cat => {
            const subcategories = (cat.subcategories || []).map(sub => {
              const matchedItems = (sub.item_categories || []).filter(ic => (ic.name || '').toLowerCase().includes(q));
              const subMatch = (sub.name || '').toLowerCase().includes(q);
              if (subMatch || matchedItems.length) return { ...sub, item_categories: matchedItems };
              return null;
            }).filter(Boolean);
            const catMatch = (cat.name || '').toLowerCase().includes(q);
            if (catMatch || subcategories.length) return { ...cat, subcategories };
            return null;
          }).filter(Boolean);
        })();

        const modalJSX = (
          <div className="modal fade show" tabIndex={-1} role="dialog" aria-modal="true" style={{ display: 'block', zIndex: 2147483646, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document" style={{ maxWidth: '900px', margin: '0 auto', pointerEvents: 'auto', zIndex: 2147483647 }}>
              <div className="modal-content" ref={pickerDialogRef} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <h5 className="modal-title" style={{ margin: 0 }}>Category Picker</h5>
                    <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCategoryPicker(false)}></button>
                  </div>
                  <div style={{ width: '100%', marginTop: 6 }}>
                    <input type="search" className="form-control" placeholder="Search categories, subcategories, item categories" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} />
                  </div>
                </div>
                <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                  <div className="mb-3">
                    <div>{(pickerSelection.categoryName || pickerSelection.subName || pickerSelection.itemCategoryName) ? (
                      <span>{pickerSelection.categoryName || ''}{pickerSelection.subName ? ` > ${pickerSelection.subName}` : ''}{pickerSelection.itemCategoryName ? ` > ${pickerSelection.itemCategoryName}` : ''}</span>
                    ) : null}</div>
                  </div>
                  {pickerLoading && <div>Loading...</div>}
                  {pickerError && <div className="text-danger">{pickerError}</div>}
                  {!pickerLoading && !pickerError && (
                    <div>
                      {filteredPickerData && filteredPickerData.length > 0 ? filteredPickerData.map(cat => (
                        <div key={cat.id} className="mb-3">
                          <div className="table-responsive">
                            <table className="table table-sm table-hover table-striped">
                              <tbody>
                                <tr>
                                  <td colSpan={3} className="fw-bold fs-6 py-2" style={{ backgroundColor: getColorForId(cat.id), border: '1px solid rgba(0,0,0,0.12)' }}>{cat.name}</td>
                                </tr>
                                <tr className="table-secondary">
                                  <th className="align-middle text-center">Subcategory</th>
                                  <th className="align-middle">Item Category</th>
                                  <th className="align-middle text-end">&nbsp;</th>
                                </tr>
                                {cat.subcategories && cat.subcategories.length > 0 ? (
                                  cat.subcategories.map((sub, si) => {
                                    const subBg = si % 2 === 0 ? 'rgba(248,249,250,0.8)' : '#ffffff';
                                    return (
                                      (sub.item_categories && sub.item_categories.length > 0) ? (
                                        sub.item_categories.map((ic, idx) => (
                                          <tr key={`${cat.id}-${sub.id}-${ic.id}`} className={`${pickerSelection.categoryId === cat.id && pickerSelection.subId === sub.id && String(pickerSelection.itemCategoryId) === String(ic.id) ? 'table-active' : ''}`} style={{ backgroundColor: subBg }}>
                                            {idx === 0 && (
                                              <td rowSpan={sub.item_categories.length} className="align-middle text-center" style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{sub.name}</td>
                                            )}
                                            <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{ic.name}</td>
                                            <td className="text-end" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>
                                              <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); pickerHandleSelect(cat.id, cat.name, sub.id, sub.name, ic.id, ic.name); }}>Select</button>
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr key={`${cat.id}-${sub.id}`} className={`${pickerSelection.categoryId === cat.id && pickerSelection.subId === sub.id ? 'table-active' : ''}`} style={{ backgroundColor: subBg }}>
                                          <td className="text-center" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{sub.name}</td>
                                          <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}><span className="text-muted">-</span></td>
                                          <td className="text-end" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>
                                            <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); pickerHandleSelect(cat.id, cat.name, sub.id, sub.name, null, ''); }}>Select</button>
                                          </td>
                                        </tr>
                                      )
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="text-muted">No subcategories</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )) : (
                        <div className="text-muted">No categories available</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={(e) => { e.preventDefault(); setShowCategoryPicker(false); }}>Close</button>
                </div>
              </div>
            </div>
            <div className="modal-backdrop show" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 2147483645, backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }} />
          </div>
        );
        return createPortal(modalJSX, document.body);
      })()}
    </>
  )
}

export default AddProduct
