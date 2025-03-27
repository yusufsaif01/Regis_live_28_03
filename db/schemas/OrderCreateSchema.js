const uuidv4 = require("uuid/v4");

module.exports = {
  fields: {
    _id: {
      type: String,
      required: true,
      default: function () {
        return uuidv4();
      },
    },
    order_id: {
      type: String,
    },
    parent_user_id: {
      type: String,
    },
    player_id: {
      type: String,
    },
    academy_id: {
      type: String,
        },
        fee: {
      type: Number  
    },
    amount: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
    },
    order_date: {
      type: String,
      required: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },

  schemaName: "order_create",

  options: {
    timestamps: true,
  },
};
