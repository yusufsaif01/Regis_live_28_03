const playerPaymentDetailsSchema = require("../schemas/PlayerPaymentDetailsSchema");
const BaseUtility = require("./BaseUtility");

class PlayerPaymentDetailsUtility extends BaseUtility {
  constructor() {
    super(playerPaymentDetailsSchema);
  }
}

module.exports = PlayerPaymentDetailsUtility;
