const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');

const Testimonials = sequelize.define('Testimonials', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'testimonials',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Testimonials.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = Testimonials;
