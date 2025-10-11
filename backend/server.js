const express = require('express');
const path = require('path');
const cors = require('cors');

const sequelize = require('./config/database');
const fileRoutes = require('./routes/fileRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const activityRoutes = require('./routes/activityRoutes');
const coreActivityRoutes = require('./routes/coreActivityRoutes');
const ticketCategoryRoutes = require('./routes/ticketCategoryRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const faqCategoryRoutes = require('./routes/faqCategoryRoutes');
const faqRoutes = require('./routes/faqRoutes');
const homeBannerRoutes = require('./routes/homeBannerRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const subAdminRoutes = require('./routes/subAdminRoutes');
const knowledgeCenterRoutes = require('./routes/knowledgeCenterRoutes');
const locationRoutes = require('./routes/locationRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const membershipPlanRoutes = require('./routes/membershipPlanRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const interestCategoriesRoutes = require('./routes/interestCategoriesRoutes');
const interestSubCategoriesRoutes = require('./routes/interestSubCategoriesRoutes');
const subSubCategoriesRoutes = require('./routes/subSubCategoriesRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const productsRoutes = require('./routes/productsRoutes');
const settingRoutes = require('./routes/settingRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const enquiriesRoutes = require('./routes/enquiriesRoutes');
const openEnquiriesRoutes = require('./routes/openEnquiriesRoutes');
const seoPagesRoutes = require('./routes/seoPagesRoutes');
const userActivityRoutes = require('./routes/userActivityRoutes');
const sellerMailHistoriesRoutes = require('./routes/sellerMailHistoriesRoutes');
const contactsRoutes = require('./routes/contactsRoutes');
const emailsRoutes = require('./routes/emailsRoutes');
const newsletterHistoriesRoutes = require('./routes/newsletterHistoriesRoutes');
const inventoriesRoutes = require('./routes/inventoriesRoutes');

const app = express();
const basePath = '/v2'; // All APIs will start with /v2

app.use(cors());
app.use(express.json());

// Health check
app.get(basePath + '/', (req, res) => {
  res.send('Node.js app is running under ' + basePath);
});

// Serve static files under basePath
app.use(basePath + '/upload', express.static(path.join(__dirname, 'upload')));

// All APIs under /v2/api/...
app.use(basePath + '/api/files', fileRoutes);
app.use(basePath + '/api/admin', adminAuthRoutes);
app.use(basePath + '/api/activities', activityRoutes);
app.use(basePath + '/api/core_activities', coreActivityRoutes);
app.use(basePath + '/api/ticket_categories', ticketCategoryRoutes);
app.use(basePath + '/api/testimonials', testimonialRoutes);
app.use(basePath + '/api/faq_categories', faqCategoryRoutes);
app.use(basePath + '/api/faqs', faqRoutes);
app.use(basePath + '/api/home_banners', homeBannerRoutes);
app.use(basePath + '/api/roles', rolesRoutes);
app.use(basePath + '/api/sub_admin', subAdminRoutes);
app.use(basePath + '/api/knowledge_center', knowledgeCenterRoutes);
app.use(basePath + '/api/location', locationRoutes);
app.use(basePath + '/api/buyers', buyerRoutes);
app.use(basePath + '/api/membership_plan', membershipPlanRoutes);
app.use(basePath + '/api/categories', categoriesRoutes);
app.use(basePath + '/api/sub_categories', subCategoryRoutes);
app.use(basePath + '/api/interest_categories', interestCategoriesRoutes);
app.use(basePath + '/api/interest_sub_categories', interestSubCategoriesRoutes);
app.use(basePath + '/api/sub_sub_categories', subSubCategoriesRoutes);
app.use(basePath + '/api/tickets', ticketRoutes);
app.use(basePath + '/api/sellers', sellerRoutes);
app.use(basePath + '/api/applications', applicationRoutes);
app.use(basePath + '/api/products', productsRoutes);
app.use(basePath + '/api/settings', settingRoutes);
app.use(basePath + '/api/newsletters', newsletterRoutes);
app.use(basePath + '/api/enquiries', enquiriesRoutes);
app.use(basePath + '/api/open_enquiries', openEnquiriesRoutes);
app.use(basePath + '/api/seo_pages', seoPagesRoutes);
app.use(basePath + '/api/user_activity', userActivityRoutes);
app.use(basePath + '/api/seller_mail_histories', sellerMailHistoriesRoutes);
app.use(basePath + '/api/contacts', contactsRoutes);
app.use(basePath + '/api/emails', emailsRoutes);
app.use(basePath + '/api/newsletter_histories', newsletterHistoriesRoutes);
app.use(basePath + '/api/inventories', inventoriesRoutes);

sequelize
  .sync()
  .then(() => {
    console.log('MySQL connected and models synced');
    app.listen(5000, () =>
      console.log('Server running on http://localhost:5000' + basePath)
    );
  })
  .catch((err) => console.error('DB connection error:', err));
