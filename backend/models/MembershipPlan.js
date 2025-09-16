const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MembershipPlan = sequelize.define('MembershipPlan', {
  name: { type: DataTypes.STRING, allowNull: false },
  sub_title: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
  price: { type: DataTypes.INTEGER, allowNull: false },
  free: { type: DataTypes.INTEGER, allowNull: true },
  user: { type: DataTypes.INTEGER, allowNull: false },
  enquiries: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.INTEGER, allowNull: false },
  product: { type: DataTypes.INTEGER, allowNull: false },
  is_default: { type: DataTypes.INTEGER, allowNull: true },
  expire_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 365, comment: "No of days after it plan has been expire " },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  elcina_plan: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'membership_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MembershipPlan;
