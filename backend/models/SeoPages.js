const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeoPages = sequelize.define('SeoPages', {
  title: { type: DataTypes.STRING, allowNull: true },
  slug: { type: DataTypes.STRING, allowNull: true },
  meta_title: { type: DataTypes.TEXT, allowNull: true },
  meta_description: { type: DataTypes.TEXT, allowNull: true },
  meta_image: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'seo_pages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SeoPages;