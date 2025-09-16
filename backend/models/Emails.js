const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Emails = sequelize.define('Emails', {
  title: { type: DataTypes.STRING, allowNull: false, unique: true },
  email_for: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  subject: { type: DataTypes.TEXT, allowNull: false },
  is_seller_direct: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.BLOB('long'), allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'emails',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Emails;