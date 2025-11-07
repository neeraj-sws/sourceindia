const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const InterestCategories = require('./InterestCategories');

const InterestSubCategories = sequelize.define('InterestSubCategories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'interest_sub_category_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  interest_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
}, {
  tableName: 'interest_sub_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

InterestSubCategories.belongsTo(InterestCategories, { foreignKey: 'interest_category_id', targetKey: 'id', as: 'InterestCategories', constraints: false });

module.exports = InterestSubCategories;