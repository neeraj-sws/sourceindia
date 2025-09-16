const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');
const CoreActivity = require('./CoreActivity');
const Activity = require('./Activity');

const CompanyInfo = sequelize.define('CompanyInfo', {
  organization_name: { type: DataTypes.STRING, allowNull: true },
  organization_slug: { type: DataTypes.STRING, allowNull: true },
  email_verified_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  remember_token: { type: DataTypes.STRING(100), allowNull: true },
  postcode: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: true },
  user_type: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  membership_plan: { type: DataTypes.STRING, allowNull: true },
  brief_company: { type: DataTypes.TEXT('long'), allowNull: true },
  callin_pin: { type: DataTypes.INTEGER, allowNull: true },
  category_buy: { type: DataTypes.STRING, allowNull: true },
  category_sell: { type: DataTypes.STRING, allowNull: true },
  sub_category: { type: DataTypes.STRING, allowNull: true },
  core_activity: { type: DataTypes.STRING, allowNull: true },
  activity: { type: DataTypes.STRING, allowNull: true },
  nature_business: { type: DataTypes.STRING, allowNull: true },
  designation: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.INTEGER, allowNull: true },
  company_location: { type: DataTypes.TEXT, allowNull: true },
  contact_person: { type: DataTypes.STRING, allowNull: true },
  company_phone: { type: DataTypes.STRING(15), allowNull: true },
  company_website: { type: DataTypes.STRING, allowNull: true },
  company_email: { type: DataTypes.STRING, allowNull: true },
  company_logo: { type: DataTypes.INTEGER, allowNull: true },
  is_verified: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_star_seller: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  featured_company: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  company_meta_title: { type: DataTypes.STRING, allowNull: true },
  sample_file_id: { type: DataTypes.INTEGER, allowNull: true },
  organizations_product_description: { type: DataTypes.TEXT('long'), allowNull: true },
  organization_quality_certification: { type: DataTypes.STRING, allowNull: true },
  company_sample_ppt_file: { type: DataTypes.INTEGER, allowNull: true },
  company_video: { type: DataTypes.INTEGER, allowNull: true },
  company_video_second: { type: DataTypes.STRING, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_company: { type: DataTypes.STRING, allowNull: true },
  is_pli: { type: DataTypes.INTEGER, allowNull: true },
  user_category: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'company_info',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

CompanyInfo.belongsTo(UploadImage, { foreignKey: 'company_logo', targetKey: 'id', as: 'companyLogo', onDelete: 'CASCADE' });
CompanyInfo.belongsTo(UploadImage, { foreignKey: 'company_sample_ppt_file', targetKey: 'id', as: 'companySamplePptFile', onDelete: 'CASCADE' });
CompanyInfo.belongsTo(UploadImage, { foreignKey: 'company_video', targetKey: 'id', as: 'companyVideo', onDelete: 'CASCADE' });
CompanyInfo.belongsTo(UploadImage, { foreignKey: 'sample_file_id', targetKey: 'id', as: 'companySampleFile', onDelete: 'CASCADE' });
CompanyInfo.belongsTo(Categories, { foreignKey: 'category_sell', targetKey: 'id', as: 'Categories', constraints: false });
CompanyInfo.belongsTo(SubCategories, { foreignKey: 'sub_category', targetKey: 'id', as: 'SubCategories', constraints: false });
CompanyInfo.belongsTo(CoreActivity, { foreignKey: 'core_activity', targetKey: 'id', as: 'CoreActivity', constraints: false });
CompanyInfo.belongsTo(Activity, { foreignKey: 'activity', targetKey: 'id', as: 'Activity', constraints: false });

module.exports = CompanyInfo;