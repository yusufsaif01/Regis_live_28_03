const playerFeeStatusSchema = require("../schemas/PlayerFeeStatusSchema");
const BaseUtility = require("./BaseUtility");

class PlayerFeeStatusUtility extends BaseUtility {
  constructor() {
    super(playerFeeStatusSchema);
  }
}

module.exports = PlayerFeeStatusUtility;
