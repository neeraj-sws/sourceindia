const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserCategory = require('./UserCategory');

const Newsletters = sequelize.define('Newsletters', {
  title: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT('long'), allowNull: false },
  user_type: { type: DataTypes.INTEGER, allowNull: true },
  ip_address: { type: DataTypes.TEXT, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.TEXT, allowNull: false },
  history_type: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  city: { type: DataTypes.STRING, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  attachment: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'news_latters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Newsletters;

Newsletters.belongsTo(UserCategory, { foreignKey: 'user_type', targetKey: 'id', as: 'UserCategory', constraints: false });