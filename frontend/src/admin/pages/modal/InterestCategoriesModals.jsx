import React from "react";
import ImageWithFallback from "../../common/ImageWithFallback";
import { ROOT_URL } from "../../../config";

const InterestCategoriesModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  colors,
  handleChange,
  handleFileChange,
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
                <h5 className="modal-title">{isEditing ? "Edit Interest Category" : "Add Interest Category"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="name" className="form-label required">Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="color" className="form-label required">Color</label>
                    <select
                      className={`form-control ${errors.color ? "is-invalid" : ""}`}
                      id="color"
                      value={formData.color}
                      onChange={handleChange}
                    >
                      <option value="">Select Color</option>
                      {colors?.map((color) => (
                        <option key={color.id} value={color.id}>
                          {color.title}
                        </option>
                      ))}
                    </select>
                    {errors.color && <div className="invalid-feedback">{errors.color}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="status" className="form-label required">Status</label>
                    <select
                      id="status"
                      className={`form-select ${errors.status ? "is-invalid" : ""}`}
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="file" className="form-label required">Interest Category Image</label>
                    <input
                      type="file"
                      className={`form-control ${errors.file ? "is-invalid" : ""}`}
                      id="file"
                      onChange={handleFileChange}
                    />
                    {errors.file && <div className="invalid-feedback">{errors.file}</div>}
                    {formData.file ? (
                    <img
                      src={URL.createObjectURL(formData.file)}
                      className="img-preview object-fit-cover mt-3"
                      width={150}
                      height={150}
                      alt="Preview"
                    />
                  ) : formData.file_name ? (
                    <ImageWithFallback
                      src={`${ROOT_URL}/${formData.file_name}`}
                      width={150}
                      height={150}
                      showFallback={false}
                    />
                  ) : null}
                  </div>
                  <div className="modal-footer justify-content-between col-md-12">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
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
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close" />
              </div>
              <div className="modal-body">Are you sure you want to delete this Interest Category?</div>
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
                <h5 className="modal-title">Confirm Status Change</h5>
                <button type="button" className="btn-close" onClick={closeStatusModal} aria-label="Close" />
              </div>
              <div className="modal-body">
                Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Interest Category?
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

export default InterestCategoriesModals;