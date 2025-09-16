const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const FaqCategory = sequelize.define('FaqCategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
}, {
  tableName: 'faqcategories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FaqCategory;
