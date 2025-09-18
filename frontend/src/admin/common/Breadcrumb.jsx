import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ mainhead = null, maincount = null, page, title, add_button = null, add_link = "", onClick = null, actions = null }) => {
  return (
    <div>
      {mainhead && (
        <h4 className="mb-0 mainheading d-flex align-items-center">
          {mainhead} <span className="badge badge-soft-primary ms-2">{maincount}</span>
        </h4>
      )}
      <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
        <div className="breadcrumb-title"> <Link to="/admin">Home</Link>
          <i className="lni lni-chevron-right px-1"></i></div>
        <div className="ps-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 p-0 align-items-center">
              {page && (
                <li className="breadcrumb-item">
                  {page}
                </li>
              )}
              <li className="breadcrumb-item active pt-1" aria-current="page">{title}</li>
            </ol>
          </nav>
        </div>
        <div className="ms-auto">
          {actions ? actions : ''}
          {add_button ? onClick ? (
            <button type="button" className={`btn btn-sm btn-primary mb-2 ${actions ? "me-2" : ""}`} onClick={onClick}>
              {add_button}
            </button>
          ) : (
            <Link type="button" className={`btn btn-sm btn-primary mb-2 ${actions ? "me-2" : ""}`} to={add_link}>
              {add_button}
            </Link>
          ) : ''}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
