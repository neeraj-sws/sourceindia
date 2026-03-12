import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
import { Suspense, lazy } from 'react';
const ImageWithFallback = lazy(() => import('../admin/common/ImageWithFallback'));
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
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState([]);
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");

  const countWords = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  };

  const handleCategorySelect = async (categoryId) => {
    let updatedCategories;

    if (selectedCategory.includes(categoryId)) {
      // If unchecking category
      updatedCategories = selectedCategory.filter(id => id !== categoryId);

      // Remove its subcategories from selectedSubCategory
      const subs = subCategoryMap[categoryId] || [];
      const subIds = subs.map(s => s.id);

      setSelectedSubCategory(prev =>
        prev.filter(id => !subIds.includes(id))
      );

      // Remove category from map
      setSubCategoryMap(prev => {
        const newMap = { ...prev };
        delete newMap[categoryId];
        return newMap;
      });

    } else {
      // If checking category
      updatedCategories = [...selectedCategory, categoryId];

      try {
        const res = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
          categories: [categoryId]
        });

        setSubCategoryMap(prev => ({
          ...prev,
          [categoryId]: res.data
        }));
      } catch (err) {
        console.error(err);
      }
    }

    setSelectedCategory(updatedCategories);
  };

  const handleSubCategorySelect = (subId) => {
    if (selectedSubCategory.includes(subId)) {
      setSelectedSubCategory(prev =>
        prev.filter(id => id !== subId)
      );
    } else {
      setSelectedSubCategory(prev =>
        [...prev, subId]
      );
    }
  };

  useEffect(() => {
    const fetchCoreActivities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/core_activities?is_delete=0`);
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

  useEffect(() => {
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
      const $core_activity = $('#core_activity');
      const $activity = $('#activity');
      if ($core_activity.data('select2')) { $core_activity.select2('destroy'); }
      if ($activity.data('select2')) { $activity.select2('destroy'); }
    };
  }, [coreActivities, activities]);

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
          const map = {};

          for (const catId of categoryArray) {
            try {
              const res = await axios.post(`${API_BASE_URL}/sub_categories/categories`, {
                categories: [catId]
              });
              map[catId] = res.data;
            } catch (err) {
              console.error(err);
            }
          }

          setSubCategoryMap(map);

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

    // 📝 1500 words limit for Company Introduction
    if (name === "brief_company") {
      const words = countWords(value);

      if (words > 1500) {
        setErrors(prev => ({
          ...prev,
          brief_company: "Company Introduction cannot exceed 1500 words"
        }));
        return; // ❌ stop update
      } else {
        setErrors(prev => ({
          ...prev,
          brief_company: ""
        }));
      }
    }

    // 📌 Check if field belongs to company_info
    if (user.company_info && name in user.company_info) {
      setUser((prev) => ({
        ...prev,
        company_info: {
          ...prev.company_info,
          [name]: files ? files[0] : value,
        },
      }));
    } else {
      // 📌 Fields directly under user
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
    // Sub category
    if (!selectedSubCategory.length)
      errs.sub_category = "Sub category is required";

    // Category Sell
    if (!selectedCategory.length)
      errs.category_sell = "At least one category is required";

    // Company Introduction
    if (!user.company_info?.brief_company?.trim())
      errs.brief_company = "Company introduction is required";
    else if (user.company_info.brief_company.length > 1500)
      errs.brief_company = "Company introduction must not exceed 1500 characters";

    // File validation (optional)
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file) {
      if (!allowedImageTypes.includes(file.type))
        errs.file = "Invalid image format (only JPG/JPEG/PNG/GIF/WEBP allowed)";
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
      formData.append("categories", selectedCategory.join(","));
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
    <>
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
                            <label className="form-label required">Select Category & Sub Category</label>
                            <button
                              type="button"
                              className="btn btn-outline-primary w-100"
                              onClick={() => setShowCategoryModal(true)}
                            >
                              Category Picker
                            </button>
                            {selectedCategory.length > 0 && (
                              <small className="text-success">
                                {selectedCategory.length} Category Selected
                              </small>
                            )}
                            {errors.category_sell && (
                              <div className="text-danger small">{errors.category_sell}</div>
                            )}
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
                                loading="lazy"
                                decoding="async"
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
                            <p className="pt-3">
                              Total Words Limit <span className="about">1500</span> |
                              Used: <strong>{countWords(user.company_info?.brief_company || "")}</strong>
                            </p>

                            {errors.brief_company && (
                              <div className="text-danger small mt-1">{errors.brief_company}</div>
                            )}

                          </div>
                          <div className="col-md-12 mt-3">
                            <label className="form-label">Ppt file</label>
                            <input
                              type="file"
                              className={`form-control ${errors.company_sample_ppt_file ? "is-invalid" : ""}`}
                              id="company_sample_ppt_file"
                              accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                              onChange={handleCompanyFileChange}
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
      {showCategoryModal && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Select Category & Sub Category</h5>
                <button className="btn-close" onClick={() => setShowCategoryModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* LEFT CATEGORY */}
                  <div className="col-12">
                    <input type="text" className="form-control mb-3" placeholder="Search Category" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {categories.filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat.id} className="mb-2">
                          <div className="form-check">
                            <input id={`category-${cat.id}`} type="checkbox" className="form-check-input" checked={selectedCategory.includes(cat.id)} onChange={() => handleCategorySelect(cat.id)} />
                            <label htmlFor={`category-${cat.id}`} className="form-check-label fw-bold">
                              {cat.name}
                            </label>
                          </div>
                          {/* Subcategories under selected category */}
                          {selectedCategory.includes(cat.id) && (
                            <div className="ms-4 mt-1 category-subcategory">
                              {(subCategoryMap[cat.id] || []).map(sub => (
                                <div key={sub.id} className="form-check mb-1">
                                  <input id={`subcategory-inline-${sub.id}`} type="checkbox" className="form-check-input" checked={selectedSubCategory.includes(sub.id)} onChange={() => handleSubCategorySelect(sub.id)} />
                                  <label htmlFor={`subcategory-inline-${sub.id}`} className="form-check-label">
                                    {sub.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* RIGHT SUBCATEGORY */}
                  <div className="col-4 d-none">
                    <input type="text" className="form-control mb-3" placeholder="Search Subcategory" value={subCategorySearch} onChange={(e) => setSubCategorySearch(e.target.value)} />
                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {selectedCategory.map(catId => {
                        const cat = categories.find(c => c.id === catId); const subs = subCategoryMap[catId] || []; if (!subs.length) return null; return (
                          <div key={catId} className="mb-3">
                            <div className="fw-bold border-bottom pb-1 mb-2">
                              {cat?.name}
                            </div>
                            {subs.filter(sub => sub.name.toLowerCase().includes(subCategorySearch.toLowerCase())).map(sub => (
                              <div key={sub.id} className="form-check mb-2">
                                <input id={`subcategory-${sub.id}`} type="checkbox" className="form-check-input" checked={selectedSubCategory.includes(sub.id)} onChange={() => handleSubCategorySelect(sub.id)} />
                                <label htmlFor={`subcategory-${sub.id}`} className="form-check-label">
                                  {sub.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => setShowCategoryModal(false)} >Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CompanyEdit