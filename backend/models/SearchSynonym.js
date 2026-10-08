const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A group of words that mean the same thing for product search, e.g. "smps, switch mode power supply".
// Searching any term of a group also searches the others. Managed in Keyword Master > Search Synonyms.
const SearchSynonym = sequelize.define('SearchSynonym', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'search_synonym_id',
  },
  terms: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Comma separated equivalent terms',
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive',
  },
}, {
  tableName: 'search_synonyms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SearchSynonym;
