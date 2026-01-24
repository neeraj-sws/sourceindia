const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');
const SellerCategory = require('../models/SellerCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const fs = require('fs');
const path = require('path');

async function getSiteConfig() {
    const settings = await SiteSettings.findAll({
        where: {
            meta_key: {
                [Op.in]: [
                    'title',
                    'site_email',
                    'smtp_server_address',
                    'smtp_port',
                    'smtp_username',
                    'smtp_password',
                    'logo_file_id',
                ],
            },
        },
        attributes: ['meta_key', 'meta_value'],
    });

    const config = Object.fromEntries(settings.map(s => [s.meta_key, s.meta_value]));

    // If logo_file_id is present, fetch logo_file path
    const ROOT_URL = process.env.ROOT_URL || 'https://sourceindia-electronics.com/';
    if (config.logo_file_id) {
        try {
            const UploadImage = require('../models/UploadImage');
            const logoImage = await UploadImage.findByPk(config.logo_file_id);
            if (logoImage && logoImage.file) {
                // Prepend ROOT_URL if not already absolute
                config.logo_file = logoImage.file.startsWith('http')
                    ? logoImage.file
                    : ROOT_URL.replace(/\/$/, '') + '/' + logoImage.file.replace(/^\//, '');
            }
        } catch (e) {
            // ignore error
        }
    }
    // Fallback if no logo_file found
    if (!config.logo_file) {
        config.logo_file = ROOT_URL.replace(/\/$/, '') + '/logo.png';
    }
    return config;
}

async function getTransporter() {
    const siteConfig = await getSiteConfig();

    const transporter = nodemailer.createTransport({
        host: siteConfig['smtp_server_address'],
        port: siteConfig['smtp_port'],
        secure: false, // usually false for port 587
        auth: {
            user: siteConfig['smtp_username'],
            pass: siteConfig['smtp_password'],
        },
        tls: {
            rejectUnauthorized: false,   // <-- IMPORTANT FIX
        }
    });

    return { transporter, siteConfig, buildEmailHtml };
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

async function generateUniqueSlug(model, name) {
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (await model.findOne({ where: { organization_slug: slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

async function getCategoryNames(user) {
    if (!user || !user.company_info) {
        return { category_sell_names: '', sub_category_names: '' };
    }

    // Get seller’s categories
    const sellerCategories = await SellerCategory.findAll({
        where: { user_id: user.id },
        attributes: ["category_id", "subcategory_id"],
        raw: true,
    });

    // Extract unique IDs
    const categoryIds = [...new Set(sellerCategories.map(item => item.category_id).filter(Boolean))];
    const subCategoryIds = [...new Set(sellerCategories.map(item => item.subcategory_id).filter(Boolean))];

    // ✅ Fetch actual names from DB
    const [allCategories, allSubCategories] = await Promise.all([
        categoryIds.length ? Categories.findAll({ where: { id: { [Op.in]: categoryIds } }, attributes: ['id', 'name'], raw: true }) : [],
        subCategoryIds.length ? SubCategories.findAll({ where: { id: { [Op.in]: subCategoryIds } }, attributes: ['id', 'name'], raw: true }) : [],
    ]);

    // Map names
    const categoryNames = allCategories.map(c => c.name).join(', ');
    const subCategoryNames = allSubCategories.map(sc => sc.name).join(', ');

    // Optional: attach to user object
    user.company_info.category_sell_names = categoryNames;
    user.company_info.sub_category_names = subCategoryNames;

    return {
        category_sell_names: categoryNames,
        sub_category_names: subCategoryNames,
    };
}

// Utility to load header, body, footer and combine, with dynamic logo
async function buildEmailHtml(bodyHtml, options = {}) {
    const headerPath = path.join(__dirname, '../email_templates/header.html');
    const footerPath = path.join(__dirname, '../email_templates/footer.html');
    let header = fs.readFileSync(headerPath, 'utf8');
    const footer = fs.readFileSync(footerPath, 'utf8');

    // If logoUrl not provided, try to get from SiteSettings
    let logoUrl = options.logoUrl;
    if (!logoUrl) {
        try {
            const siteConfig = await getSiteConfig();
            if (siteConfig.logo_file) {
                logoUrl = siteConfig.logo_file;
            }
        } catch (e) {
            // ignore error, fallback to nothing
        }
    }
    // Fallback to /logo.png if still not set
    if (!logoUrl) {
        const ROOT_URL = process.env.ROOT_URL || 'https://react.sourceindia-electronics.com/';
        logoUrl = ROOT_URL.replace(/\/$/, '') + '/logo.png';
    }
    header = header.replace(/\{\{\s*LOGO_URL\s*\}\}/g, logoUrl);
    return header + (bodyHtml || '') + footer;
}

module.exports = {
    getTransporter,
    getSiteConfig,
    slugify, generateUniqueSlug, getCategoryNames,
    buildEmailHtml
};


