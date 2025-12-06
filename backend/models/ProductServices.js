const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const Emails = require('./Emails');

const ProductServices = sequelize.define('ProductServices', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'product_service_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: false },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'product_services',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProductServices;