const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventories = sequelize.define('Inventories', {
  pno: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qty: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'inventories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Inventories;
