import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

const CompanyEdit = () => {
  const navigate = useNavigate();
  const { showNotification } = useAlert();
  const [user, setUser] = useState({
    organization_name: "",
    company_email: "",
    company_location: "",
    company_website: "",
    core_activity: "",
    activity: "",
    category_sell: "",
    sub_category: "",
    brief_company: "",
    companyLogo: null,
    companySamplePptFile: null,
    company_video_second: "",
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState([]);
  const previousSelectedCategoriesRef = useRef([]);
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [coreActivities, setCoreActivities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedCoreActivity, setSelectedCoreActivity] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [companyFile, setCompanyFile] = useState(null);
  const [companyBrochure, setCompanyBrochure] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryLimit, setCategoryLimit] = useState(null);
    const isBlockingRef = useRef(false);

  useEffect(() => {
    const fetchCoreActivities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities`);
        setCoreActivities(res.data);
      } catch (error) {
        console.error("Error fetching core activities:", error);
      }
    };
    fetchCoreActivities();
  }, []);

  const handleCoreActivityChange = async (event) => {
    const coreActivityId = event.target.value;
    setSelectedCoreActivity(coreActivityId);
    try {
      const res = await axios.get(`${API_BASE_URL}/activities/coreactivity/${coreActivityId}`);
      setActivities(res.data);
      setSelectedActivity('');
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleActivityChange = (event) => {
    setSelectedActivity(event.target.value);
  };

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
      showNotification(`You can select up to ${categoryLimit} categories only.`, "error");
      return;  
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
    $('#category_sell').select2({
      theme: "bootstrap",
      width: '100%',
      placeholder: "Select Category",
      multiple: true,
    }).on("change", async function () {
      const currentSelected = $(this).val()?.map(Number) || [];
      if (categoryLimit && currentSelected.length > categoryLimit) {
        currentSelected.pop();
        $(this).val(currentSelected).trigger("change");
        showNotification(`You can select maximum ${categoryLimit} categories.`, "error");
        return;
    }
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

    return () => {
      const $category_sell = $('#category_sell');
      const $sub_category = $('#sub_category');
      const $core_activity = $('#core_activity');
      const $activity = $('#activity');
      if ($category_sell.data('select2')) { $category_sell.off("change").select2('destroy'); }
      if ($sub_category.data('select2')) { $sub_category.off("change").select2('destroy'); }
      if ($core_activity.data('select2')) { $core_activity.select2('destroy'); }
      if ($activity.data('select2')) { $activity.select2('destroy'); }
    };
  }, [categories, subCategories, selectedSubCategory, subCategoryMap, coreActivities, activities]);

  const handleFileChange = (e) => { setFile(e.target.files[0]); };

  const handleCompanyFileChange = (e) => { setCompanyFile(e.target.files[0]); };

  const handleCompanyBrochureChange = (e) => { setCompanyBrochure(e.target.files[0]); };

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = response.data.user;
        setUser(userData);

        // Parse stored category/subcategory ids
        const categoryArray = userData.company_info?.sellerCategoryIds
          ? userData.company_info.sellerCategoryIds.split(',').map(Number)
          : [];
        const subCategoryArray = userData.company_info?.sellerSubCategoryIds
          ? userData.company_info.sellerSubCategoryIds.split(',').map(Number)
          : [];

        setSelectedCategory(categoryArray);
        setSelectedSubCategory(subCategoryArray);
        setSelectedCoreActivity(userData.company_info?.core_activity ?? '');
        setSelectedActivity(userData.company_info?.activity ?? '');

        if (categoryArray.length > 0) {
          // Fetch subcategories for selected categories
          const cRes = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
            categories: categoryArray,
          });
          setSubCategories(cRes.data);

          // ✅ wait for the subcategories to finish rendering before setting select2 value
          setTimeout(() => {
            $('#category_sell').val(categoryArray).trigger('change');
            $('#sub_category').val(subCategoryArray).trigger('change');
          }, 300);
        }

        if (userData.company_info?.core_activity) {
          const ctRes = await axios.get(
            `${API_BASE_URL}/activities/coreactivity/${userData.company_info.core_activity}`
          );
          setActivities(ctRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Profile fetch failed', err);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Check if the field belongs to company_info
    if (user.company_info && name in user.company_info) {
      setUser((prev) => ({
        ...prev,
        company_info: {
          ...prev.company_info,
          [name]: files ? files[0] : value,
        },
      }));
    } else {
      // For fields directly under user
      setUser((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

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

    // Organization Name
    if (!user.company_info?.organization_name?.trim())
      errs.organization_name = "Organization name is required";

    // Company Email
    if (!user.company_info?.company_email?.trim())
      errs.company_email = "Company email is required";
    else if (!/\S+@\S+\.\S+/.test(user.company_info.company_email))
      errs.company_email = "Invalid email format";

    // Company Location
    if (!user.company_info?.company_location?.trim())
      errs.company_location = "Company location is required";

    // Company Website
    if (!user.company_info?.company_website?.trim())
      errs.company_website = "Company website is required";
    else if (
      !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/.test(
        user.company_info.company_website
      )
    )
      errs.company_website = "Invalid website URL";

    // Core Activity
    if (!selectedCoreActivity)
      errs.core_activity = "Core activity is required";

    // Activity
    if (!selectedActivity)
      errs.activity = "Activity is required";

    // Category Sell
    if (!selectedCategory.length)
      errs.category_sell = "At least one category is required";

    // Company Introduction
    if (!user.company_info?.brief_company?.trim())
      errs.brief_company = "Company introduction is required";
    else if (user.company_info.brief_company.length > 1500)
      errs.brief_company = "Company introduction must not exceed 1500 characters";

    // File validation (optional)
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file) {
      if (!allowedImageTypes.includes(file.type))
        errs.file = "Invalid image format (only JPG/PNG allowed)";
      else if (file.size > maxSize)
        errs.file = "Image size must be under 2MB";
    }

    // Company Brochure (PDF)
    const allowedPdfType = ["application/pdf"];
    const maxPdfSize = 10 * 1024 * 1024; // 10MB
    if (companyBrochure) {
      if (!allowedPdfType.includes(companyBrochure.type))
        errs.sample_file_id = "Invalid file format (only PDF allowed)";
      else if (companyBrochure.size > maxPdfSize)
        errs.sample_file_id = "Brochure size must be under 10MB";
    }

    // Company Sample PPT
    const allowedPptTypes = [
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    ];
    const maxPptSize = 12 * 1024 * 1024; // 12MB
    if (companyFile) {
      if (!allowedPptTypes.includes(companyFile.type))
        errs.company_sample_ppt_file = "Invalid file format (only PPT/PPTX allowed)";
      else if (companyFile.size > maxPptSize)
        errs.company_sample_ppt_file = "PPT file size must be under 12MB";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0; // ✅ returns true if valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const token = localStorage.getItem("user_token");
    try {
      const formData = new FormData();
      formData.append("organization_name", user.company_info?.organization_name || "");
      formData.append("company_email", user.company_info?.company_email || "");
      formData.append("company_location", user.company_info?.company_location || "");
      formData.append("company_website", user.company_info?.company_website || "");
      formData.append("core_activity", selectedCoreActivity || "");
      formData.append("activity", selectedActivity || "");
      // formData.append("category_sell", selectedCategory.join(","));
      // formData.append("sub_category", selectedSubCategory.join(","));
      formData.append("categories", selectedCategory.join(",")); // Append categories as comma-separated string
  formData.append("subcategory_ids", selectedSubCategory.join(","));
      formData.append("brief_company", user.company_info?.brief_company || "");
      formData.append("company_video_second", user.company_info?.company_video_second || "");

      // Files (only append if present)
      if (file) formData.append("company_logo", file); // company logo
      if (companyBrochure) formData.append("sample_file_id", companyBrochure); // company brochure
      if (companyFile) formData.append("company_sample_ppt_file", companyFile);
      const response = await axios.post(`${API_BASE_URL}/signup/update-profile`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      showNotification("Company updated successfully!", 'success');
      if (response.data.redirectToMyProduct) {
        navigate("/my-product");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error("Update failed", err);
      showNotification("Error updating profile", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h4 className="pb-2">Company Update</h4>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="row mt-3">
                  <div className="col-lg-12">
                    <div className="border border-1 p-4 rounded">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">
                            Organization Name<sup className="text-danger">*</sup>
                          </label>
                          <input
                            type="text"
                            name="organization_name"
                            value={user.company_info?.organization_name || ""}
                            onChange={handleChange}
                            className={`form-control ${errors.organization_name ? 'is-invalid' : ''}`}
                            placeholder="Enter Organization Name"
                          />
                          {errors.organization_name && <div className="invalid-feedback">{errors.organization_name}</div>}
                        </div>
                        <div className="col-md-6 mt-3">
                          <label className="form-label">
                            Company Email<sup className="text-danger">*</sup>
                          </label>
                          <input
                            type="email"
                            className={`form-control ${errors.company_email ? 'is-invalid' : ''}`}
                            name="company_email"
                            placeholder="Enter  Comapny Email"
                            value={user.company_info?.company_email || ""}
                            onChange={handleChange}
                          />
                          {errors.company_email && <div className="invalid-feedback">{errors.company_email}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            Company Location<sup className="text-danger">*</sup>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.company_location ? 'is-invalid' : ''}`}
                            name="company_location"
                            placeholder="Enter Organization Name"
                            value={user.company_info?.company_location || ""}
                            onChange={handleChange}
                          />
                          {errors.company_location && <div className="invalid-feedback">{errors.company_location}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            Company Website <sup className="text-danger">*</sup>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.company_website ? 'is-invalid' : ''}`}
                            name="company_website"
                            placeholder="Enter Company Website"
                            value={user.company_info?.company_website || ""}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="core_activity" className="form-label required">Core Activity</label>
                          <select
                            id="core_activity"
                            className="form-control select2"
                            value={selectedCoreActivity}
                            onChange={handleCoreActivityChange}
                          >
                            <option value="">Select Core Activity</option>
                            {coreActivities.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          {errors.core_activity && <div className="text-danger small mt-1">{errors.core_activity}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="activity" className="form-label required">Activity</label>
                          <select
                            id="activity"
                            className="form-control select2"
                            value={selectedActivity}
                            onChange={handleActivityChange}
                          >
                            <option value="">Select Activity</option>
                            {activities.map((activity) => (
                              <option key={activity.id} value={activity.id}>{activity.name}</option>
                            ))}
                          </select>
                          {errors.activity && <div className="text-danger small mt-1">{errors.activity}</div>}
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="category_sell" className="form-label required">Category</label>
                          <select
                            id="category_sell" className="form-control select2"
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            multiple
                          >
                            <option value="">Select Category</option>
                            {categories?.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                          {errors.category_sell && (<div className= "text-danger small mt-1">{errors.category_sell}</div>)}
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="sub_category" className="form-label">Sub Category</label>
                          <select
                            id="sub_category" className="form-control select2"
                            value={selectedSubCategory}
                            onChange={handleSubCategoryChange}
                            disabled={subCategories.length === 0}
                            multiple
                          >
                            <option value="">Select Sub Category</option>
                            {subCategories?.map((sub_category) => (
                              <option key={sub_category.id} value={sub_category.id}>{sub_category.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">Company Logo </label>
                          <input className="form-control" type="file"
                            id="file" onChange={handleFileChange} />
                          {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                          {file ? (
                            <img
                              src={URL.createObjectURL(file)}
                              className="img-preview mt-3"
                              width={150}
                              height={150}
                              alt="Preview"
                            />
                          ) : user.company_info?.companyLogo?.file ? (
                            <ImageWithFallback
                              src={`${ROOT_URL}/${user.company_info.companyLogo.file}`}
                              width={150}
                              height={150}
                              showFallback={false}
                            />
                          ) : null}
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">
                            Company Introduction<sup className="text-danger">*</sup>
                          </label>
                          <textarea
                            className="form-control"
                            id="brief_company"
                            name="brief_company"
                            placeholder="Company Introduction"
                            rows={5}
                            value={user.company_info?.brief_company || ""}
                            onChange={handleChange}
                          />
                          {errors.brief_company && <div className= "text-danger small mt-1">{errors.brief_company}</div>}
                          <p className="pt-3">
                            Total Words Limit <span className="about">1500 </span>{" "}
                          </p>
                        </div>
                        <div className="col-md-12 mt-3">
                          <label className="form-label">Ppt file</label>
                          <input
                            type="file" className={`form-control ${errors.company_sample_ppt_file ? "is-invalid" : ""}`}
                            id="company_sample_ppt_file"
                            onChange={handleChange}
                          />
                          {user.company_info?.companySamplePptFile?.file && (
                            <a
                              href={`${ROOT_URL}/${user.company_info.companySamplePptFile.file}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Uploaded PPT
                            </a>
                          )}
                          {errors.company_sample_ppt_file && (<div className="invalid-feedback">{errors.company_sample_ppt_file}</div>)}
                        </div>
                        <div className="col-md-12 mt-3 ">
                          <label className="form-label">Upload Video Url</label>
                          <div className="input-group row">
                            <div className="col-md-10">
                              <div className="custom-file">
                                <input
                                  type="url"
                                  className="form-control"
                                  name="company_video_second"
                                  value={user.company_info?.company_video_second || ""}
                                  onChange={handleChange}
                                />
                                <small>(https://www.youtube.com/c/w3schools)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12">
                          <label className="form-label">Company Brochure</label>
                          <input
                            type="file" className={`form-control ${errors.sample_file_id ? "is-invalid" : ""}`}
                            id="sample_file_id"
                            onChange={handleCompanyBrochureChange}
                          />
                          {user.company_info?.companySampleFile?.file && (
                            <a
                              href={`${ROOT_URL}/${user.company_info.companySampleFile.file}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View PDF
                            </a>
                          )}
                          {errors.sample_file_id && (<div className="invalid-feedback">{errors.sample_file_id}</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <button type="submit" className="btn btn-primary mt-3" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
        {/*end row*/}
      </div>
    </div>
  )
}

export default CompanyEdit