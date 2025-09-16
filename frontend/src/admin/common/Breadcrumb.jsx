import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ page, title, add_button = null, add_link = "", onClick = null, actions = null }) => {
  return (
    <div className="page-breadcrumb d-none d-sm-flex align-items-center mb-3">
      <div className="breadcrumb-title pe-3">{page}</div>
      <div className="ps-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 p-0">
            <li className="breadcrumb-item">
              <Link to="/admin"><i className="bx bx-home-alt" /></Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">{title}</li>
          </ol>
        </nav>
      </div>
      <div className="ms-auto">
      {actions ? actions : ''}
      {add_button ? onClick ? (
        <button type="button" className={`btn btn-sm btn-primary mb-2 ${actions ? "me-2":""}`} onClick={onClick}>
          {add_button}
        </button>
      ) : (
        <Link type="button" className={`btn btn-sm btn-primary mb-2 ${actions ? "me-2":""}`} to={add_link}>
          {add_button}
        </Link>
      ) : ''}
      </div>
    </div>
  );
};

export default Breadcrumb;
