const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailChangeRequest = sequelize.define('EmailChangeRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  old_email: { type: DataTypes.STRING, allowNull: false },
  new_email: { type: DataTypes.STRING, allowNull: true },
  old_otp_hash: { type: DataTypes.STRING, allowNull: true },
  new_otp_hash: { type: DataTypes.STRING, allowNull: true },
  old_otp_expires_at: { type: DataTypes.DATE, allowNull: true },
  new_otp_expires_at: { type: DataTypes.DATE, allowNull: true },
  old_verified_at: { type: DataTypes.DATE, allowNull: true },
  new_verified_at: { type: DataTypes.DATE, allowNull: true },
  attempts_old: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  attempts_new: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  last_sent_at: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'old_verified', 'completed', 'expired'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'email_change_requests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmailChangeRequest;
