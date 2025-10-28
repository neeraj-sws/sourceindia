const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const OpenEnquiriesChats = sequelize.define('OpenEnquiriesChats', {
  message: { type: DataTypes.TEXT('long'), allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  enquiry_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  enquiry_user_id: { type: DataTypes.INTEGER, allowNull: true },
  reply_user_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'open_enquriychats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

OpenEnquiriesChats.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = OpenEnquiriesChats;