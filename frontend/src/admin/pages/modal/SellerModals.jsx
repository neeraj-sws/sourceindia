import React from "react";
import { formatDateTime } from '../../../utils/formatDate';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const SellerModals = ({
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

  // Mail History modal
  showMailHistoryModal,
  mailHistoryData = [],
  mailHistoryLoading = false,
  closeMailHistoryModal,

  // Decline modal
  showDeclineModal,
  declineMessage,
  setDeclineMessage,
  closeDeclineModal,
  handleDeclineSubmit,
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
                Are you sure you want to delete {isBulkDelete ? "the selected sellers" : "this seller"}?
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
                  statusToggleInfo.field === "status" ? `Are you sure you want to ${statusToggleInfo.currentStatus === 1 ? "deactivate" : "activate"} this Seller Status` :
                  statusToggleInfo.field === "delete_status" ? `Are you sure want to ${statusToggleInfo.currentStatus === 1 ? "restore deleted" : "remove from list"}` :
                  statusToggleInfo.field === "account_status" ? `Are you sure want to Ready to ${statusToggleInfo.currentStatus === 1 ? "disapprove" : "approve"}` : "item"
                }?
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeStatusModal}>Cancel</button>
                <button type="button" className="btn btn-warning" onClick={handleStatusConfirm}>
                  {
                    statusToggleInfo.field === "delete_status"
                      ? statusToggleInfo.currentStatus === 1 ? "Restore" : "Remove"
                      : statusToggleInfo.field === "account_status"
                      ? statusToggleInfo.currentStatus === 1 ? "No" : "Yes"
                      : "Yes, Change"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mail History Modal */}
      {showMailHistoryModal && (
        <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mail History</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeMailHistoryModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                {mailHistoryLoading ? (
                  <div className="text-center py-3">Loading...</div>
                ) : mailHistoryData.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Mail Title</th>
                          <th>Mail Type</th>
                          <th>Location</th>
                          <th>Mail Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mailHistoryData.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.mail_title ? item.mail_title : 'NA'}</td>
                            <td>{item.mail_type ? item.mail_type : 'NA'}</td>
                            <td>{[item.city, item.state, item.country].filter(Boolean).join(', ')}</td>
                            <td>{formatDateTime(item.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted">No mail history found.</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={closeMailHistoryModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Decline Seller</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeclineModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <label className="form-label">Message</label>
                <CKEditor
                  editor={ClassicEditor}
                  data={declineMessage || ''}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    setDeclineMessage(data);
                  }}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeDeclineModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleDeclineSubmit}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showDeleteModal || showStatusModal || showMailHistoryModal || showDeclineModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default SellerModals;