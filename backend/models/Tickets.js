const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TicketCategory = require('./TicketCategory');
const Users = require('./Users');

const Tickets = sequelize.define('Tickets', {
  fname: { type: DataTypes.STRING, allowNull: true },
  lname: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  cc_email: { type: DataTypes.STRING, allowNull: true },
  ticket_id: { type: DataTypes.STRING, allowNull: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.TEXT, allowNull: true },
  attachment: { type: DataTypes.TEXT, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: true, comment: '0=pending, 1=inprogress, 2= resolved, 3=cancel' },
  otp: { type: DataTypes.INTEGER, allowNull: true },
  is_complete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  priority: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  created_by: { type: DataTypes.STRING, allowNull: true },
  token: { type: DataTypes.STRING, allowNull: true },
  added_by: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Tickets.belongsTo(TicketCategory, { foreignKey: 'category', targetKey: 'id', as: 'TicketCategory', constraints: false });
Tickets.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = Tickets;