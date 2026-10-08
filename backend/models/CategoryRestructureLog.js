const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoryRestructureLog = sequelize.define('CategoryRestructureLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'category_restructure_log_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  action: { type: DataTypes.STRING(20), allowNull: false, comment: 'move | merge' },
  level: { type: DataTypes.STRING(50), allowNull: false },
  source_id: { type: DataTypes.INTEGER, allowNull: false },
  source_name: { type: DataTypes.STRING, allowNull: false },
  from_parent: { type: DataTypes.STRING, allowNull: true },
  target_id: { type: DataTypes.INTEGER, allowNull: false },
  target_name: { type: DataTypes.STRING, allowNull: false },
  affected: { type: DataTypes.TEXT, allowNull: true, comment: 'JSON summary of updated rows per table' },
  admin_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'category_restructure_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CategoryRestructureLog;
