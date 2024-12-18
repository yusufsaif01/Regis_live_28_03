const ParentSchema = require("../schemas/ParentSchema");
const BaseUtility = require("./BaseUtility");

class ParentUtility extends BaseUtility {
  constructor() {
    super(ParentSchema);
  }
}

module.exports = ParentUtility;
