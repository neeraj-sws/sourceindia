import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from "axios";
import API_BASE_URL from "../../config";
import $ from 'jquery'
import Breadcrumb from '../common/Breadcrumb';

const EmailCircularDetails = () => {
  const { newsletterId } = useParams();
  const tableRef = useRef(null)
  const [emailCircular, setEmailCircular] = useState([])
  const dataTableRef = useRef(null)
  const [formData, setFormData] = useState({ user_type: '', title: '', subject: '', description: '' });

  useEffect(() => {
    const fetchNewsletter = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/newsletters/${newsletterId}`);
        const data = res.data;
        setFormData({
          user_type: data.user_type || '',
          title: data.title || '',
          subject: data.subject || '',
          description: data.description || '',
          images: data.images || [],
        });
      } catch (error) {
        console.error('Error fetching Newsletter:', error);
      }
    };
    fetchNewsletter();
  }, [newsletterId]);

  useEffect(() => {
    const mockData = [
      { id: 1, user_name: 'Tiger Nixon' },
      { id: 2, user_name: 'Garrett Winters' },
      { id: 3, user_name: 'Ashton Cox' },
      { id: 4, user_name: 'fdsf' },
      { id: 5, user_name: 'yuiyu' },
      { id: 6, user_name: 'qwerw' },
      { id: 7, user_name: 'bvfhf' },
      { id: 8, user_name: 'yuiy' },
      { id: 9, user_name: 'zsds' },
      { id: 10, user_name: 'myhjkuy' },
      { id: 11, user_name: 'qweerq' },
      { id: 12, user_name: 'yut' },
      { id: 13, user_name: 'pioiu' },
      { id: 14, user_name: 'ljkyh' },
      { id: 15, user_name: 'sds' },
    ]
    setEmailCircular(mockData)
  }, [])

  useEffect(() => {
    if (tableRef.current && !dataTableRef.current) {
      dataTableRef.current = $(tableRef.current).DataTable({
        columnDefs: [
          { targets: [-1, -2, -3], orderable: false, searchable: false }
        ],
      })
    }
  }, [])

  useEffect(() => {
    const table = dataTableRef.current
    if (!table) return
    table.clear()
    emailCircular.forEach((email_circular, index) => {
      table.row.add([
        index + 1,
        email_circular.user_name,
        `<button class="btn btn-success btn-sm">Yes</button>`,
        `<button class="btn btn-danger btn-sm">No</button>`,
        `<button class="btn btn-primary btn-sm btn-sm">Resend</button>`,
      ])
    })
    table.draw()
  }, [emailCircular])

  return (
    <>
      <div className="page-wrapper">
        <div className="page-content">
          <Breadcrumb page="Settings" title="Email Circular Details" add_button="Back" add_link="/admin/email_circular" />
          <div className="card mb-3">
            <div className="card-body">
              <h2>{formData.subject}</h2>
              <div dangerouslySetInnerHTML={{ __html: formData.description }} />
            </div>
          </div>

          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4">
            <div className="col">
              <div className="card radius-10 mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">All Users</p>
                      <h4 className="my-1">191</h4>
                    </div>
                    <div className="widgets-icons bg-light-success text-success ms-auto">
                      <i className="bx bxs-user" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card radius-10 mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">Sent Mail</p>
                      <h4 className="my-1">191</h4>
                    </div>
                    <div className="widgets-icons bg-light-info text-info ms-auto">
                      <i className="bx bx-mail-send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card radius-10 mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">Un Sent Mail</p>
                      <h4 className="my-1">0</h4>
                    </div>
                    <div className="widgets-icons bg-light-danger text-danger ms-auto">
                      <i className="bx bx-mail-send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card radius-10 mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">Open Mail</p>
                      <h4 className="my-1">0</h4>
                    </div>
                    <div className="widgets-icons bg-light-warning text-warning ms-auto">
                      <i className="bx bx-mail-send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card radius-10 mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div>
                      <p className="mb-0 text-secondary">Not Open Mail</p>
                      <h4 className="my-1">191</h4>
                    </div>
                    <div className="widgets-icons bg-light-warning text-primary ms-auto">
                      <i className="bx bx-mail-send" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table ref={tableRef} className="table table-striped table-bordered" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User Name</th>
                  <th>Is Mail Sent</th>
                  <th>Is Mail Open</th>
                  <th>Resend Mail</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default EmailCircularDetails