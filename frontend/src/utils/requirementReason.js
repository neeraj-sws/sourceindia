const AUTO_CANCELLED_REASON_LABELS = {
  sla_timeout: "No action was taken within the allowed time, so the lead was auto-cancelled and reassigned.",
  rollout_gap_timeout: "No response was received during the release window, so the lead was auto-cancelled and reassigned.",
  lead_already_accepted: "Another seller had already accepted the requirement, so this assignment was auto-cancelled.",
  lead_accepted: "Another seller accepted the requirement, so this assignment was auto-cancelled.",
  lead_accepted_by_another_seller: "Another seller accepted the requirement, so this assignment was auto-cancelled.",
  superseded_by_owner: "Another seller accepted the requirement, so this assignment was auto-cancelled.",
  requirement_locked: "The requirement was already accepted, completed, or closed, so this assignment was auto-cancelled.",
  reassignment_limit_reached: "The reassignment limit was reached, so this assignment was auto-cancelled.",
  no_next_seller_after_rejection: "No eligible next seller was available, so this assignment was auto-cancelled.",
  no_next_seller_for_reassignment: "No eligible next seller was available, so this assignment was auto-cancelled.",
};

const AUTO_CANCELLED_REASON_FALLBACK = "Auto-cancelled — seller did not respond in time.";

export const formatAutoCancelledReason = (reason) => {
  if (typeof reason !== "string" || !reason) return AUTO_CANCELLED_REASON_FALLBACK;
  if (Object.prototype.hasOwnProperty.call(AUTO_CANCELLED_REASON_LABELS, reason)) {
    return AUTO_CANCELLED_REASON_LABELS[reason];
  }
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(reason)) {
    return reason.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/_/g, " ");
  }
  return reason;
};
