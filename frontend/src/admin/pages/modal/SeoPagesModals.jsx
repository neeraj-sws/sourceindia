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
}) => {
  return (
    <>
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="add-update-form modal fade show" style={{ display: "block" }} tabIndex="-1" aria-modal="true" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEditing ? "Edit Seo Pages" : "Add Seo Pages"}</h5>
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
                    <label htmlFor="meta_title" className="form-label required">Meta Title</label>
                    <input
                      type="text"
                      className={`form-control ${errors.meta_title ? "is-invalid" : ""}`}
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={handleChange}
                      placeholder="Meta Title"
                    />
                    {errors.meta_title && <div className="invalid-feedback">{errors.meta_title}</div>}
                  </div>
                  <div className="form-group col-md-12 mb-3">
                    <label htmlFor="meta_description" className="form-label required">Description</label>
                    <textarea
                      className={`form-control ${errors.meta_description ? "is-invalid" : ""}`}
                      id="meta_description"
                      onChange={handleChange}
                      placeholder="Description"
                      defaultValue={formData.meta_description}
                    />
                    {errors.meta_description && <div className="text-danger mt-1">{errors.meta_description}</div>}
                  </div>
                  <div className="form-group col-md-12 mb-3">
                    <label htmlFor="file" className="form-label required">Meta Image</label>
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
                    ) : formData.meta_image ? (
                      <ImageWithFallback
                        src={`${ROOT_URL}/${formData.meta_image}`}
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
              <div className="modal-body">Are you sure you want to delete this Seo Pages?</div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeDeleteModal}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showModal || showDeleteModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default HomeBannerModals;