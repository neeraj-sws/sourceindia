const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const BuyerRequirements = require('../models/BuyerRequirements');
const RequirementAssignments = require('../models/RequirementAssignments');
const RequirementActivityLog = require('../models/RequirementActivityLog');
const SellerPerformance = require('../models/SellerPerformance');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const SubCategories = require('../models/SubCategories');
const Categories = require('../models/Categories');
const Cities = require('../models/Cities');
const States = require('../models/States');
const Countries = require('../models/Countries');
const Units = require('../models/Units');
const { logActivity, getBuyerLocation, geocodeCity, reverseGeocodePostcode, getSystemConfig, ensureSellerPerformance, recalculateSellerPerformance, detectRequirementCategories, hasLeadPriority, getLeadPriorityTag } = require('../helpers/requirementHelper');
const { assignSellerToRequirement, handleSellerResponse, handleSellerComplete, handleSellerView } = require('../helpers/assignmentHelper');
const { withAssignedSeller } = require('../helpers/leadOwnershipHelper');
const { getLeadUsage } = require('../helpers/leadLimitHelper');
const { getSellerPerformanceDetailData } = require('../services/sellerPerformanceDetailService');

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip || '';
};

async function getUnits(req, res) {
  try {
    const units = await Units.findAll({
      attributes: ['id', 'name'],
      where: { is_active: 1 },
      order: [['name', 'ASC']],
    });
    return res.json(units);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function searchCities(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const esc = q.replace(/[%_]/g, (m) => `\\${m}`);
    const where = {
      name: { [Op.like]: `%${esc}%` },
    };
    const cities = await Cities.findAll({
      where,
      include: [{
        model: States, as: 'States',
        attributes: ['id', 'name'],
        required: true,
        include: [{
          model: Countries, as: 'Countries',
          attributes: [],
          required: true,
          where: { id: 101 },
        }],
      }],
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      limit: 20,
    });
    return res.json(cities);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createRequirement(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      product_keyword_id, item_subcategory_id, item_category_id,
      subcategory_id, category_id,
      product_name_snapshot, quantity, quantity_unit,
      description, supplier_preference, preference_states,
      buyer_name, buyer_email, buyer_phone, buyer_company, buyer_country_code,
      buyer_city, buyer_state, buyer_pincode,
    } = req.body;

    if (!product_name_snapshot || !product_name_snapshot.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Product/Service name is required' });
    }

    const ipAddress = getClientIp(req);
    const buyerLocation = await getBuyerLocation(ipAddress);
    const systemConfig = await getSystemConfig();

    // If a logged-in buyer/user posted this, resolve their profile so the
    // requirement keeps real identity (JWT payload only carries id/email/is_seller).
    let buyerIdentity = {};
    if (req.user && req.user.id) {
      const buyerUser = await Users.findByPk(req.user.id, {
        include: [{ model: CompanyInfo, as: 'company_info', attributes: ['organization_name'] }],
        attributes: ['id', 'fname', 'lname', 'email', 'mobile', 'user_company', 'company_id'],
      });
      if (buyerUser) {
        const fullName = `${buyerUser.fname || ''} ${buyerUser.lname || ''}`.trim();
        buyerIdentity = {
          buyer_id: buyerUser.id,
          buyer_name: fullName,
          buyer_email: buyerUser.email || '',
          buyer_phone: buyerUser.mobile || '',
          buyer_company: buyerUser.user_company || buyerUser.company_info?.organization_name || '',
        };
      }
    }

    // Where the product field came from. Derived from what the buyer actually did
    // rather than trusted from the request body: a submitted product_keyword_id
    // means they picked a row out of the product list ("admin"), an absent one
    // means they typed a name of their own that never came from the list
    // ("other"). Computed BEFORE detectRequirementCategories below, so the fuzzy
    // keyword lookup that still runs for custom names never rewrites the
    // recorded source - "other" keeps meaning "typed by the buyer".
    const productEntryType = product_keyword_id ? 'admin' : 'other';

    const detected = product_keyword_id
      ? {}
      : await detectRequirementCategories(product_name_snapshot);

    const finalCity = buyer_city || buyerLocation.buyer_city || null;
    const finalState = buyer_state || buyerLocation.buyer_state || null;

    // An explicit pincode from an API caller wins; otherwise it is derived below.
    const submittedPincode = String(buyer_pincode || '').replace(/\D/g, '').slice(0, 10) || null;

    // If IP geolocation gave no lat/lon, geocode the selected city so distance works
    let geo = { buyer_latitude: buyerLocation.buyer_latitude, buyer_longitude: buyerLocation.buyer_longitude };
    if (!geo.buyer_latitude || !geo.buyer_longitude) {
      const g = await geocodeCity(finalCity, finalState);
      if (g) geo = { buyer_latitude: g.latitude, buyer_longitude: g.longitude };
    }

    // Now that we have coordinates, derive the pincode the same way - silently,
    // with no buyer input. Best-effort; stays null if the lookup fails.
    const finalPincode = submittedPincode
      || await reverseGeocodePostcode(geo.buyer_latitude, geo.buyer_longitude);

    const requirement = await BuyerRequirements.create({
      buyer_id: buyerIdentity.buyer_id || null,
      buyer_name: buyer_name || buyerIdentity.buyer_name || '',
      buyer_email: buyer_email || buyerIdentity.buyer_email || '',
      buyer_phone: buyer_phone || buyerIdentity.buyer_phone || '',
      buyer_company: buyer_company || buyerIdentity.buyer_company || '',
      buyer_country_code: buyer_country_code || 'IN^91',
      product_keyword_id: product_keyword_id || detected.product_keyword_id || null,
      type: productEntryType,
      item_subcategory_id: item_subcategory_id || detected.item_subcategory_id || null,
      item_category_id: item_category_id || detected.item_category_id || null,
      subcategory_id: subcategory_id || detected.subcategory_id || null,
      category_id: category_id || detected.category_id || null,
      product_name_snapshot: product_name_snapshot.trim(),
      quantity: quantity || null,
      quantity_unit: quantity_unit || null,
      description: description || null,
      supplier_preference: supplier_preference || 'Anywhere in India',
      preference_states: preference_states ? JSON.stringify(preference_states) : null,
      buyer_ip: ipAddress,
      ...buyerLocation,
      ...geo,
      buyer_city: finalCity,
      buyer_state: finalState,
      buyer_pincode: finalPincode,
      status: 0,
      max_reassignment_attempts: systemConfig.max_reassignment_attempts,
    }, { transaction: t });

    await logActivity(requirement.id, 'requirement_created', `Requirement created by ${requirement.buyer_name || 'guest'}`, null, null, ipAddress, t);
    await t.commit();

    assignSellerToRequirement(requirement.id, ipAddress).catch(err => {
      console.error('Background assign error:', err.message);
    });

    return res.status(201).json({
      message: 'Requirement submitted successfully',
      data: { id: requirement.id, uuid: requirement.uuid, status: requirement.status },
    });
  } catch (err) {
    await t.rollback();
    console.error('createRequirement error:', err);
    return res.status(500).json({ message: 'Failed to create requirement', error: err.message });
  }
}

async function getRequirementById(req, res) {
  try {
    const { id } = req.params;
    const requirement = await BuyerRequirements.findByPk(id, {
      include: [
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: Users, as: 'buyer', attributes: ['id', 'fname', 'lname', 'email', 'mobile'] },
        {
          model: RequirementAssignments, as: 'assignments',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
          order: [['assignment_number', 'ASC']],
        },
      ],
    });
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });
    return res.json(requirement);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getMyRequirements(req, res) {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'created_at', sort = 'DESC' } = req.query;

    const where = { is_delete: 0, buyer_id: req.user.id };
    if (search) {
      where[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await BuyerRequirements.count({ where });
    const rows = await BuyerRequirements.findAll({
      where,
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: RequirementAssignments, as: 'assignments', attributes: ['id', 'status', 'seller_id', 'is_reassigned', 'assignment_note', 'assigned_at', 'accepted_at', 'completed_at'],
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
        },
      ],
      order: [[sortBy, sort.toUpperCase()]],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      // Only the seller that actually holds the lead is exposed as the assignee.
      data: withAssignedSeller(rows),
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementActivityLog(req, res) {
  try {
    const { id } = req.params;
    const logs = await RequirementActivityLog.findAll({
      where: { requirement_id: id },
      include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'] }],
      order: [['created_at', 'ASC']],
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerBuyLeads(req, res) {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 25, search = '', status: statusFilter } = req.query;

    const where = { seller_id: sellerId };
    if (statusFilter !== undefined && statusFilter !== '') {
      where.status = parseInt(statusFilter);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await RequirementAssignments.findAndCountAll({
      where,
      include: [{
        model: BuyerRequirements,
        as: 'requirement',
        where: { is_delete: 0 },
        required: true,
        include: [
          { model: Categories, as: 'category', attributes: ['id', 'name'] },
          { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
          { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
          { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
          { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        ],
      }],
      order: [['assigned_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      data: rows,
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getBuyLeadDetail(req, res) {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const assignment = await RequirementAssignments.findOne({
      where: { id, seller_id: sellerId },
      include: [{
        model: BuyerRequirements,
        as: 'requirement',
        include: [
          { model: Categories, as: 'category', attributes: ['id', 'name'] },
          { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
          { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
          { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
          { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        ],
      }],
    });
    if (!assignment) return res.status(404).json({ message: 'Lead not found' });

    if (assignment.status === 0) {
      await handleSellerView(assignment.id, sellerId);
      assignment.status = 1;
    }

    return res.json(assignment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function sellerRespondToLead(req, res) {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;
    const sellerId = req.user.id;

    if (!['accept', 'reject', 'respond'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const result = await handleSellerResponse(parseInt(id), sellerId, action, rejection_reason, req.ip);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Action completed successfully', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function sellerCompleteLead(req, res) {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const result = await handleSellerComplete(parseInt(id), sellerId);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Lead marked as completed', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerPerformance(req, res) {
  try {
    const sellerId = req.user.id;
    const perf = await ensureSellerPerformance(sellerId);
    await recalculateSellerPerformance(sellerId);
    const updated = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
    const data = updated.toJSON ? updated.toJSON() : updated;
    data.score_breakdown = data.score_breakdown ? (() => { try { return JSON.parse(data.score_breakdown); } catch (e) { return null; } })() : null;
    const score = Number(data.overall_performance_score) || 0;
    data.overall_performance_score = score;
    data.has_lead_priority = hasLeadPriority(score);
    data.lead_priority = getLeadPriorityTag(score);
    data.search_appearance_count = Number(data.search_appearance_count) || 0;
    data.late_response_count = Math.max(0, (Number(data.responded_leads) || 0) - (Number(data.on_time_response_count) || 0));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerLeadCounts(req, res) {
  try {
    const sellerId = req.user.id;
    const counts = await RequirementAssignments.findAll({
      where: { seller_id: sellerId },
      attributes: [
        'status',
        [fn('COUNT', col('assignment_id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const result = { total: 0, assigned: 0, viewed: 0, responded: 0, accepted: 0, rejected: 0, auto_cancelled: 0, completed: 0 };
    counts.forEach(c => {
      result.total += parseInt(c.count);
      const statusMap = { 0: 'assigned', 1: 'viewed', 2: 'responded', 3: 'accepted', 4: 'rejected', 5: 'auto_cancelled', 6: 'completed' };
      if (statusMap[c.status]) result[statusMap[c.status]] = parseInt(c.count);
    });

    const perf = await ensureSellerPerformance(sellerId);
    const config = await getSystemConfig();

    // "Monthly Used" is read from seller_lead_count - the same row the quota is
    // actually enforced against in seller selection - so this card, the admin
    // list and the admin detail page can never disagree. It counts leads the
    // seller accepted or rejected; pending assignments and SLA auto-cancels are
    // not counted.
    const usage = await getLeadUsage(sellerId, config);
    result.monthly_used = usage.leads_received;
    result.monthly_limit = usage.limit_at_period_start;

    const score = Number(perf.overall_performance_score) || 0;
    result.overall_performance_score = score;
    result.has_lead_priority = hasLeadPriority(score);
    result.lead_priority = getLeadPriorityTag(score);
    result.search_appearance_count = Number(perf.search_appearance_count) || 0;
    result.on_time_response_count = Number(perf.on_time_response_count) || 0;
    result.on_time_response_percentage = Number(perf.on_time_response_percentage) || 0;
    result.late_response_count = Math.max(0, (Number(perf.responded_leads) || 0) - (Number(perf.on_time_response_count) || 0));
    result.auto_cancelled = Number(perf.auto_cancelled_leads) || result.auto_cancelled;
    result.completed_performance = Number(perf.completed_leads) || 0;
    result.sla_minutes = config.sla_minutes;

    result.period_used = usage.leads_received;
    result.period_limit = usage.limit_at_period_start;
    result.period_remaining = usage.remaining;
    result.period_start = usage.period_start;
    result.period_end = usage.period_end;
    result.period_type = usage.period_type;

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerHistory(req, res) {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 25, search = '', status: statusFilter, from, to } = req.query;

    const where = { seller_id: sellerId };
    if (statusFilter !== undefined && statusFilter !== '') {
      where.status = parseInt(statusFilter);
    }
    if (from || to) {
      where.assigned_at = {};
      if (from) where.assigned_at[Op.gte] = new Date(from);
      if (to) where.assigned_at[Op.lte] = new Date(to);
    }

    const reqWhere = { is_delete: 0 };
    if (search) {
      reqWhere[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { buyer_name: { [Op.like]: `%${search}%` } },
        { buyer_company: { [Op.like]: `%${search}%` } },
        { buyer_email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await RequirementAssignments.findAndCountAll({
      where,
      include: [{
        model: BuyerRequirements,
        as: 'requirement',
        where: reqWhere,
        required: true,
        include: [
          { model: Categories, as: 'category', attributes: ['id', 'name'] },
          { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
          { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
          { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
          { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        ],
      }],
      order: [['assigned_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // On-time is judged against the SLA currently configured, same as the stored
    // on_time_response_count counter. A rejection is a seller action but is not
    // counted as a "response to" the lead, so it is reported separately.
    const config = await getSystemConfig();
    const slaSeconds = (Number.parseInt(config.sla_minutes, 10) || 0) * 60;
    const data = rows.map((row) => {
      const plain = typeof row.toJSON === 'function' ? row.toJSON() : { ...row };
      const responseSeconds = Number(plain.response_time_seconds);
      const hasResponse = plain.responded_at != null && Number.isFinite(responseSeconds);
      plain.response_time_minutes = hasResponse ? Math.round((responseSeconds / 60) * 10) / 10 : null;
      plain.is_on_time = hasResponse ? responseSeconds <= slaSeconds : null;
      plain.sla_minutes = config.sla_minutes;
      return plain;
    });

    return res.json({
      data,
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function submitBuyerFeedback(req, res) {
  try {
    const buyerId = req.user ? req.user.id : null;
    if (!buyerId) return res.status(401).json({ message: 'Authentication required' });

    const { rating, feedback } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 3) {
      return res.status(400).json({ message: 'Feedback must be at least 3 characters long' });
    }

    const requirement = await BuyerRequirements.findOne({
      where: { id: req.params.id, buyer_id: buyerId, is_delete: 0 },
      include: [{
        model: RequirementAssignments,
        as: 'assignments',
        where: { status: 6 },
        required: true,
        attributes: ['id', 'seller_id', 'status'],
      }],
    });

    if (!requirement) return res.status(404).json({ message: 'Completed requirement not found' });
    if (requirement.status !== 3) {
      return res.status(400).json({ message: 'Only completed requirements can be rated' });
    }
    if (requirement.buyer_rating != null) {
      return res.status(400).json({ message: 'Feedback already submitted for this requirement' });
    }

    const assignment = requirement.assignments[0];
    const sellerId = assignment.seller_id;

    await requirement.update({
      buyer_rating: ratingNum,
      buyer_feedback: feedback.trim(),
    });

    const perf = await SellerPerformance.findOne({ where: { seller_id: sellerId } });
    if (perf) {
      const newCount = (perf.buyer_rating_count || 0) + 1;
      const newAvg = perf.buyer_rating_count > 0
        ? Math.round(((perf.buyer_rating_avg * perf.buyer_rating_count + ratingNum) / newCount) * 100) / 100
        : ratingNum;
      await perf.update({ buyer_rating_avg: newAvg, buyer_rating_count: newCount });
      await recalculateSellerPerformance(sellerId);
    }

    await RequirementActivityLog.create({
      requirement_id: requirement.id,
      assignment_id: assignment.id,
      seller_id: sellerId,
      action: 'buyer_feedback',
      details: `Buyer rated ${ratingNum}/5`,
      ip_address: getClientIp(req),
    });

    return res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getBuyerRequirementHistory(req, res) {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 25, search = '', status: statusFilter, from, to } = req.query;

    const where = { buyer_id: buyerId, is_delete: 0 };
    if (statusFilter !== undefined && statusFilter !== '') {
      where.status = parseInt(statusFilter);
    }
    if (search) {
      where[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { buyer_name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at[Op.gte] = new Date(from);
      if (to) where.created_at[Op.lte] = new Date(to);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const count = await BuyerRequirements.count({ where });
    const rows = await BuyerRequirements.findAll({
      where,
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        {
          model: RequirementAssignments, as: 'assignments',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      // Only the seller that actually holds the lead is exposed as the assignee.
      data: withAssignedSeller(rows),
      totalRecords: count,
      filteredRecords: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/**
 * Seller-facing twin of the admin seller-performance detail report.
 *
 * The seller id comes exclusively from the verified JWT (authMiddleware), never
 * from a path param, query, or body field, so a seller can only ever read their
 * own report. The metrics themselves are computed by the same shared service the
 * admin detail endpoint uses, which keeps both sides showing identical numbers.
 */
async function getSellerMyPerformance(req, res) {
  try {
    const sellerId = req.user.id;
    if (!sellerId) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    // Guarantees a performance row exists so a brand-new seller sees a report
    // instead of a 404.
    await ensureSellerPerformance(sellerId);

    // Feedback is admin-only surface, so it is skipped here to avoid loading
    // buyer details the seller page never renders.
    const result = await getSellerPerformanceDetailData(sellerId, req.query, { includeFeedback: false });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createRequirement,
  searchCities,
  getUnits,
  getRequirementById,
  getMyRequirements,
  getRequirementActivityLog,
  getSellerBuyLeads,
  getBuyLeadDetail,
  sellerRespondToLead,
  sellerCompleteLead,
  getSellerPerformance,
  getSellerMyPerformance,
  getSellerLeadCounts,
  getSellerHistory,
  getBuyerRequirementHistory,
  submitBuyerFeedback,
};
