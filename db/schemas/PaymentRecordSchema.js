const uuid = require("uuid/v4");
const mongoose = require("mongoose");

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
    },

    order_id: {
      type: String,
      required: true,
    },
    order_amount: {
      type: Number,
      required: true,
    },
    order_currency: {
      type: String,
      required: true,
    },

    cf_payment_id: {
      type: String,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILED", "PENDING"],
    },
    payment_amount: {
      type: Number,
      required: true,
    },
    payment_currency: {
      type: String,
      required: true,
    },
    payment_message: {
      type: String,
    },
    payment_time: {
      type: Date,
      required: true,
    },

    payment_group: {
      type: String,
      required: true,
    },
    bank_reference: {
      type: String,
    },
    auth_id: {
      type: String,
    },

    payment_method: {
      type: Object, // JSON object to store UPI, card, or other payment method details
      required: true,
    },
    payment_user_id: {
      type: String,
    },

    customer_id: {
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

    gateway_name: {
      type: String,
    },
    gateway_order_id: {
      type: String,
    },
    gateway_payment_id: {
      type: String,
    },
    gateway_order_reference_id: {
      type: String,
    },
    gateway_settlement: {
      type: String,
    },
    gateway_status_code: {
      type: String,
    },

    payment_offers: {
      type: Object, // JSON object to store multiple offer details
    },

    event_time: {
      type: Date,
      required: true,
    },
    webhook_type: {
      type: String,
      required: true,
      default: "PAYMENT_SUCCESS_WEBHOOK",
    },
  },
  schemaName: "payment_records",
  options: {
    timestamps: true,
  },
};
