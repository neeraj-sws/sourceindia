const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const { logActivity, ensureSellerPerformance, incrementSellerPerformance, getSystemConfig, recalculateSellerPerformance } = require('./requirementHelper');
const { findEligibleSellers, hasSellerProductMatch, isProductAvailableForKeyword } = require('./matchingHelper');
const { enrichSellers, evaluateSellerEligibility, isSameDayCityProductAssigned, matchesSupplierPreference, normalizeText, SAME_DAY_CITY_PRODUCT_REASON } = require('./sellerEligibilityHelper');
const { getOrCreateSellerLeadCount, consumeSellerLeadQuota } = require('./leadLimitHelper');
const { sendMail } = require('./mailHelper');
const {
  ASSIGNED, VIEWED, RESPONDED, ACCEPTED, REJECTED, COMPLETED,
  LIVE_STATUSES,
  isRequirementLocked,
  lockRequirementRow, lockAssignmentRow, findOwningAssignment,
  hasOwningAssignment, closeCompetingAssignments,
} = require('./leadOwnershipHelper');

// Expected, user-facing failure inside the claim transaction (bad state, wrong
// seller, someone else already owns the lead). Rolled back and returned as a
// normal failure instead of a 500.
class AssignmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssignmentError';
  }
}

// ---------------------------------------------------------------
// Multi-seller (parallel) assignment model
// ---------------------------------------------------------------
// A requirement goes to EVERY eligible distinct seller who stocks the product,
// each as its own independent assignment with its own SLA lifecycle. One
// seller's inaction/reassignment never blocks the others' already-assigned
// leads. The global Monthly Lead Limit per Seller only stops a single seller
// when their own seller_lead_count is used up.
//
// Location tiers (STEP 4):
//   T1 exact-city   - eligible sellers in the buyer's city (all get a lead)
//   T2 same-state   - only when ZERO sellers exist in the exact city; nearest first
//   T3 anywhere     - only when no city/state match exists; nearest first
// An exhausted-but-existing exact-city seller does NOT trigger the fallback
// (they go through the normal per-product no-seller/incomplete path instead).
// ---------------------------------------------------------------

// Activity Log reason for the one No Seller Found case driven purely by the
// same-day + same-city + same-product eligibility rule.
const ALREADY_POSTED_REASON = 'Requirement already posted for the same product and city today';

// True when every seller still in scope was disqualified by the same-day +
// same-city + same-product rule in evaluateSellerEligibility() AND by nothing
// else, so that rule is the reason no eligible seller is left. Requires
// reasons.length === 1 on purpose: a seller that also ran out of quota, has lead
// receiving off or has no active product keeps the reason it had before, so this
// never fires for those cases.
function allCandidatesBlockedAsAlreadyPosted(sellers) {
  return sellers.length > 0 && sellers.every(
    (s) => !s.is_eligible
      && Array.isArray(s.reasons)
      && s.reasons.length === 1
      && s.reasons[0] === SAME_DAY_CITY_PRODUCT_REASON
  );
}

// Build the tiered list of sellers to assign for this requirement.
// Returns { tier, sellers, notePrefix, cityCandidatesExist }
async function collectAssignmentCandidates(requirement, config) {
  const pool = await findEligibleSellers(requirement, config.candidate_pool_size, { countSearchAppearances: true });
  if (!pool.length) return { tier: 'none', sellers: [], cityCandidatesExist: false };

  const enriched = await enrichSellers(pool, requirement);
  const evaluated = await evaluateSellerEligibility(enriched, requirement);

  // Enforce the requirement's Supplier Preference (Within My City / Within My State)
  const prefFiltered = evaluated.filter((s) => {
    const chk = matchesSupplierPreference({ city: s.city, state: s.state_name }, requirement);
    return chk.matches;
  });

  const cityCandidates = prefFiltered.filter((s) => s.same_city);
  const nonCityCandidates = prefFiltered.filter((s) => !s.same_city);

  // Only the "sellers exist but none eligible" outcomes below can be caused by
  // the same-day + same-city + same-product rule, so only they carry the flag.
  const alreadyPosted = allCandidatesBlockedAsAlreadyPosted(prefFiltered);

  const eligibleCity = cityCandidates.filter((s) => s.is_eligible);
  if (eligibleCity.length > 0) {
    return { tier: 'exact_city', sellers: eligibleCity, cityCandidatesExist: true, notePrefix: null };
  }

  // Zero eligible in the exact city, but sellers WITH the product exist there
  // (all exhausted / lead receiving off) -> no city fallback; per-product incomplete.
  if (cityCandidates.length > 0) {
    return { tier: 'city_exhausted', sellers: [], cityCandidatesExist: true, notePrefix: null, alreadyPosted };
  }

  // No seller in the exact city at all -> T2 same-state (nearest city first).
  if (requirement.buyer_state) {
    const buyerState = normalizeText(String(requirement.buyer_state));
    const sameState = nonCityCandidates.filter(
      (s) => s.is_eligible && s.state_name && normalizeText(String(s.state_name)) === buyerState
    );
    if (sameState.length > 0) {
      const ordered = [...sameState].sort((a, b) => ((a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)));
      return {
        tier: 'same_state',
        sellers: ordered,
        cityCandidatesExist: false,
        notePrefix: requirement.buyer_city ? `No seller available in ${requirement.buyer_city}` : 'No seller available in buyer city',
      };
    }
  }

  // T3 anywhere (no city known, or no state match) -> nearest first where known.
  const anywhereEligible = nonCityCandidates.filter((s) => s.is_eligible);
  if (anywhereEligible.length > 0) {
    const ordered = [...anywhereEligible].sort((a, b) => ((a.distance_km ?? Infinity) - (b.distance_km ?? Infinity)));
    return {
      tier: 'anywhere',
      sellers: ordered,
      cityCandidatesExist: false,
      notePrefix: requirement.buyer_city ? `No seller available in ${requirement.buyer_city}` : null,
    };
  }

  return { tier: 'none', sellers: [], cityCandidatesExist: false, notePrefix: null, alreadyPosted };
}

function buildAssignmentNote(tier, notePrefix, seller) {
  if (!notePrefix) return null;
  const sellerLoc = `${seller.city || 'n/a'}${seller.state_name ? ', ' + seller.state_name : ''}`;
  return `${notePrefix} — assigned from nearest city: ${sellerLoc}.`;
}

// Recompute the requirement-level status from its current assignment set.
// Single-ownership: an accepted/completed assignment is final. The requirement
// never drops back to Assigned and never becomes "No Seller Found" once a seller
// has taken ownership.
async function refreshRequirementStatus(requirement) {
  const completed = await RequirementAssignments.count({ where: { requirement_id: requirement.id, status: COMPLETED } });
  const accepted = await RequirementAssignments.count({ where: { requirement_id: requirement.id, status: ACCEPTED } });
  const active = await RequirementAssignments.count({ where: { requirement_id: requirement.id, status: { [Op.in]: [ASSIGNED, VIEWED, RESPONDED] } } });

  if (completed > 0) {
    if (requirement.status !== 3) await requirement.update({ status: 3 });
  } else if (accepted > 0) {
    if (requirement.status !== 2) await requirement.update({ status: 2 });
  } else if (active > 0) {
    if (requirement.status !== 1) await requirement.update({ status: 1 });
  } else {
    // No active, none accepted/completed and not explicitly closed/unavailable:
    // every lead fell through -> No Seller Found (5).
    if (requirement.status !== 5 && ![4, 6].includes(requirement.status)) {
      await requirement.update({ status: 5 });
    }
  }
}

async function reassignmentCount(requirementId) {
  return RequirementAssignments.count({ where: { requirement_id: requirementId, is_reassigned: 1 } });
}

// Close a requirement out as No Seller Found (5) - but ONLY when nothing is left
// live. This helper is reached both from fresh assignment (where there is never
// anything live yet) and from the reassignment path (where sibling assignments
// may still be pending with their own SLA running). Writing 5 unconditionally in
// the latter case told the buyer "no seller found" while sellers were still
// holding live offers, and dropped the requirement out of the SLA sweep - which
// only selects status 1/2 - so those remaining offers could never be
// auto-cancelled or reassigned again.
// Returns true when the requirement was actually closed out.
async function markNoSellerFound(requirement, message) {
  const liveCount = await RequirementAssignments.count({
    where: { requirement_id: requirement.id, status: { [Op.in]: LIVE_STATUSES } },
  });
  if (liveCount > 0) {
    // Still live offers out there - keep the derived status (stays 1).
    await refreshRequirementStatus(requirement);
    return false;
  }
  if (Number(requirement.status) !== 5) {
    await requirement.update({ status: 5 });
  }
  await logActivity(requirement.id, 'no_seller_found', message);
  return true;
}

// Assign the requirement to ALL eligible sellers (parallel). When `reassigned`
// is true, newly created assignments are tagged is_reassigned=1 and the count
// of previous reassignments is checked against max_reassignment_attempts.
async function assignSellerToRequirement(requirementId, ipAddress = null, opts = {}) {
  const config = await getSystemConfig();
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };

  // Single-ownership lock. Status 2 (Accepted), 3 (Completed) and 4 (Closed)
  // must never gain another assignment; a seller owning the lead is caught
  // separately just below.
  // 5 (No Seller Found) and 6 (Product Not Available) are NOT locked: they are
  // derived outcomes, not decisions, and a requirement sitting on 5 is exactly
  // the state a single auto-cancelled/rejected offer leaves behind. Blocking
  // them here would make the auto-cancel -> reassign path a no-op, so the
  // "status >= 2" test is replaced by the explicit lock set.
  if (isRequirementLocked(requirement)) {
    return { success: false, message: 'Requirement already accepted or completed' };
  }
  if (await hasOwningAssignment(requirementId)) {
    return { success: false, message: 'Requirement already accepted by a seller' };
  }

  // Product itself does not exist in the system -> Product Not Available (6), not No Seller Found (5).
  // Only for requirements that NEVER had any seller assigned; once a seller was ever assigned,
  // never flip to 6 (keep the no-seller flow -> 5).
  if (requirement.product_keyword_id && !(await isProductAvailableForKeyword(requirement.product_keyword_id))) {
    const hadSeller = (await RequirementAssignments.count({ where: { requirement_id: requirementId } })) > 0;
    if (!hadSeller) {
      await requirement.update({ status: 6 });
      await logActivity(requirementId, 'no_product_found', 'Product is not available in the system');
      return { success: false, message: 'Product is not available in the system.' };
    }
  }

  if (opts.reassigned && await reassignmentCount(requirementId) >= requirement.max_reassignment_attempts) {
    return { success: false, message: 'Reassignment limit reached' };
  }

  const cand = await collectAssignmentCandidates(requirement, config);

  if (cand.tier === 'city_exhausted') {
    // Status stays 5 (No Seller Found); only the Activity Log reason differs when
    // the same-day + same-city + same-product rule is what left nobody eligible.
    await markNoSellerFound(requirement, cand.alreadyPosted ? ALREADY_POSTED_REASON : 'All sellers in the buyer city have reached their lead limit for this period');
    return { success: false, message: 'All sellers in the buyer city have reached their lead limit for this period' };
  }

  if (cand.tier === 'none' || cand.sellers.length === 0) {
    await markNoSellerFound(requirement, cand.alreadyPosted ? ALREADY_POSTED_REASON : 'No eligible seller available anywhere');
    return { success: false, message: 'No eligible seller available anywhere' };
  }

  const assignments = [];
  let nextNumber = requirement.assignment_count;

  for (const seller of cand.sellers) {
    if (!seller || !seller.seller_id) continue;

    const perf = await ensureSellerPerformance(seller.seller_id);
    if (!perf.lead_receiving_enabled) continue;

    // Fresh capacity re-check (race-safe, against the current period's count).
    // leads_received only counts leads this seller ACCEPTED or REJECTED, so a
    // seller sitting on unanswered offers is still selectable here - pending
    // assignments must not read as "full".
    const row = await getOrCreateSellerLeadCount(seller.seller_id, config);
    if (row.leads_received >= row.limit_at_period_start) continue;

    if (await isSameDayCityProductAssigned(seller.seller_id, requirement)) continue;

    // Never create a second live assignment row for the same seller on the same
    // requirement: the first one is the offer, later attempts are duplicates.
    const existingLive = await RequirementAssignments.findOne({
      where: { requirement_id: requirementId, seller_id: seller.seller_id, status: { [Op.in]: LIVE_STATUSES } },
    });
    if (existingLive) continue;

    nextNumber += 1;
    const assignmentNote = buildAssignmentNote(cand.tier, cand.notePrefix, seller);
    const assignment = await RequirementAssignments.create({
      requirement_id: requirementId,
      seller_id: seller.seller_id,
      assignment_number: nextNumber,
      status: 0,
      product_match_level: seller.match_level,
      product_match_score: seller.match_score,
      total_rank_score: seller.performance_score || 0,
      is_reassigned: opts.reassigned ? 1 : 0,
      assignment_note: assignmentNote,
      assigned_at: new Date(),
    });

    await incrementSellerPerformance(seller.seller_id, { total_leads: 1 });

    // Monthly Used is deliberately NOT consumed here. An offer the seller has
    // not answered yet costs them nothing; the quota is spent in
    // consumeSellerLeadQuota(), called from the accept and reject paths only.
    // That also means a seller holding several pending offers is NOT treated as
    // exhausted by this loop - `row` above still holds whatever they had
    // actually accepted or rejected, so the re-check stays accurate.

    const action = opts.reassigned ? 'lead_reassigned' : 'seller_assigned';
    const detail = opts.reassigned
      ? `Reassigned to seller #${seller.seller_id}${assignmentNote ? ' — ' + assignmentNote : ''}`
      : `Assigned to seller #${seller.seller_id} (match: ${seller.match_level}, score: ${seller.performance_score})${assignmentNote ? ' — ' + assignmentNote : ''}`;
    await logActivity(requirementId, action, detail, seller.seller_id, assignment.id, ipAddress);

    assignments.push({ assignment, seller_id: seller.seller_id });

    // A reassignment advances the chain by exactly ONE seller.
    //
    // The candidate pool for a reassignment is "sellers not yet tried on this
    // requirement". Fan-out here handed that whole pool to a single hop, which
    // broke the chain in two ways:
    //   1. reassignmentCount() (used for max_reassignment_attempts) jumped by
    //      the size of the pool in one step, so the cap could be blown inside a
    //      single pass and the next hop was rejected as over-limit.
    //   2. Every remaining seller already had an assignment row, so when that
    //      hop's seller then rejected or auto-cancelled there was nobody left to
    //      move the lead to - the chain always stopped after one hop.
    // Taking the first candidate only keeps the chain one hop per failure and
    // makes the counter match the configured attempt limit exactly. The fresh
    // (non-reassignment) path is still a full parallel fan-out.
    if (opts.reassigned) break;
  }

  if (assignments.length === 0) {
    await markNoSellerFound(requirement, 'No eligible seller received the lead (all exhausted or no capacity this period)');
    return { success: false, message: 'No eligible seller received the lead (all exhausted or no capacity this period)' };
  }

  await requirement.update({
    status: 1,
    assignment_count: nextNumber,
  });

  for (const { assignment, seller_id } of assignments) {
    await notifySeller(seller_id, requirement, assignment);
  }

  return {
    success: true,
    assignments: assignments.map((a) => a.assignment),
    seller_ids: assignments.map((a) => a.seller_id),
    score: assignments[0].assignment.total_rank_score,
  };
}

// Admin override: add a specific seller's assignment to the requirement.
// Multiple concurrent assignments are allowed; previously-assigned sellers are
// left untouched (their independent SLA lifecycle continues). Once a seller has
// accepted or completed the lead the requirement is locked and no further
// assignment is allowed, admin or otherwise.
async function manualAssignSellerToRequirement(requirementId, sellerId, ipAddress = null) {
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };

  // Admin override: an admin may still rescue a requirement that ended up with
  // no seller (5 = No Seller Found, 6 = Product Not Available) - that override
  // is the whole point of the manual flow. Only a locked status (accepted /
  // completed / closed) or an existing owner blocks it.
  if (isRequirementLocked(requirement)) {
    return { success: false, message: 'Requirement already accepted, completed or closed' };
  }
  if (await hasOwningAssignment(requirementId)) {
    return { success: false, message: 'Requirement already accepted by a seller' };
  }

  const seller = await Users.findByPk(sellerId);
  if (!seller || seller.is_delete) return { success: false, message: 'Seller not found' };
  if (seller.is_seller !== 1) return { success: false, message: 'Selected user is not a seller' };

  // Prevent self-match: a seller cannot be assigned to their own requirement
  if (requirement.buyer_id && parseInt(sellerId) === parseInt(requirement.buyer_id)) {
    return { success: false, message: 'Cannot assign a seller to their own posted requirement' };
  }

  if (requirement.product_keyword_id) {
    const hasProduct = await hasSellerProductMatch(parseInt(sellerId), requirement.product_keyword_id);
    if (!hasProduct) {
      return { success: false, message: 'This product is not available with this seller.' };
    }
  }

  if (await isSameDayCityProductAssigned(parseInt(sellerId), requirement)) {
    return { success: false, message: 'Seller already assigned for same date + same city + same product on this day' };
  }

  const alreadyAssigned = await RequirementAssignments.findOne({
    where: { requirement_id: requirementId, seller_id: sellerId, status: { [Op.in]: LIVE_STATUSES } },
  });
  if (alreadyAssigned) return { success: false, message: 'This seller already has an active assignment for this requirement' };

  await ensureSellerPerformance(sellerId);

  const assignmentNumber = requirement.assignment_count + 1;
  const assignment = await RequirementAssignments.create({
    requirement_id: requirementId,
    seller_id: sellerId,
    assignment_number: assignmentNumber,
    status: 0,
    is_reassigned: 0,
    assigned_at: new Date(),
  });

  await incrementSellerPerformance(sellerId, { total_leads: 1 });
  // Monthly Used is not consumed at assignment time - see assignSellerToRequirement.
  // It is spent when this seller accepts or rejects the lead.

  await requirement.update({
    assignment_count: assignmentNumber,
  });
  await refreshRequirementStatus(requirement);

  await logActivity(
    requirementId,
    'seller_assigned',
    `Admin manually assigned to seller #${sellerId}`,
    sellerId,
    assignment.id,
    ipAddress
  );

  await notifySeller(sellerId, requirement, assignment);

  return { success: true, assignment, seller_id: sellerId };
}

async function adminChangeRequirementStatus(requirementId, newStatus, ipAddress = null) {
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };

  const validStatus = [1, 2, 3, 4, 5, 6];
  if (!validStatus.includes(parseInt(newStatus))) {
    return { success: false, message: 'Invalid status' };
  }

  await requirement.update({ status: parseInt(newStatus) });

  const statusLabels = {
    1: 'Assigned', 2: 'Accepted', 3: 'Completed', 4: 'Closed',
    5: 'No Seller Found', 6: 'Product Not Available',
  };
  await logActivity(
    requirementId,
    'status_changed',
    `Admin changed status to ${statusLabels[newStatus] || newStatus}`,
    null,
    null,
    ipAddress
  );

  return { success: true, status: parseInt(newStatus) };
}

async function adminCloseRequirement(requirementId, ipAddress = null) {
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };
  if (requirement.status === 4) return { success: false, message: 'Requirement is already closed' };

  await requirement.update({ status: 4 });
  await logActivity(requirementId, 'closed', 'Requirement closed by admin', null, null, ipAddress);
  return { success: true };
}

async function notifySeller(sellerId, requirement, assignment) {
  try {
    const seller = await Users.findByPk(sellerId, {
      include: [{ model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] }],
    });
    if (!seller || !seller.email) return;

    const config = await getSystemConfig();
    const slaMs = config.sla_minutes * 60 * 1000;
    const productName = requirement.product_name_snapshot || 'your product category';
    const quantity = requirement.quantity ? `${requirement.quantity} ${requirement.quantity_unit || ''}` : '';

    const subject = 'New Buy Requirement Received - Source India Electronics';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Buy Requirement Received</h2>
        <p>Dear ${seller.company_info?.organization_name || seller.fname},</p>
        <p>You have received a new buy requirement. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Product/Service</td><td style="padding: 8px; border: 1px solid #ddd;">${productName}</td></tr>
          ${quantity ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Quantity</td><td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td></tr>` : ''}
          ${requirement.description ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td><td style="padding: 8px; border: 1px solid #ddd;">${requirement.description}</td></tr>` : ''}
          ${requirement.buyer_city ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Buyer Location</td><td style="padding: 8px; border: 1px solid #ddd;">${requirement.buyer_city}${requirement.buyer_state ? ', ' + requirement.buyer_state : ''}</td></tr>` : ''}
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Response Deadline</td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(new Date(assignment.assigned_at).getTime() + slaMs).toLocaleString()}</td></tr>
        </table>
        <p>Please respond within the deadline to avoid auto-cancellation.</p>
        <p style="margin-top: 20px;"><a href="${process.env.APP_URL || 'http://localhost:3000'}/buy-lead-detail/${assignment.id}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View & Respond</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated notification from Source India Electronics.</p>
      </div>
    `;

    await sendMail({ to: seller.email, subject, message: body, htmlAlreadyBuilt: true });
  } catch (err) {
    console.error('notifySeller error:', err.message);
  }
}

// Claiming a lead is the one place ownership changes hands, so it runs inside a
// transaction that locks the requirement row first. Two sellers accepting the
// same lead at the same time serialise on that lock: the first commits, the
// second sees the owner and is rejected. Accepting also closes every other
// pending assignment so nobody else can end up owning the same lead.
//
// 'accept' takes ownership and consumes the seller's Monthly Used quota.
// 'respond' is neither an accept nor a reject, so it consumes nothing.
async function claimAssignment(assignmentId, sellerId, action) {
  const isAccept = action === 'accept';
  const newStatus = isAccept ? ACCEPTED : RESPONDED;

  const preview = await RequirementAssignments.findByPk(assignmentId);
  if (!preview) return { success: false, message: 'Assignment not found' };
  if (preview.seller_id !== sellerId) return { success: false, message: 'Unauthorized' };
  if (preview.status !== ASSIGNED && preview.status !== VIEWED) {
    return { success: false, message: 'Assignment no longer active' };
  }

  const now = new Date();
  const responseTimeSeconds = Math.max(0, Math.floor((now - new Date(preview.assigned_at)) / 1000));

  let assignment;
  let superseded = [];
  try {
    await sequelize.transaction(async (t) => {
      await lockRequirementRow(preview.requirement_id, t);

      const locked = await lockAssignmentRow(assignmentId, t);
      if (!locked) throw new AssignmentError('Assignment not found');
      if (Number(locked.seller_id) !== Number(sellerId)) throw new AssignmentError('Unauthorized');
      if (Number(locked.status) !== ASSIGNED && Number(locked.status) !== VIEWED) {
        throw new AssignmentError('Assignment no longer active');
      }

      // Single-ownership lock: somebody else already took this lead.
      const owner = await findOwningAssignment(locked.requirement_id, {
        excludeAssignmentId: assignmentId,
        transaction: t,
      });
      if (owner) throw new AssignmentError('This lead has already been accepted by another seller');

      await RequirementAssignments.update(
        {
          status: newStatus,
          responded_at: now,
          accepted_at: isAccept ? now : locked.accepted_at,
          response_time_seconds: responseTimeSeconds,
        },
        { where: { id: assignmentId }, transaction: t }
      );

      if (isAccept) {
        superseded = await closeCompetingAssignments(locked.requirement_id, assignmentId, t);
      }

      assignment = await RequirementAssignments.findByPk(assignmentId, { transaction: t });
    });
  } catch (err) {
    if (err instanceof AssignmentError) return { success: false, message: err.message };
    throw err;
  }

  await logActivity(
    preview.requirement_id,
    isAccept ? 'seller_accepted' : 'seller_responded',
    `Seller ${isAccept ? 'accepted' : 'responded'} (response time: ${responseTimeSeconds}s)`,
    sellerId,
    assignmentId
  );

  if (isAccept) {
    await logActivity(preview.requirement_id, 'lead_accepted', `Requirement accepted by seller #${sellerId}`, sellerId, assignmentId);
    for (const s of superseded) {
      await logActivity(
        preview.requirement_id,
        'lead_closed',
        `Lead closed for seller #${s.seller_id}: requirement already accepted by seller #${sellerId}`,
        s.seller_id,
        s.id
      );
    }

    // Accepting is what spends the quota. The sellers in `superseded` never
    // accepted or rejected, so they are correctly not charged anything.
    await consumeSellerLeadQuota(sellerId);
  }

  const requirement = await BuyerRequirements.findByPk(preview.requirement_id);
  await refreshRequirementStatus(requirement);

  await ensureSellerPerformance(sellerId);
  const config = await getSystemConfig();
  const slaSeconds = config.sla_minutes * 60;
  await incrementSellerPerformance(sellerId, {
    responded_leads: 1,
    accepted_leads: isAccept ? 1 : 0,
    total_response_time_seconds: responseTimeSeconds,
    on_time_response_count: responseTimeSeconds <= slaSeconds ? 1 : 0,
  });
  await recalculateSellerPerformance(sellerId);

  return { success: true, assignment, superseded_count: superseded.length };
}

// Per-assignment seller response. Requirement-level status is derived from the
// whole assignment set (one seller's accept/reject never collapses the others).
async function handleSellerResponse(assignmentId, sellerId, action, rejectionReason = null, ipAddress = null) {
  if (action === 'respond' || action === 'accept') {
    return claimAssignment(assignmentId, sellerId, action);
  }

  if (action === 'reject') {
    const assignment = await RequirementAssignments.findByPk(assignmentId, {
      include: [{ model: BuyerRequirements, as: 'requirement' }],
    });
    if (!assignment) return { success: false, message: 'Assignment not found' };
    if (assignment.seller_id !== sellerId) return { success: false, message: 'Unauthorized' };
    if (assignment.status !== 0 && assignment.status !== 1) {
      return { success: false, message: 'Assignment no longer active' };
    }
    if (!(rejectionReason || '').trim()) {
      return { success: false, message: 'Rejection reason is required to reject a lead' };
    }

    const now = new Date();
    const responseTimeSeconds = Math.floor((now - new Date(assignment.assigned_at)) / 1000);

    await assignment.update({
      status: REJECTED,
      rejected_at: now,
      rejection_reason: rejectionReason,
      response_time_seconds: responseTimeSeconds,
    });

    await logActivity(
      assignment.requirement_id,
      'seller_rejected',
      `Seller rejected${rejectionReason ? ': ' + rejectionReason : ''}`,
      sellerId,
      assignment.id
    );

    await ensureSellerPerformance(sellerId);
    await incrementSellerPerformance(sellerId, { rejected_leads: 1 });

    // Rejecting spends the quota too: the seller took an action on the lead and
    // used up their Monthly Used slot for this period, exactly as accepting does.
    await consumeSellerLeadQuota(sellerId);

    await recalculateSellerPerformance(sellerId);

    const requirement = assignment.requirement;
    await refreshRequirementStatus(requirement);

    // Reassign while the requirement is still up for grabs. Same reasoning as the
    // SLA path: refreshRequirementStatus above has just derived 5 (No Seller
    // Found) when this rejection removed the last live offer, and the old
    // `status !== 1` guard read that as "stop reassigning".
    if (isRequirementLocked(requirement)) return { success: true };
    if (await hasOwningAssignment(requirement.id)) return { success: true };

    if (await reassignmentCount(requirement.id) >= requirement.max_reassignment_attempts) {
      await markNoSellerFound(
        requirement,
        `No seller found after rejection (reassignment limit ${requirement.max_reassignment_attempts} reached)`
      );
      return { success: true };
    }

    await logActivity(
      requirement.id,
      'lead_reassigned',
      `Seller #${sellerId} rejected the requirement; assigning to next eligible seller`,
      null,
      assignment.id
    );

    const reassignmentResult = await assignSellerToRequirement(requirement.id, ipAddress, { reassigned: true });
    if (!reassignmentResult.success) {
      await refreshRequirementStatus(requirement);
      // Sibling offers may still be live - only report when nothing is left.
      if (Number(requirement.status) === 5) {
        await logActivity(
          requirement.id,
          'no_seller_found',
          reassignmentResult.message
            ? `No seller found after rejection (${reassignmentResult.message})`
            : 'No seller found after rejection'
        );
      }
    }
    return { success: true };
  }

  return { success: false, message: 'Invalid action' };
}

// Seller marks an accepted lead as completed -> requirement Completed (3), assignment Completed (6)
async function handleSellerComplete(assignmentId, sellerId) {
  const assignment = await RequirementAssignments.findByPk(assignmentId, {
    include: [{ model: BuyerRequirements, as: 'requirement' }],
  });
  if (!assignment) return { success: false, message: 'Assignment not found' };
  if (assignment.seller_id !== sellerId) return { success: false, message: 'Unauthorized' };
  if (assignment.status !== 3) {
    return { success: false, message: 'Only an accepted lead can be marked as completed' };
  }

  const now = new Date();
  await assignment.update({ status: COMPLETED, completed_at: now });
  // Completion is terminal: close out any sibling assignment that somehow is
  // still pending so the completed lead stays with this seller only.
  const superseded = await closeCompetingAssignments(assignment.requirement_id, assignment.id, null);
  await refreshRequirementStatus(assignment.requirement);

  await logActivity(
    assignment.requirement_id,
    'lead_completed',
    `Requirement marked as completed by seller #${sellerId}`,
    sellerId,
    assignment.id
  );
  for (const s of superseded) {
    await logActivity(
      assignment.requirement_id,
      'lead_closed',
      `Lead closed for seller #${s.seller_id}: requirement completed by seller #${sellerId}`,
      s.seller_id,
      s.id
    );
  }

  await ensureSellerPerformance(sellerId);
  await incrementSellerPerformance(sellerId, { completed_leads: 1 });
  await recalculateSellerPerformance(sellerId);

  return { success: true, assignment };
}

async function handleSellerView(assignmentId, sellerId) {
  const assignment = await RequirementAssignments.findByPk(assignmentId);
  if (!assignment || assignment.seller_id !== sellerId) return;
  if (assignment.status === 0) {
    await assignment.update({ status: 1, viewed_at: new Date() });
    await logActivity(assignment.requirement_id, 'seller_viewed', 'Seller viewed the requirement', sellerId, assignment.id);
  }
}

// No-action auto-cancel + independent per-assignment reassignment (STEP 3).
// Each lead has its own SLA window; on timeout it is auto-cancelled and the
// requirement is re-checked: if a new eligible seller exists (and the
// requirement is still awaiting a response) the slot is reassigned and marked
// is_reassigned=1. One seller's timeout never cancels another seller's lead.
//
// An SLA timeout is the seller doing NOTHING, so it must NOT touch Monthly Used:
// consumeSellerLeadQuota() is deliberately absent from this function.
async function processExpiredAssignments() {
  const config = await getSystemConfig();
  const slaMs = config.sla_minutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - slaMs);

  const expiredAssignments = await RequirementAssignments.findAll({
    where: {
      status: { [Op.in]: [0, 1] },
      assigned_at: { [Op.lt]: cutoffTime },
    },
    include: [{ model: BuyerRequirements, as: 'requirement', where: { is_delete: 0, status: { [Op.in]: [1, 2] } } }],
  });

  for (const assignment of expiredAssignments) {
    try {
      const requirement = assignment.requirement;
      if (!requirement || requirement.is_delete) continue;

      // Single-ownership: a requirement owned by an accepted/completed seller is
      // frozen. Close out any leftover pending offers (legacy data) and stop -
      // no SLA cancellation, no lead-count penalty, no reassignment.
      if (await hasOwningAssignment(requirement.id)) {
        const superseded = await closeCompetingAssignments(requirement.id, null, null);
        for (const s of superseded) {
          await logActivity(
            requirement.id,
            'lead_closed',
            `Lead closed for seller #${s.seller_id}: requirement already accepted by another seller`,
            s.seller_id,
            s.id
          );
        }
        continue;
      }

      // Still the current lead for this seller? (idempotency guard)
      const fresh = await RequirementAssignments.findByPk(assignment.id);
      if (!fresh || ![0, 1].includes(fresh.status)) continue;

      // Re-check under the ownership lock: a seller may have accepted this lead
      // between the query above and now.
      let owned = false;
      await sequelize.transaction(async (t) => {
        await lockRequirementRow(requirement.id, t);
        owned = await hasOwningAssignment(requirement.id, { transaction: t });
      });
      if (owned) continue;

      await assignment.update({
        status: 5,
        auto_cancelled_at: new Date(),
        reassignment_reason: 'sla_timeout',
      });

      await logActivity(
        requirement.id,
        'seller_auto_cancelled',
        `Assignment auto-cancelled due to SLA timeout (${config.sla_minutes} min)`,
        assignment.seller_id,
        assignment.id
      );

      // Monthly Used is deliberately NOT incremented here: the seller took no
      // action, so this costs them nothing. `auto_cancelled_leads` below is a
      // performance metric, not quota, and is tracked separately.
      await ensureSellerPerformance(assignment.seller_id);
      await incrementSellerPerformance(assignment.seller_id, { auto_cancelled_leads: 1 });
      await recalculateSellerPerformance(assignment.seller_id);

      await refreshRequirementStatus(requirement);

      // Reassign while the requirement is still up for grabs. The derived status
      // CANNOT be used as that test: refreshRequirementStatus above just set 5
      // (No Seller Found) whenever this cancelled offer was the last live one -
      // i.e. in precisely the case that most needs a next seller - and the old
      // `status !== 1` guard then read that consequence as "stop reassigning".
      // The real preconditions are the explicit lock set (2 accepted / 3
      // completed / 4 closed) and no seller having taken ownership.
      if (isRequirementLocked(requirement)) continue;
      if (await hasOwningAssignment(requirement.id)) continue;

      if (await reassignmentCount(requirement.id) >= requirement.max_reassignment_attempts) {
        await refreshRequirementStatus(requirement);
        if (Number(requirement.status) === 5) {
          await logActivity(
            requirement.id,
            'no_seller_found',
            `Seller did not respond within SLA (${config.sla_minutes} min); reassignment limit (${requirement.max_reassignment_attempts}) reached; lead closed`
          );
        }
        continue;
      }

      await logActivity(
        requirement.id,
        'lead_reassigned',
        `Seller #${assignment.seller_id} did not respond within SLA (${config.sla_minutes} min); reassigning to next eligible seller`,
        null,
        assignment.id
      );

      const reassignmentResult = await assignSellerToRequirement(requirement.id, requirement.buyer_ip, { reassigned: true });
      if (!reassignmentResult.success) {
        await refreshRequirementStatus(requirement);
        // Only report "no seller found" when the requirement really has nothing
        // live left; sibling offers may still be pending with their own SLA.
        if (Number(requirement.status) === 5) {
          await logActivity(
            requirement.id,
            'no_seller_found',
            reassignmentResult.message || 'No eligible sellers left for reassignment'
          );
        }
      }
    } catch (err) {
      console.error('processExpiredAssignments error for assignment', assignment.id, err.message);
    }
  }

  return expiredAssignments.length;
}

// Self-healing: requirements stuck in an active status (1/2) but with NO active
// assignment (e.g. after auto-cancel/reject where no next seller was found) get
// resolved: assign any newly-eligible seller or -> 5.
async function repairStuckRequirements() {
  const stuckReqs = await BuyerRequirements.findAll({
    where: { is_delete: 0, status: { [Op.in]: [1, 2] } },
  });
  let fixed = 0;
  for (const requirement of stuckReqs) {
    try {
      // Single-ownership: never "repair" a requirement a seller already owns.
      if (await hasOwningAssignment(requirement.id)) continue;

      const activeAssignment = await RequirementAssignments.findOne({
        where: {
          requirement_id: requirement.id,
          status: { [Op.in]: LIVE_STATUSES },
        },
      });
      if (activeAssignment) continue;

      const result = await assignSellerToRequirement(requirement.id, requirement.buyer_ip);
      if (!result.success) {
        await refreshRequirementStatus(requirement);
        await logActivity(
          requirement.id,
          'no_seller_found',
          `No active assignment and no eligible seller available (${result.message})`
        );
      }
      fixed++;
    } catch (err) {
      console.error('repairStuckRequirements error for requirement', requirement.id, err.message);
    }
  }
  return fixed;
}

module.exports = {
  assignSellerToRequirement,
  manualAssignSellerToRequirement,
  adminChangeRequirementStatus,
  adminCloseRequirement,
  handleSellerResponse,
  handleSellerComplete,
  handleSellerView,
  processExpiredAssignments,
  repairStuckRequirements,
  refreshRequirementStatus,
  notifySeller,
};
