import React from "react";

const EmailCircularModals = ({
  showDeleteModal,
  closeDeleteModal,
  handleDeleteConfirm,
  deleteType,
}) => {
  return (
    <>
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                {`Are you sure you want to delete this ${deleteType === "image" ? "image" : "newsletter"}?`}
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showDeleteModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default EmailCircularModals;