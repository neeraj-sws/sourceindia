const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const SellerPerformance = require('../models/SellerPerformance');
const { logActivity, ensureSellerPerformance, getSystemConfig, recalculateSellerPerformance } = require('./requirementHelper');
const { findEligibleSellers, hasSellerProductMatch, isProductAvailableForKeyword } = require('./matchingHelper');
const { rankCandidates } = require('./rankingHelper');
const { selectFinalSeller, isSameDayCityProductAssigned } = require('./sellerEligibilityHelper');
const { sendMail } = require('./mailHelper');

async function assignSellerToRequirement(requirementId, ipAddress = null) {
  const config = await getSystemConfig();
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };

  if (requirement.status >= 3) {
    return { success: false, message: 'Requirement already completed or closed' };
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

  const activeAssignment = await RequirementAssignments.findOne({
    where: {
      requirement_id: requirementId,
      status: { [Op.in]: [0, 1, 2, 3, 6] },
    },
  });
  if (activeAssignment) {
    return { success: false, message: 'Active assignment already exists' };
  }

  // Final, revalidated seller selection (same-city priority + same-day/city/product exclusion + nearest-city fallback)
  const selection = await selectFinalSeller(requirement);
  if (!selection.success || !selection.seller) {
    await requirement.update({ status: 5 });
    await logActivity(requirementId, 'no_seller_found', selection.message || 'No eligible sellers found');
    return { success: false, message: selection.message || 'No eligible sellers found' };
  }

  const candidate = selection.seller;
  const perf = await ensureSellerPerformance(candidate.seller_id);
  if (!perf.lead_receiving_enabled) {
    await requirement.update({ status: 5 });
    await logActivity(requirementId, 'no_seller_found', 'Selected seller not receiving leads');
    return { success: false, message: 'Selected seller not receiving leads' };
  }
  if (perf.monthly_leads_used >= config.monthly_limit) {
    await requirement.update({ status: 5 });
    await logActivity(requirementId, 'no_seller_found', 'Selected seller monthly limit reached');
    return { success: false, message: 'Selected seller monthly limit reached' };
  }
  if (await isSameDayCityProductAssigned(candidate.seller_id, requirement)) {
    await requirement.update({ status: 5 });
    await logActivity(requirementId, 'no_seller_found', 'Selected seller already assigned for same date/city/product');
    return { success: false, message: 'Selected seller already assigned for same date/city/product' };
  }

  const assignmentNumber = requirement.assignment_count + 1;
  const assignment = await RequirementAssignments.create({
    requirement_id: requirementId,
    seller_id: candidate.seller_id,
    assignment_number: assignmentNumber,
    status: 0,
    product_match_level: candidate.match_level,
    product_match_score: candidate.match_score,
    total_rank_score: candidate.total_score,
    assigned_at: new Date(),
  });

  await perf.update({ monthly_leads_used: perf.monthly_leads_used + 1, total_leads: perf.total_leads + 1 });
  await requirement.update({
    status: 1,
    current_assignment_id: assignment.id,
    assignment_count: assignmentNumber,
  });

  await logActivity(
    requirementId,
    'seller_assigned',
    `Assigned to seller #${candidate.seller_id} (match: ${candidate.match_level}, score: ${candidate.total_score})`,
    candidate.seller_id,
    assignment.id,
    ipAddress
  );

  await notifySeller(candidate.seller_id, requirement, assignment);

  return { success: true, assignment, seller_id: candidate.seller_id, score: candidate.total_score };
}

async function manualAssignSellerToRequirement(requirementId, sellerId, ipAddress = null) {
  const requirement = await BuyerRequirements.findByPk(requirementId);
  if (!requirement || requirement.is_delete) return { success: false, message: 'Requirement not found' };

  const seller = await Users.findByPk(sellerId);
  if (!seller || seller.is_delete) return { success: false, message: 'Seller not found' };
  if (seller.is_seller !== 1) return { success: false, message: 'Selected user is not a seller' };

  if (requirement.product_keyword_id) {
    const hasProduct = await hasSellerProductMatch(parseInt(sellerId), requirement.product_keyword_id);
    if (!hasProduct) {
      return { success: false, message: 'This product is not available with this seller.' };
    }
  }

  if (await isSameDayCityProductAssigned(parseInt(sellerId), requirement)) {
    return { success: false, message: 'Seller already assigned for same date + same city + same product on this day' };
  }

  const activeAssignment = await RequirementAssignments.findOne({
    where: {
      requirement_id: requirementId,
      status: { [Op.in]: [0, 1, 2, 3, 6] },
    },
  });
  if (activeAssignment) {
    if (activeAssignment.seller_id === parseInt(sellerId)) {
      return { success: false, message: 'This seller already has the active assignment for this requirement' };
    }
    const oldPerf = await ensureSellerPerformance(activeAssignment.seller_id);
    await oldPerf.update({ auto_cancelled_leads: oldPerf.auto_cancelled_leads + 1 });
    await activeAssignment.update({
      status: 5,
      auto_cancelled_at: new Date(),
      reassignment_reason: 'admin_override',
    });
    await logActivity(
      requirementId,
      'seller_auto_cancelled',
      `Admin override: existing assignment to seller #${activeAssignment.seller_id} cancelled for re-assignment`,
      activeAssignment.seller_id,
      activeAssignment.id,
      ipAddress
    );
  }

  const alreadyAssigned = await RequirementAssignments.findOne({
    where: { requirement_id: requirementId, seller_id: sellerId },
  });
  if (alreadyAssigned) return { success: false, message: 'Seller was already assigned to this requirement' };

  const perf = await ensureSellerPerformance(sellerId);
  const config = await getSystemConfig();

  const assignmentNumber = requirement.assignment_count + 1;
  const assignment = await RequirementAssignments.create({
    requirement_id: requirementId,
    seller_id: sellerId,
    assignment_number: assignmentNumber,
    status: 0,
    assigned_at: new Date(),
  });

  await perf.update({ monthly_leads_used: perf.monthly_leads_used + 1, total_leads: perf.total_leads + 1 });
  await requirement.update({
    status: 1,
    current_assignment_id: assignment.id,
    assignment_count: assignmentNumber,
  });

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

  await requirement.update({ status: 4, current_assignment_id: null });
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

async function handleSellerResponse(assignmentId, sellerId, action, rejectionReason = null, ipAddress = null) {
  const assignment = await RequirementAssignments.findByPk(assignmentId, {
    include: [{ model: BuyerRequirements, as: 'requirement' }],
  });
  if (!assignment) return { success: false, message: 'Assignment not found' };
  if (assignment.seller_id !== sellerId) return { success: false, message: 'Unauthorized' };
  if (assignment.status !== 0 && assignment.status !== 1) {
    return { success: false, message: 'Assignment no longer active' };
  }

  const now = new Date();
  const responseTimeSeconds = Math.floor((now - new Date(assignment.assigned_at)) / 1000);

  if (action === 'respond' || action === 'accept') {
    const isAccept = action === 'accept';
    const newStatus = isAccept ? 3 : 2; // accept -> assignment Accepted (3)
    await assignment.update({
      status: newStatus,
      responded_at: now,
      accepted_at: isAccept ? now : null,
      response_time_seconds: responseTimeSeconds,
    });

    await logActivity(
      assignment.requirement_id,
      action === 'accept' ? 'seller_accepted' : 'seller_responded',
      `Seller ${action === 'accept' ? 'accepted' : 'responded'} (response time: ${responseTimeSeconds}s)`,
      sellerId,
      assignment.id
    );

    if (isAccept) {
      await assignment.requirement.update({ status: 2 }); // requirement -> Accepted (2)
      await logActivity(assignment.requirement_id, 'lead_accepted', `Requirement accepted by seller #${sellerId}`, sellerId, assignment.id);
    } else {
      await assignment.requirement.update({ status: 1 }); // responded but not accepted -> stays Assigned (1)
    }

    const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
    if (perf) {
      const config = await getSystemConfig();
      const slaSeconds = config.sla_minutes * 60;
      await perf.update({
        responded_leads: perf.responded_leads + 1,
        accepted_leads: isAccept ? perf.accepted_leads + 1 : perf.accepted_leads,
        total_response_time_seconds: perf.total_response_time_seconds + responseTimeSeconds,
        on_time_response_count: responseTimeSeconds <= slaSeconds
          ? perf.on_time_response_count + 1
          : perf.on_time_response_count,
      });
      await recalculateSellerPerformance(sellerId);
    }

    return { success: true, assignment };
  } else if (action === 'reject') {
    await assignment.update({
      status: 4,
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

    const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
    if (perf) {
      await perf.update({
        rejected_leads: perf.rejected_leads + 1,
      });
      await recalculateSellerPerformance(sellerId);
    }

    await assignment.requirement.update({ current_assignment_id: null });

    const requirement = assignment.requirement;

    if (requirement.assignment_count >= requirement.max_reassignment_attempts) {
      await requirement.update({ status: 5 });
      await logActivity(
        requirement.id,
        'no_seller_found',
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

    const reassignmentResult = await assignSellerToRequirement(requirement.id, ipAddress);
    if (!reassignmentResult.success) {
      await requirement.update({ status: 5 });
      await logActivity(
        requirement.id,
        'no_seller_found',
        reassignmentResult.message
          ? `No seller found after rejection (${reassignmentResult.message})`
          : 'No seller found after rejection'
      );
    }
    return { success: true };
  }

  return { success: false, message: 'Invalid action' };
}

// Seller marks an accepted lead as completed -> requirement Completed (5), assignment Completed (6)
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
  await assignment.update({ status: 6, completed_at: now });
  await assignment.requirement.update({ status: 3 }); // requirement -> Completed (3)

  await logActivity(
    assignment.requirement_id,
    'lead_completed',
    `Requirement marked as completed by seller #${sellerId}`,
    sellerId,
    assignment.id
  );

  const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
  if (perf) {
    await perf.update({ completed_leads: perf.completed_leads + 1 });
    await recalculateSellerPerformance(sellerId);
  }

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

async function processExpiredAssignments() {
  const config = await getSystemConfig();
  const slaMs = config.sla_minutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - slaMs);

  const expiredAssignments = await RequirementAssignments.findAll({
    where: {
      status: { [Op.in]: [0, 1] },
      assigned_at: { [Op.lt]: cutoffTime },
    },
    include: [{ model: BuyerRequirements, as: 'requirement', where: { is_delete: 0, status: { [Op.lt]: 5 } } }],
  });

  for (const assignment of expiredAssignments) {
    try {
      const requirement = assignment.requirement;
      if (!requirement || requirement.is_delete) continue;

      const currentActive = await RequirementAssignments.findOne({
        where: {
          requirement_id: requirement.id,
          status: { [Op.in]: [0, 1, 2, 3, 6] },
        },
      });
      if (!currentActive || currentActive.id !== assignment.id) continue;

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

      const perf = await SellerPerformance.findOne({ where: { seller_id: assignment.seller_id } });
      if (perf) {
        await perf.update({
          auto_cancelled_leads: perf.auto_cancelled_leads + 1,
        });
        await recalculateSellerPerformance(assignment.seller_id);
      }

      await requirement.update({ current_assignment_id: null });

      if (requirement.assignment_count >= requirement.max_reassignment_attempts) {
        await requirement.update({ status: 5 });
        await logActivity(
          requirement.id,
          'no_seller_found',
          `Seller did not respond within SLA (${config.sla_minutes} min); reassignment limit (${requirement.max_reassignment_attempts}) reached; lead closed`
        );
        continue;
      }

      await logActivity(
        requirement.id,
        'lead_reassigned',
        `Seller #${assignment.seller_id} did not respond within SLA (${config.sla_minutes} min); reassigning to next seller`,
        null,
        assignment.id
      );

      const reassignmentResult = await assignSellerToRequirement(requirement.id, requirement.buyer_ip);
      if (!reassignmentResult.success) {
        await requirement.update({ status: 5 });
        await logActivity(
          requirement.id,
          'no_seller_found',
          reassignmentResult.message || 'No eligible sellers left for reassignment'
        );
      }
    } catch (err) {
      console.error('processExpiredAssignments error for assignment', assignment.id, err.message);
    }
  }

  return expiredAssignments.length;
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
  notifySeller,
};
