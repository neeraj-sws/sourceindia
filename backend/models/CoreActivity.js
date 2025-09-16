const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Color = require('./Color');
const UploadImage = require('./UploadImage');

const CoreActivity = sequelize.define('CoreActivity', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
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
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: sequelize.literal('CURRENT_TIMESTAMP')
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'core_activities',
  timestamps: false,
});

CoreActivity.belongsTo(Color, { foreignKey: 'color', targetKey: 'id', as: 'Color', constraints: false });
CoreActivity.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = CoreActivity;
