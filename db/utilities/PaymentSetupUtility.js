const paymentSetupSchema = require("../schemas/PaymentSetupSchema");
const BaseUtility = require("./BaseUtility");

class PaymentSetupUtility extends BaseUtility {
  constructor() {
    super(paymentSetupSchema);
  }
}

module.exports = PaymentSetupUtility;
