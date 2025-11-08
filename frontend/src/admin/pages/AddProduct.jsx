import React, { useState, useEffect, useRef } from 'react';
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
  const [formData, setFormData] = useState({
    user_id: '', title: '', code: '', article_number: '', is_gold: '', is_featured: '', is_recommended: '', best_product: '',
    status: '', application: '', short_description: '', description: '', item_category_id: '', item_subcategory_id: '', item_id: ''
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
  const [selectedItems, setSelectedItems] = useState('');

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
    const fetchSellers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers`);
        setSellers(res.data);
      } catch (error) {
        console.error("Error fetching sellers:", error);
      }
    };
    fetchSellers();
  }, []);

  const handleSellersChange = (event) => { setSelectedSellers(event.target.value); };

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = async (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/sub_categories/category/${categoryId}`
      );
      setSubCategories(res.data);
      setSelectedSubCategory("");
    } catch (error) {
      console.error("Error fetching sub categories:", error);
    }
  };

  const handleSubCategoryChange = (event) => { setSelectedSubCategory(event.target.value); };

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

    $('#category').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Category"
    }).on("change", function () {
      const categoryId = $(this).val();
      handleCategoryChange({ target: { value: categoryId } });
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
    const val = $(this).val();
    setSelectedItemCategory(val);
    setSelectedItemSubCategory('');
    setSelectedItems('');
  });

$('#item_sub_category_id')
  .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Sub Category" })
  .on("change", function () {
    const val = $(this).val();
    setSelectedItemSubCategory(val);
    setSelectedItems('');
  });

$('#item_id')
  .select2({ theme: "bootstrap", width: '100%', placeholder: "Select Item Sub Category" })
  .on("change", function () {
    const val = $(this).val();
    setSelectedItems(val);
  });

    return () => {
      $('#user_id').off("change").select2('destroy');
      $('#application').off("change").select2('destroy');
      $('#category').off("change").select2('destroy');
      $('#sub_category').off("change").select2('destroy');
      if ($('#item_category_id').data('select2')) $('#item_category_id').select2('destroy');
      if ($('#item_sub_category_id').data('select2')) $('#item_sub_category_id').select2('destroy');
      if ($('#item_id').data('select2')) $('#item_id').select2('destroy');
    };
  }, [sellers, applications, categories, subCategories]);

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
    if (!formData.status) errs.status = 'Status is required';
    if (!formData.short_description) errs.short_description = 'Short description is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (files.length === 0 && !isEditing) {
      errs.file = 'At least one product image is required';
    } else {
      files.forEach((file, index) => {
        if (!allowedImageTypes.includes(file.type)) {
          errs.file = `Invalid format in image ${index + 1} (only JPG/PNG allowed)`;
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
          is_gold: data.is_gold || '',
          is_featured: data.is_featured || '',
          is_recommended: data.is_recommended || '',
          best_product: data.best_product,
          status: String(data.status),
          short_description: data.short_description || '',
          description: data.description || '',
          images: data.images || [],
        });
        setSelectedSellers(data.user_id || '');
        setSelectedApplications(data.application || '');
        setSelectedCategory(data.category || "");
        setSelectedSubCategory(data.sub_category || "");
        if (data.category) {
          const cRes = await axios.get(`${API_BASE_URL}/sub_categories/category/${data.category}`); setSubCategories(cRes.data);
        }

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
          category: selectedCategory,
          sub_category: selectedSubCategory,
          item_category_id: selectedItemCategory,
          item_subcategory_id: selectedItemSubCategory,
          item_id: selectedItems,
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
        data.append("item_id", selectedItems);
        files.forEach((file) => {
          data.append("files", file);
        });
        payload = data;
        headers = { "Content-Type": "multipart/form-data" };
        await axios[method](endpoint, payload, { headers });
      }
      showNotification(`Product ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/admin/products");
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
      const res = await axios.post(`${API_BASE_URL}/products/${productId}/images`,
        formDataObj,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...(Array.isArray(res.data) ? res.data : [res.data])]
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

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb  page="Product" title={isEditing ? "Edit Product" : "Add Product"} add_button="Back" add_link="/admin/products" />
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
                            id="user_id" className={`form-control ${errors.user_id ? "is-invalid" : ""}`}
                            value={selectedSellers}
                            onChange={handleSellersChange}
                          >
                            <option value="">Select user</option>
                            {sellers?.map((user) => (
                              <option key={user.id} value={user.id}>{user.fname + " " + user.lname}</option>
                            ))}
                          </select>
                          {errors.user_id && (<div className="invalid-feedback">{errors.user_id}</div>)}
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
                          <label htmlFor="short_description" className="form-label required">Short Description</label>
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
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="category" className="form-label required">Category</label>
                          <select
                            id="category" className={`form-control ${errors.category ? "is-invalid" : ""}`}
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                          >
                            <option value="">Select Category</option>
                            {categories?.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                          {errors.category && (<div className="invalid-feedback">{errors.category}</div>)}
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="sub_category" className="form-label">Sub Category</label>
                          <select
                            id="sub_category" className="form-control"
                            value={selectedSubCategory}
                            onChange={handleSubCategoryChange}
                            disabled={!selectedCategory}
                          >
                            <option value="">Select Sub Category</option>
                            {subCategories?.map((sub_category) => (
                              <option key={sub_category.id} value={sub_category.id}>{sub_category.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_category_id" className="form-label">Item Category</label>
                          <select
                            className="form-control"
                            id="item_category_id"
                            value={selectedItemCategory}
                            onChange={(e) => {
                              setSelectedItemCategory(e.target.value);
                              setSelectedItemSubCategory(''); // reset subcategory when category changes
                            }}
                            disabled={!selectedCategory || !selectedSubCategory}
                          >
                            <option value="">Select Item Category</option>
                            {itemCategories.map(ic => (
                              <option key={ic.id} value={ic.id}>
                                {ic.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_sub_category_id" className="form-label">Item Sub Category</label>
                          <select
                            className="form-control"
                            id="item_sub_category_id"
                            value={selectedItemSubCategory}
                            onChange={(e) => setSelectedItemSubCategory(e.target.value)}
                            disabled={!selectedCategory || !selectedSubCategory || !selectedItemCategory}
                          >
                            <option value="">Select Item Sub Category</option>
                            {itemSubCategories.map(isc => (
                              <option key={isc.id} value={isc.id}>
                                {isc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group mb-3 col-md-12">
                          <label htmlFor="item_id" className="form-label">Items</label>
                          <select
                            className="form-control"
                            id="item_id"
                            value={selectedItems}
                            onChange={(e) => setSelectedItems(e.target.value)}
                            disabled={!selectedCategory || !selectedSubCategory || !selectedItemCategory || !selectedItemSubCategory}
                          >
                            <option value="">Select Items</option>
                            {items.map(i => (
                              <option key={i.id} value={i.id}>
                                {i.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-12">
                          <label htmlFor="file" className="form-label required">Thumbnail</label><br />
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
                          {errors.file && (<div className="invalid-feedback">{errors.file}</div>)}
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
    </>
  )
}

export default AddProduct