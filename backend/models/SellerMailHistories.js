const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const SellerMailHistories = sequelize.define('SellerMailHistories', {
  mail_type: { type: DataTypes.INTEGER, allowNull: false, comment: "0='direct',1='selected',3='all'" },
  mail_template_id: { type: DataTypes.INTEGER, allowNull: false },
  mail: { type: DataTypes.STRING, allowNull: false },
  email_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  company_id: { type: DataTypes.STRING, allowNull: false },
  mail_send_time: { type: DataTypes.STRING, allowNull: false },
  ip_address: { type: DataTypes.TEXT, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.INTEGER, allowNull: false },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'seller_mail_histories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

SellerMailHistories.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });

module.exports = SellerMailHistories;