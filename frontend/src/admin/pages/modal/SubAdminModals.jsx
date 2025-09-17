import React from "react";
import SearchDropdown from "../../common/SearchDropdown";

const SubAdminModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  roles,
  handleChange,
  handleSelectChange,
  handleSubmit,

  // Delete modal
  showDeleteModal,
  closeDeleteModal,
  handleDeleteConfirm,

  // Status modal
  showStatusModal,
  statusToggleInfo,
  closeStatusModal,
  handleStatusConfirm,
}) => {
  return (
    <>
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="add-update-form modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? "Edit Sub Admin" : "Add Sub Admin"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="name" className="form-label required">Name</label>
                    <input
                      type="text"
                      className={`form-control ${ errors.name ? "is-invalid" : "" }`}
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Name"
                    />
                    {errors.name && ( <div className="invalid-feedback">{errors.name}</div> )}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="mobile" className="form-label required">Mobile</label>
                    <input
                      type="text"
                      className={`form-control ${ errors.mobile ? "is-invalid" : "" }`}
                      id="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Mobile"
                    />
                    {errors.mobile && ( <div className="invalid-feedback">{errors.mobile}</div> )}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="email" className="form-label required">Email</label>
                    <input
                      type="email"
                      className={`form-control ${ errors.email ? "is-invalid" : "" }`}
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                    />
                    {errors.email && ( <div className="invalid-feedback">{errors.email}</div> )}
                  </div>
                  {!isEditing &&
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="password" className="form-label required">Password</label>
                    <input
                      type="text"
                      className={`form-control ${ errors.password ? "is-invalid" : "" }`}
                      id="password"
                      value={formData.password || ""}
                      onChange={handleChange}
                      placeholder="Password"
                    />
                    {errors.password && ( <div className="invalid-feedback">{errors.password}</div> )}
                  </div>
                  }
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="role" className="form-label required">Role</label>
                    <SearchDropdown
                      id="role"
                      options={roles?.map(role => ({ value: role.id, label: role.name }))}
                      value={formData.role}
                      onChange={handleSelectChange("role")}
                      placeholder="Select role"                      
                    />
                    {errors.role && ( <div className="invalid-feedback">{errors.role} </div>
                    )}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="status" className="form-label required">Status</label>
                    <select
                      id="status"
                      className={`form-select ${ errors.status ? "is-invalid" : "" }`}
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                    {errors.status && ( <div className="invalid-feedback">{errors.status}</div>
                    )}
                  </div>
                  <div className="modal-footer justify-content-between col-md-12">
                    <button type="button" className="btn btn-secondary"onClick={closeModal}>Close</button>
                    <button type="submit" className="btn btn-primary">{isEditing ? "Update" : "Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
              <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close" ></button>
            </div>
            <div className="modal-body">Are you sure you want to delete this Sub Admin?</div>
            <div className="modal-footer justify-content-between">
              <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="statusModalLabel">Confirm Status Change</h5>
              <button type="button" className="btn-close" onClick={closeStatusModal} aria-label="Close" ></button>
            </div>
            <div className="modal-body">
              Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Sub Admin?
            </div>
            <div className="modal-footer justify-content-between">
              <button type="button" className="btn btn-secondary" onClick={closeStatusModal}>Cancel</button>
              <button type="button" className="btn btn-warning" onClick={handleStatusConfirm}>Yes, Change</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal Backdrop */}
      {(showModal || showDeleteModal || showStatusModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default SubAdminModals;