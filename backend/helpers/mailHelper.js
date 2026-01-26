const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');
const SellerCategory = require('../models/SellerCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function getSiteConfig() {
    const settings = await SiteSettings.findAll({
        where: {
            meta_key: {
                [Op.in]: [
                    'title',
                    'site_email',
                    'smtp_from_name',
                    'smtp_from_address',
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

// Format 'from' address using site settings
function formatFrom(siteConfig, defaultName = 'Source India-Electronics Supply Portal', defaultAddress = 'info@sourceindia-electronics.com') {
    // Prefer a human-readable site title, then configured smtp_from_name, then fallback
    const name = siteConfig?.['smtp_from_name'] || defaultName;
    const address = siteConfig?.['smtp_from_address'] || defaultAddress;
    return `${name} <${address}>`;
}

// Centralized sendMail helper
async function sendMail({ to, subject, message, htmlAlreadyBuilt = false, defaultFromName, fromOverride }) {
    const { transporter, siteConfig, buildEmailHtml } = await getTransporter();
    const from = fromOverride || formatFrom(siteConfig, defaultFromName);
    const htmlContent = htmlAlreadyBuilt ? message : await buildEmailHtml(message);
    return transporter.sendMail({ from, to, subject, html: htmlContent });
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

    // Root URL (backend) and APP_URL (frontend). Use APP_URL for frontend links.
    const ROOT_URL = process.env.ROOT_URL || 'https://sourceindia-electronics.com/';
    const APP_URL = process.env.APP_URL || ROOT_URL;
    const normalizedRoot = ROOT_URL.replace(/\/$/, '');
    const normalizedApp = APP_URL.replace(/\/$/, '');

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
    // Fallback to /logo.png (use backend ROOT_URL for static asset fallback)
    if (!logoUrl) {
        logoUrl = normalizedRoot + '/logo.png';
    }

    // Inject logo into header
    header = header.replace(/\{\{\s*LOGO_URL\s*\}\}/g, logoUrl);

    // Assemble full content and replace URL tokens if present in any part
    let content = header + (bodyHtml || '') + footer;

    // Replace frontend URL tokens using APP_URL (so emails point to the frontend)
    const adminUrl = normalizedApp + '/admin';
    content = content.replace(/\{\{\s*ADMIN_URL\s*\}\}/gi, adminUrl);
    content = content.replace(/\{\{\s*URL\s*\}\}/gi, normalizedApp + '/');
    content = content.replace(/\{\{\s*LOGIN_URL\s*\}\}/gi, normalizedApp + '/login');
    content = content.replace(/\{\{\s*LOGIN_URL\s*\}\}/gi, normalizedRoot + '/login');

    return content;
}

// -------------------------
// OTP / Password generators
// -------------------------
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generatePassword() {
    const password = 'SI' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    return { password, hashedPassword };
}

async function generateOtpAndPassword() {
    const otp = generateOtp();
    const { password, hashedPassword } = await generatePassword();
    return { otp, password, hashedPassword };
}

module.exports = {
    getTransporter,
    getSiteConfig,
    slugify, generateUniqueSlug, getCategoryNames,
    buildEmailHtml,
    formatFrom,
    sendMail,
    generateOtp,
    generatePassword,
    generateOtpAndPassword,
    // Sends OTP using template id 97 (fallback text if missing)
    async sendOtp(to, otp, opts = {}) {
        try {
            const Emails = require('../models/Emails');
            const emailTemplate = await Emails.findByPk(opts.templateId || 97);
            let msgStr = emailTemplate && emailTemplate.message ? emailTemplate.message.toString('utf8') : '';
            if (!msgStr) msgStr = `Your verification code is: {{ OTP }}`;

            // Build replacement map: allow caller to pass arbitrary tokens via opts.data
            const replacements = Object.assign({}, opts.data || {});
            // Provide both generic and template-specific keys for OTP so templates
            // using {{ OTP }} or {{ USER_OTP }} both work.
            replacements.OTP = otp;
            replacements.USER_OTP = otp;

            let userMessage = msgStr;
            for (const [key, val] of Object.entries(replacements)) {
                const safeKey = key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
                const re = new RegExp(`{{\\s*${safeKey}\\s*}}`, 'gi');
                userMessage = userMessage.replace(re, String(val));
            }

            await sendMail({ to, subject: (emailTemplate?.subject) || opts.subject || 'Verify your email', message: userMessage, defaultFromName: opts.defaultFromName || 'Support Team' });
            return true;
        } catch (err) {
            console.error('sendOtp error:', err.message || err);
            return false;
        }
    },
    // Sends credentials/password using a template (default id 58)
    async sendCredential(to, credential, opts = {}) {
        try {
            const Emails = require('../models/Emails');
            const tplId = opts.templateId || 58;
            const emailTemplate = await Emails.findByPk(tplId);
            let msgStr = emailTemplate && emailTemplate.message ? emailTemplate.message.toString('utf8') : '';
            if (!msgStr) msgStr = `Your password: {{ USER_PASSWORD }}`;
            const userMessage = msgStr.replace(/{{\s*USER_PASSWORD\s*}}/g, credential).replace(/{{\s*USER_EMAIL\s*}}/g, to || '');
            await sendMail({ to, subject: (emailTemplate?.subject) || opts.subject || 'Your account credentials', message: userMessage, defaultFromName: opts.defaultFromName || 'Support Team' });
            return true;
        } catch (err) {
            console.error('sendCredential error:', err.message || err);
            return false;
        }
    }
};


