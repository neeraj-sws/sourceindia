const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');

const ReviewRating = sequelize.define('ReviewRating', {
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  company_id: { type: DataTypes.INTEGER, allowNull: true },
  rating: { type: DataTypes.INTEGER, allowNull: true },
  review: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'review_ratings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

ReviewRating.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'reviewer', onDelete: 'CASCADE' });

module.exports = ReviewRating;