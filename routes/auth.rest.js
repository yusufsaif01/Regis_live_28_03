const userValidator = require("../middleware/validators").userValidator;
const UserRegistrationService = require('../services/UserRegistrationService');
const { checkAuthToken, checkTokenForAccountActivation, removeAuthToken } = require('../middleware/auth');
const responseHandler = require('../ResponseHandler');
const AuthService = require('../services/AuthService');
const CreateTraningCenterService = require("../services/CreateTraningCenterService");
const OtpService = require("../services/OtpService");
module.exports = (router) => {
    /**
	 * @api {post} /register register 
	 * @apiName Register
	 * @apiGroup Auth
	 *
	 * @apiParam (body) {String} member_type  player/club/academy.
	 * @apiParam (body) {String} first_name if member type player
	 * @apiParam (body) {String} last_name if member type player
	 * @apiParam (body) {String} name if member type club/academy
	 * @apiParam (body) {String} type type of club/academy Residential/Non-Residential
	 * @apiParam (body) {String} dob dob of player
	 * @apiParam (body) {String} phone phone number of member
	 * @apiParam (body) {String} email email of member
	 *
	 * @apiSuccess {String} status success
	 * @apiSuccess {String} message Successfully done
	 *
	 * @apiSuccessExample {json} Success-Response:
	 *     HTTP/1.1 200 OK
	 *     {
	 *       "status": "success",
	 *       "message": "Successfully done"
	 *     }
	 *
	 *
	 * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	 *     HTTP/1.1 500 Internal server error
	 *     {
     *       "message": "Internal Server Error",
     *       "code": "INTERNAL_SERVER_ERROR",
     *       "httpCode": 500
	 *     }
	 *
	 */
	router.post('/register', function (req, res) {
		console.log("register api hits inside registration middleware")
		const serviceInst = new UserRegistrationService();
		console.log("in new middleware")
		responseHandler(req, res, serviceInst.memberRegistration(req.body));
	});


	//otp verify

	  router.post("/otp/verify", function (req, res) {
      console.log(req.body.otp);
	  console.log(req.body.email);
		  
    const serviceInst = new OtpService()
    responseHandler(req, res, serviceInst.otpVerify(req.body));
    });
	// create traning center

	  router.post("/create_traning_center", function (req, res) {
      const serviceInst = new CreateTraningCenterService();
      responseHandler(req, res, serviceInst.createTraningCenter(req.body));
    });
	/**
	 * @api {post} /login login
	 * @apiName Login
	 * @apiGroup Auth
	 *
	 * @apiParam (body) {String} email email of member.
	 * @apiParam (body) {String} password password of member
	 *
	 * @apiSuccess {String} status success
	 * @apiSuccess {String} message Successfully done
	 *
	 * @apiSuccessExample {json} Success-Response:
	 *     HTTP/1.1 200 OK
	 *     {
	 *       "status": "success",
	 *       "message": "Successfully done",
     *       "data": {
     *                "user_id": "7b2aae40-b92d-41c9-a1b5-84c0b20d9996",
     *                "email": "newclub@newclub.com",
     *                "role": "club",
     *                "member_type": "club",
	 *                "avatar_url": "/uploads/avatar/user-avatar.png",
     *                "token": "emlhdCI6MTU4NjM1MTgzOZQXcVhb7e8xD9EaImqZwaErrhK7s"
     *}
	 *}
	 *
	 *
	 * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	 *     HTTP/1.1 500 Internal server error
	 *     {
     *       "message": "Internal Server Error",
     *       "code": "INTERNAL_SERVER_ERROR",
     *       "httpCode": 500
	 *     }
	 *
	 */
	router.post('/login', function (req, res) {
		console.log("loggeddddd");
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.login(req.body.email, req.body.password));
		
	});
	/**
* @api {put} /activate email verification
* @apiName activate
* @apiGroup Auth
*
* @apiSuccess {String} status success
* @apiSuccess {String} message Successfully done
*
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "status": "success",
*       "message": "Successfully done"
*     }
*
* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
*     HTTP/1.1 500 Internal server error
*     {
*       "message": "Internal Server Error",
*       "code": "INTERNAL_SERVER_ERROR",
*       "httpCode": 500
*     }
*
* @apiErrorExample {json} UNAUTHORIZED
*     HTTP/1.1 401 Unauthorized
*     {
*       "message": "Unauthorized",
*       "code": "UNAUTHORIZED",
*       "httpCode": 401
*     }
* 
*/
	router.put('/activateemail', function (req, res, next) {
		console.log("inside registration activate")
		console.log(req.body.email)
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.emailVerification(req.body.email));
	})
	
	/**
	* @api {post} /create-password create password 
	* @apiName Create password
	* @apiGroup Auth
	*
	* @apiParam (body) {String} password password by member.
	* @apiParam (body) {String} confirmPassword confirm password by member
	* @apiSuccess {String} status success
	* @apiSuccess {String} message Successfully done
	*
	* @apiSuccessExample {json} Success-Response:
	*     HTTP/1.1 200 OK
	*     {
	*       "status": "success",
	*       "message": "Successfully done"
	*     }
	*
	* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	*     HTTP/1.1 500 Internal server error
	*     {
	*       "message": "Internal Server Error",
	*       "code": "INTERNAL_SERVER_ERROR",
	*       "httpCode": 500
	*     }
	*
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "Unauthorized",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	*
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "user is not registered",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	*
    *@apiErrorExample {json} VALIDATION_FAILED
	*     HTTP/1.1 422 Validiation Failed
	*     {
	*       "message": "Password already created",
    *       "code": "VALIDATION_FAILED",
    *       "httpCode": 422
	*     }
	*  
	*/
	router.post('/create-password', function (req, res) {
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.createPassword(req.body.body.email, req.body.body.password, req.body.body.confirmPassword));
		
	});
	/**
	* @api {post} /reset-password reset password 
	* @apiName Reset password
	* @apiGroup Auth
	*
	* @apiParam (body) {String} password password by member.
	* @apiParam (body) {String} confirmPassword confirm password by member
	* @apiSuccess {String} status success
	* @apiSuccess {String} message Successfully done
	*
	* @apiSuccessExample {json} Success-Response:
	*     HTTP/1.1 200 OK
	*     {
	*       "status": "success",
	*       "message": "Successfully done"
	*     }
	*
	* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	*     HTTP/1.1 500 Internal server error
	*     {
	*       "message": "Internal Server Error",
	*       "code": "INTERNAL_SERVER_ERROR",
	*       "httpCode": 500
	*     }
	*
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "Unauthorized",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	*
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "user is not registered",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	*  
	* @apiErrorExample {json} VALIDATION_FAILED
	*     HTTP/1.1 422 Validation Failed
	*     {
	*       "message": "account is not activated",
	*       "code": "VALIDATION_FAILED",
	*       "httpCode": 422
	*     }
	*
	*/
	router.post('/reset-password', checkTokenForAccountActivation, function (req, res) {
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.resetPassword(req.authUser, req.body.password, req.body.confirmPassword));
	});
	/**
	* @api {post} /logout logout 
	* @apiName Logout
	* @apiGroup Auth
	*
	* @apiSuccess {String} status success
	* @apiSuccess {String} message Successfully done
	*
	* @apiSuccessExample {json} Success-Response:
	*     HTTP/1.1 200 OK
	*     {
	*       "status": "success",
	*       "message": "Successfully done"
	*     }
	*
	*
	* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	*     HTTP/1.1 500 Internal server error
	*     {
	*       "message": "Internal Server Error",
	*       "code": "INTERNAL_SERVER_ERROR",
	*       "httpCode": 500
	*     }
	*
	* @apiErrorExample {json} Unauthorized
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "Unauthorized",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	* 
	*/
	router.post('/logout', removeAuthToken, function (req, res) {
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.logout(req.authUser));
	});
    /**
	 * @api {post} /forgot-password forgot password
	 * @apiName Forgot password
	 * @apiGroup Auth
	 *
	 * @apiParam (body) {String} email email of member.
	 * @apiSuccess {String} status success
	 * @apiSuccess {String} message Successfully done
	 *
	 * @apiSuccessExample {json} Success-Response:
	 *     HTTP/1.1 200 OK
	 *     {
	 *       "status": "success",
	 *       "message": "Successfully done"
	 *     }
	 *
	 * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	 *     HTTP/1.1 500 Internal server error
	 *     {
     *       "message": "Internal Server Error",
     *       "code": "INTERNAL_SERVER_ERROR",
     *       "httpCode": 500
	 *     }
	 *
     * @apiErrorExample {json} UNAUTHORIZED
	 *     HTTP/1.1 401 Unauthorized
	 *     {
	 *       "message": "Unauthorized",
     *       "code": "UNAUTHORIZED",
     *       "httpCode": 401
	 *     }
     * 
     * @apiErrorExample {json} UNAUTHORIZED
	 *     HTTP/1.1 401 Unauthorized
	 *     {
	 *       "message": "user is not registered",
     *       "code": "UNAUTHORIZED",
     *       "httpCode": 401
	 *     }
     * 
	 * @apiErrorExample {json} VALIDATION_FAILED
	 *     HTTP/1.1 422 Validation Failed
	 *     {
	 *       "message": "account is not activated",
     *       "code": "VALIDATION_FAILED",
     *       "httpCode": 422
	 *     }
	 * 
	 */
	router.post('/forgot-password', function (req, res) {
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.forgotPassword(req.body.email));
	});
	/**
* @api {post} /change-password change password
* @apiName Change password
* @apiGroup Auth
*
* @apiParam (body) {String} old_password current password of member.
* @apiParam (body) {String} new_password new password by member.
* @apiParam (body) {String} confirm_password confirm password by member
* @apiSuccess {String} status success
* @apiSuccess {String} message Successfully done
*
* @apiSuccessExample {json} Success-Response:
*     HTTP/1.1 200 OK
*     {
*       "status": "success",
*       "message": "Successfully done"
*     }
*
* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
*     HTTP/1.1 500 Internal server error
*     {
*       "message": "Internal Server Error",
*       "code": "INTERNAL_SERVER_ERROR",
*       "httpCode": 500
*     }
*
* @apiErrorExample {json} UNAUTHORIZED
*     HTTP/1.1 401 Unauthorized
*     {
*       "message": "Unauthorized",
*       "code": "UNAUTHORIZED",
*       "httpCode": 401
*     }
* 
* @apiErrorExample {json} VALIDATION_FAILED
*     HTTP/1.1 422 Validation Failed
*     {
*       "message": "account is not activated",
*       "code": "VALIDATION_FAILED",
*       "httpCode": 422
*     }
*
* @apiErrorExample {json} BAD_REQUEST
*     HTTP/1.1 400 Bad Request
*     {
*       "message": "old password is incorrect",
*       "code": "BAD_REQUEST",
*       "httpCode": 400
*     }
* 
* @apiErrorExample {json} UNAUTHORIZED
*     HTTP/1.1 401 Unauthorized
*     {
*       "message": "user is not registered",
*       "code": "UNAUTHORIZED",
*       "httpCode": 401
*     }
* 
*/
	router.post('/change-password', checkAuthToken, function (req, res) {
		const authServiceInst = new AuthService();
		responseHandler(req, res, authServiceInst.changePassword(req.authUser, req.body.old_password, req.body.new_password, req.body.confirm_password));
	});

    /**
	* @api {get} /link/status check the status of the forgot password link
	* @apiName Forgot password link status
	* @apiGroup Auth
	*
	* @apiSuccess {String} status success
	* @apiSuccess {String} message Successfully done
	*
	* @apiSuccessExample {json} Success-Response:
	*     HTTP/1.1 200 OK
	*     {
	*       "status": "success",
	*       "message": "Successfully done"
	*     }
	*
	* @apiErrorExample {json} INTERNAL_SERVER_ERROR:
	*     HTTP/1.1 500 Internal server error
	*     {
	*       "message": "Internal Server Error",
	*       "code": "INTERNAL_SERVER_ERROR",
	*       "httpCode": 500
	*     }
	*
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "Unauthorized",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
    *
	* @apiErrorExample {json} UNAUTHORIZED
	*     HTTP/1.1 401 Unauthorized
	*     {
	*       "message": "Unauthorized",
	*       "code": "UNAUTHORIZED",
	*       "httpCode": 401
	*     }
	* 
	*/
	router.get('/link/status', checkTokenForAccountActivation, function (req, res, next) {
		responseHandler(req, res, Promise.resolve());
	})
};
