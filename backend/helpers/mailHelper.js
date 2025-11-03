const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');
const SellerCategory = require('../models/SellerCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');

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
                ],
            },
        },
        attributes: ['meta_key', 'meta_value'],
    });

    return Object.fromEntries(settings.map(s => [s.meta_key, s.meta_value]));
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
    });

    return { transporter, siteConfig };
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


module.exports = {
    getTransporter,
    getSiteConfig,
    slugify, generateUniqueSlug, getCategoryNames
};


