import React from "react";

/**
 * Reusable centred confirmation dialog.
 *
 * Built from the Bootstrap modal markup already used across this app (see
 * pages/MyBuyRequirements.jsx, pages/Profile.jsx and the admin
 * pages/modal/*Modals.jsx files): `modal fade show` wrapper, a
 * `modal-dialog-centered` dialog, and a footer with a secondary Cancel plus a
 * solid confirm button. The only addition over the existing delete-confirmation
 * modals is the coloured icon + bold title + one-line description header block
 * requested for these lead actions.
 *
 * Generic by design - each caller passes its own icon, copy and button colour.
 */
const ConfirmActionModal = ({
  show,
  icon = "bx bx-help-circle",
  iconClass = "text-primary",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClass = "btn-primary",
  confirmDisabled = false,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        style={{ display: "block", zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: 420 }}>
          <div className="modal-content radius-2 text-center">
            <div className="modal-body px-4 pt-4 pb-2">
              <div className={`mb-3 fs-1 lh-1 ${iconClass}`}>
                <i className={icon}></i>
              </div>
              <h5 className="mb-2 fw-semibold">{title}</h5>
              {description ? (
                <p className="text-muted small mb-0 px-2">{description}</p>
              ) : null}
            </div>
            <div className="modal-footer justify-content-center gap-2 border-0 pt-2 pb-4 px-4">
              <button
                type="button"
                className="btn btn-outline-secondary flex-fill"
                onClick={onCancel}
                disabled={confirmDisabled}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${confirmClass} flex-fill`}
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

export default ConfirmActionModal;