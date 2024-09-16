var mysql = require("mysql2/promise");
const fs = require("fs");
var path = require("path");

    var conn = mysql.createPool({
      host: "yftregistration.mysql.database.azure.com",
      user: "yftregistration",
      password: "Dyt799@#mysqlServer",
      database: "yft_registration_in",
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
