const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const CompanyInfo = require('./CompanyInfo');
const Enquiry = require('./Enquiries');

const EnquiryMessage = sequelize.define('EnquiryMessage', {
  enquiry_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable as per schema
    references: {
      model: Enquiry,
      key: 'id'
    }
  },
  buyer_company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: CompanyInfo,
      key: 'id'
    }
  },
  seller_company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CompanyInfo,
      key: 'id'
    }
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
  tableName: 'enquiry_messages',
  timestamps: false // Explicitly disable if you manage created_at/updated_at manually
});

EnquiryMessage.belongsTo(Enquiry, { foreignKey: 'enquiry_id', targetKey: 'id', as: 'Enquiry', constraints: false });
EnquiryMessage.belongsTo(CompanyInfo, { foreignKey: 'buyer_company_id', targetKey: 'id', as: 'BuyerCompany', constraints: false });
EnquiryMessage.belongsTo(CompanyInfo, { foreignKey: 'seller_company_id', targetKey: 'id', as: 'SellerCompany', constraints: false });

module.exports = EnquiryMessage;