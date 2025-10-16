const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UploadImage = require('./UploadImage');
const CompanyInfo = require('./CompanyInfo');
const Countries = require('./Countries');
const States = require('./States');
const Cities = require('./Cities');
const CoreActivity = require('./CoreActivity');
const Activity = require('./Activity');

const Users = sequelize.define('Users', {
  company_id: { type: DataTypes.INTEGER, allowNull: true, },
  elcina_member: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1="elcina member",2="not",3="not sure"' },
  fname: { type: DataTypes.STRING, allowNull: false },
  lname: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  mobile: { type: DataTypes.STRING, allowNull: true, },
  step: { type: DataTypes.INTEGER, allowNull: true, },
  mode: { type: DataTypes.INTEGER, allowNull: true, comment: "0='online',1='offline'" },
  password: { type: DataTypes.STRING, allowNull: false },
  real_password: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  zipcode: { type: DataTypes.STRING(25), allowNull: true },
  remember_token: { type: DataTypes.STRING, allowNull: true },
  is_seller: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  membership_plan_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  plan_price: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  file_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  status: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, comment: '1 = Active, 0 = Inactive' },
  payment_status: { type: DataTypes.INTEGER, allowNull: true, comment: '0="Payment done",1="Payment Pending"' },
  is_approve: { type: DataTypes.INTEGER, allowNull: false, },
  approve_date: { type: DataTypes.DATE, allowNull: true, },
  email_token: { type: DataTypes.STRING, allowNull: true },
  is_email_verify: { type: DataTypes.INTEGER, allowNull: false, },
  is_complete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  company_file_id: { type: DataTypes.INTEGER, allowNull: true },
  featured_company: { type: DataTypes.INTEGER, allowNull: true },
  user_company: { type: DataTypes.STRING, allowNull: true },
  is_intrest: { type: DataTypes.INTEGER, allowNull: true },
  step_decline: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  is_new: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  step_prograss: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  website: { type: DataTypes.STRING, allowNull: false },
  products: { type: DataTypes.TEXT, allowNull: true },
  request_admin: { type: DataTypes.INTEGER, allowNull: true },
  is_delete: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  is_mail_test: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  is_admin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  aal_test_mail: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  otp: { type: DataTypes.STRING, allowNull: true, },
  is_trading: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  walkin_buyer: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, },
  member_role: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, },
  is_profile: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1, },
  is_company: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1, },
  is_product: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1, },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Users.belongsTo(UploadImage, { foreignKey: 'file_id', targetKey: 'id', as: 'file', onDelete: 'CASCADE' });
Users.belongsTo(UploadImage, { foreignKey: 'company_file_id', targetKey: 'id', as: 'company_file', onDelete: 'CASCADE' });
Users.belongsTo(CompanyInfo, { foreignKey: 'company_id', targetKey: 'id', as: 'company_info', constraints: false });
Users.belongsTo(Countries, { foreignKey: 'country', targetKey: 'id', as: 'country_data', constraints: false });
Users.belongsTo(States, { foreignKey: 'state', targetKey: 'id', as: 'state_data', constraints: false });
Users.belongsTo(Cities, { foreignKey: 'city', targetKey: 'id', as: 'city_data', constraints: false });

module.exports = Users;
