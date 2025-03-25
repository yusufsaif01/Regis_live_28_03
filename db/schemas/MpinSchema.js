const uuidv4 = require("uuid/v4");
const MEMBER = require("../../constants/MemberType");
const ACCOUNT = require("../../constants/AccountStatus");
const PROFILE = require("../../constants/ProfileStatus");
const ROLE = require("../../constants/Role");
module.exports = {
  fields: {
    user_id: {
      type: String,
      required: true,
      default: function () {
        return uuidv4();
      },
    },

    academy_user_id: {
      type: String,
    },
    failed_attempts: {
      type: Number,
      default: 0, // Track incorrect login attempts
    },
    is_locked: {
      type: Boolean,
      default: false, // Lock after too many failed attempts
    },
    expires_at: {
      type: Date, // Optional: for mPIN expiration
    },
    password: {
      type: Number,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },

  schemaName: "mpin",

  options: {
    timestamps: true,
  },
};
