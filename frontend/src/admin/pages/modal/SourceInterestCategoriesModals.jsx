import React from "react";
import SearchDropdown from "../../common/SearchDropdown";

const SourceInterestCategoriesModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  categories,
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
                <h5 className="modal-title">{isEditing ? "Edit source interest categories" : "Add source interest categories"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3 col-md-12">
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
                    <label htmlFor="interest_category_id" className="form-label required">Interest Category</label>
                    <SearchDropdown
                      id="interest_category_id"
                      options={categories?.map(cat => ({ value: cat.id, label: cat.name }))}
                      value={formData.interest_category_id}
                      onChange={handleSelectChange("interest_category_id")}
                      placeholder="Select Category"                      
                    />
                    {errors.interest_category_id && ( <div className="invalid-feedback">{errors.interest_category_id} </div>
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
            <div className="modal-body">Are you sure you want to delete this source interest categories?</div>
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
              Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this source interest categories?
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

export default SourceInterestCategoriesModals;