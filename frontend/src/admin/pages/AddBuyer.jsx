import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Breadcrumb from '../common/Breadcrumb';
import ImageWithFallback from "../common/ImageWithFallback";
import API_BASE_URL, { ROOT_URL } from "../../config";
import { useAlert } from "../../context/AlertContext";
import "select2/dist/css/select2.min.css";
import "select2";
import "select2-bootstrap-theme/dist/select2-bootstrap.min.css";

const AddBuyer = () => {
  const { showNotification } = useAlert();
  const { buyerId } = useParams();
  const isEditing = Boolean(buyerId);
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [formData, setFormData] = useState({
    fname: '', lname: '', email: '', password: '', mobile: '', zipcode: '', user_company: '', website: '', is_trading: '',
    elcina_member: '', user_category: '', address: '', products: '', file: null, company_file: null
  });
  const [file, setFile] = useState(null);
  const [companyFile, setCompanyFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
      setSelectedState('');
      setCities([]);
      setSelectedCity('');
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
      setSelectedCity('');
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
  };

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

    return () => {
      $('#country').off("change").select2('destroy');
      $('#state').off("change").select2('destroy');
      $('#city').off("change").select2('destroy');
    };
  }, [countries, states, cities]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCompanyFileChange = (e) => {
    setCompanyFile(e.target.files[0]);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.fname.trim()) errs.fname = 'First Name is required';
    if (!formData.lname.trim()) errs.lname = 'Last Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email format';
    if (!isEditing) {
      if (!formData.password || !formData.password.trim()) {
        errs.password = "Password is required";
      } else if (formData.password.trim().length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
    }
    if (!formData.mobile.trim()) errs.mobile = 'Mobile is required';
    else if (!/^[6-9]\d{9}$/.test(formData.mobile)) errs.mobile = "Mobile Number is invalid";
    if (!selectedCountry) errs.country = 'Country is required';
    if (!selectedState) errs.state = 'State is required';
    if (!selectedCity) errs.city = 'City is required';
    if (!formData.zipcode) errs.zipcode = 'Post Code is required';
    if (!formData.user_company) errs.user_company = 'Company Name is required';
    // if (!formData.website) errs.website = 'Website is required';
    // if (!formData.is_trading) errs.is_trading = 'Trader is required';
    if (!formData.elcina_member) errs.elcina_member = 'ELCINA Member is required';
    // if (!formData.user_category) errs.user_category = 'User Category is required';
    if (!formData.address) errs.address = 'Address is required';
    // if (!formData.products) errs.products = 'Products is required';

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (!file && !isEditing) {
      errs.file = 'Profile image is required';
    } else if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        errs.file = 'Invalid image format (only JPG/PNG allowed)';
      } else if (file.size > maxSize) {
        errs.file = 'Image size must be under 2MB';
      }
    }
    if (!companyFile && !isEditing) {
      errs.company_file = 'Company image is required';
    } else if (companyFile) {
      if (!allowedImageTypes.includes(companyFile.type)) {
        errs.company_file = 'Invalid image format (only JPG/PNG allowed)';
      } else if (companyFile.size > maxSize) {
        errs.company_file = 'Image size must be under 2MB';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (!isEditing) return;

    const fetchBuyer = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/buyers/${buyerId}`);
        const data = res.data;
        setFormData({
          fname: data.fname || '',
          lname: data.lname || '',
          email: data.email || '',
          password: '',
          mobile: data.mobile || '',
          zipcode: data.zipcode || '',
          user_company: data.user_company || '',
          website: data.website || '',
          is_trading: String(data.is_trading),
          elcina_member: String(data.elcina_member),
          user_category: data.user_category || '',
          address: data.address || '',
          products: data.products || '',
          file_name: data.file_name || '',
          company_file_name: data.company_file_name || '',
        });

        setSelectedCountry(data.country || '');
        setSelectedState(data.state || '');
        setSelectedCity(data.city || '');

        if (data.country) {
          const stRes = await axios.get(`${API_BASE_URL}/location/states/${data.country}`);
          setStates(stRes.data);
        }
        if (data.state) {
          const ctRes = await axios.get(`${API_BASE_URL}/location/cities/${data.state}`);
          setCities(ctRes.data);
        }
      } catch (error) {
        console.error('Error fetching buyer:', error);
      }
    };

    fetchBuyer();
  }, [buyerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    data.append('country', selectedCountry);
    data.append('state', selectedState);
    data.append('city', selectedCity);

    if (file) data.append('file', file);
    if (companyFile) data.append('company_file', companyFile);

    try {
      const endpoint = isEditing ? `${API_BASE_URL}/buyers/${buyerId}` : `${API_BASE_URL}/buyers`;
      const method = isEditing ? 'put' : 'post';

      await axios[method](endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification(`Buyer ${isEditing ? 'updated' : 'added'} successfully!`, "success");
      if (!isEditing) { navigate('/admin/buyers'); }
    } catch (error) {
      console.error('Error saving buyer:', error);
      showNotification(`Failed to ${isEditing ? 'update' : 'add'} buyer`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Buyers" title={isEditing ? "Edit Buyer" : "Add Buyer"} add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
        <div className="row">
          <div className="col-xl-12 mx-auto">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="card mb-2">
                <div className='card-header py-3 px-2 bg-white'>
                  <h6 className="mb-0 fw-bold">Basic Information</h6>
                </div>
                <div className="card-body mb-3">
                  <div className='row'>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="fname" className="form-label required">First Name</label>
                      <input type="text" className={`form-control ${errors.fname ? 'is-invalid' : ''}`} id="fname"
                        placeholder="First Name" value={formData.fname} onChange={handleInputChange} />
                      {errors.fname && <div className="invalid-feedback">{errors.fname}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lname" className="form-label required">Last Name</label>
                      <input type="text" className={`form-control ${errors.lname ? 'is-invalid' : ''}`} id="lname"
                        placeholder="Last Name" value={formData.lname} onChange={handleInputChange} />
                      {errors.lname && <div className="invalid-feedback">{errors.lname}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label htmlFor="email" className="form-label required">Email</label>
                      <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} id="email"
                        placeholder="Email" value={formData.email} onChange={handleInputChange} />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                    {!isEditing &&
                      <div className="col-md-4 mb-3">
                        <label htmlFor="password" className="form-label required">Password</label>
                        <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} id="password"
                          placeholder="Password" value={formData.password} onChange={handleInputChange} />
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      </div>
                    }
                    <div className="col-md-4 mb-3">
                      <label htmlFor="mobile" className="form-label required">Mobile</label>
                      <input type="text" className={`form-control ${errors.mobile ? 'is-invalid' : ''}`} id="mobile"
                        placeholder="Mobile" value={formData.mobile} onChange={handleInputChange} />
                      {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
                    </div>
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
                      <input type="number" className={`form-control ${errors.zipcode ? 'is-invalid' : ''}`} id="zipcode"
                        placeholder="Post Code" value={formData.zipcode} onChange={handleInputChange} />
                      {errors.zipcode && <div className="invalid-feedback">{errors.zipcode}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="file" className="form-label required">Image</label>
                      <input className={`form-control ${errors.file ? 'is-invalid' : ''}`} type="file"
                        id="file" onChange={handleFileChange} />
                      {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                      {file ? (
                        <img
                          src={URL.createObjectURL(file)}
                          className="img-preview object-fit-cover mt-3"
                          width={150}
                          height={150}
                          alt="Preview"
                          loading="lazy"
                          decoding="async"
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
                    <div className="col-md-6">
                      <label htmlFor="user_category" className="form-label">User Category</label>
                      <select
                        id="user_category" className="form-control"
                        value={formData.user_category}
                        onChange={handleInputChange}
                      >
                        <option value="">Select User Category</option>
                        <option value="brand" selected="">Brand</option>
                        <option value="ems">EMS</option>
                        <option value="oem">OEM</option>
                        <option value="component manufacturer">Component Manufacturer</option>
                      </select>
                      {/* {errors.user_category && (<div className="invalid-feedback">{errors.user_category}</div>)} */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className='card-header py-3 px-2 bg-white'>
                  <h6 className="mb-0 fw-bold">Company Information</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="user_company" className="form-label required">Company Name</label>
                      <input type="text" className={`form-control ${errors.user_company ? 'is-invalid' : ''}`} id="user_company"
                        placeholder="Company Name" value={formData.user_company} onChange={handleInputChange} />
                      {errors.user_company && <div className="invalid-feedback">{errors.user_company}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="website" className="form-label">Website</label>
                      <input type="url" className="form-control" id="website"
                        placeholder="Website" value={formData.website} onChange={handleInputChange} />
                      {/* {errors.website && <div className="invalid-feedback">{errors.website}</div>} */}
                    </div>

                    <div className="col-md-3 mb-3">
                      <label htmlFor="is_trading" className="form-label">Trader</label>
                      <select id="is_trading" className="form-control"
                        value={formData.is_trading} onChange={handleInputChange}>
                        <option value="">Select Trader</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                      {/* {errors.is_trading && <div className="invalid-feedback">{errors.is_trading}</div>} */}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label htmlFor="elcina_member" className="form-label required">ELCINA Member</label>
                      <select id="elcina_member" className={`form-select ${errors.elcina_member ? 'is-invalid' : ''}`}
                        value={formData.elcina_member} onChange={handleInputChange}>
                        <option value="">Select Member</option>
                        <option value="1">Yes</option>
                        <option value="2">No</option>
                        <option value="3">Not Sure</option>
                      </select>
                      {errors.elcina_member && <div className="invalid-feedback">{errors.elcina_member}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="company_file" className="form-label required">Company Image</label>
                      <div className=''>
                        <input className={`w-75 float-start form-control ${errors.company_file ? 'is-invalid' : ''}`} type="file"
                          id="company_file" onChange={handleCompanyFileChange} />
                        {errors.company_file && <div className="invalid-feedback">{errors.company_file}</div>}
                        {companyFile ? (
                          <img
                            src={URL.createObjectURL(companyFile)}
                            className="object-fit-cover float-end"
                            width={100}
                            height={80}
                            alt="Preview"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : formData.file_name ? (
                          <ImageWithFallback
                            src={`${ROOT_URL}/${formData.company_file_name}`}
                            className="bject-fit-cover ms-2"
                            width={100}
                            height={100}
                            showFallback={false}
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="address" className="form-label required">
                        Address
                      </label>
                      <textarea
                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                        id="address"
                        placeholder="Address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="products" className="form-label">Products</label>
                      <textarea
                        className="form-control"
                        id="products"
                        placeholder="Products"
                        rows={3}
                        defaultValue={formData.products}
                        onChange={handleInputChange}
                      />
                      {/* {errors.products && <div className="invalid-feedback">{errors.products}</div>} */}
                    </div>
                    <div className="col-md-12 text-end">
                      <button type="submit" className="btn btn-primary px-4 mt-4">
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

          </div>
        </div>
      </div>
    </div>
  )
}

export default AddBuyer