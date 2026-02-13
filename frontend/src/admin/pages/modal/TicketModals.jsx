import React from "react";

const TicketModals = ({
  // Delete modal
  showDeleteModal,
  closeDeleteModal,
  handleDeleteConfirm,

  // Status modal
  showStatusModal,
  statusToggleInfo,
  closeStatusModal,
  handleStatusConfirm,
  statusLoading,

  // Acceptance modal
  showAcceptModal,
  closeAcceptModal,
  acceptAction,
  handleAcceptConfirm,
  acceptLoading
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
                <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close" />
              </div>
              <div className="modal-body">Are you sure you want to delete this Ticket?</div>
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
                Are you sure you want to
                {statusToggleInfo.newStatus === 2 ? " resolve " : " cancel "}
                this ticket?
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeStatusModal}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleStatusConfirm}
                >
                  {statusLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    "Yes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Confirm {acceptAction === "accept" ? "Accept" : "Decline"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAcceptModal}
                />
              </div>

              <div className="modal-body">
                Are you sure you want to{" "}
                <strong>{acceptAction}</strong> this ticket?
              </div>

              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={closeAcceptModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={`btn ${
                    acceptAction === "accept" ? "btn-success" : "btn-danger"
                  }`}
                  onClick={handleAcceptConfirm}
                  disabled={acceptLoading}
                >
                  {acceptLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Yes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showDeleteModal || showStatusModal || showAcceptModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default TicketModals;