import React from "react";

const MembershipPlanModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  handleChange,
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
                <h5 className="modal-title">{isEditing ? "Edit Membership Plan" : "Add Membership Plan"}</h5>
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
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="price" className="form-label required">Price</label>
                    <input
                      type="number"
                      className={`form-control ${errors.price ? "is-invalid" : ""}`}
                      id="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Price"
                    />
                    {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="user" className="form-label required">No. of users</label>
                    <input
                      type="number"
                      className={`form-control ${errors.user ? "is-invalid" : ""}`}
                      id="user"
                      value={formData.user}
                      onChange={handleChange}
                      placeholder="No. of users"
                    />
                    {errors.user && <div className="invalid-feedback">{errors.user}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="category" className="form-label required">No. of categories</label>
                    <input
                      type="number"
                      className={`form-control ${errors.category ? "is-invalid" : ""}`}
                      id="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="No. of categories"
                    />
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="product" className="form-label required">No. of products</label>
                    <input
                      type="number"
                      className={`form-control ${errors.product ? "is-invalid" : ""}`}
                      id="product"
                      value={formData.product}
                      onChange={handleChange}
                      placeholder="No. of products"
                    />
                    {errors.product && <div className="invalid-feedback">{errors.product}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="expire_days" className="form-label required">Validity</label>
                    <input
                      type="number"
                      className={`form-control ${errors.expire_days ? "is-invalid" : ""}`}
                      id="expire_days"
                      value={formData.expire_days}
                      onChange={handleChange}
                      placeholder="Validity"
                    />
                    {errors.expire_days && <div className="invalid-feedback">{errors.expire_days}</div>}
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
                    <label htmlFor="is_default" className="form-label required">Is default</label>
                    <select
                      id="is_default"
                      className={`form-select ${errors.is_default ? "is-invalid" : ""}`}
                      value={formData.is_default}
                      onChange={handleChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                    {errors.is_default && <div className="invalid-feedback">{errors.is_default}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="free" className="form-label required">Plan Type</label>
                    <select
                      id="free"
                      className={`form-select ${errors.free ? "is-invalid" : ""}`}
                      value={formData.free}
                      onChange={handleChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Free</option>
                      <option value="0">Paid</option>
                    </select>
                    {errors.free && <div className="invalid-feedback">{errors.free}</div>}
                  </div>
                  <div className="form-group col-md-6 mb-3">
                    <label htmlFor="elcina_plan" className="form-label required">Elcina Plan</label>
                    <select
                      id="elcina_plan"
                      className={`form-select ${errors.elcina_plan ? "is-invalid" : ""}`}
                      value={formData.elcina_plan}
                      onChange={handleChange}
                    >
                      <option value="">Select here</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                    {errors.elcina_plan && <div className="invalid-feedback">{errors.elcina_plan}</div>}
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
              <div className="modal-body">Are you sure you want to delete this Membership Plan?</div>
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
                Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Membership Plan?
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

export default MembershipPlanModals;