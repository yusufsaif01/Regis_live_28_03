const PaymentRecordSchema = require("../schemas/PaymentRecordSchema");
const BaseUtility = require("./BaseUtility");

class PaymentRecordUtility extends BaseUtility {
  constructor() {
    super(PaymentRecordSchema);
  }
}

module.exports = PaymentRecordUtility;
