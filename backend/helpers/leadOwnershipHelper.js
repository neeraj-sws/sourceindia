const { Op } = require('sequelize');
const sequelize = require('../config/database');
const RequirementAssignments = require('../models/RequirementAssignments');

// Single-ownership rules for a buy-requirement lead.
//
// The product distributes a requirement to every eligible seller in parallel
// (see assignSellerToRequirement), so a requirement legitimately has several
// assignment rows at once. The moment ONE seller accepts, ownership is locked:
//   - every other still-pending assignment is closed out, and
//   - no further assignment/reassignment may touch the requirement.
//
// Everything that can create, close or reassign a lead funnels through the
// helpers below so the invariant holds for the API, the admin override and the
// background SLA job alike.

// Assignment lifecycle, mirrored from models/RequirementAssignments.js
const ASSIGNED = 0;
const VIEWED = 1;
const RESPONDED = 2;
const ACCEPTED = 3;
const REJECTED = 4;
const AUTO_CANCELLED = 5;
const COMPLETED = 6;

// Accepted or completed: this seller owns the lead and the requirement is locked.
const OWNING_STATUSES = [ACCEPTED, COMPLETED];
// Still a live assignment held by the seller (not yet rejected / auto-cancelled).
const LIVE_STATUSES = [ASSIGNED, VIEWED, RESPONDED, ACCEPTED, COMPLETED];
// Offered but not yet answered -> can be closed out when someone else accepts.
const PENDING_STATUSES = [ASSIGNED, VIEWED, RESPONDED];

const OWNER_RANK = {
  [COMPLETED]: 0,
  [ACCEPTED]: 1,
  [RESPONDED]: 2,
  [VIEWED]: 3,
  [ASSIGNED]: 4,
};

// Reasons written to requirement_assignments.reassignment_reason
const REASON_SUPERSEDED = 'superseded_by_owner';

// Take the requirement row lock. Every mutating path locks the requirement
// BEFORE any assignment row, so concurrent accepts serialise instead of racing.
async function lockRequirementRow(requirementId, transaction) {
  if (!transaction) return null;
  const rows = await sequelize.query(
    'SELECT requirement_id, status FROM buyer_requirements WHERE requirement_id = :id FOR UPDATE',
    { replacements: { id: requirementId }, type: sequelize.QueryTypes.SELECT, transaction }
  );
  return rows[0] || null;
}

async function lockAssignmentRow(assignmentId, transaction) {
  if (!transaction) {
    return RequirementAssignments.findByPk(assignmentId);
  }
  const rows = await sequelize.query(
    'SELECT * FROM requirement_assignments WHERE assignment_id = :id FOR UPDATE',
    { replacements: { id: assignmentId }, type: sequelize.QueryTypes.SELECT, transaction }
  );
  return rows[0] || null;
}

// Requirement-level status that can never receive another assignment:
// accepted (2), completed (3) and closed (4).
// NOTE: 5 = No Seller Found and 6 = Product Not Available are NOT locked - an
// admin override is exactly how those get rescued, so they must stay assignable.
const LOCKED_REQUIREMENT_STATUSES = [2, 3, 4];

function isRequirementLocked(requirement) {
  if (!requirement) return false;
  return LOCKED_REQUIREMENT_STATUSES.includes(Number(requirement.status));
}

// The single assignment that currently owns the requirement, if any.
async function findOwningAssignment(requirementId, opts = {}) {
  const { excludeAssignmentId = null, transaction = null } = opts;
  const where = { requirement_id: requirementId, status: { [Op.in]: OWNING_STATUSES } };
  if (excludeAssignmentId) where.id = { [Op.ne]: excludeAssignmentId };
  return RequirementAssignments.findOne({
    where,
    order: [['accepted_at', 'DESC'], ['id', 'DESC']],
    transaction,
  });
}

async function hasOwningAssignment(requirementId, opts = {}) {
  const count = await RequirementAssignments.count({
    where: { requirement_id: requirementId, status: { [Op.in]: OWNING_STATUSES } },
    transaction: opts.transaction,
  });
  return count > 0;
}

// The one seller the buyer should see: the owning assignment if the lead was
// accepted/completed, otherwise the single live assignment. Pure function over
// plain assignment objects so it can be unit tested and reused for API shaping.
function pickOwnerAssignment(assignments) {
  const live = (assignments || []).filter(
    (a) => a && LIVE_STATUSES.includes(Number(a.status))
  );
  if (live.length === 0) return null;
  return live.slice().sort(compareOwners)[0];
}

// Lower rank wins; ties break towards the earliest assignment so the choice is
// stable and does not flip between requests.
function compareOwners(a, b) {
  const ra = OWNER_RANK[Number(a.status)] ?? 99;
  const rb = OWNER_RANK[Number(b.status)] ?? 99;
  if (ra !== rb) return ra - rb;
  const ta = new Date(a.assigned_at || a.created_at || 0).getTime() || 0;
  const tb = new Date(b.assigned_at || b.created_at || 0).getTime() || 0;
  if (ta !== tb) return ta - tb;
  return Number(a.id || 0) - Number(b.id || 0);
}

// Close every other pending assignment because one seller took ownership.
// Returns the ids closed so the caller can log the supersession.
async function closeCompetingAssignments(requirementId, keepAssignmentId, transaction) {
  const [count] = await RequirementAssignments.update(
    {
      status: AUTO_CANCELLED,
      auto_cancelled_at: new Date(),
      reassignment_reason: REASON_SUPERSEDED,
    },
    {
      where: {
        requirement_id: requirementId,
        status: { [Op.in]: PENDING_STATUSES },
        ...(keepAssignmentId ? { id: { [Op.ne]: keepAssignmentId } } : {}),
      },
      transaction,
    }
  );
  if (!count) return [];
  const rows = await RequirementAssignments.findAll({
    where: {
      requirement_id: requirementId,
      status: AUTO_CANCELLED,
      reassignment_reason: REASON_SUPERSEDED,
      ...(keepAssignmentId ? { id: { [Op.ne]: keepAssignmentId } } : {}),
    },
    attributes: ['id', 'seller_id'],
    transaction,
  });
  return rows.map((r) => ({ id: r.id, seller_id: r.seller_id }));
}

// The single seller a buyer may see for a requirement, shaped for the API.
// Returns null when nothing is genuinely assigned (never offered, or every offer
// was rejected / auto-cancelled) so a mere candidate is never rendered as the
// assigned seller.
function buildAssignedSeller(requirement) {
  const plain = requirement && requirement.toJSON ? requirement.toJSON() : requirement;
  const owner = pickOwnerAssignment((plain && plain.assignments) || []);
  if (!owner) return null;

  const seller = owner.seller || null;
  return {
    assignment_id: owner.id,
    status: Number(owner.status),
    assigned_at: owner.assigned_at || null,
    accepted_at: owner.accepted_at || null,
    completed_at: owner.completed_at || null,
    seller: seller
      ? {
          id: seller.id,
          fname: seller.fname || '',
          lname: seller.lname || '',
          company_info: { organization_name: (seller.company_info && seller.company_info.organization_name) || null },
        }
      : null,
  };
}

// Attach `assigned_seller` to each requirement row before it leaves the API.
function withAssignedSeller(rows) {
  return (rows || []).map((row) => {
    const plain = row && row.toJSON ? row.toJSON() : row;
    plain.assigned_seller = buildAssignedSeller(plain);
    return plain;
  });
}

module.exports = {
  ASSIGNED,
  VIEWED,
  RESPONDED,
  ACCEPTED,
  REJECTED,
  AUTO_CANCELLED,
  COMPLETED,
  OWNING_STATUSES,
  LIVE_STATUSES,
  PENDING_STATUSES,
  LOCKED_REQUIREMENT_STATUSES,
  REASON_SUPERSEDED,
  isRequirementLocked,
  lockRequirementRow,
  lockAssignmentRow,
  findOwningAssignment,
  hasOwningAssignment,
  closeCompetingAssignments,
  pickOwnerAssignment,
  compareOwners,
  buildAssignedSeller,
  withAssignedSeller,
};
