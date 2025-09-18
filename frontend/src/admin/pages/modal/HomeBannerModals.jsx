import React from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import ImageWithFallback from "../../common/ImageWithFallback";
import { ROOT_URL } from "../../../config";

const HomeBannerModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
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
                <h5 className="modal-title">{isEditing ? "Edit Home Banner" : "Add Home Banner"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="title" className="form-label required">Title</label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? "is-invalid" : ""}`}
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Title"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="sub_title" className="form-label required">Sub Title</label>
                    <input
                      type="text"
                      className={`form-control ${errors.sub_title ? "is-invalid" : ""}`}
                      id="sub_title"
                      value={formData.sub_title}
                      onChange={handleChange}
                      placeholder="Sub Title"
                    />
                    {errors.sub_title && <div className="invalid-feedback">{errors.sub_title}</div>}
                  </div>
                  <div className="form-group col-md-12 mb-3">
                    <label htmlFor="description" className="form-label required">Description</label>
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description || ''}
                      className={`form-control ${errors.description ? "is-invalid" : ""}`}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        handleChange({ target: { id: 'description', value: data } });
                      }}
                    />
                    {errors.description && <div className="text-danger mt-1">{errors.description}</div>}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="button_text" className="form-label required">Button Text</label>
                    <input
                      type="text"
                      className={`form-control ${errors.button_text ? "is-invalid" : ""}`}
                      id="button_text"
                      value={formData.button_text}
                      onChange={handleChange}
                      placeholder="Button Text"
                    />
                    {errors.button_text && <div className="invalid-feedback">{errors.button_text}</div>}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="button_url" className="form-label required">Button Url</label>
                    <input
                      type="url"
                      className={`form-control ${errors.button_url ? "is-invalid" : ""}`}
                      id="button_url"
                      value={formData.button_url}
                      onChange={handleChange}
                      placeholder="Button Url"
                    />
                    {errors.button_url && <div className="invalid-feedback">{errors.button_url}</div>}
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
                    <label htmlFor="file" className="form-label required">Home Banner Image</label>
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
                    <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>Close</button>
                    <button type="submit" className="btn btn-primary btn-sm">{isEditing ? "Update" : "Save"}</button>
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
              <div className="modal-body">Are you sure you want to delete this Home Banner?</div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeDeleteModal}>Cancel</button>
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
                Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Home Banner?
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeStatusModal}>Cancel</button>
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

export default HomeBannerModals;