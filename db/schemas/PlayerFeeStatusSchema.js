const uuid = require("uuid/v4");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = {
  fields: {
    id: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return uuid();
      },
    },
    user_id: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return uuid();
      },
    },

    player_user_id: {
      type: String,
    },
   
    parent_user_id: {
      type: String,
    },
   
    start_date: {
      type: String
    },
    end_date: {
      type: String
    },
    academy_user_id: {
      type: String,
    },
    fee_status: {
      type: String,
    },
    fees: {
      type: Number
    },
    deleted_at: {
      type: Date,
    },
  },
  schemaName: "player_fee_status",
  options: {
    timestamps: true,
  },
};
