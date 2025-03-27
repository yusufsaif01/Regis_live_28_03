const createError  = require('http-errors');
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const logger       = require('morgan');
const apiRouter    = require('./routes/index');
const app          = express();
const db         = require('./db');
const config       = require('./config');
const cors = require('cors')
const responseHandler = require("./ResponseHandler");
const errors = require("./errors");
const StorageProvider = require('storage-provider');
 var request = require("request");
global.__basedir = path.resolve(__dirname);

/*Db Connection*/
db.connectDB();
/*Mysql Connection*/

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(StorageProvider.addUploadMiddleware({
  limits: {
    fileSize: 15 * 1024 * 1024 * 1024 // 15 GB
  },
  createParentPath: true,
  uriDecodeFileNames: true,
  safeFileNames: true,
  preserveExtension: 4,
  abortOnLimit: true,
  limitHandler: function (req, res, next) {
      next(new errors.MaxFileLimitExceeded(null, { size: "15 GB" }));
  },
  useTempFiles: true,
  tempFileDir: "/tmp",
  debug: true
}));

var whitelist = config.app.client_domains.split(",");

var corsOptions = {
  origin: function (origin, callback) {
    if (origin && whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions));

apiRouter.loadRoutes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    if(err.status && err.status === 404){
      err = new errors.NotFound("No resource found");
    }
    // render the error page
    responseHandler(req, res, Promise.reject(err));
});

app.listen(config.server.port, config.server.host, function(x) {
    let host = config.server.host, port = config.server.port;
    console.log(`App is running on http://${host}:${port}`);
});

module.exports = app;
