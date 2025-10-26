import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { showNotification } = useAlert();
  const [user, setUser] = useState({
    fname: "",
    lname: "",
    mobile: "",
    email: "",
    designation: "",
    state: "",
    city: "",
    zipcode: "",
    address: "",
    file: null,
  });
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/location/states`);
        setStates(res.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []);

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
      $('#state').off("change").select2('destroy');
      $('#city').off("change").select2('destroy');
    };
  }, [states, cities]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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
        setSelectedState(userData.state ?? '');
        setSelectedCity(userData.city ?? '');
        if (userData.state) {
          const ctRes = await axios.get(`${API_BASE_URL}/location/cities/${userData.state}`);
          setCities(ctRes.data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Profile fetch failed", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("user_token");
    try {
      await axios.post(`${API_BASE_URL}/signup/update-profile`, user, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Profile updated successfully!", 'success');
    } catch (err) {
      console.error("Update failed", err);
      showNotification("Error updating profile", 'error');
    }
  };

  if (!user) return <div className="text-center mt-5">Loading profile...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h4 className="pb-2">Profile Update</h4>
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-md-12">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        First Name<sup className="text-danger">*</sup>
                      </label>
                      <input
                        type="text"
                        name="fname"
                        value={user.fname || ""}
                        onChange={handleChange}
                        className={`form-control ${errors.fname ? 'is-invalid' : ''}`}
                        placeholder="Enter First Name"
                      />
                      {errors.fname && <div className="invalid-feedback">{errors.fname}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Last Name<sup className="text-danger">*</sup>
                      </label>
                      <input
                        type="text"
                        name="lname"
                        value={user.lname || ""}
                        onChange={handleChange}
                        className={`form-control ${errors.lname ? 'is-invalid' : ''}`}
                        placeholder="Enter Last Name"
                      />
                      {errors.lname && <div className="invalid-feedback">{errors.lname}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Moblie<sup className="text-danger">*</sup>
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        value={user.mobile || ""}
                        onChange={handleChange}
                        className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                        placeholder="Enter Mobile"
                      />
                      {errors.mobile && <div className="invalid-feedback">{errors.mobile}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Email<sup className="text-danger">*</sup>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={user.email || ""}
                        onChange={handleChange}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="Enter Email"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Designation</label>
                      <input
                        className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
                        list="browsers"
                        name="designation"
                        placeholder="Designation"
                        id="browser"
                        defaultValue=""
                      />
                      <datalist id="browsers">
                        <option value="Chairman" if=""></option>
                        <option value="Chief Executive Officer" if=""></option>
                        <option value="Chief Financial Officer" if=""></option>
                        <option value="Deputy Manager" if=""></option>
                        <option value="Designer" if=""></option>
                        <option value="Director" if=""></option>
                        <option value="Developer" if=""></option>
                      </datalist>
                      {errors.designation && <div className="invalid-feedback">{errors.designation}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="state" className="form-label required">State</label>
                      <select
                        id="state"
                        className={`form-control select2 ${errors.state ? "is-invalid" : ""}`}
                        value={selectedState}
                        onChange={handleStateChange}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="city" className="form-label required">City</label>
                      <select
                        id="city"
                        className={`form-control select2 ${errors.city ? "is-invalid" : ""}`}
                        value={selectedCity}
                        onChange={handleCityChange}
                      >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                      {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>
                    <div className="col-md-6 mt-3">
                      <label className="form-label">
                        Pincode<sup className="text-danger">*</sup>
                      </label>
                      <input
                        type="text"
                        name="zipcode"
                        value={user.zipcode || ""}
                        onChange={handleChange}
                        className={`form-control ${errors.zipcode ? 'is-invalid' : ''}`}
                        placeholder="Enter Pincode"
                      />
                      {errors.zipcode && <div className="invalid-feedback">{errors.zipcode}</div>}
                    </div>
                    <div className="row g-3 mt-2">
                      <div className="col-md-12">
                        <label className="form-label">
                          Address<sup className="text-danger">*</sup>
                        </label>
                        <textarea
                          name="address"
                          rows={3}
                          value={user.address || ""}
                          onChange={handleChange}
                          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                          placeholder="Enter Address"
                        />
                        {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                      </div>
                      <div className="col-md-12">
                        <label className="form-label">User Image</label>
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
                          />
                        ) : user.file ? (
                          <ImageWithFallback
                            src={`${ROOT_URL}/${user.file.file}`}
                            width={150}
                            height={150}
                            showFallback={false}
                          />
                        ) : null}
                      </div>
                    </div>
                    {/*end row*/}
                  </div>
                  <div className="text-end">
                    <button type="submit" className="btn btn-primary mt-3">
                      Save
                    </button>
                  </div>
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

export default ProfileEdit