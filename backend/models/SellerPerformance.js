const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const SellerPerformance = sequelize.define('SellerPerformance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'seller_performance_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  total_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  responded_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  accepted_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  rejected_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  auto_cancelled_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  completed_leads: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  total_response_time_seconds: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  monthly_leads_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Count for current month',
  },
  monthly_leads_reset_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time monthly count was reset',
  },
  on_time_response_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  overall_performance_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
  },
  average_response_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  on_time_response_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
  },
  acceptance_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
  },
  buyer_rating_avg: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Average buyer rating 0-5',
  },
  buyer_rating_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lead_receiving_enabled: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1=enabled, 0=disabled',
  },
  product_quality_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Product listing quality score 0-100. NULL when no public listing data.',
  },
  score_breakdown: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON: explainability breakdown (lead vs product components and reasons)',
  },
  search_appearance_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'How many times this seller\u2019s product was returned as a match candidate in buyer requirement searches',
  },
}, {
  tableName: 'seller_performance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

SellerPerformance.belongsTo(Users, { foreignKey: 'seller_id', as: 'seller', constraints: false });

module.exports = SellerPerformance;
