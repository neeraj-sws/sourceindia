// models/index.js
const sequelize = require('../config/database');

// Import models
const CompanyInfo = require('./CompanyInfo');
const Users = require('./Users');
const UploadImage = require('./UploadImage');
const Countries = require('./Countries');
const States = require('./States');
const Cities = require('./Cities');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const CoreActivity = require('./CoreActivity');
const Activity = require('./Activity');
const MembershipPlan = require('./MembershipPlan');
const NatureBusinesses = require('./NatureBusinesses');
const SellerCategory = require('./SellerCategory');
const BuyerSourcingInterests = require('./BuyerSourcingInterests');
const Products = require('./Products');
const ItemCategory = require('./ItemCategory');
const ItemSubCategory = require('./ItemSubCategory');

// Collect all models
const models = {
  sequelize,
  CompanyInfo,
  Users,
  UploadImage,
  Countries,
  States,
  Cities,
  Categories,
  SubCategories,
  CoreActivity,
  Activity,
  MembershipPlan,
  NatureBusinesses,
  SellerCategory,
  BuyerSourcingInterests,
  Products,
  ItemCategory,
  ItemSubCategory
};

// Run all associations
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

module.exports = models;
