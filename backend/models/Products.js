const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');
const CompanyInfo = require('./CompanyInfo');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const Users = require('./Users');
const Applications = require('./Applications');
const Color = require('./Color');
const States = require('./States');
const ReviewRating = require('./ReviewRating');
const ItemCategory = require('./ItemCategory');
const ItemSubCategory = require('./ItemSubCategory');
const Items = require('./Items');

const Products = sequelize.define('Products', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'product_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  article_number: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true },
  size: { type: DataTypes.INTEGER, allowNull: true },
  unit: { type: DataTypes.INTEGER, allowNull: true },
  category: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  sub_category: { type: DataTypes.INTEGER, allowNull: true },
  short_description: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  file_id: { type: DataTypes.INTEGER, allowNull: true },
  file_ids: { type: DataTypes.TEXT, allowNull: false },
  is_gold: { type: DataTypes.INTEGER, allowNull: true },
  is_featured: { type: DataTypes.INTEGER, allowNull: true },
  is_recommended: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  best_product: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.INTEGER, allowNull: false, comment: '0=draft, 1=public' },
  is_approve: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  application: { type: DataTypes.STRING, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  item_category_id: { type: DataTypes.INTEGER, allowNull: true },
  item_subcategory_id: { type: DataTypes.INTEGER, allowNull: true },
  item_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Products.belongsTo(UploadImage, {
  foreignKey: {
    name: 'file_id',
    allowNull: true
  },
  targetKey: 'id',
  as: 'file',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
Products.belongsTo(CompanyInfo, { foreignKey: 'company_id', targetKey: 'id', as: 'company_info', constraints: false });
Products.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });
Products.belongsTo(Categories, { foreignKey: 'category', as: 'Categories', constraints: false });
Products.belongsTo(SubCategories, { foreignKey: 'sub_category', targetKey: 'id', as: 'SubCategories', constraints: false });
Products.belongsTo(Applications, { foreignKey: 'application', targetKey: 'id', as: 'Applications', constraints: false });
Products.belongsTo(Color, { foreignKey: 'color', targetKey: 'id', as: 'Color', constraints: false });
Products.belongsTo(ItemCategory, { foreignKey: 'item_category_id', targetKey: 'id', as: 'ItemCategory', constraints: false });
Products.belongsTo(ItemSubCategory, { foreignKey: 'item_subcategory_id', targetKey: 'id', as: 'ItemSubCategory', constraints: false });
Products.belongsTo(Items, { foreignKey: 'item_id', targetKey: 'id', as: 'Items', constraints: false });

module.exports = Products;
