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
const SiteSettings = require('../models/SiteSettings');
const { logActivity, getSystemConfig } = require('../helpers/requirementHelper');
const { manualAssignSellerToRequirement, adminChangeRequirementStatus, adminCloseRequirement } = require('../helpers/assignmentHelper');
const { isSameDayCityProductAssigned, findEligibleSellers, enrichSellers, normalizeText } = require('../helpers/sellerEligibilityHelper');

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip || '';
};

async function getAllRequirements(req, res) {
  try {
    const { page = 1, limit = 25, search = '', sortBy = 'created_at', sort = 'DESC', status, category_id, seller_id, city } = req.query;

    const where = { is_delete: 0 };
    if (status !== undefined && status !== '') where.status = parseInt(status);
    if (category_id) where.category_id = parseInt(category_id);
    if (city) where.buyer_city = { [Op.like]: `%${city}%` };
    if (search) {
      where[Op.or] = [
        { product_name_snapshot: { [Op.like]: `%${search}%` } },
        { buyer_name: { [Op.like]: `%${search}%` } },
        { buyer_email: { [Op.like]: `%${search}%` } },
        { buyer_company: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await BuyerRequirements.findAndCountAll({
      where,
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        {
          model: RequirementAssignments, as: 'assignments',
          required: false,
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
    console.error('getAllRequirements error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementDetailAdmin(req, res) {
  try {
    const { id } = req.params;
    const requirement = await BuyerRequirements.findByPk(id, {
      include: [
        { model: Categories, as: 'category', attributes: ['id', 'name'] },
        { model: SubCategories, as: 'subCategory', attributes: ['id', 'name'] },
        { model: ItemCategory, as: 'itemCategory', attributes: ['id', 'name'] },
        { model: ItemSubCategory, as: 'itemSubCategory', attributes: ['id', 'name'] },
        { model: ProductKeyword, as: 'keyword', attributes: ['id', 'name'] },
        {
          model: RequirementAssignments, as: 'assignments',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname', 'email'],
            include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
          }],
          order: [['assignment_number', 'ASC']],
        },
        {
          model: RequirementActivityLog, as: 'activity_logs',
          include: [{ model: Users, as: 'seller', attributes: ['id', 'fname', 'lname'] }],
          order: [['created_at', 'ASC']],
        },
      ],
    });
    if (!requirement) return res.status(404).json({ message: 'Requirement not found' });
    return res.json(requirement);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementCounts(req, res) {
  try {
    const counts = await BuyerRequirements.findAll({
      where: { is_delete: 0 },
      attributes: [
        'status',
        [fn('COUNT', col('requirement_id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const total = await BuyerRequirements.count({ where: { is_delete: 0 } });
    const result = { total, pending: 0, assigned: 0, in_progress: 0, responded: 0, accepted: 0, completed: 0, closed: 0, no_seller_found: 0 };
    const statusMap = { 0: 'pending', 1: 'assigned', 2: 'in_progress', 3: 'responded', 4: 'accepted', 5: 'completed', 6: 'closed', 8: 'no_seller_found' };
    counts.forEach(c => {
      if (statusMap[c.status]) result[statusMap[c.status]] = parseInt(c.count);
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellerPerformanceAdmin(req, res) {
  try {
    const { page = 1, limit = 25, search = '' } = req.query;
    const where = {};
    if (search) {
      const matchingUsers = await Users.findAll({
        where: {
          [Op.or]: [
            { fname: { [Op.like]: `%${search}%` } },
            { lname: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        },
        attributes: ['id'],
        raw: true,
      });
      where.seller_id = { [Op.in]: matchingUsers.map(u => u.id) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await SellerPerformance.findAndCountAll({
      where,
      include: [{
        model: Users, as: 'seller',
        attributes: ['id', 'fname', 'lname', 'email'],
        include: [{ model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] }],
      }],
      order: [['seller_id', 'ASC']],
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

async function updateSellerPerformanceSettings(req, res) {
  try {
    const { id } = req.params;
    const { lead_receiving_enabled, monthly_leads_limit } = req.body;

    const perf = await SellerPerformance.findOne({ where: { seller_id: parseInt(id) } });
    if (!perf) return res.status(404).json({ message: 'Seller performance record not found' });

    const updates = {};
    if (lead_receiving_enabled !== undefined) updates.lead_receiving_enabled = lead_receiving_enabled ? 1 : 0;
    await perf.update(updates);

    return res.json({ message: 'Settings updated', data: perf });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateSystemConfig(req, res) {
  try {
    const { lead_sla_minutes, lead_monthly_limit, lead_candidate_pool_size } = req.body;
    const updates = {};
    const fields = { lead_sla_minutes, lead_monthly_limit, lead_candidate_pool_size };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
        const existing = await SiteSettings.findOne({ where: { meta_key: key } });
        if (existing) {
          await existing.update({ meta_value: String(value) });
        } else {
          await SiteSettings.create({ meta_key: key, meta_value: String(value) });
        }
      }
    }

    return res.json({ message: 'Configuration updated', data: updates });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSystemConfigAdmin(req, res) {
  try {
    const settings = await SiteSettings.findAll({
      where: {
        meta_key: { [Op.in]: ['lead_sla_minutes', 'lead_monthly_limit', 'lead_candidate_pool_size'] },
      },
      raw: true,
    });
    const config = {};
    settings.forEach(s => { config[s.meta_key] = s.meta_value; });
    return res.json({
      lead_sla_minutes: parseInt(config.lead_sla_minutes) || 120,
      lead_monthly_limit: parseInt(config.lead_monthly_limit) || 6,
      lead_candidate_pool_size: parseInt(config.lead_candidate_pool_size) || 15,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getRequirementChartData(req, res) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const data = await BuyerRequirements.findAll({
      where: {
        is_delete: 0,
        created_at: { [Op.gte]: startDate },
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('requirement_id')), 'count'],
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getSellersForAssign(req, res) {
  try {
    const { search = '', requirementId } = req.query;
    const where = { is_seller: 1, status: 1, is_delete: 0, is_approve: 1 };
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      where[Op.or] = [
        { fname: { [Op.like]: like } },
        { lname: { [Op.like]: like } },
        { email: { [Op.like]: like } },
        { user_company: { [Op.like]: like } },
      ];
    }
    const sellers = await Users.findAll({
      where,
      attributes: ['id', 'fname', 'lname', 'email', 'mobile'],
      include: [
        { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
        {
          model: Cities, as: 'city_data',
          attributes: ['id', 'name'],
          include: [{ model: States, as: 'States', attributes: ['name'] }],
        },
        { model: States, as: 'state_data', attributes: ['name'] },
      ],
      limit: 50,
    });

    const requirement = requirementId
      ? await BuyerRequirements.findByPk(parseInt(requirementId))
      : null;
    const useRequirement = requirement && !requirement.is_delete;

    let excluded = new Set();
    const topBlock = []; // sellers holding the required product, same-city -> same-state -> India, nearest first
    if (useRequirement) {
      for (const s of sellers) {
        if (await isSameDayCityProductAssigned(s.id, requirement)) excluded.add(Number(s.id));
      }
      if (!search.trim() && requirement.product_keyword_id) {
        const config = await getSystemConfig();
        const candidates = await findEligibleSellers(requirement, config.candidate_pool_size);
        const enriched = await enrichSellers(candidates, requirement);
        const reqState = normalizeText(requirement.buyer_state);
        const tiered = enriched
          .filter((e) => !excluded.has(Number(e.seller_id)))
          .map((e) => ({
            e,
            tier: e.same_city ? 0
              : (reqState && normalizeText(e.state_name) === reqState ? 1 : 2),
          }))
          .sort((a, b) => (
            a.tier - b.tier
            || ((a.e.distance_km ?? Infinity) - (b.e.distance_km ?? Infinity))
          ));

        if (tiered.length > 0) {
          const topUsers = await Users.findAll({
            where: { id: { [Op.in]: tiered.map((t) => t.e.seller_id) } },
            attributes: ['id', 'fname', 'lname', 'email', 'mobile'],
            include: [
              { model: CompanyInfo, as: 'company_info', attributes: ['id', 'organization_name'] },
              {
                model: Cities, as: 'city_data',
                attributes: ['id', 'name'],
                include: [{ model: States, as: 'States', attributes: ['name'] }],
              },
              { model: States, as: 'state_data', attributes: ['name'] },
            ],
          });
          const byId = new Map(topUsers.map((u) => [Number(u.id), u]));
          for (const t of tiered) {
            const u = byId.get(Number(t.e.seller_id));
            if (u) topBlock.push(u);
          }
        }
      }
    }

    const topIds = new Set(topBlock.map((u) => Number(u.id)));
    const bottomBlock = sellers.filter((s) => !excluded.has(Number(s.id)) && !topIds.has(Number(s.id)));
    return res.json([...topBlock, ...bottomBlock]);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminAssignSeller(req, res) {
  try {
    const { id } = req.params;
    const { seller_id } = req.body;
    if (!seller_id) return res.status(400).json({ message: 'seller_id is required' });
    const ipAddress = getClientIp(req);
    const result = await manualAssignSellerToRequirement(parseInt(id), parseInt(seller_id), ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Seller assigned successfully', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminUpdateRequirementStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status === undefined) return res.status(400).json({ message: 'status is required' });
    const ipAddress = getClientIp(req);
    const result = await adminChangeRequirementStatus(parseInt(id), status, ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Status updated successfully', data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function adminCloseRequirementAction(req, res) {
  try {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const result = await adminCloseRequirement(parseInt(id), ipAddress);
    if (!result.success) return res.status(400).json({ message: result.message });
    return res.json({ message: 'Requirement closed successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAllRequirements,
  getRequirementDetailAdmin,
  getRequirementCounts,
  getSellersForAssign,
  adminAssignSeller,
  adminUpdateRequirementStatus,
  adminCloseRequirementAction,
  getSellerPerformanceAdmin,
  updateSellerPerformanceSettings,
  updateSystemConfig,
  getSystemConfigAdmin,
  getRequirementChartData,
};
