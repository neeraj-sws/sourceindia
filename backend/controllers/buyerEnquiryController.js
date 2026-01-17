// New: Admin Buyer Enquiry List (for new route)
exports.getAdminBuyerEnquiryList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const user_id = req.query.user_id || '';
        const company_id = req.query.company_id || '';
        const sortBy = req.query.sortBy || 'id';
        const sort = req.query.sort || 'DESC';

        const where = {};
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { message: { [Op.like]: `%${search}%` } }
            ];
        }
        if (user_id) {
            where.user_id = user_id;
        }

        // For company filter, need to filter through include

        const senderInclude = {
            model: Users,
            as: 'sender',
            attributes: ['id', 'fname', 'lname', 'company_id'],
            include: [
                {
                    model: CompanyInfo,
                    as: 'company_info',
                    attributes: ['id', 'organization_name', 'organization_slug']
                }
            ]
        };
        if (company_id) {
            senderInclude.where = { company_id };
        }

        const receiverInclude = {
            model: Users,
            as: 'receiver',
            attributes: ['id', 'fname', 'lname', 'company_id'],
            include: [
                {
                    model: CompanyInfo,
                    as: 'company_info',
                    attributes: ['id', 'organization_name', 'organization_slug']
                }
            ]
        };

        const { count, rows } = await BuyerEnquiry.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sort]],
            include: [senderInclude, receiverInclude]
        });

        res.status(200).json({
            data: rows,
            filteredRecords: count,
            totalRecords: count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Admin: Get all Buyer Enquiries with user and company info, filters, and pagination
exports.getAdminBuyerEnquiries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const user_id = req.query.user_id || '';
        const company_id = req.query.company_id || '';
        const sortBy = req.query.sortBy || 'id';
        const sort = req.query.sort || 'DESC';

        const where = {};
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { message: { [Op.like]: `%${search}%` } }
            ];
        }
        if (user_id) {
            where.user_id = user_id;
        }

        // For company filter, need to filter through include
        const senderInclude = {
            model: Users,
            as: 'sender',
            attributes: ['id', 'fname', 'lname', 'company_id'],
            include: [
                {
                    model: CompanyInfo,
                    as: 'company_info',
                    attributes: ['id', 'organization_name', 'organization_slug']
                }
            ]
        };
        if (company_id) {
            senderInclude.where = { company_id };
        }

        const receiverInclude = {
            model: Users,
            as: 'receiver',
            attributes: ['id', 'fname', 'lname', 'company_id'],
            include: [
                {
                    model: CompanyInfo,
                    as: 'company_info',
                    attributes: ['id', 'organization_name', 'organization_slug']
                }
            ]
        };

        const { count, rows } = await BuyerEnquiry.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, sort]],
            include: [senderInclude, receiverInclude]
        });

        res.status(200).json({
            data: rows,
            filteredRecords: count,
            totalRecords: count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const { Op } = require('sequelize');
const BuyerEnquiry = require('../models/BuyerEnquiry');
const Users = require('../models/Users');
const CompanyInfo = require('../models/CompanyInfo');

// Get Buyer Enquiries for a specific user
exports.getUserBuyerEnquiries = async (req, res) => {
    try {
        const user_id = req.query.user_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const where = { user_id };
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { message: { [Op.like]: `%${search}%` } }
            ];
        }
        if (status) {
            where.status = status;
        }

        const { count, rows } = await BuyerEnquiry.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Users,
                    as: 'receiver',
                    include: [
                        {
                            model: CompanyInfo,
                            as: 'company_info',
                            attributes: ['organization_name', 'organization_slug']
                        }
                    ]
                }
            ]
        });

        res.status(200).json({
            data: rows,
            filteredRecords: count,
            totalRecords: count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
