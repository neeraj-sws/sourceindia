const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const Contacts = sequelize.define('Contacts', {
  fname: { type: DataTypes.STRING, allowNull: false },
  lname: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  subject: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
}, {
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Contacts;