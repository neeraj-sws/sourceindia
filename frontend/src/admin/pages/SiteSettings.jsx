import React from 'react';
import Breadcrumb from '../common/Breadcrumb';
import SystemSettingsForm from '../forms/site/SystemSettingsForm';
import ChangePasswordForm from '../forms/site/ChangePasswordForm';
import MetaSettingsForm from '../forms/site/MetaSettingsForm';
import EmailSettingsForm from '../forms/site/EmailSettingsForm';
import SmsSettingsForm from '../forms/site/SmsSettingsForm';

const SiteSettings = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Settings" title="Site Settings" />
          <div className="col-xl-12 mx-auto">        
            <div className="card">
              <div className="card-body">
                <ul className="nav nav-pills mb-3" role="tablist">
                  <li className="nav-item" role="presentation">
                    <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-system" role="tab" aria-selected="true">
                      <div className="d-flex align-items-center">
                        <div className="tab-icon"><i className="bx bx-folder font-18 me-1" /></div>
                        <div className="tab-title">System Settings</div>
                      </div>
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-password" role="tab" aria-selected="false">
                      <div className="d-flex align-items-center">
                        <div className="tab-icon"><i className="bx bx-key font-18 me-1" /></div>
                        <div className="tab-title">Change Password</div>
                      </div>
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-meta" role="tab" aria-selected="false">
                      <div className="d-flex align-items-center">
                        <div className="tab-icon"><i className="bx bx-cog font-18 me-1" /></div>
                        <div className="tab-title">Meta Settings</div>
                      </div>
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-email" role="tab" aria-selected="false">
                      <div className="d-flex align-items-center">
                        <div className="tab-icon"><i className="bx bx-at font-18 me-1" /></div>
                        <div className="tab-title">Email Settings</div>
                      </div>
                    </a>
                  </li>
                  <li className="nav-item" role="presentation">
                    <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-sms" role="tab" aria-selected="false">
                      <div className="d-flex align-items-center">
                        <div className="tab-icon"><i className="bx bx-message font-18 me-1" /></div>
                        <div className="tab-title">SMS Settings</div>
                      </div>
                    </a>
                  </li>
                </ul>
                <div className="tab-content" id="pills-tabContent">
                  <div className="tab-pane fade show active" id="primary-pills-system" role="tabpanel">
                    <SystemSettingsForm />
                  </div>
                  <div className="tab-pane fade" id="primary-pills-password" role="tabpanel">
                    <ChangePasswordForm />
                  </div>
                  <div className="tab-pane fade" id="primary-pills-meta" role="tabpanel">
                    <MetaSettingsForm />
                  </div>
                  <div className="tab-pane fade" id="primary-pills-email" role="tabpanel">
                    <EmailSettingsForm />
                  </div>
                  <div className="tab-pane fade" id="primary-pills-sms" role="tabpanel">
                    <SmsSettingsForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/*end row*/}
      </div>
    </div>
  )
}

export default SiteSettings