const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');

const KnowledgeCenter = sequelize.define('KnowledgeCenter', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  video_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = Active, 0 = Inactive'
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'knowledge_centers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

KnowledgeCenter.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', onDelete: 'CASCADE' });

module.exports = KnowledgeCenter;
