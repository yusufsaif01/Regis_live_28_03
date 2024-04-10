const Promise = require("bluebird");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var config = require("../../config");
const errors = require("../../errors");
const LoginUtility = require("./LoginUtility");
const ACCOUNT = require("../../constants/AccountStatus");
const RESPONSE_MESSAGE = require("../../constants/ResponseMessage");
const redisServiceInst = require("../../redis/RedisService");

class AuthUtility {
  constructor() {
    this.loginUtility = new LoginUtility();
  }

  tokenCompare(pass1, pass2) {
    console.log("inside tokenComapre !!!!!!!!!!!");
    return this.bcryptTokenCompare(pass1, pass2);
  }

  getAuthToken(id, email, member_type) {
    console.log("inside getAuthToken !!!!!!!!!!!");
    return this.signWithJWT(
      JSON.stringify({
        id,
        email,
        member_type,
      }),
      config.jwt.jwt_secret,
      config.jwt.expiry_in
    );
  }

  randomBytes(len = 20) {
    console.log("inside randomBytes !!!!!!!!!!!");
    return crypto.randomBytes(len).toString("hex");
  }

  async bcryptToken(password) {
    console.log("inside bcryptToken !!!!!!!!!!!");
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }

  async bcryptTokenCompare(pass1, pass2) {
    console.log("inside bcryptTokenCompare !!!!!!!!!!!");
    let isMatched = await bcrypt.compare(pass1, pass2);
    isMatched = isMatched ? true : false;
    return Promise.resolve(isMatched);
  }

  signWithJWT(string, secretKey, expiry) {
    return new Promise((resolve, reject) => {
      let data = JSON.parse(string);

      jwt.sign(data, secretKey, { expiresIn: "7d" }, (err, token) => {
        if (err) {
          console.log("token get expire in error body");
          return reject(err);
        }
        return resolve(token);
      });
    });
  }

  jwtVerification(token, secretKey) {
    return new Promise((resolve, reject) => {
      return jwt.verify(token.split(" ")[1], secretKey, function (err, data) {
        if (err) {
          console.log(err);
          return reject(new errors.InvalidToken());
        }

        return resolve(data);
      });
    });
  }

  async getUserByToken(token, isCheckStatus, isCheckForgotPassToken) {
    try {
      token = token.split(" ")[1];
      let user_id = isCheckForgotPassToken
        ? await redisServiceInst.getUserIdFromCacheByKey(
            `keyForForgotPassword${token}`
          )
        : await redisServiceInst.getUserIdFromCacheByKey(token);

      if (!user_id) {
        return Promise.reject(new errors.InvalidToken());
      }
      let user = await redisServiceInst.getUserFromCacheByKey(user_id);
      user.token = token;
      if (user) {
        if (isCheckStatus) {
          let status = user.status;
          if (status === ACCOUNT.BLOCKED) {
            throw new errors.Unauthorized(RESPONSE_MESSAGE.USER_BLOCKED);
          } else if (status !== ACCOUNT.ACTIVE) {
            throw new errors.Unauthorized(RESPONSE_MESSAGE.USER_INACTIVE);
          }
        }

        if (isCheckForgotPassToken) {
          console.log("inside isCheckForgotPassToken 1");
          if (user.forgot_password_token) {
            const fpt = "Bearer " + user.forgot_password_token;
            console.log("fpt value is ", fpt);
            const fptUser = await this.jwtVerification(
              fpt,
              config.jwt.jwt_secret
            );
            if (user.user_id !== fptUser.id)
              throw new errors.Unauthorized(
                RESPONSE_MESSAGE.USER_AUTHENTICATION_FAILED
              );
          } else {
            throw new errors.LinkExpired(RESPONSE_MESSAGE.LINK_EXPIRED);
          }
        }
        return user;
      } else {
        throw new errors.Unauthorized();
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }
}

module.exports = AuthUtility;
