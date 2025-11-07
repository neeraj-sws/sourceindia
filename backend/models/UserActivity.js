const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_activity_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
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