const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteSettings = sequelize.define('SiteSettings', {
  meta_key: { type: DataTypes.STRING, allowNull: false },
  meta_value: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'site_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SiteSettings;