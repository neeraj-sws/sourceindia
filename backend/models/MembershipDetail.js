const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MembershipDetail = sequelize.define('MembershipDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'membership_detail_id',
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  /*id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },*/
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used_user: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remaining_user: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used_category: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remaining_category: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  product: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used_product: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remaining_product: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  core_activity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  used_core_activity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remaining_core_activity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  start_date: {
    type: DataTypes.DATEONLY,
  },
  end_date: {
    type: DataTypes.DATEONLY,
  },
},
  {
    tableName: "membership_details",
    timestamps: true, // automatically manages created_at & updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// 🔹 Associations (optional)
MembershipDetail.associate = (models) => {
  MembershipDetail.belongsTo(models.Companyinfo, {
    foreignKey: "company_id",
    as: "company",
  });

  MembershipDetail.belongsTo(models.MembershipPlan, {
    foreignKey: "plan_id",
    as: "plan",
  });
};


module.exports = MembershipDetail;