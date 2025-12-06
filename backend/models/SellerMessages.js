const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const SellerMessages = sequelize.define('SellerMessages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'seller_message_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'seller_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

SellerMessages.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = SellerMessages;