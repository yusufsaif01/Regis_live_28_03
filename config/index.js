const convict = require("convict");
const app = require("./configs/app.json");
const mailer = require("./configs/mailer.json");
const azureMailer = require("./configs/azureMailer.json");
const logger = require("./configs/logger.json");
const server = require("./configs/server.json");
const db = require("./configs/db.json");
const helper = require("./configs/helper.json");
const jwt = require("./configs/jwt.json");
//const redis = require("./configs/redis.json")
const storage = require("./configs/storage.json");
const state_district_storage = require("./configs/state-district-storage.json");
const vimeo = require('./configs/vimeo.json');
const mySqlDb = require('./configs/mySqlDb.json')
const cashfree = require('./configs/cashfree.json')

// Define a schema
var config = convict({
  app,
  mailer,
  azureMailer,
  logger,
  db,
  server,
  helper,
  jwt,
  storage,
  state_district_storage,
  vimeo,
  mySqlDb,
  cashfree,
});

// Perform validation
config.validate({ allowed: "strict" });

module.exports = config._instance;
