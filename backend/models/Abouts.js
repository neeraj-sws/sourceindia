const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Abouts = sequelize.define('Abouts', {
  page: { type: DataTypes.STRING, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: false },
  meta_key: { type: DataTypes.STRING, allowNull: false },
  meta_value: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'abouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Abouts;