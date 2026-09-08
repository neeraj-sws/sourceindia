const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const BuyerRequirements = require('./BuyerRequirements');
const Users = require('./Users');

const RequirementActivityLog = sequelize.define('RequirementActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'log_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'requirement_created, seller_assigned, seller_viewed, seller_responded, seller_rejected, seller_auto_cancelled, lead_reassigned, seller_accepted, lead_completed, buyer_feedback',
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'requirement_activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

RequirementActivityLog.belongsTo(BuyerRequirements, { foreignKey: 'requirement_id', as: 'requirement', constraints: false });
RequirementActivityLog.belongsTo(Users, { foreignKey: 'seller_id', as: 'seller', constraints: false });

module.exports = RequirementActivityLog;
