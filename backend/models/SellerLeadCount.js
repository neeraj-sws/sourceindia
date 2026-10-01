const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Per-seller lead usage tracker for the current period.
// remaining = limit_at_period_start - leads_received (computed, not stored).
// The global limit itself lives in site_settings (lead_monthly_limit); this
// table only stores each seller's own usage against the snapshot of that limit
// taken when their period began.
const SellerLeadCount = sequelize.define('SellerLeadCount', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  seller_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Inclusive start of the lead-count period',
  },
  period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Inclusive last day of the lead-count period',
  },
  limit_at_period_start: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Snapshot of the global monthly/longer lead limit when the period began',
  },
  leads_received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'seller_lead_count',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['seller_id', 'period_start'] },
  ],
});

module.exports = SellerLeadCount;