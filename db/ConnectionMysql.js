var mysql = require("mysql2/promise");
const fs = require("fs");
var path = require("path");
const config = require("../config");

    var conn = mysql.createPool({
      host: config.mySqlDb.db_host,
      user: config.mySqlDb.db_user,
      password: config.mySqlDb.db_pass,
      database: config.mySqlDb.db_name,
      port: 3306,
      connectionLimit: 10,
      ssl: {
        ca: fs.readFileSync(
          path.join(
            __dirname,
            "./utilities/certificate/DigiCertGlobalRootCA.crt.pem"
          )
        ),
      },
    });
    

module.exports = conn;
