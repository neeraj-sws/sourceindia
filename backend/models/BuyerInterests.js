const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const InterestSubCategories = require('./InterestSubCategories');

const BuyerInterests = sequelize.define('BuyerInterests', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'buyerinterest_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  buyer_id: { type: DataTypes.INTEGER, allowNull: false },
  core_activity_id: { type: DataTypes.INTEGER, allowNull: false },
  activity_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'buyerinterests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Users.hasMany(BuyerInterests, { foreignKey: 'buyer_id', as: 'buyer_interests', constraints: false });
BuyerInterests.belongsTo(Users, { foreignKey: 'buyer_id', as: 'buyer_interests', constraints: false });
BuyerInterests.belongsTo(InterestSubCategories, {
  foreignKey: 'activity_id',
  targetKey: 'id',
  as: 'activity',
  constraints: false
});

module.exports = BuyerInterests;