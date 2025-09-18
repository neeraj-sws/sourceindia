import React from 'react';
import Breadcrumb from '../common/Breadcrumb';
import AboutStatusForm from '../forms/about/AboutStatusForm';
import AnniversaryForm from '../forms/about/AnniversaryForm';
import AboutSourceIndiaForm from '../forms/about/AboutSourceIndiaForm';
import CounterSectionForm from '../forms/about/CounterSectionForm';
import VisionForm from '../forms/about/VisionForm';
import MissionStatementForm from '../forms/about/MissionStatementForm';
import ValuesForm from '../forms/about/ValuesForm';

const AboutSettings = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Breadcrumb page="Settings" title="About Settings" />
        <div className="col-xl-12 mx-auto">
          <div className='card mb-4'>
            <div className='card-body py-0 px-2'>
              <ul className="nav nav-pills customnavbar" role="tablist">
                <li className="nav-item" role="presentation">
                  <a className="nav-link active" data-bs-toggle="pill" href="#primary-pills-status" role="tab" aria-selected="true">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-check font-18 me-1" /></div>
                      <div className="tab-title">About Status</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-anniversary" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-gift font-18 me-1" /></div>
                      <div className="tab-title">Anniversary</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-source" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-info-circle font-18 me-1" /></div>
                      <div className="tab-title">About Source India</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-counter" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-layer font-18 me-1" /></div>
                      <div className="tab-title">Counter Section</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-vision" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-show font-18 me-1" /></div>
                      <div className="tab-title">Vision</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-mission" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-bullseye font-18 me-1" /></div>
                      <div className="tab-title">Mission Statement</div>
                    </div>
                  </a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" data-bs-toggle="pill" href="#primary-pills-values" role="tab" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <div className="tab-icon"><i className="bx bx-list-check font-18 me-1" /></div>
                      <div className="tab-title">Values</div>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="tab-content" id="pills-tabContent">
                <div className="tab-pane fade show active" id="primary-pills-status" role="tabpanel">
                  <AboutStatusForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-anniversary" role="tabpanel">
                  <AnniversaryForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-source" role="tabpanel">
                  <AboutSourceIndiaForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-counter" role="tabpanel">
                  <CounterSectionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-vision" role="tabpanel">
                  <VisionForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-mission" role="tabpanel">
                  <MissionStatementForm />
                </div>
                <div className="tab-pane fade" id="primary-pills-values" role="tabpanel">
                  <ValuesForm />
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

export default AboutSettings