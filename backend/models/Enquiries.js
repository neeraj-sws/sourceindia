const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const CompanyInfo = require('./CompanyInfo');

const Enquiries = sequelize.define('Enquiries', {
  enquiry_number: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.INTEGER, allowNull: true, comment: "0 = public,1 = product,2 = company,3 = admin" },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  buyer_company_id: { type: DataTypes.INTEGER, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  sub_category: { type: DataTypes.STRING, allowNull: true },
  category_name: { type: DataTypes.STRING, allowNull: true },
  sub_category_name: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  name: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  company: { type: DataTypes.STRING, allowNull: true },
  is_approve: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'enquiries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Enquiries.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'from_user', constraints: false });
Enquiries.belongsTo(Users, { foreignKey: 'company_id', targetKey: 'company_id', as: 'to_user', constraints: false });
Enquiries.hasMany(require('./EnquiryUsers'), {
  foreignKey: 'enquiry_id',
  sourceKey: 'id',
  as: 'enquiry_users', // Use a meaningful alias
  constraints: false
});

module.exports = Enquiries;