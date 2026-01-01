import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from "axios";
import API_BASE_URL from "../../config";
import Breadcrumb from '../common/Breadcrumb';
import { formatDateTime } from '../../utils/formatDate';

const UserActivityDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_fname: '', user_lname: '', user_status: '', user_is_seller: '', user_updated_at: '',
    user_activity: []
  });

  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/user_activity/user_id/${userId}`);
        const data = res.data;
        setFormData({
          user_fname: data.user_fname || '',
          user_lname: data.user_lname || '',
          user_status: data.user_status || '',
          user_is_seller: data.user_is_seller || '',
          user_updated_at: data.user_updated_at || '',
          user_activity: data.user_activity || [],
        });
      } catch (error) {
        console.error('Error fetching Activity Details:', error);
      }
    };
    fetchActivityDetails();
  }, [userId]);

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="User Activities" title="User Activity Details" add_button="Back" add_link="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} />
          <div className="row">
            <div className="col mb-3">
              <div className="card radius-10 overflow-hidden  border border-blue">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <strong className="mb-0">Full Name</strong>
                      <p className="mb-0">{formData.user_fname} {formData.user_lname}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col mb-3">
              <div className="card radius-10 overflow-hidden border border-blue">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <strong className="mb-0">Status</strong>
                      <p className="mb-0">{formData.user_status ? formData.user_status == 1 ? "Active" : "Inactive" : ""}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col mb-3">
              <div className="card radius-10 overflow-hidden border border-blue">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <strong className="mb-0">Is Seller</strong>
                      <p className="mb-0">
                        <span className="badge bg-primary">{formData.user_status ? formData.user_is_seller == 1 ? "Seller" : "Buyer" : ""}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col mb-3">
              <div className="card radius-10 overflow-hidden border border-blue">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <strong className="mb-0">Last Updated</strong>
                      <p className="mb-0">{formatDateTime(formData.user_updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mb-3">
            <div className="card-body">
              <table className="table table-striped table-bordered table-responsive dataTable mt-2">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Is Side</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.user_activity && formData.user_activity.map((row) => (
                    <tr key={row.id}>
                      <td>{row.type}</td>
                      <td>{row.is_side}</td>
                      <td>{formatDateTime(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserActivityDetails