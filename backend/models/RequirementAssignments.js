const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const BuyerRequirements = require('./BuyerRequirements');

const RequirementAssignments = sequelize.define('RequirementAssignments', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'assignment_id',
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
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignment_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Which assignment attempt this is for the requirement',
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0=assigned, 1=viewed, 2=responded, 3=accepted, 4=rejected, 5=auto_cancelled, 6=completed',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  product_match_level: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'product_keyword, item_subcategory, item_category, subcategory, category',
  },
  product_match_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '100, 80, 60, 40, 20',
  },
  total_rank_score: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Combined ranking score at time of assignment',
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  viewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  responded_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  auto_cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  response_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'responded_at - assigned_at in seconds',
  },
  reassignment_reason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'sla_timeout, rejected, seller_inactive, etc.',
  },
  is_reassigned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '1 = this lead was assigned via reassignment (SLA/reject), not a fresh first-time lead',
  },
  assignment_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-visible note, e.g. city/state fallback explanation',
  },
}, {
  tableName: 'requirement_assignments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

RequirementAssignments.belongsTo(BuyerRequirements, { foreignKey: 'requirement_id', as: 'requirement', constraints: false });
RequirementAssignments.belongsTo(Users, { foreignKey: 'seller_id', as: 'seller', constraints: false });

module.exports = RequirementAssignments;
