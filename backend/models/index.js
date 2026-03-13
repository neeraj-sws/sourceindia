const sequelize = require('../config/database');

// Import all models without importing each other inside the files
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const UploadImage = require('./UploadImage');
const Users = require('./Users');
const CompanyInfo = require('./CompanyInfo');
const Applications = require('./Applications');
const ItemCategory = require('./ItemCategory');
const ItemSubCategory = require('./ItemSubCategory');
const Products = require('./Products');
const Items = require('./Items');

// ===== DEFINE ASSOCIATIONS HERE =====

// ItemCategory -> Products
ItemCategory.hasMany(Products, {
  foreignKey: 'item_category_id',
  as: 'products'
});
Products.belongsTo(ItemCategory, {
  foreignKey: 'item_category_id',
  as: 'ItemCategory'
});

// ItemSubCategory -> Products
ItemSubCategory.hasMany(Products, {
  foreignKey: 'item_subcategory_id',
  as: 'products'
});
Products.belongsTo(ItemSubCategory, {
  foreignKey: 'item_subcategory_id',
  as: 'ItemSubCategory'
});

// Export all models and sequelize instance
module.exports = {
  sequelize,
  Categories,
  SubCategories,
  UploadImage,
  Users,
  CompanyInfo,
  Applications,
  ItemCategory,
  ItemSubCategory,
  Products,
  Items,
};