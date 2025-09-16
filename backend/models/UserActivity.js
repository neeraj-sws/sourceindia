const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const UserActivity = sequelize.define('UserActivity', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true },
  is_side: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'user_activity',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

UserActivity.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = UserActivity;