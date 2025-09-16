const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const FaqCategory = require('./FaqCategory');

const Faq = sequelize.define('Faq', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'faqs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Faq.belongsTo(FaqCategory, { foreignKey: 'category', targetKey: 'id', as: 'FaqCategory', constraints: false });

module.exports = Faq;