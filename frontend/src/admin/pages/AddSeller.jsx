import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const AddSeller = () => {
  const { showNotification } = useAlert();
  const { sellerId } = useParams();
  const isEditing = Boolean(sellerId);
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState([]);
  const [coreactivities, setCoreactivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedCoreActivity, setSelectedCoreActivity] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  // const [roles, setRoles] = useState([]);
  // const [selectedRoles, setSelectedRoles] = useState('');
  const [formData, setFormData] = useState({
    fname: "", lname: "", email: "", password: "", mobile: "", zipcode: "", website: "", is_trading: "", elcina_member: "",
    address: "", file: null, company_logo: null, user_company: "", company_location: "",
    is_star_seller: "", is_verified: "", company_meta_title: "", company_video_second: "", brief_company: "", products: "",
    designation: "", featured_company: "", company_sample_ppt_file: null, company_video: null, sample_file_id: null,
  });
  const [file, setFile] = useState(null);
  const [companyFile, setCompanyFile] = useState(null);
  const [companyBrochure, setCompanyBrochure] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const previousSelectedCategoriesRef = useRef([]);
  const [subCategoryMap, setSubCategoryMap] = useState({}); 
  const [designations, setDesignations] = useState([]);
  const [categoryLimit, setCategoryLimit] = useState(null);
  const isBlockingRef = useRef(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/countries`);
        setCountries(res.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = async (event) => {
    const countryId = event.target.value;
    setSelectedCountry(countryId);
    try {
      const res = await axios.get(`${API_BASE_URL}/location/states/${countryId}`);
      setStates(res.data);
      setSelectedState("");
      setCities([]);
      setSelectedCity("");
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const handleStateChange = async (event) => {
    const stateId = event.target.value;
    setSelectedState(stateId);
    try {
      const res = await axios.get(`${API_BASE_URL}/location/cities/${stateId}`);
      setCities(res.data);
      setSelectedCity("");
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCityChange = (event) => { setSelectedCity(event.target.value); };

  useEffect(() => {
    $('#country').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Country"
    }).on("change", function () {
      const countryId = $(this).val();
      handleCountryChange({ target: { value: countryId } });
    });

    $('#state').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select State"
    }).on("change", function () {
      const stateId = $(this).val();
      handleStateChange({ target: { value: stateId } });
    });

    $('#city').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select City"
    }).on("change", function () {
      const cityId = $(this).val();
      handleCityChange({ target: { value: cityId } });
    });

    $('#category_sell').select2({
    theme: "bootstrap",
    width: '100%',
    placeholder: "Select Category",
    multiple: true,
  })

  // ⬇⬇ ADD THIS BLOCK RIGHT HERE (before .on("change")) ⬇⬇
  .on("select2:select", function (e) {
  const values = $(this).val() || [];

  if (categoryLimit && values.length > categoryLimit) {
    isBlockingRef.current = true;  // ⬅ Block next change event

    $(this).val(values.slice(0, categoryLimit)).trigger("change");

    showNotification(`Maximum ${categoryLimit} categories allowed`, "error");
  }
})
  // ⬆⬆ ADD ABOVE ⬆⬆

  .on("change", async function () {
    if (isBlockingRef.current) {
    isBlockingRef.current = false;
    return;  // prevent clearing subcategories
  }
    const currentSelected = $(this).val()?.map(Number) || [];
    const previousSelectedCategories = previousSelectedCategoriesRef.current;
    const addedCategories = currentSelected.filter(cat => !previousSelectedCategories.includes(cat));
    const removedCategories = previousSelectedCategories.filter(cat => !currentSelected.includes(cat));
    previousSelectedCategoriesRef.current = [...currentSelected];
    setSelectedCategory(currentSelected);

    let updatedSubCategories = [...subCategories];
    let updatedMap = { ...subCategoryMap };

    if (addedCategories.length > 0) {
      try {
        const res = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
          categories: addedCategories
        });
        const newSubCats = res.data;
        newSubCats.forEach(sub => {
          if (!updatedMap[sub.id]) updatedMap[sub.id] = new Set();
          addedCategories.forEach(catId => updatedMap[sub.id].add(catId));
          if (!updatedSubCategories.find(s => s.id === sub.id)) {
            updatedSubCategories.push(sub);
          }
        });
      } catch (err) {
        console.error("Error adding subcategories:", err);
      }
    }

    if (removedCategories.length > 0) {
      Object.entries(updatedMap).forEach(([subId, categorySet]) => {
        removedCategories.forEach(catId => categorySet.delete(catId));
      });
      updatedSubCategories = updatedSubCategories.filter(sub => {
        const set = updatedMap[sub.id];
        return set && set.size > 0;
      });
      const updatedSelected = selectedSubCategory.filter(subId => {
        return updatedMap[subId] && updatedMap[subId].size > 0;
      });
      setSelectedSubCategory(updatedSelected);
      $('#sub_category').val(updatedSelected).trigger('change');
    }

    setSubCategories(updatedSubCategories);
    setSubCategoryMap(updatedMap);

    if (currentSelected.length === 0) {
      setSubCategories([]);
      setSelectedSubCategory([]);
      setSubCategoryMap({});
      $('#sub_category').val([]).trigger('change');
    }
  });

    $('#sub_category').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Sub Category",
      multiple: true,
    }).on("change", function () {
      const selectedValues = $(this).val() || [];
      setSelectedSubCategory(selectedValues.map(Number));
    });

    $('#core_activity').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Core Activity"
    }).on("change", function () {
      const coreActivityId = $(this).val();
      handleCoreActivityChange({ target: { value: coreActivityId } });
    });

    $('#activity').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Activity"
    }).on("change", function () {
      const activityId = $(this).val();
      handleActivityChange({ target: { value: activityId } });
    });

    /*$('#user_type').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Activity"
    }).on("change", function () {
      const rolesId = $(this).val();
      handleRolesChange({ target: { value: rolesId } });
    });*/

    return () => {
      $('#country').off("change").select2('destroy');
      $('#state').off("change").select2('destroy');
      $('#city').off("change").select2('destroy');
      $('#category_sell').off("change").select2('destroy');
      $('#sub_category').off("change").select2('destroy');
      $('#core_activity').off("change").select2('destroy');
      $('#activity').off("change").select2('destroy');
      // $('#user_type').off("change").select2('destroy');
    };
  }, [countries, states, cities, categories, subCategories, selectedSubCategory, subCategoryMap, coreactivities, activities]);

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
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => Number(option.value));
    if (categoryLimit && selectedOptions.length > categoryLimit) {
      showNotification(`You can select only ${categoryLimit} categories`, "error");
      return; // STOP user from selecting more
    }
    setSelectedCategory(selectedOptions);
    if (selectedOptions.length > 0) {
      try {
        const res = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
          categories: selectedOptions
        });
        const subCats = res.data;
        const validSelectedSubCategories = selectedSubCategory.filter(id =>
          subCats.some(sub => sub.id == id)
        );
        setSubCategories(subCats);
        setSelectedSubCategory(validSelectedSubCategories);
        $('#sub_category').val(validSelectedSubCategories).trigger('change');
      } catch (err) {
        console.error("Error fetching subcategories:", err);
      }
    } else {
      setSubCategories([]);
      setSelectedSubCategory([]);
      $('#sub_category').val([]).trigger('change');
    }
  };

  const handleSubCategoryChange = (event) => {
    const options = Array.from(event.target.selectedOptions, (option) => Number(option.value));
    setSelectedSubCategory(options);
  };

  useEffect(() => {
    const fetchCoreactivities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities`);
        setCoreactivities(res.data);
      } catch (error) {
        console.error("Error fetching core activities:", error);
      }
    };
    fetchCoreactivities();
  }, []);

  const handleCoreActivityChange = async (event) => {
    const coreActivityId = event.target.value;
    setSelectedCoreActivity(coreActivityId);
    try {
      const res = await axios.get(`${API_BASE_URL}/activities/coreactivity/${coreActivityId}`);
      setActivities(res.data);
      setSelectedActivity("");
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/designations?status=1`);
        setDesignations(res.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchDesignations();
  }, []);

  const handleActivityChange = (event) => { setSelectedActivity(event.target.value); };

  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    if (e.target.type === "file") {
      setFormData({ ...formData, [id]: files[0] });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleFileChange = (e) => { setFile(e.target.files[0]); };

  const handleCompanyFileChange = (e) => { setCompanyFile(e.target.files[0]); };

  const handleCompanyBrochureChange = (e) => { setCompanyBrochure(e.target.files[0]); };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/settings/site`);
        setCategoryLimit(Number(res.data.seller_category_limit)); // convert to number
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!formData.fname?.trim()) errs.fname = "First Name is required";
    if (!formData.lname?.trim()) errs.lname = "Last Name is required";
    if (!formData.email?.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email format";
    if (!isEditing) {
      if (!formData.password?.trim()) {
        errs.password = "Password is required";
      } else if (formData.password.trim().length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
    }
    if (!formData.mobile?.trim()) errs.mobile = "Mobile is required";
    else if (!/^[6-9]\d{9}$/.test(formData.mobile)) errs.mobile = "Mobile Number is invalid";
    if (!selectedCountry) errs.country = "Country is required";
    if (!selectedState) errs.state = "State is required";
    if (!selectedCity) errs.city = "City is required";
    if (!formData.zipcode?.trim()) errs.zipcode = "Post Code is required";
    if (!formData.address?.trim()) errs.address = "Address is required";
    if (!formData.user_company?.trim()) errs.user_company = "Organization Name is required";
    // if (!formData.designation?.trim()) errs.designation = "Designation is required";
    if (!formData.company_location?.trim()) errs.company_location = "Company Location is required";
    // if (!formData.company_video_second?.trim()) errs.company_video_second = "Video URL is required";
    if (!formData.brief_company?.trim()) errs.brief_company = "Brief Company Description is required";
    // if (!selectedRoles) errs.user_type = "User Type is required";
    if (!formData.is_star_seller) errs.is_star_seller = "Star Seller status is required";
    if (!formData.is_verified) errs.is_verified = "Verification status is required";
    if (!formData.elcina_member) errs.elcina_member = "ELCINA Member is required";
    if (selectedCategory.length === 0) {
      errs.category_sell = "Category is required";
    }
    if (categoryLimit && selectedCategory.length > categoryLimit) {
      errs.category_sell = `You can select only ${categoryLimit} categories`;
    }
    if (!selectedCoreActivity) errs.core_activity = "Core Activity is required";
    if (!selectedActivity) errs.activity = "Activity is required";

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    const maxSize = 2 * 1024 * 1024;

    if (!file && !isEditing) {
      errs.file = "Profile image is required";
    } else if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        errs.file = "Invalid image format (only JPG/PNG allowed)";
      } else if (file.size > maxSize) {
        errs.file = "Image size must be under 2MB";
      }
    }

    if (!companyFile && !isEditing) {
      errs.company_logo = "Company image is required";
    } else if (companyFile) {
      if (!allowedImageTypes.includes(companyFile.type)) {
        errs.company_logo = "Invalid image format (only JPG/PNG allowed)";
      } else if (companyFile.size > maxSize) {
        errs.company_logo = "Image size must be under 2MB";
      }
    }

    if (companyBrochure) {
      if (!allowedFileTypes.includes(companyBrochure.type)) {
        errs.sample_file_id =
          "Invalid Brochure format (only JPG/PNG/PDF/PPT allowed)";
      } else if (companyBrochure.size > maxSize) {
        errs.sample_file_id = "Brochure size must be under 2MB";
      }
    }

    if (formData.company_sample_ppt_file) {
      if (!allowedFileTypes.includes(formData.company_sample_ppt_file.type)) {
        errs.company_sample_ppt_file = "Invalid file format for PPT";
      } else if (formData.company_sample_ppt_file.size > maxSize) {
        errs.company_sample_ppt_file = "File size must be under 2MB";
      }
    }

    if (formData.company_video) {
      if (!allowedImageTypes.includes(formData.company_video.type)) {
        errs.company_video =
          "Invalid video format (only JPG/PNG allowed as placeholder)";
      } else if (formData.company_video.size > maxSize) {
        errs.company_video = "Video file must be under 2MB";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!isEditing) return;
    const fetchSeller = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/sellers/${sellerId}`);
        const data = res.data;
        setFormData({
          fname: data.fname || "",
          lname: data.lname || "",
          email: data.email || "",
          password: "",
          mobile: data.mobile || "",
          zipcode: data.zipcode || "",
          user_company: data.organization_name || "",
          is_trading: String(data.is_trading),
          elcina_member: String(data.elcina_member),
          address: data.address || "",
          file_name: data.file_name || "",
          company_file_name: data.company_file_name || "",
          designation: data.designation || "",
          website: data.company_website || "",
          company_location: data.company_location || "",
          company_meta_title: data.company_meta_title || "",
          company_video_second: data.company_video_second || "",
          products: data.products || "",
          brief_company: data.brief_company || "",
          // user_type: data.user_type || "",
          featured_company: String(data.featured_company) || "",
          company_sample_file_name: data.company_sample_file_name || "",
          company_sample_ppt_file_name: data.company_sample_ppt_file_name || "",
          is_star_seller: String(data.is_star_seller) || "",
          is_verified: String(data.is_verified) || "",
        });
        setSelectedCountry(data.country || "");
        setSelectedState(data.state || "");
        setSelectedCity(data.city || "");
        // setSelectedCategory(data.category_sell ? data.category_sell.split(',') : []);
        // setSelectedSubCategory(data.sub_category ? data.sub_category.split(',') : []);
        // Extract only unique category_id values
        if (data.categories && Array.isArray(data.categories)) {
      const categoryIds = [...new Set(data.categories.map(c => c.category_id).filter(Boolean))];
      const subCategoryIds = data.categories.map(c => c.subcategory_id).filter(Boolean);

      setSelectedCategory(categoryIds);

      // Fetch subcategories for selected categories
      const subRes = await axios.post(`${API_BASE_URL}/sub_categories/categories`, { categories: categoryIds });
      setSubCategories(subRes.data);

      setSelectedSubCategory(subCategoryIds);

      // Update Select2 values after options exist
      setTimeout(() => {
        $('#category_sell').val(categoryIds).trigger('change');
        $('#sub_category').val(subCategoryIds).trigger('change');
      }, 50);
    }
        setSelectedCoreActivity(data.core_activity || "");
        setSelectedActivity(data.activity || "");
        // setSelectedRoles(data.user_type || "");
        if (data.country) {
          const stRes = await axios.get(`${API_BASE_URL}/location/states/${data.country}`); setStates(stRes.data);
        }
        if (data.state) {
          const ctRes = await axios.get(`${API_BASE_URL}/location/cities/${data.state}`); setCities(ctRes.data);
        }
        /*if (data.category_sell) {
          const categoriesArray = data.category_sell.split(',').map(Number);
          setSelectedCategory(categoriesArray);
          const cRes = await axios.post(`${API_BASE_URL}/sub_categories/categories`, { categories: categoriesArray });
          setSubCategories(cRes.data);
          const subCatArray = data.sub_category ? data.sub_category.split(',').map(Number) : [];
          setSelectedSubCategory(subCatArray);
          $('#sub_category').val(subCatArray).trigger('change');
          $('#category_sell').val(categoriesArray).trigger('change');
        }*/
        if (data.core_activity) {
          const aRes = await axios.get(`${API_BASE_URL}/activities/coreactivity/${data.core_activity}`); setActivities(aRes.data);
        }
      } catch (error) {
        console.error("Error fetching seller:", error);
      }
    };
    fetchSeller();
  }, [sellerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => { data.append(key, value); });
    data.append("country", selectedCountry);
    data.append("state", selectedState);
    data.append("city", selectedCity);
    // data.append("category_sell", selectedCategory.join(","));
    // data.append("sub_category", selectedSubCategory.join(","));
    data.append("categories", selectedCategory.join(','));
  data.append("subcategory_ids", selectedSubCategory.join(','));
    data.append("core_activity", selectedCoreActivity);
    data.append("activity", selectedActivity);
    // data.append("user_type", selectedRoles);
    if (file) data.append("file", file);
    if (companyFile) data.append("company_logo", companyFile);
    if (companyBrochure) data.append("sample_file_id", companyBrochure);
    try {
      const endpoint = isEditing ? `${API_BASE_URL}/sellers/${sellerId}` : `${API_BASE_URL}/sellers`;
      const method = isEditing ? "put" : "post";
      await axios[method](endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showNotification(`Seller ${isEditing ? "updated" : "added"} successfully!`, "success");
      navigate("/admin/sellers");
    } catch (error) {
      console.error("Error saving seller:", error);
      showNotification(`Failed to ${isEditing ? "update" : "add"} seller`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /*useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/roles`);
        setRoles(res.data);
      } catch (error) {
        console.error("Error fetching core activities:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleRolesChange = async (event) => {
    const rolesId = event.target.value;
    setSelectedRoles(rolesId);
  };*/

  return (
    <>
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Seller" title="Add Seller" add_button="Back" add_link="/admin/sellers" />
        <div className="row">
          <div className="col-xl-12 mx-auto">            
            <form className="" onSubmit={handleSubmit}>
              <div className="card mb-4">
                <div className="card-body px-4 row g-3">
                  <div className="col-md-4">
                    <label htmlFor="user_company" className="form-label required">Organization Name</label>
                    <input
                      type="text" className={`form-control ${errors.user_company ? "is-invalid" : ""}`}
                      id="user_company"
                      placeholder="Organization Name"
                      value={formData.user_company}
                      onChange={handleInputChange}
                    />
                    {errors.user_company && (<div className="invalid-feedback">{errors.user_company}</div>)}
                  </div>
                  {/* <div className="col-md-4">
                    <label htmlFor="user_type" className="form-label required">User Type</label>
                    <select
                      id="user_type" className="form-control select2"
                      value={selectedRoles}
                      onChange={handleRolesChange}
                    >
                      <option value="">Select user type</option>
                      {roles?.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    {errors.user_type && (<div className="text-danger small">{errors.user_type}</div>)}
                  </div> */}
                  <div className="col-md-4">
                    <label htmlFor="core_activity" className="form-label required">Core Activity</label>
                    <select
                      id="core_activity" className="form-control select2"
                      value={selectedCoreActivity}
                      onChange={handleCoreActivityChange}
                    >
                      <option value="">Select Core Activity</option>
                      {coreactivities?.map((core_activity) => (
                        <option key={core_activity.id} value={core_activity.id}>{core_activity.name}</option>
                      ))}
                    </select>
                    {errors.core_activity && (<div className="text-danger small">{errors.core_activity}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="activity" className="form-label required">Activity</label>
                    <select
                      id="activity" className="form-control select2"
                      value={selectedActivity}
                      onChange={handleActivityChange}
                      disabled={!selectedCoreActivity}
                    >
                      <option value="">Select Activity</option>
                      {activities?.map((activity) => (
                        <option key={activity.id} value={activity.id}>{activity.name}</option>
                      ))}
                    </select>
                    {errors.activity && (<div className="text-danger small">{errors.activity}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="category_sell" className="form-label required">Category</label>
                    <select
                      id="category_sell"
                      className="form-control select2"
                      value={selectedCategory}
                      onChange={() => {}}
                      multiple
                    >
                      <option value="">Select Category</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {errors.category_sell && (<div className="text-danger small">{errors.category_sell}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="sub_category" className="form-label">Sub Category</label>
                    <select
                      id="sub_category"
                      className="form-control select2"
                      value={selectedSubCategory}
                      disabled={subCategories.length === 0}
                      multiple
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories?.map((sub_category) => (
                        <option key={sub_category.id} value={sub_category.id}>{sub_category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="website" className="form-label">Company Website</label>
                    <input
                      type="text" className="form-control"
                      id="website"
                      placeholder="Company Website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="company_location" className="form-label required">Company Location</label>
                    <input
                      type="text" className={`form-control ${errors.company_location ? "is-invalid" : ""}`}
                      id="company_location"
                      placeholder="Company Location"
                      value={formData.company_location}
                      onChange={handleInputChange}
                    />
                    {errors.company_location && (<div className="invalid-feedback">{errors.company_location}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="is_star_seller" className="form-label required">Star Supplier</label>
                    <select
                      id="is_star_seller" className={`form-control ${errors.is_star_seller ? "is-invalid" : ""}`}
                      value={formData.is_star_seller}
                      onChange={handleInputChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                    {errors.is_star_seller && (<div className="invalid-feedback">{errors.is_star_seller}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="is_verified" className="form-label required">Trusted Seal Verified</label>
                    <select
                      id="is_verified" className={`form-control ${errors.is_verified ? "is-invalid" : ""}`}
                      value={formData.is_verified}
                      onChange={handleInputChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                    {errors.is_verified && (<div className="invalid-feedback">{errors.is_verified}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="featured_company" className="form-label">Featured Company</label>
                    <select
                      id="featured_company" className="form-control"
                      value={formData.featured_company}
                      onChange={handleInputChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="is_trading" className="form-label">Trader</label>
                    <select
                      id="is_trading" className="form-control"
                      value={formData.is_trading}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Trader</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="company_meta_title" className="form-label">Company Display Title</label>
                    <input
                      type="text" className="form-control"
                      id="company_meta_title"
                      placeholder="Company Display Title"
                      value={formData.company_meta_title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="company_logo" className="form-label required">Company Image</label>
                    <input
                      className={`form-control ${errors.company_logo ? "is-invalid" : ""}`}
                      type="file"
                      id="company_logo"
                      onChange={handleCompanyFileChange}
                    />
                    {errors.company_logo && (<div className="invalid-feedback">{errors.company_logo}</div>)}
                    {companyFile ? (
                      <img
                        src={URL.createObjectURL(companyFile)}
                        className="img-preview object-fit-cover mt-3"
                        width={150}
                        height={150}
                        alt="Preview"
                      />
                    ) : formData.file_name ? (
                      <ImageWithFallback
                        src={`${ROOT_URL}/${formData.company_file_name}`}
                        width={150}
                        height={150}
                        showFallback={false}
                      />
                    ) : null}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="company_sample_ppt_file" className="form-label">Ppt File</label>
                    <input
                      type="file" className="form-control"
                      id="company_sample_ppt_file"
                      onChange={handleInputChange}
                    />
                    {formData.company_sample_ppt_file_name && 
                    <a className="mt-2" href={`${ROOT_URL}/${formData.company_sample_ppt_file_name}`} target="_blank">Sample PPT File</a>
                    }
                    {errors.company_sample_ppt_file && (<div className="invalid-feedback">{errors.company_sample_ppt_file}</div>)}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="sample_file_id" className="form-label">Company Brochure</label>
                    <input
                      className="form-control"
                      type="file"
                      id="sample_file_id"
                      onChange={handleCompanyBrochureChange}
                    />
                    {formData.company_sample_file_name && 
                    <a className="mt-2" href={`${ROOT_URL}/${formData.company_sample_file_name}`} target="_blank">Sample File</a>
                    }
                    {errors.sample_file_id && (<div className="invalid-feedback">{errors.sample_file_id}</div>)}
                    {/* {companyBrochure ? (
                      <img
                        src={URL.createObjectURL(companyBrochure)}
                        className="img-preview object-fit-cover mt-3"
                        width={150}
                        height={150}
                        alt="Preview"
                      />
                    ) : formData.file_name ? (
                      <ImageWithFallback
                        src={`${ROOT_URL}/${formData.company_sample_file_name}`}
                        width={150}
                        height={150}
                        showFallback={false}
                      />
                    ) : null} */}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="elcina_member" className="form-label required">ELCINA Member</label>
                    <select
                      id="elcina_member" className={`form-control ${errors.elcina_member ? "is-invalid" : ""}`}
                      value={formData.elcina_member}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Member</option>
                      <option value="1">Yes</option>
                      <option value="2">No</option>
                      <option value="3">Not Sure</option>
                    </select>
                    {errors.elcina_member && (<div className="invalid-feedback">{errors.elcina_member}</div>)}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="company_video" className="form-label">Upload Video</label>
                    <input
                      type="file" className="form-control"
                      id="company_video"
                      onChange={handleInputChange}
                    />
                    {errors.company_video && (<div className="invalid-feedback">{errors.company_video}</div>)}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="uploadVideoUrl" className="form-label">Upload Video Url</label>
                    <input
                      type="text" className="form-control"
                      id="company_video_second"
                      placeholder="Upload Video Url"
                      value={formData.company_video_second}
                      onChange={handleInputChange}
                    />
                    {/* {errors.company_video_second && (<div className="invalid-feedback">{errors.company_video_second}</div>)} */}
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="brief_company" className="form-label required">Brief Company Profile</label>
                    <textarea
                      className={`form-control ${errors.brief_company ? "is-invalid" : ""}`}
                      id="brief_company"
                      placeholder="Brief Company Profile"
                      rows={3}
                      value={formData.brief_company}
                      onChange={handleInputChange}
                    />
                    {errors.brief_company && (<div className="invalid-feedback">{errors.brief_company}</div>)}
                  </div>
                  <div className="col-md-12">
                    <label htmlFor="products" className="form-label">Products Description</label>
                    <textarea
                      className="form-control"
                      id="products"
                      placeholder="Products Description"
                      rows={3}
                      value={formData.products}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="card card-border mb-4">
                <div className='card-header py-3 px-3'>
                  <h6 className="mb-0 fw-bold">Company User</h6>
                </div>
                <div className="card-body px-4 mb-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="fname" className="form-label required">First Name</label>
                      <input
                        type="text" className={`form-control ${errors.fname ? "is-invalid" : ""}`}
                        id="fname"
                        placeholder="First Name"
                        value={formData.fname}
                        onChange={handleInputChange}
                      />
                      {errors.fname && (<div className="invalid-feedback">{errors.fname}</div>)}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lname" className="form-label required">Last Name</label>
                      <input
                        type="text" className={`form-control ${errors.lname ? "is-invalid" : ""}`}
                        id="lname"
                        placeholder="Last Name"
                        value={formData.lname}
                        onChange={handleInputChange}
                      />
                      {errors.lname && (<div className="invalid-feedback">{errors.lname}</div>)}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="mobile" className="form-label required">Mobile</label>
                      <input
                        type="text" className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                        id="mobile"
                        placeholder="Mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                      />
                      {errors.mobile && (<div className="invalid-feedback">{errors.mobile}</div>)}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="email" className="form-label required">Email</label>
                      <input
                        type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        id="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {errors.email && (<div className="invalid-feedback">{errors.email}</div>)}
                    </div>
                    {!isEditing && (
                      <div className="col-md-4 mb-3">
                        <label htmlFor="password" className="form-label required">Password</label>
                        <input
                          type="password"
                          className={`form-control ${errors.password ? "is-invalid" : ""}`}
                          id="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        {errors.password && (<div className="invalid-feedback">{errors.password}</div>)}
                      </div>
                    )}
                    <div className="col-md-3 mb-3">
                      <label htmlFor="country" className="form-label required">Country</label>
                      <select
                        id="country"
                        className="form-control select2"
                        value={selectedCountry}
                        onChange={handleCountryChange}
                      >
                        <option value="">Select Country</option>
                        {countries.map(country => (
                          <option key={country.id} value={country.id}>{country.name}</option>
                        ))}
                      </select>
                      {errors.country && <div className="text-danger small">{errors.country}</div>}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label htmlFor="state" className="form-label required">State</label>
                      <select
                        id="state"
                        className="form-control select2"
                        value={selectedState}
                        onChange={handleStateChange}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors.state && <div className="text-danger small">{errors.state}</div>}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label htmlFor="city" className="form-label required">City</label>
                      <select
                        id="city"
                        className="form-control select2"
                        value={selectedCity}
                        onChange={handleCityChange}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                      {errors.city && <div className="text-danger small">{errors.city}</div>}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label htmlFor="zipcode" className="form-label required">Post Code</label>
                      <input
                        type="number" className={`form-control ${errors.zipcode ? "is-invalid" : ""}`}
                        id="zipcode"
                        placeholder="Post Code"
                        value={formData.zipcode}
                        onChange={handleInputChange}
                      />
                      {errors.zipcode && (<div className="invalid-feedback">{errors.zipcode}</div>)}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="designation" className="form-label">Designation</label>
                      <input
                        type="text" className="form-control"
                        list="browsers"
                        id="designation"
                        placeholder="Designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                      />
                      <datalist id="browsers">
                        {designations.map((d, index) => (
                          <option value={d.name} if="" key={index}></option>
                        ))}
                      </datalist>
                      {/* {errors.designation && (<div className="invalid-feedback">{errors.designation}</div>)} */}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="file" className="form-label required">
                        Image
                      </label>
                      <input
                        className={`form-control ${errors.file ? "is-invalid" : ""}`}
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                      />
                      {errors.file && (<div className="invalid-feedback">{errors.file}</div>)}
                      {file ? (
                        <img
                          src={URL.createObjectURL(file)}
                          className="object-fit-cover mt-3"
                          width={100}
                          height={100}
                          alt="Preview"
                        />
                      ) : formData.file_name ? (
                        <ImageWithFallback
                          src={`${ROOT_URL}/${formData.file_name}`}
                          width={100}
                          height={100}
                          showFallback={false}
                        />
                      ) : null}
                    </div>
                    <div className="col-md-12">
                      <label htmlFor="address" className="form-label required">Address</label>
                      <textarea
                        className={`form-control ${errors.address ? "is-invalid" : ""}`}
                        id="address"
                        placeholder="Address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      {errors.address && (<div className="invalid-feedback">{errors.address}</div>)}
                    </div>
                    <div className="col-12 text-end mt-3">
                      <button type="submit" className="btn btn-primary px-4 mt-3" disabled={submitting}>
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
                  </div>
                </div>
              </div>
            </form>
            {/*end row*/}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AddSeller;