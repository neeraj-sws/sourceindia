const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoryConflictLog = sequelize.define('CategoryConflictLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'category_conflict_log_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  source_module: { type: DataTypes.STRING, allowNull: false },
  conflict_module: { type: DataTypes.STRING, allowNull: false },
  conflict_flow: { type: DataTypes.STRING, allowNull: false },
  conflict_name: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'category_conflict_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CategoryConflictLog;
