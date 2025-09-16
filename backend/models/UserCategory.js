const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCategory = sequelize.define('UserCategory', {
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
  type: { type: DataTypes.INTEGER, allowNull: false },
  user_type: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'user_category',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserCategory;