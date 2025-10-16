const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const SiteSettings = require('../models/SiteSettings');

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

module.exports = {
    getTransporter,
    getSiteConfig,
    slugify, generateUniqueSlug
};
