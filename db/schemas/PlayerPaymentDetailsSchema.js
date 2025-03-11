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

    cf_order_id: {
      type: String,
      required: true, // Ensure Cashfree Order ID is always stored
    },

    order_id: {
      type: String,
      required: true, // Store the merchant's order ID (ORDER123xxx)
    },

    order_status: {
      type: String,
      required: true, // Store payment status (PAID, FAILED, etc.)
    },

    order_date: {
      type: Date,
      required: true, // Store order creation date (from Cashfree)
    },

    start_date: {
      type: Date, // Added start date if required for tracking
    },

    end_date: {
      type: Date,
    },

    fees: {
      type: Number,
      required: true, // Ensure fee amount is always stored
    },

    currency: {
      type: String,
      default: "INR", // Store order currency (default INR)
    },
    customer_user_id: {
      type: String,
    },

    customer_name: {
      type: String,
    },

    customer_email: {
      type: String,
    },

    customer_phone: {
      type: String,
    },
    parent_user_id: {
      type: String,
    },
    academy_userid: {
      type: String,
    },
  },
  schemaName: "player_payment_details",
  options: {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
};
