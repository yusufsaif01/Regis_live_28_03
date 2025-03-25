const MpinSchema = require("../schemas/MpinSchema");
const BaseUtility = require("./BaseUtility");

class MpinUtility extends BaseUtility {
  constructor() {
    super(MpinSchema);
  }
}

module.exports = MpinUtility;
