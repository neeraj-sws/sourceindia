import React from "react";

const ItemModals = ({
  showModal,
  closeModal,
  isEditing,
  formData,
  errors,
  categories,
  subcategories,
  selectedCategory,
  selectedSubCategory,
  handleCategoryChange,
  handleSubCategoryChange,
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
                <h5 className="modal-title">{isEditing ? "Edit Item" : "Add Item"}</h5>
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
                    <label htmlFor="category" className="form-label required">Category</label>
                    <select
                      className={`form-control ${ errors.category ? "is-invalid" : "" }`}
                      id="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && ( <div className="invalid-feedback">{errors.category} </div>
                    )}
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <label htmlFor="sub_category" className="form-label required">Sub Category</label>
                    <select
                      className={`form-control ${ errors.sub_category ? "is-invalid" : "" }`}
                      id="sub_category"
                      value={selectedSubCategory}
                      onChange={handleSubCategoryChange}
                      disabled={!selectedCategory}
                    >
                      <option value="">Select Sub Category</option>
                      {subcategories.map((sub_category) => (
                        <option key={sub_category.id} value={sub_category.id}>
                          {sub_category.name}
                        </option>
                      ))}
                    </select>
                    {errors.sub_category && ( <div className="invalid-feedback">{errors.sub_category} </div>
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
            <div className="modal-body">Are you sure you want to delete this Item?</div>
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
              Are you sure you want to {statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Item?
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

export default ItemModals;