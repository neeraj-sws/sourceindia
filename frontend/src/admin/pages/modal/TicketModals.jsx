import React from "react";
import SearchDropdown from "../../common/SearchDropdown";

const TicketModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  users,
  categories,
  listStatus,
  handleChange,
  handleSelectChange,
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
                <h5 className="modal-title">{isEditing ? "Edit Ticket" : "Add Ticket"}</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
              </div>
              <div className="modal-body container">
                <form className="row" onSubmit={handleSubmit} noValidate>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="user_id" className="form-label required">On Behalf Of</label>
                    <SearchDropdown
                      id="user_id"
                      options={users?.map(user => ({ value: user.id, label: user.fname + " " + user.lname }))}
                      value={formData.user_id}
                      onChange={handleSelectChange("user_id")}
                      placeholder="Select here"                      
                    />
                    {errors.user_id && <div className="invalid-feedback">{errors.user_id}</div>}
                  </div>
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
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="priority" className="form-label required">Priority</label>
                    <select
                      id="priority"
                      className={`form-select ${errors.priority ? "is-invalid" : ""}`}
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="">Select here</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                    {errors.priority && <div className="invalid-feedback">{errors.priority}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="category" className="form-label required">Category</label>
                    <SearchDropdown
                      id="category"
                      options={categories?.map(cat => ({ value: String(cat.id), label: cat.name }))}
                      value={formData.category}
                      onChange={handleSelectChange("category")}
                      placeholder="Select category"                      
                    />
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>                  
                  <div className="form-group col-md-12 mb-3">
                    <label htmlFor="message" className="form-label required">Message</label>
                    <textarea
                      className={`form-control ${errors.message ? "is-invalid" : ""}`}
                      id="message"
                      onChange={handleChange}
                      placeholder="message"
                      defaultValue={formData.message}
                    />
                    {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="attachment" className="form-label required">Attachment</label>
                    <input
                      type="file"
                      className={`form-control ${errors.attachment ? "is-invalid" : ""}`}
                      id="attachment"
                      onChange={handleChange}
                    />
                    {errors.attachment && <div className="invalid-feedback">{errors.attachment}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="status" className="form-label required">Status</label>
                    <select
                      id="status"
                      className={`form-select ${errors.status ? "is-invalid" : ""}`}
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="">Select here</option>
                      {listStatus?.map((status, key) => (<option key={key} value={key}>{status}</option>))}
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
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
              <div className="modal-body">Are you sure you want to delete this Ticket?</div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
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

export default TicketModals;