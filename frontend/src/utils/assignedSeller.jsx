import React from "react";

// The backend decides which single seller owns a lead and sends it as
// `assigned_seller` (see helpers/leadOwnershipHelper.js). Both buyer-facing
// requirement lists read that field so a seller who was only matched,
// shortlisted or auto-cancelled is never shown as the assignee.
export function renderAssignedSeller(row) {
  const owner = row?.assigned_seller;
  const seller = owner?.seller;

  if (!owner || !seller) {
    return <span className="text-muted">No seller assigned</span>;
  }

  const company = seller.company_info?.organization_name;
  return (
    <div className="small">
      {seller.fname} {seller.lname}
      {company ? <span className="text-muted"> ({company})</span> : null}
    </div>
  );
}
