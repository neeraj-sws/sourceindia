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
const { logActivity, getBuyerLocation, geocodeCity, getSystemConfig, ensureSellerPerformance, recalculateSellerPerformance, detectRequirementCategories } = require('../helpers/requirementHelper');
const { assignSellerToRequirement, handleSellerResponse, handleSellerComplete, handleSellerView } = require('../helpers/assignmentHelper');

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip || '';
};

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
      subcategory_id, category_id, product_type,
      product_name_snapshot, quantity, quantity_unit,
      description, supplier_preference, preference_states,
      buyer_name, buyer_email, buyer_phone, buyer_company, buyer_country_code,
      buyer_city, buyer_state,
    } = req.body;

    if (!product_name_snapshot || !product_name_snapshot.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Product/Service name is required' });
    }

    const ipAddress = getClientIp(req);
    const buyerLocation = await getBuyerLocation(ipAddress);

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

    const detected = product_keyword_id
      ? {}
      : await detectRequirementCategories(product_name_snapshot);

    const finalCity = buyer_city || buyerLocation.buyer_city || null;
    const finalState = buyer_state || buyerLocation.buyer_state || null;

    // If IP geolocation gave no lat/lon, geocode the selected city so distance works
    let geo = { buyer_latitude: buyerLocation.buyer_latitude, buyer_longitude: buyerLocation.buyer_longitude };
    if (!geo.buyer_latitude || !geo.buyer_longitude) {
      const g = await geocodeCity(finalCity, finalState);
      if (g) geo = { buyer_latitude: g.latitude, buyer_longitude: g.longitude };
    }

    const requirement = await BuyerRequirements.create({
      buyer_id: buyerIdentity.buyer_id || null,
      buyer_name: buyer_name || buyerIdentity.buyer_name || '',
      buyer_email: buyer_email || buyerIdentity.buyer_email || '',
      buyer_phone: buyer_phone || buyerIdentity.buyer_phone || '',
      buyer_company: buyer_company || buyerIdentity.buyer_company || '',
      buyer_country_code: buyer_country_code || 'IN^91',
      product_keyword_id: product_keyword_id || detected.product_keyword_id || null,
      item_subcategory_id: item_subcategory_id || detected.item_subcategory_id || null,
      item_category_id: item_category_id || detected.item_category_id || null,
      subcategory_id: subcategory_id || detected.subcategory_id || null,
      category_id: category_id || detected.category_id || null,
      product_type: product_type || 2,
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
      status: 0,
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

    const where = { is_delete: 0 };
    if (search) {
      where[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await BuyerRequirements.findAndCountAll({
      where,
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: RequirementAssignments, as: 'assignments', attributes: ['id', 'status', 'seller_id'],
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
    return res.json(updated);
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
    result.monthly_used = perf.monthly_leads_used;
    result.monthly_limit = config.monthly_limit;

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createRequirement,
  searchCities,
  getRequirementById,
  getMyRequirements,
  getRequirementActivityLog,
  getSellerBuyLeads,
  getBuyLeadDetail,
  sellerRespondToLead,
  sellerCompleteLead,
  getSellerPerformance,
  getSellerLeadCounts,
};
