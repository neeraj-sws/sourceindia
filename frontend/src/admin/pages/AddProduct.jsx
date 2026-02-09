import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from '../common/Breadcrumb';
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ProductModals from "./modal/ProductModals";
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const AddProduct = () => {
  const { showNotification } = useAlert();
  const { productId } = useParams();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [selectedSellers, setSelectedSellers] = useState("");
  const [applications, setApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  /*const [formData, setFormData] = useState({
    user_id: '', title: '', code: '', article_number: '', is_gold: '', is_featured: '', is_recommended: '', best_product: '',
    status: '', application: '', short_description: '', description: '', item_category_id: '', item_subcategory_id: '', item_id: ''
  });*/
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    article_number: '',
    is_gold: '',
    is_featured: '',
    is_recommended: '',
    best_product: '',
    status: '',
    short_description: '',
    description: ''
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [itemCategories, setItemCategories] = useState([]);
  const [itemSubCategories, setItemSubCategories] = useState([]);
  const [selectedItemCategory, setSelectedItemCategory] = useState('');
  const [selectedItemSubCategory, setSelectedItemSubCategory] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  // Category Picker (admin modal)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [pickerData, setPickerData] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const pickerDialogRef = useRef(null);
  const pickerSearchRef = useRef(null);
  const [pickerSelection, setPickerSelection] = useState({ categoryId: null, categoryName: '', subId: null, subName: '', itemCategoryId: null, itemCategoryName: '' });

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
    if (selectedCategory && selectedSubCategory && selectedItemCategory) {
      axios.get(
        `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}`
      )
        .then(res => setItemSubCategories(res.data))
        .catch(err => {
          console.error("Error fetching item sub categories:", err);
          setItemSubCategories([]);
        });
    } else {
      setItemSubCategories([]);
    }
  }, [selectedCategory, selectedSubCategory, selectedItemCategory]);

  useEffect(() => {
    if (selectedCategory && selectedSubCategory && selectedItemCategory && selectedItemSubCategory) {
      axios.get(
        `${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}/${selectedItemSubCategory}`
      )
        .then(res => setItems(res.data))
        .catch(err => {
          console.error("Error fetching items:", err);
          setItems([]);
        });
    } else {
      setItems([]);
    }
  }, [selectedCategory, selectedSubCategory, selectedItemCategory, selectedItemSubCategory]);

  useEffect(() => {
    if (selectedItemCategory && itemCategories.length > 0) {
      $('#item_category_id')
        .val(String(selectedItemCategory))
        .trigger('change.select2');
    }
  }, [selectedItemCategory, itemCategories]);

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers?is_delete=0&status=1&is_complete=1`);
        setSellers(res.data);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };
    fetchSellers();
  }, []);

  useEffect(() => {
    if (!selectedSellers) {
      setSubCategories([]);
      setSelectedSubCategory("");
      setSelectedCategory("");
      return;
    }

    const fetchSellerSubcategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/seller-subcategories-by-user`, {
          params: { user_id: selectedSellers }
        });
        setSubCategories(res.data);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubCategories([]);
      }
    };

    fetchSellerSubcategories();
  }, [selectedSellers]);

  useEffect(() => {
    if (subCategories.length > 0 && selectedSubCategory) {
      $('#sub_category')
        .val(selectedSubCategory)
        .trigger('change.select2');
    }
  }, [subCategories, selectedSubCategory]);

  const handleSellersChange = (event) => {
    const userId = event.target.value;
    setSelectedSellers(userId);

    // reset everything dependent on seller
    setCategories([]);
    setSubCategories([]);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setItems([]);
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/applications`);
        setApplications(res.data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };
    fetchApplications();
  }, []);

  const handleApplicationsChange = (event) => { setSelectedApplications(event.target.value); };

  const handleSubCategoryChange = (event) => {
    const subCategoryId = event.target.value;
    const subCat = subCategories.find(sc => String(sc.id) === subCategoryId);

    setSelectedSubCategory(subCategoryId);
    setSelectedCategory(subCat ? String(subCat.category_id) : "");

    // Reset dependent dropdowns
    setSelectedItemCategory('');
    setSelectedItemSubCategory('');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setItems([]);

    // fetch item categories for this subcategory
    if (subCat) {
      axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${subCat.category_id}/${subCategoryId}`)
        .then(res => setItemCategories(res.data))
        .catch(err => {
          console.error("Error fetching item categories:", err);
          setItemCategories([]);
        });
    }
  };

  // Handle Item Category Change
  const handleItemCategoryChange = async (event) => {
    const itemCategoryId = event.target.value;
    setSelectedItemCategory(itemCategoryId);

    // Reset lower dropdowns
    setSelectedItemSubCategory('');
    setSelectedItem('');
    setItemSubCategories([]);
    setItems([]);

    if (selectedCategory && selectedSubCategory && itemCategoryId) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${selectedCategory}/${selectedSubCategory}/${itemCategoryId}`
        );
        setItemSubCategories(res.data);
      } catch (error) {
        console.error("Error fetching item sub categories:", error);
        setItemSubCategories([]);
      }
    }
  };

  // Handle Item Sub Category Change
  const handleItemSubCategoryChange = async (event) => {
    const itemSubCategoryId = event.target.value;
    setSelectedItemSubCategory(itemSubCategoryId);
    console.log(itemSubCategoryId);
    // Reset lower dropdown
    setSelectedItem('');
    setItems([]);

    if (selectedCategory && selectedSubCategory && selectedItemCategory && itemSubCategoryId) {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${selectedCategory}/${selectedSubCategory}/${selectedItemCategory}/${itemSubCategoryId}`
        );
        setItems(res.data);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      }
    }
  };

  // Handle Item Change
  const handleItemChange = (event) => {
    setSelectedItem(event.target.value);
  };

  useEffect(() => {
    $('#user_id').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Seller"
    }).on("change", function () {
      const userId = $(this).val();
      handleSellersChange({ target: { value: userId } });
    });

    $('#application').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select application"
    }).on("change", function () {
      const applicationId = $(this).val();
      handleApplicationsChange({ target: { value: applicationId } });
    });

    $('#sub_category').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Sub Category"
    }).on("change", function () {
      const subCategoryId = $(this).val();
      handleSubCategoryChange({ target: { value: subCategoryId } });
    });
    $('#item_category_id')
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Category" })
      .on("change", function () {
        handleItemCategoryChange({ target: { value: $(this).val() } });
      });


    $('#item_sub_category_id')
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Sub Category" })
      .on("change", function () {
        handleItemSubCategoryChange({ target: { value: $(this).val() } });
      });

    $('#item_id')
      .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item" })
      .on("change", function () {
        handleItemChange({ target: { value: $(this).val() } });
      });

    return () => {
      $('#user_id').off("change").select2('destroy');
      $('#application').off("change").select2('destroy');
      $('#sub_category').off("change").select2('destroy');
      if ($('#item_category_id').data('select2')) $('#item_category_id').select2('destroy');
      if ($('#item_sub_category_id').data('select2')) $('#item_sub_category_id').select2('destroy');
      if ($('#item_id').data('select2')) $('#item_id').select2('destroy');
    };
  }, [sellers, applications, subCategories]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const validateForm = () => {
    const errs = {};
    if (!selectedSellers) errs.user_id = 'User is required';
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!selectedCategory) errs.category = "Category is required";
    if (!selectedSubCategory) errs.sub_category = "Sub Category is required";
    if (!selectedItemCategory) errs.item_category = "Item Category is required";

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
        setSelectedSellers(String(data.user_id || ""));
        setSelectedApplications(String(data.application || ""));
        // Set category & subcategory first
        setSelectedCategory(data.category || "");
        setSelectedSubCategory(String(data.sub_category || ""));
        setSelectedItemCategory(data.item_category_id || '');
        setSelectedItemSubCategory(data.item_subcategory_id || '');
        setSelectedItem(data.item_id || '');
        // Fetch dependent dropdowns sequentially in correct order
        if (data.user_id) {
          const catRes = await axios.get(
            `${API_BASE_URL}/sellers/seller-categories`,
            { params: { user_id: data.user_id } }
          );
          setCategories(catRes.data);
        }
        if (data.user_id) {
          try {
            const res = await axios.get(`${API_BASE_URL}/sellers/seller-subcategories-by-user`, {
              params: { user_id: data.user_id }
            });
            setSubCategories(res.data || []);
          } catch (err) {
            console.error("Error fetching subcategories:", err);
            setSubCategories([]);
          }
        }

        setSelectedSubCategory(data.sub_category || "");

        let itemCatRes = [];
        if (data.category && data.sub_category) {
          const resIC = await axios.get(
            `${API_BASE_URL}/item_category/by-category-subcategory/${data.category}/${data.sub_category}`
          );
          itemCatRes = resIC.data;
          setItemCategories(itemCatRes);
        }

        // ✅ Now only set selectedItemCategory AFTER data is available
        setSelectedItemCategory(data.item_category_id || '');

        let itemSubCatRes = [];
        if (data.category && data.sub_category && data.item_category_id && data.item_subcategory_id) {
          try {
            const resISC = await axios.get(
              `${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${data.category}/${data.sub_category}/${data.item_category_id}`
            );
            itemSubCatRes = resISC.data;
            setItemSubCategories(itemSubCatRes);
          } catch (err) {
            console.warn("No item subcategories found (404 likely):", err);
            setItemSubCategories([]);
          }
        }

        setSelectedItemSubCategory(data.item_subcategory_id || '');

        if (data.category && data.sub_category && data.item_category_id && data.item_subcategory_id) {
          const itemsRes = await axios.get(
            `${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${data.category}/${data.sub_category}/${data.item_category_id}/${data.item_subcategory_id}`
          );
          setItems(itemsRes.data);
        }

        setSelectedItem(data.item_id || '');
      } catch (error) {
        console.error('Error fetching Product:', error);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let endpoint, method, payload, headers;
      if (isEditing) {
        endpoint = `${API_BASE_URL}/products/${productId}`;
        method = "put";
        payload = {
          ...formData,
          user_id: selectedSellers,
          application: selectedApplications,
          category: Number(selectedCategory) || 0,
          sub_category: Number(selectedSubCategory) || 0,
          item_category_id: Number(selectedItemCategory) || 0,
          item_subcategory_id: Number(selectedItemSubCategory) || 0,
          item_id: Number(selectedItem) || 0,
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
        data.append("user_id", selectedSellers);
        data.append("application", selectedApplications);
        data.append("category", selectedCategory);
        data.append("sub_category", selectedSubCategory);
        data.append("item_category_id", selectedItemCategory);
        data.append("item_subcategory_id", selectedItemSubCategory);
        data.append("item_id", selectedItem);
        files.forEach((file) => {
          data.append("files", file);
        });
        payload = data;
        headers = { "Content-Type": "multipart/form-data" };
        await axios[method](endpoint, payload, { headers });
      }
      showNotification(`Product ${isEditing ? "updated" : "added"} successfully!`, "success");
      if (!isEditing) { navigate("/admin/products"); }
    } catch (error) {
      console.error("Error saving Product:", error);
      showNotification(`Failed to ${isEditing ? "update" : "add"} Product`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (key, checked) => {
    setFormData(prevState => ({ ...prevState, [key]: checked ? 1 : 0 }));
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

  useEffect(() => {
    if ($('#item_sub_category_id').data('select2')) {
      $('#item_sub_category_id').select2('destroy');
    }

    $('#item_sub_category_id').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Item Sub Category"
    });

  }, [itemSubCategories]);

  // Load picker data scoped to selected seller
  const loadPickerData = async () => {
    if (!selectedSellers) return setPickerData([]);
    setPickerLoading(true);
    setPickerError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/sellers/seller-subcategories-by-user`, {
        params: { user_id: selectedSellers }
      });
      const subcats = res.data || [];

      // Group subcategories by category to match front picker structure
      const map = {};
      subcats.forEach(s => {
        const cid = s.category_id || s.category || '0';
        if (!map[cid]) {
          map[cid] = { id: cid, name: s.category_name || s.category || 'Uncategorized', subcategories: [] };
        }
        map[cid].subcategories.push({ id: s.id, name: s.name || s.sub_name || 'Subcategory', item_categories: [] });
      });

      const grouped = Object.values(map);

      // eager-load item categories and their item subcategories for all subcategories
      try {
        const subsToLoad = [];
        grouped.forEach(c => { (c.subcategories || []).forEach(s => subsToLoad.push({ catId: c.id, subId: s.id })); });
        await Promise.all(subsToLoad.map(async ({ catId, subId }) => {
          try {
            const r = await axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${catId}/${subId}`);
            const items = r.data || [];
            // for each item category, eager-load its item subcategories
            await Promise.all((items || []).map(async (ic) => {
              try {
                const r2 = await axios.get(`${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${catId}/${subId}/${ic.id}`);
                ic.item_sub_categories = r2.data || [];
              } catch (ee) {
                ic.item_sub_categories = [];
              }
            }));

            // attach into grouped
            grouped.forEach(c => {
              if (String(c.id) !== String(catId)) return;
              c.subcategories = c.subcategories.map(su => String(su.id) === String(subId) ? { ...su, item_categories: items } : su);
            });
          } catch (e) {
            // ignore per-sub failures
          }
        }));
      } catch (e) {
        // ignore overall eager-load failures
      }

      setPickerData(grouped);
    } catch (err) {
      console.error('Error loading picker data:', err);
      setPickerError('Failed to load categories');
      setPickerData([]);
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    if (showCategoryPicker) loadPickerData();
  }, [showCategoryPicker, selectedSellers]);

  // Close modal on Escape and lock body scroll (add modal-open class like front picker)
  useEffect(() => {
    if (!showCategoryPicker) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowCategoryPicker(false); };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = originalOverflow || ''; document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); };
  }, [showCategoryPicker]);

  const pickerHandleSelect = (subcat, itemCat) => {
    // legacy simple handler removed in favor of frontend-style picker selection
  };

  const adminPickerHandleSelect = async (catId, catName, subId, subName, itemCategoryId, itemCategoryName, itemSubCategoryId, itemSubCategoryName) => {
    const selection = { categoryId: catId || null, categoryName: catName || '', subId: subId || null, subName: subName || '', itemCategoryId: itemCategoryId || null, itemCategoryName: itemCategoryName || '', itemSubCategoryId: itemSubCategoryId || null, itemSubCategoryName: itemSubCategoryName || '' };
    setPickerSelection(selection);
    // Always reset dependent dropdowns
    setSelectedCategory(selection.categoryId || '');
    setSelectedSubCategory(selection.subId || '');
    setSelectedItemCategory(selection.itemCategoryId || '');
    setSelectedItemSubCategory(selection.itemSubCategoryId || '');
    setSelectedItem('');
    setItemCategories([]);
    setItemSubCategories([]);
    setItems([]);
    // eager-load item categories for the selected subcategory
    if (selection.categoryId && selection.subId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/item_category/by-category-subcategory/${selection.categoryId}/${selection.subId}`);
        setItemCategories(res.data || []);
      } catch (err) {
        setItemCategories([]);
      }
    }
    // If item category and item sub category are selected, reload item sub categories
    if (selection.categoryId && selection.subId && selection.itemCategoryId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/item_sub_category/by-category-subcategory-itemcategory/${selection.categoryId}/${selection.subId}/${selection.itemCategoryId}`);
        setItemSubCategories(res.data || []);
      } catch (err) {
        setItemSubCategories([]);
      }
    }
    // If item sub category is selected, reload items
    if (selection.categoryId && selection.subId && selection.itemCategoryId && selection.itemSubCategoryId) {
      try {
        const res = await axios.get(`${API_BASE_URL}/items/by-category-subcategory-itemcategory-itemsubcategory/${selection.categoryId}/${selection.subId}/${selection.itemCategoryId}/${selection.itemSubCategoryId}`);
        setItems(res.data || []);
      } catch (err) {
        setItems([]);
      }
    }
    setShowCategoryPicker(false);
  };

  const filteredPickerData = (pickerData || []).map(cat => {
    if (!pickerQuery) return cat;
    const q = pickerQuery.toLowerCase();
    const matchedSubcategories = (cat.subcategories || []).map(sub => {
      const matchedItemCategories = (sub.item_categories || []).map(ic => {
        const matchedItemSubs = (ic.item_sub_categories || []).filter(isc => String(isc.name || '').toLowerCase().includes(q));
        const icMatch = String(ic.name || '').toLowerCase().includes(q) || matchedItemSubs.length > 0;
        return icMatch ? { ...ic, item_sub_categories: matchedItemSubs.length ? matchedItemSubs : ic.item_sub_categories } : null;
      }).filter(Boolean);

      const subMatch = String(sub.name || '').toLowerCase().includes(q) || matchedItemCategories.length > 0;
      return subMatch ? { ...sub, item_categories: matchedItemCategories.length ? matchedItemCategories : sub.item_categories } : null;
    }).filter(Boolean);

    const catMatch = String(cat.name || '').toLowerCase().includes(q) || (matchedSubcategories && matchedSubcategories.length > 0);
    return catMatch ? { ...cat, subcategories: matchedSubcategories.length ? matchedSubcategories : cat.subcategories } : null;
  }).filter(Boolean);

  // Front-like picker rows and helpers
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

  const getColorForId = (id) => {
    if (id === undefined || id === null) return 'transparent';
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 94%)`;
  };

  const getRowColor = (id) => {
    if (id === undefined || id === null) return 'transparent';
    const str = String(id);
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    const hue = Math.abs(hash) % 360;
    const saturation = 50;
    const lightness = 94 - (Math.abs(hash) % 4);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Products" title={isEditing ? "Edit Product" : "Add Product"} add_button="Back" add_link="/admin/products" />
          <div className="row">
            <div className="col-xl-12 mx-auto">
              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-8">
                  <div className="card">
                    <div className="card-body p-4">
                      <div className="row">
                        <div className="form-group mb-3 col-md-6">
                          <label htmlFor="user_id" className="form-label required">User</label>
                          <select
                            id="user_id" className="form-control select2"
                            value={selectedSellers}
                            onChange={handleSellersChange}
                          >
                            <option value="">Select user</option>
                            {sellers?.map((user) => (
                              <option key={user.id} value={user.id}>{user.company_name}</option>
                            ))}
                          </select>
                          {errors.user_id && (<div className="text-danger small">{errors.user_id}</div>)}
                        </div>
                        <div className="form-group mb-3 col-md-6">
                          <label htmlFor="title" className="form-label required">Product Name</label>
                          <input
                            type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`}
                            id="title"
                            placeholder="Product Name"
                            value={formData.title}
                            onChange={handleInputChange}
                          />
                          {errors.title && (<div className="invalid-feedback">{errors.title}</div>)}
                        </div>
                        <div className="form-group mb-3 col-md-6">
                          <label htmlFor="code" className="form-label">Sku</label>
                          <input
                            type="text" className="form-control"
                            id="code"
                            placeholder="Sku"
                            value={formData.code}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group mb-3 col-md-6">
                          <label htmlFor="article_number" className="form-label">Part Number</label>
                          <input
                            type="number" className="form-control"
                            id="article_number"
                            placeholder="Part Number"
                            value={formData.article_number}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-12">
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_gold"
                              checked={formData.is_gold === 1}
                              onChange={(e) => handleCheckboxChange('is_gold', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="is_gold">Gold</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_featured"
                              checked={formData.is_featured === 1}
                              onChange={(e) => handleCheckboxChange('is_featured', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="is_featured">Featured</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="is_recommended"
                              checked={formData.is_recommended === 1}
                              onChange={(e) => handleCheckboxChange('is_recommended', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="is_recommended">Recommended</label>
                          </div>
                          <div className="form-check form-check-inline">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="best_product"
                              checked={formData.best_product === 1}
                              onChange={(e) => handleCheckboxChange('best_product', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="best_product">Best Product</label>
                          </div>
                        </div>
                        <div className="form-group mb-3 col-md-6">
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
                        <div className="form-group mb-3 col-md-6">
                          <label htmlFor="application" className="form-label">Applications</label>
                          <select
                            id="application" className="form-control"
                            value={selectedApplications}
                            onChange={handleApplicationsChange}
                          >
                            <option value="">Select application</option>
                            {applications?.map((application) => (
                              <option key={application.id} value={application.id}>{application.name}</option>
                            ))}
                          </select>
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
                        <div className="col-md-12">
                          <label htmlFor="description" className="form-label">Long Description</label>
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
                        <div className="col-12 mb-3 d-flex justify-content-end align-items-center">
                          {selectedSellers ? (
                            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setShowCategoryPicker(true)}>Category Picker</button>
                          ) : null}
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="sub_category" className="form-label required">Sub Category</label>
                          <div className="d-flex flex-column">
                            <div>
                              <select
                                id="sub_category"
                                className="form-control select2"
                                value={selectedSubCategory}
                                onChange={handleSubCategoryChange}
                                disabled={!selectedSellers}
                              >
                                <option value="">Select Sub Category</option>
                                {subCategories.map(sc => (
                                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                                ))}
                              </select>
                              {errors.sub_category && (<div className="text-danger small">{errors.sub_category}</div>)}
                            </div>

                          </div>
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_category_id" className="form-label">Item Category</label>
                          <select
                            id="item_category_id"
                            className="form-control"
                            value={selectedItemCategory}
                            onChange={handleItemCategoryChange}
                            disabled={
                              !selectedItemCategory && (!selectedCategory || !selectedSubCategory)
                            }
                          >
                            <option value="">Select Item Category</option>
                            {itemCategories.map((ic) => (
                              <option key={ic.id} value={ic.id}>{ic.name}</option>
                            ))}
                          </select>
                          {errors.item_category && (<div className="text-danger small">{errors.item_category}</div>)}
                        </div>

                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_sub_category_id" className="form-label">Item Sub Category</label>
                          <select
                            id="item_sub_category_id"
                            className="form-control"
                            value={selectedItemSubCategory}
                            onChange={handleItemSubCategoryChange}
                            disabled={!selectedCategory || !selectedSubCategory || !selectedItemCategory}
                          >
                            <option value="">Select Item Sub Category</option>
                            {itemSubCategories.map((isc) => (
                              <option key={isc.id} value={isc.id}>{isc.name}</option>
                            ))}
                          </select>

                        </div>

                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_id" className="form-label">Items</label>
                          <select
                            id="item_id"
                            className="form-control"
                            value={selectedItem}
                            onChange={handleItemChange}
                            disabled={!selectedCategory || !selectedSubCategory || !selectedItemCategory || !selectedItemSubCategory}
                          >
                            <option value="">Select Item</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </select>

                        </div>

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
      {showCategoryPicker && createPortal(
        <div className="modal fade show" tabIndex={-1} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, pointerEvents: 'auto' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document" style={{ maxWidth: 900, width: 'min(900px, 90vw)', pointerEvents: 'auto', zIndex: 100001 }}>
            <div className="modal-content" ref={pickerDialogRef} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <h5 className="modal-title" style={{ margin: 0 }}>Category Picker</h5>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCategoryPicker(false)} />
                </div>
                <div style={{ width: '100%', marginTop: 6 }}>
                  <div className="input-group input-group-sm">
                    <input ref={pickerSearchRef} className="form-control form-control-sm" placeholder="Search categories, subcategories or item categories" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} />
                    <button type="button" className="btn btn-outline-secondary" onClick={(e) => { e.preventDefault(); setPickerQuery(''); try { pickerSearchRef.current && pickerSearchRef.current.focus(); } catch (err) { } }} title="Clear search">×</button>
                  </div>
                </div>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {pickerLoading && <div>Loading...</div>}
                {pickerError && <div className="text-danger">{pickerError}</div>}
                {!pickerLoading && !pickerError && (
                  <div>
                    {(filteredPickerData && filteredPickerData.length > 0) ? (
                      filteredPickerData.map(cat => (
                        <div key={cat.id} className="mb-3">
                          <div className="table-responsive">
                            <table className="table table-sm table-hover table-striped">
                              <tbody>
                                <tr>
                                  <td colSpan={4} className="fw-bold fs-6 py-2" style={{ backgroundColor: getColorForId(cat.id), border: '1px solid rgba(0,0,0,0.12)' }}>{cat.name}</td>
                                </tr>
                                <tr className="table-secondary">
                                  <th className="align-middle text-center">Subcategory</th>
                                  <th className="align-middle">Item Category</th>
                                  <th className="align-middle">Item Sub Category</th>
                                  <th className="align-middle text-end">&nbsp;</th>
                                </tr>
                                {cat.subcategories && cat.subcategories.length > 0 ? (
                                  cat.subcategories.map((sub, si) => {
                                    const subBg = si % 2 === 0 ? 'rgba(248,249,250,0.8)' : '#ffffff';
                                    const subRows = (sub.item_categories || []).reduce((sum, ic) => sum + Math.max(1, (ic.item_sub_categories || []).length), 0) || 1;
                                    return (
                                      (sub.item_categories && sub.item_categories.length > 0) ? (
                                        sub.item_categories.map((ic, idx) => {
                                          const icRows = Math.max(1, (ic.item_sub_categories || []).length);
                                          if (ic.item_sub_categories && ic.item_sub_categories.length > 0) {
                                            return ic.item_sub_categories.map((isc, jdx) => (
                                              <tr key={`${cat.id}-${sub.id}-${ic.id}-${isc.id}`} className={`${pickerSelection.categoryId === cat.id && pickerSelection.subId === sub.id && String(pickerSelection.itemCategoryId) === String(ic.id) && String(pickerSelection.itemSubCategoryId) === String(isc.id) ? 'table-active' : ''}`} style={{ backgroundColor: subBg }}>
                                                {idx === 0 && jdx === 0 && (
                                                  <td rowSpan={subRows} className="align-middle text-center" style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{sub.name}</td>
                                                )}
                                                {jdx === 0 && (
                                                  <td rowSpan={icRows} className="align-middle text-start" style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{ic.name}</td>
                                                )}
                                                <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{isc.name}</td>
                                                <td className="text-end" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>
                                                  <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); adminPickerHandleSelect(cat.id, cat.name, sub.id, sub.name, ic.id, ic.name, isc.id, isc.name); }}>Select</button>
                                                </td>
                                              </tr>
                                            ));
                                          }
                                          // no item subcategories for this item category
                                          return (
                                            <tr key={`${cat.id}-${sub.id}-${ic.id}`} className={`${pickerSelection.categoryId === cat.id && pickerSelection.subId === sub.id && String(pickerSelection.itemCategoryId) === String(ic.id) && !pickerSelection.itemSubCategoryId ? 'table-active' : ''}`} style={{ backgroundColor: subBg }}>
                                              {idx === 0 && (
                                                <td rowSpan={subRows} className="align-middle text-center" style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{sub.name}</td>
                                              )}
                                              <td className="align-middle" style={{ verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{ic.name}</td>
                                              <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}><span className="text-muted">-</span></td>
                                              <td className="text-end" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>
                                                <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); adminPickerHandleSelect(cat.id, cat.name, sub.id, sub.name, ic.id, ic.name, null, ''); }}>Select</button>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      ) : (
                                        <tr key={`${cat.id}-${sub.id}`} className={`${pickerSelection.categoryId === cat.id && pickerSelection.subId === sub.id ? 'table-active' : ''}`} style={{ backgroundColor: subBg }}>
                                          <td className="text-center" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>{sub.name}</td>
                                          <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}><span className="text-muted">-</span></td>
                                          <td style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}><span className="text-muted">-</span></td>
                                          <td className="text-end" style={{ border: '1px solid rgba(0,0,0,0.12)', backgroundColor: subBg }}>
                                            <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.preventDefault(); adminPickerHandleSelect(cat.id, cat.name, sub.id, sub.name, null, '', null, ''); }}>Select</button>
                                          </td>
                                        </tr>
                                      )
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="text-muted">No subcategories</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))) : (
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
          <div className="modal-backdrop show" style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }} onMouseDown={() => setShowCategoryPicker(false)} />
        </div>, document.body)}
    </>
  )
}

export default AddProduct