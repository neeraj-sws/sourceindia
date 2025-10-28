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

const Products = sequelize.define('Products', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  company_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  slug: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  article_number: { type: DataTypes.STRING, allowNull: true },
  content: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true },
  size: { type: DataTypes.INTEGER, allowNull: true },
  unit: { type: DataTypes.INTEGER, allowNull: true },
  color: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  sub_category: { type: DataTypes.INTEGER, allowNull: true },
  sub_item: { type: DataTypes.INTEGER, allowNull: true },
  core_activity: { type: DataTypes.INTEGER, allowNull: false },
  activity: { type: DataTypes.INTEGER, allowNull: false },
  segment: { type: DataTypes.INTEGER, allowNull: false },
  product_service: { type: DataTypes.INTEGER, allowNull: false },
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
}, {
  tableName: 'products1',
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
Products.belongsTo(Categories, { foreignKey: 'category', targetKey: 'id', as: 'Categories', constraints: false });
Products.belongsTo(SubCategories, { foreignKey: 'sub_category', targetKey: 'id', as: 'SubCategories', constraints: false });
Products.belongsTo(Applications, { foreignKey: 'application', targetKey: 'id', as: 'Applications', constraints: false });
Products.belongsTo(Color, { foreignKey: 'color', targetKey: 'id', as: 'Color', constraints: false });

module.exports = Products;
