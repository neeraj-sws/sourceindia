const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomeSettings = sequelize.define('HomeSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'home_setting_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  page: { type: DataTypes.STRING, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: false },
  meta_key: { type: DataTypes.STRING, allowNull: false },
  meta_value: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'home_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = HomeSettings;