const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Categories = require('./Categories');
const SubCategories = require('./SubCategories');

const BuyerSourcingInterests = sequelize.define("BuyerSourcingInterests", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'buyer_sourcing_interest_id' },
  uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  item_category_id: { type: DataTypes.INTEGER, allowNull: false },
  item_subcategory_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "buyer_sourcing_interests",
  timestamps: false,
});

BuyerSourcingInterests.belongsTo(Categories, { foreignKey: "item_category_id", as: "category" });
BuyerSourcingInterests.belongsTo(SubCategories, { foreignKey: "item_subcategory_id", as: "subcategory" });

module.exports = BuyerSourcingInterests;
