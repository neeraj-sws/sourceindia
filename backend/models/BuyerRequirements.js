const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const ProductKeyword = require('./ProductKeyword');
const ItemSubCategory = require('./ItemSubCategory');
const ItemCategory = require('./ItemCategory');
const SubCategories = require('./SubCategories');
const Categories = require('./Categories');

const BuyerRequirements = sequelize.define('BuyerRequirements', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'requirement_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'NULL if guest buyer',
  },
  buyer_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_country_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  product_keyword_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  item_subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  item_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  product_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1=Service, 2=Product',
  },
  product_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Original text entered by buyer',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  quantity_unit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  supplier_preference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Anywhere in India, Near by, Specific States, etc.',
  },
  preference_states: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of state codes if Specific States',
  },
  buyer_ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  buyer_country: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'India',
  },
  buyer_latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  buyer_longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  location_source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ip_geolocation, manual',
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0=pending, 1=assigned, 2=in_progress, 3=responded, 4=accepted, 5=completed, 6=closed, 7=cancelled, 8=no_seller_found',
  },
  current_assignment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of current active assignment',
  },
  assignment_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  max_reassignment_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
  },
  buyer_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1-5 rating from buyer after completion',
  },
  buyer_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'buyer_requirements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

BuyerRequirements.belongsTo(Users, { foreignKey: 'buyer_id', as: 'buyer', constraints: false });
BuyerRequirements.belongsTo(ProductKeyword, { foreignKey: 'product_keyword_id', as: 'keyword', constraints: false });
BuyerRequirements.belongsTo(ItemSubCategory, { foreignKey: 'item_subcategory_id', as: 'itemSubCategory', constraints: false });
BuyerRequirements.belongsTo(ItemCategory, { foreignKey: 'item_category_id', as: 'itemCategory', constraints: false });
BuyerRequirements.belongsTo(SubCategories, { foreignKey: 'subcategory_id', as: 'subCategory', constraints: false });
BuyerRequirements.belongsTo(Categories, { foreignKey: 'category_id', as: 'category', constraints: false });

module.exports = BuyerRequirements;
