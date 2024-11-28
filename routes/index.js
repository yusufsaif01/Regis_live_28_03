const express = require('express');
const authRoutes = require('./auth.rest');
const accessToken = require('./access-token.rest');
const checkAccessToken = require('../middleware/auth/access-token');
const userProfileRoutes = require("./userProfile.rest");
const memberRoutes = require("./member.rest");
class Route {
	loadRoutes(app) {
		const apiRouter = express.Router();
		const accessTokenRouter = express.Router();
    
		authRoutes(apiRouter);
		memberRoutes(apiRouter);
		accessToken(accessTokenRouter);
		userProfileRoutes(apiRouter);
		app.use("/registration/in/access-token", accessTokenRouter)
		app.use('/registration/in', checkAccessToken(), apiRouter);
		app.use("/apidocs", express.static("apidocs/doc"));
		app.use("/uploads", express.static("uploads"));
		app.use("/public", express.static("public"));

	}
}

module.exports = new Route();
