const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One row per product search on the website products page; zero-result rows show what to add
// as keywords or synonyms. Viewed in Keyword Master > Search Logs.
const SearchLog = sequelize.define('SearchLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'search_log_id',
  },
  query: { type: DataTypes.STRING(255), allowNull: false },
  normalized_query: { type: DataTypes.STRING(255), allowNull: false },
  corrected_query: { type: DataTypes.STRING(255), allowNull: true },
  result_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  source: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'products_page' },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'search_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['normalized_query'] }, { fields: ['result_count'] }, { fields: ['created_at'] }],
});

module.exports = SearchLog;
