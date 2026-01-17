const express = require('express');
const router = express.Router();
const CompanyInfo = require('../models/CompanyInfo');

// Admin: Get all companies (id, organization_name, organization_slug)
router.get('/all', async (req, res) => {
    try {
        const companies = await CompanyInfo.findAll({ attributes: ['id', 'organization_name', 'organization_slug'] });
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
