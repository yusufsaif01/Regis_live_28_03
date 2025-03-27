const OrderCreateSchema = require("../schemas/OrderCreateSchema");
const BaseUtility = require("./BaseUtility");

class OrderCreateUtility extends BaseUtility {
  constructor() {
    super(OrderCreateSchema);
  }
}

module.exports = OrderCreateUtility;
