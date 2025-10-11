import React from "react";

const FaqModals = ({
  // Delete modal
  showDeleteModal,
  closeDeleteModal,
  handleDeleteConfirm,
  isBulkDelete = false,

  // Status modal
  showStatusModal,
  statusToggleInfo,
  closeStatusModal,
  handleStatusConfirm,
}) => {
  return (
    <>
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Confirm {isBulkDelete ? "Bulk Deletion" : "Deletion"}
                </h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close" />
              </div>
              <div className="modal-body">
                Are you sure you want to delete {isBulkDelete ? "the selected Faq" : "this Faq"}?
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeDeleteModal}>Cancel </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                  {isBulkDelete ? "Delete Selected" : "Delete"}
                </button>
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
                {
                  statusToggleInfo.field === "status" ? `Are you sure you want to ${statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Faq Status` :
                  statusToggleInfo.field === "delete_status" ? `Are you sure want to ${statusToggleInfo.currentStatus === 1 ? "restore deleted" : "remove from list"}` : "item"
                }?
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeStatusModal}>Cancel</button>
                <button type="button" className="btn btn-warning" onClick={handleStatusConfirm}>
                  {statusToggleInfo.field === "delete_status" ? statusToggleInfo.currentStatus === 1 ? "Restore" : "Remove" : "Yes, Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showDeleteModal || showStatusModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default FaqModals;