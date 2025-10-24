const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/Users');
const CompanyInfo = require('./CompanyInfo');
const EnquiryMessage = require('./EnquiryMessage');

const UserMessage = sequelize.define('UserMessage', {
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable as per schema
    references: {
      model: EnquiryMessage,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CompanyInfo,
      key: 'id'
    }
  },
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  user_company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: CompanyInfo,
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  read_message: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_delete: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'user_messages',
  timestamps: false // Explicitly disable if you manage created_at/updated_at manually
});

UserMessage.belongsTo(EnquiryMessage, { foreignKey: 'message_id', targetKey: 'id', as: 'EnquiryMessage', constraints: false });
UserMessage.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'User', constraints: false });
UserMessage.belongsTo(CompanyInfo, { foreignKey: 'company_id', targetKey: 'id', as: 'Company', constraints: false });
UserMessage.belongsTo(User, { foreignKey: 'seller_id', targetKey: 'id', as: 'Seller', constraints: false });
UserMessage.belongsTo(CompanyInfo, { foreignKey: 'user_company_id', targetKey: 'id', as: 'UserCompany', constraints: false });

module.exports = UserMessage;