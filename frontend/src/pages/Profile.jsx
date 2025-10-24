import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL, { ROOT_URL } from "./../config";
import ImageWithFallback from "../admin/common/ImageWithFallback";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/signup/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    navigate('/login');
  };

  if (!user) return <div className="text-center mt-5">Loading profile...</div>;

  return (
    <div className="page-wrapper">
      <div className="page-content">
      {/*end breadcrumb*/}
      <div className="container">
        <div className="main-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-column align-items-center text-center">
                    <ImageWithFallback
                      src={user.file && `${ROOT_URL}/${user.file.file}`}
                      width={110}
                      height={110}
                      showFallback={true}
                      className="rounded-circle"
                    />
                    <div className="mt-3">
                      <h4>{user.fname} {user.lname}</h4>
                      <Link to="#" className="mb-1">{user.email}</Link>
                      <p className="text-muted font-size-sm">
                        {user.mobile}
                      </p>
                      <Link to="#" className="text-danger mb-1">Change Password <i className="bx bx-key" /></Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card">
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="edit_btn d-flex text-end justify-content-between align-items-center border-bottom pb-2">
                        <h5 className="mb-0 text-primary">Profile</h5>
                        <Link to="/profile-edit" className="py-1 btn btn-sm btn-primary">
                          <i className="lni lni-pencil-alt me-1" /> User Profile
                        </Link>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Name</h6>
                      <p>{user.fname} {user.lname}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Email</h6>
                      <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Mobile</h6>
                      <p>{user.mobile}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Designation</h6>
                      <p>{user.company_info?.designation}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>State</h6>
                      <p>{user.state_data?.name}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>City</h6>
                      <p>{user.city_data?.name}</p>
                      </div>
                    </div>
                    <div className="col-sm-12">
                      <div className="pt-3 border-bottom">
                      <h6>Address</h6>
                      <p>{user.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {user.company_info && (
            <div className="col-lg-12 mt-3">
              <div className="card">
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-sm-12">
                      <div className="edit_btn d-flex text-end justify-content-between align-items-center border-bottom pb-2">
                        <h5 className="mb-0 text-primary">Company Information</h5>
                        <Link to="/company-edit" className="py-1 btn btn-sm btn-primary">
                          <i className="lni lni-pencil-alt me-1" /> Company Profile
                        </Link>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Organization Name</h6>
                      <p>{user.company_info?.organization_name}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Core Activities</h6>
                      <p>{user.company_info?.CoreActivity?.name}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Activity</h6>
                      <p>{user.company_info?.Activity?.name}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Category</h6>
                      <p>{user.company_info?.category_sell_names}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Sub Category</h6>
                      <p>{user.company_info?.sub_category_names}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Company Website</h6>
                      <p>{user.company_info?.company_website}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Company Location</h6>
                      <p>{user.company_info?.company_location}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Company Brochure</h6>
                      <a href={user.company_info?.companySamplePptFile ? `${ROOT_URL}/${user.company_info.companySamplePptFile.file}` : "#"}>
                      Download File
                      </a>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="pt-3 border-bottom">
                      <h6>Company Logo</h6>
                      <ImageWithFallback
                        src={user.company_info?.companyLogo ? `${ROOT_URL}/${user.company_info.companyLogo.file}` : ""}
                        width={150}
                        height={150}
                        showFallback={true}
                      />
                      </div>
                    </div>
                    <div className="col-sm-12">
                      <div className="pt-3 border-bottom">
                      <h6>Company Introduction</h6>
                      <p>{user.company_info?.organizations_product_description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Profile;
