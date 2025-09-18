import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../common/Breadcrumb";
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import SearchDropdown from "../common/SearchDropdown";

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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [coreactivities, setCoreactivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedCoreActivity, setSelectedCoreActivity] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    fname: "", lname: "", email: "", password: "", mobile: "", zipcode: "", website: "", is_trading: "", elcina_member: "", address: "",
    file: null, company_logo: null, user_company: "", user_type: "", company_location: "", is_star_seller: "",
    is_verified: "", company_meta_title: "", company_video_second: "", brief_company: "", products: "",
    designation: "", featured_company: "", company_sample_ppt_file: null, company_video: null, sample_file_id: null,
  });
  const [file, setFile] = useState(null);
  const [companyFile, setCompanyFile] = useState(null);
  const [companyBrochure, setCompanyBrochure] = useState(null);
  const [errors, setErrors] = useState({});

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
    const coreactivityId = event.target.value;
    setSelectedCoreActivity(coreactivityId);
    try {
      const res = await axios.get(`${API_BASE_URL}/activities/coreactivity/${coreactivityId}`);
      setActivities(res.data);
      setSelectedActivity("");
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

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
    if (!formData.designation?.trim()) errs.designation = "Designation is required";
    if (!formData.company_location?.trim()) errs.company_location = "Company Location is required";
    if (!formData.company_video_second?.trim()) errs.company_video_second = "Video URL is required";
    if (!formData.brief_company?.trim()) errs.brief_company = "Brief Company Description is required";
    if (!formData.user_type) errs.user_type = "User Type is required";
    if (!formData.is_star_seller) errs.is_star_seller = "Star Seller status is required";
    if (!formData.is_verified) errs.is_verified = "Verification status is required";
    if (!formData.elcina_member) errs.elcina_member = "ELCINA Member is required";
    if (!selectedCategory) errs.category_sell = "Category is required";
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

    if (!companyBrochure && !isEditing) {
      errs.sample_file_id = "Company Brochure is required";
    } else if (companyBrochure) {
      if (!allowedFileTypes.includes(companyBrochure.type)) {
        errs.sample_file_id =
          "Invalid Brochure format (only JPG/PNG/PDF/PPT allowed)";
      } else if (companyBrochure.size > maxSize) {
        errs.sample_file_id = "Brochure size must be under 2MB";
      }
    }

    if (!formData.company_sample_ppt_file && !isEditing) {
      errs.company_sample_ppt_file = "Company Sample PPT is required";
    } else if (formData.company_sample_ppt_file) {
      if (!allowedFileTypes.includes(formData.company_sample_ppt_file.type)) {
        errs.company_sample_ppt_file = "Invalid file format for PPT";
      } else if (formData.company_sample_ppt_file.size > maxSize) {
        errs.company_sample_ppt_file = "File size must be under 2MB";
      }
    }

    if (!formData.company_video && !isEditing) {
      errs.company_video = "Company Video is required";
    } else if (formData.company_video) {
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
          user_company: data.user_company || "",
          is_trading: String(data.is_trading),
          elcina_member: String(data.elcina_member),
          address: data.address || "",
          file_name: data.file_name || "",
          company_file_name: data.company_file_name || "",
          designation: data.designation || "",
          website: data.website || "",
          company_location: data.company_location || "",
          company_meta_title: data.company_meta_title || "",
          company_video_second: data.company_video_second || "",
          products: data.products || "",
          brief_company: data.brief_company || "",
          user_type: data.user_type || "",
          featured_company: String(data.featured_company) || "",
          company_sample_file_name: data.company_sample_file_name || "",
          is_star_seller: String(data.is_star_seller) || "",
          is_verified: String(data.is_verified) || "",
        });
        setSelectedCountry(data.country || "");
        setSelectedState(data.state || "");
        setSelectedCity(data.city || "");
        setSelectedCategory(data.category_sell || "");
        setSelectedSubCategory(data.sub_category || "");
        setSelectedCoreActivity(data.core_activity || "");
        setSelectedActivity(data.activity || "");
        if (data.country) {
          const stRes = await axios.get(`${API_BASE_URL}/location/states/${data.country}`); setStates(stRes.data);
        }
        if (data.state) {
          const ctRes = await axios.get(`${API_BASE_URL}/location/cities/${data.state}`); setCities(ctRes.data);
        }
        if (data.category_sell) {
          const cRes = await axios.get(`${API_BASE_URL}/sub_categories/category/${data.category_sell}`); setSubCategories(cRes.data);
        }
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
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => { data.append(key, value); });
    data.append("country", selectedCountry);
    data.append("state", selectedState);
    data.append("city", selectedCity);
    data.append("category_sell", selectedCategory);
    data.append("sub_category", selectedSubCategory);
    data.append("core_activity", selectedCoreActivity);
    data.append("activity", selectedActivity);
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
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/roles`);
        setRoles(res.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleSelectChange = (fieldName) => (selectedOption) => {
    setFormData((prev) => ({ ...prev, [fieldName]: selectedOption ? selectedOption.value : "", }));
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Seller" title="Add Seller" add_button="Back" add_link="/admin/sellers" />
        <div className="row">
          <div className="col-xl-12 mx-auto">
            <div className="card">
              <div className="card-body p-4">
                <form className="row g-3" onSubmit={handleSubmit}>
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
                  <div className="col-md-4">
                    <label htmlFor="user_type" className="form-label required">User Type</label>
                    <SearchDropdown
                      id="user_type"
                      options={roles?.map((role) => ({ value: role.id, label: role.name, }))}
                      value={formData.user_type}
                      onChange={handleSelectChange("user_type")}
                      placeholder="Select here"
                    />
                    {errors.user_type && (<div className="invalid-feedback">{errors.user_type}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="core_activity" className="form-label required">Core Activity</label>
                    <select
                      id="core_activity" className={`form-control ${errors.core_activity ? "is-invalid" : ""}`}
                      value={selectedCoreActivity}
                      onChange={handleCoreActivityChange}
                    >
                      <option value="">Select Core Activity</option>
                      {coreactivities?.map((core_activity) => (
                        <option key={core_activity.id} value={core_activity.id}>{core_activity.name}</option>
                      ))}
                    </select>
                    {errors.core_activity && (<div className="invalid-feedback">{errors.core_activity}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="activity" className="form-label required">Activity</label>
                    <select
                      id="activity" className={`form-control ${errors.activity ? "is-invalid" : ""}`}
                      value={selectedActivity}
                      onChange={handleActivityChange}
                      disabled={!selectedCoreActivity}
                    >
                      <option value="">Select Activity</option>
                      {activities?.map((activity) => (
                        <option key={activity.id} value={activity.id}>{activity.name}</option>
                      ))}
                    </select>
                    {errors.activity && (<div className="invalid-feedback">{errors.activity}</div>)}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="category_sell" className="form-label required">Category</label>
                    <select
                      id="category_sell" className={`form-control ${errors.category_sell ? "is-invalid" : ""}`}
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Select Category</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {errors.category_sell && (<div className="invalid-feedback">{errors.category_sell}</div>)}
                  </div>
                  <div className="col-md-4">
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
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                    <label htmlFor="company_sample_ppt_file" className="form-label required">Ppt File</label>
                    <input
                      type="file" className={`form-control ${errors.company_sample_ppt_file ? "is-invalid" : ""}`}
                      id="company_sample_ppt_file"
                      onChange={handleInputChange}
                    />
                    {errors.company_sample_ppt_file && (<div className="invalid-feedback">{errors.company_sample_ppt_file}</div>)}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="sample_file_id" className="form-label required">Company Brochure</label>
                    <input
                      className={`form-control ${errors.sample_file_id ? "is-invalid" : ""}`}
                      type="file"
                      id="sample_file_id"
                      onChange={handleCompanyBrochureChange}
                    />
                    {errors.sample_file_id && (<div className="invalid-feedback">{errors.sample_file_id}</div>)}
                    {companyBrochure ? (
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
                    ) : null}
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
                    <label htmlFor="company_video" className="form-label required">Upload Video</label>
                    <input
                      type="file" className={`form-control ${errors.company_video ? "is-invalid" : ""}`}
                      id="company_video"
                      onChange={handleInputChange}
                    />
                    {errors.company_video && (<div className="invalid-feedback">{errors.company_video}</div>)}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="uploadVideoUrl" className="form-label required">Upload Video Url</label>
                    <input
                      type="text" className={`form-control ${errors.company_video_second ? "is-invalid" : ""}`}
                      id="company_video_second"
                      placeholder="Upload Video Url"
                      value={formData.company_video_second}
                      onChange={handleInputChange}
                    />
                    {errors.company_video_second && (<div className="invalid-feedback">{errors.company_video_second}</div>)}
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
                  <h5 className="">Company User</h5>
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                  <div className="col-md-3">
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
                    <div className="col-md-3">
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
                  <div className="col-md-3">
                    <label htmlFor="country" className="form-label required">Country</label>
                    <select
                      id="country" className={`form-control ${errors.country ? "is-invalid" : ""}`}
                      value={selectedCountry}
                      onChange={handleCountryChange}
                    >
                      <option value="">Select Country</option>
                      {countries?.map((country) => (
                        <option key={country.id} value={country.id}>{country.name}</option>
                      ))}
                    </select>
                    {errors.country && (<div className="invalid-feedback">{errors.country}</div>)}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="state" className="form-label required">State</label>
                    <select
                      id="state" className={`form-control ${errors.state ? "is-invalid" : ""}`}
                      value={selectedState}
                      onChange={handleStateChange}
                      disabled={!selectedCountry}
                    >
                      <option value="">Select State</option>
                      {states?.map((state) => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                      ))}
                    </select>
                    {errors.state && (<div className="invalid-feedback">{errors.state}</div>)}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="city" className="form-label required">City</label>
                    <select
                      id="city" className={`form-control ${errors.city ? "is-invalid" : ""}`}
                      value={selectedCity}
                      onChange={handleCityChange}
                      disabled={!selectedState}
                    >
                      <option value="">Select City</option>
                      {cities?.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                    {errors.city && (
                      <div className="invalid-feedback">{errors.city}</div>
                    )}
                  </div>
                  <div className="col-md-4">
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
                  <div className="col-md-4">
                    <label htmlFor="designation" className="form-label required">Designation</label>
                    <input
                      type="text" className={`form-control ${errors.designation ? "is-invalid" : ""}`}
                      id="designation"
                      placeholder="Designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                    />
                    {errors.designation && (<div className="invalid-feedback">{errors.designation}</div>)}
                  </div>
                  <div className="col-md-4">
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
                        className="img-preview object-fit-cover mt-3"
                        width={150}
                        height={150}
                        alt="Preview"
                      />
                    ) : formData.file_name ? (
                      <ImageWithFallback
                        src={`${ROOT_URL}/${formData.file_name}`}
                        width={150}
                        height={150}
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
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-sm btn-primary px-4 mt-3">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/*end row*/}
      </div>
    </div>
  );
};

export default AddSeller;