const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CompanyInfo = require('./CompanyInfo');
const Products = require('./Products');

const EnquiryUsers = sequelize.define('EnquiryUsers', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'enquiry_user_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  enquiry_id: { type: DataTypes.INTEGER, allowNull: true },
  product_name: { type: DataTypes.STRING, allowNull: true },
  enquiry_status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'enquiry_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

EnquiryUsers.belongsTo(CompanyInfo, { foreignKey: 'company_id', targetKey: 'id', as: 'CompanyInfo', constraints: false });
EnquiryUsers.belongsTo(Products, { foreignKey: 'product_id', targetKey: 'id', as: 'Products', constraints: false });

module.exports = EnquiryUsers;