import React from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import SearchDropdown from "../../common/SearchDropdown";

const FaqModals = ({
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
                <h5 className="modal-title">{isEditing ? "Edit Faq" : "Add Faq"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3 col-md-12">
                    <label htmlFor="title" className="form-label required">Title</label>
                    <input
                      type="text"
                      className={`form-control ${errors.title ? "is-invalid" : ""}`}
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Title"
                    />
                    {errors.title && (<div className="invalid-feedback">{errors.title}</div>)}
                  </div>
                  <div className="form-group mb-3 col-md-12">
                    <label htmlFor="description" className="form-label required">Description</label>
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description || ''}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        handleChange({ target: { id: 'description', value: data } });
                      }}
                    />
                    {errors.description && <div className="text-danger mt-1">{errors.description}</div>}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="category" className="form-label required">Category</label>
                    <SearchDropdown
                      id="category"
                      options={categories?.map(cat => ({ value: cat.id, label: cat.name }))}
                      value={formData.category}
                      onChange={handleSelectChange("category")}
                      placeholder="Select Category"
                    />
                    {errors.category && (<div className="invalid-feedback">{errors.category} </div>
                    )}
                  </div>
                  <div className="form-group mb-3 col-md-6">
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
                    {errors.status && (<div className="invalid-feedback">{errors.status}</div>
                    )}
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
                <h5 className="modal-title" id="deleteModalLabel">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close" ></button>
              </div>
              <div className="modal-body">Are you sure you want to delete this Faq?</div>
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
                <h5 className="modal-title" id="statusModalLabel">Confirm Status Change</h5>
                <button type="button" className="btn-close" onClick={closeStatusModal} aria-label="Close" ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Faq?
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

export default FaqModals;