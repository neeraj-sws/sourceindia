const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CoreActivity = require('./CoreActivity');

const Activity = sequelize.define('Activity', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coreactivity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
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
  tableName: 'activities',
  timestamps: false,
});

Activity.belongsTo(CoreActivity, { foreignKey: 'coreactivity', targetKey: 'id', as: 'CoreActivity', constraints: false });

module.exports = Activity;