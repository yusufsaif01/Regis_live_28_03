const Connection = require("./Connection");
const config = require("../config");
var mysql = require("mysql2/promise");
const fs = require("fs");
var path = require("path");
class DB {
  async connectDB() {
    let host = config.db.host;
    let dbName = config.db.name;
    let url = host + dbName;
    let options = config.db.options;
    if (config.db.is_auth_enable) {
      options.user = config.db.db_user;
      options.pass = config.db.db_pass;
      options.authSource = config.db.db_auth_source;
    }
    this.dbConnection = await Connection.connectMongoDB(url, options);
    return this.dbConnection;
  }

  async connectMySqlFunction() {
    try {
    const conn =await mysql.createConnection( {
        host: "yftregistration.mysql.database.azure.com",
        user: "yftregistration",
        password: "Dyt799@#mysqlServer",
        database: "yft_registration_in",
        port: 3306,
        ssl: {
          ca: fs.readFileSync(
            path.join(
              __dirname,
              "./utilities/certificate/DigiCertGlobalRootCA.crt.pem"
            )
          ),
        },
      });
      
      console.log("Mysql connect");
      return conn;
    } catch (err) {
      console.error({ err }, "Error in mYsql Connect DB connection.");
      throw err;
    }
  }
}

module.exports = new DB();
