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

    deleted_at: {
      type: Date,
    },
    start_date: {
      type: Date,
    },
    end_date: {
      type: Date,
    },

    fees: {
      type: Number,
    },
    academy_userid: {
      type: String,
    },
  },
  schemaName: "payment_setup",
  options: {
    timestamps: true,
  },
};
