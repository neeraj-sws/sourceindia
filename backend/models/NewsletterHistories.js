const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Users = require('./Users');
const Newsletters = require('./Newsletters');

const NewsletterHistories = sequelize.define('NewsletterHistories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'newsletter_history_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  newsLatter_id: { type: DataTypes.INTEGER, allowNull: false },
  is_mail: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  code: { type: DataTypes.STRING, allowNull: true },
  email_view_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'news_latter_histories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = NewsletterHistories;

NewsletterHistories.belongsTo(Users, { foreignKey: 'user_id', targetKey: 'id', as: 'Users', constraints: false });
NewsletterHistories.belongsTo(Newsletters, { foreignKey: 'newsLatter_id', targetKey: 'id', as: 'Newsletters', constraints: false });