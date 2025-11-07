const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // adjust the path to your DB config

const TicketReply = sequelize.define(
  "TicketReply",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ticket_reply_id',
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // since Guest can be null
    },

    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    reply: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    added_by: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Guest",
    },

    attachment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    media_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "text",
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "ticket_replies",
    timestamps: false,
  }
);

module.exports = TicketReply;
