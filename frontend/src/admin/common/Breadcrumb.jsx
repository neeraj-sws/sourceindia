import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ mainhead = null, maincount = null, page, title, add_button = null, add_link = "", onClick = null, actions = null }) => {
  return (
    <div className='d-flex align-items-center justify-content-between mb-2'>
      <div>
        {mainhead && (
          <h4 className="mb-0 mainheading d-flex align-items-center mb-1">
            {mainhead}{" "}
            {maincount > 0 && (
              <span className="badge badge-soft-primary ms-2">{maincount}</span>
            )}
          </h4>
        )}
        <div className="page-breadcrumb d-none d-sm-flex align-items-top mb-3">
          {title && (
            <div className="breadcrumb-title">
              <Link to="/admin">Home</Link>
              <i className="lni lni-chevron-right px-1"></i>
            </div>
          )}
          <div className="ps-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0 p-0 align-items-top">
                {page && (
                  <li className="breadcrumb-item">
                    {page}
                  </li>
                )}
                <li className="breadcrumb-item active" aria-current="page">{title}</li>
              </ol>
            </nav>
          </div>


        </div>
      </div>
      <div className="ms-auto">
        {actions ? actions : ''}
        {add_button ? onClick ? (
          <button
            type="button"
            className={`btn btn-primary mb-2 ${actions ? "me-2" : ""}`}
            onClick={onClick}
          >
            {/* <i
              className={`fadeIn animated bx ${add_button.toLowerCase() === "back"
                ? "bx-arrow-back me-1"
                : "bx-message-square-add me-2"
                }`}
            ></i>{" "} */}
            {add_button}
          </button>
        ) : (
          <Link
            type="button"
            className={`btn btn-primary mb-2 ${actions ? "me-2" : ""}`}
            to={add_link}
          >
            {/* <i
              className={`fadeIn animated bx ${add_button.toLowerCase() === "back"
                ? "bx-arrow-back me-1"
                : "bx-message-square-add me-2"
                }`}
            ></i>{" "} */}
            {add_button}
          </Link>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Breadcrumb;
