const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TicketCategory = sequelize.define('TicketCategory', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  }
}, {
  tableName: 'ticket_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TicketCategory;
