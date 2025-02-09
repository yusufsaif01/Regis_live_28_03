const Promise = require("bluebird");
const errors = require("../errors");
const LoginUtility = require("../db/utilities/LoginUtility");
const PlayerUtility = require("../db/utilities/PlayerUtility");
const ParentUtility = require("../db/utilities/ParentUtility");
const coacheUtility = require("../db/utilities/CoacheUtility");
const EncryptionUtility = require("../db/utilities/EncryptionUtility");
const ClubAcademyUtility = require("../db/utilities/ClubAcademyUtility");
const UserService = require("./UserService");
const uuid = require("uuid/v4");
const AuthUtility = require("../db/utilities/AuthUtility");
const EmailService = require("./EmailService");
const config = require("../config");
const _ = require("lodash");
const AdminUtility = require("../db/utilities/AdminUtility");
const ACCOUNT = require("../constants/AccountStatus");
const MEMBER = require("../constants/MemberType");
const ROLE = require("../constants/Role");
const PROFILE = require("../constants/ProfileStatus");
const RESPONSE_MESSAGE = require("../constants/ResponseMessage");
const redisServiceInst = require("../redis/RedisService");
const FootPlayerUtility = require("../db/utilities/FootPlayerUtility");
const FOOTPLAYER_STATUS = require("../constants/FootPlayerStatus");
const OtpService = require("./OtpService");
const moment = require("moment");
const PLAYER_TYPE = require("../constants/PlayerType");
var crypto = require("crypto");
const fs = require("fs");
var path = require("path");
var conn = require("../db/ConnectionMysql");
const {
  EmailClient,
  KnownEmailSendStatus,
} = require("@azure/communication-email");
const FootCoachUtility = require("../db/utilities/FootCoachUtility");
/**
 *
 *
 * @class UserRegistrationService
 * @extends {UserService}
 */
class UserRegistrationService extends UserService {
  /**
   *Creates an instance of UserRegistrationService.
   * @memberof UserRegistrationService
   */
  constructor() {
    super();
    this.playerUtilityInst = new PlayerUtility();
    this.parentUtilityInst = new ParentUtility();
    this.coacheUtilityInst = new coacheUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.loginUtilityInst = new LoginUtility();
    this.authUtilityInst = new AuthUtility();
    this.emailService = new EmailService();
    this.adminUtilityInst = new AdminUtility();
    this.footPlayerUtilityInst = new FootPlayerUtility();
    this.footCoachUtilityInst = new FootCoachUtility();
  }
  connectionString =
    "endpoint=https://mycsr.unitedstates.communication.azure.com/;accesskey=hSLMNiZDd0wogPYNdT9tpLeqeWAO20/WMMcgjTCalrtIKKgLq+J66RHYPqvd8lK3Us9jfUKZzaySrUuplKohWw==";
  senderAddress =
    "DoNotReply@a1b588b6-9f22-4e0e-bbba-0f3fdd2d88f6.azurecomm.net";
  ecipientAddress = "yusufsaif0@gmail.com";

  /**
   *
   *
   * @param {*} registerUser
   * @returns
   * @memberof UserRegistrationService
   */
  async validateMemberRegistration(registerUser) {
    if (registerUser.member_type == MEMBER.PLAYER) {
      if (!registerUser.first_name) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.FIRST_NAME_REQUIRED)
        );
      }
      if (!registerUser.last_name) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.LAST_NAME_REQUIRED)
        );
      }
    } else {
      if (!registerUser.name) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.NAME_REQUIRED)
        );
      }
    }

    const sql = "SELECT * FROM login_details WHERE username = 'abc0@gmail.com'";

    const [result, fields] = await conn.query(sql);

    //const user = await this.loginUtilityInst.findOne({ "username": registerUser.email });

    return Promise.resolve(registerUser);
  }

  /**
   *
   *
   * @param {*} userData
   * @returns
   * @memberof UserRegistrationService
   */
  
async memberRegistration(userData) {
  try {
    const emailLowerCase = userData.email ? userData.email.toLowerCase() : "";
    userData.user_id = uuid();
    userData.avatar_url = config.app.default_avatar_url;
    const tokenForAccountActivation = await this.authUtilityInst.getAuthToken(
      userData.user_id,
      emailLowerCase,
      userData.member_type
    );
    
    let loginDetails = await this.loginUtilityInst.insert(
      {
        user_id: userData.user_id,
        username: emailLowerCase,
        status: ACCOUNT.PENDING,
        role: userData.member_type,
        member_type: userData.member_type,
        forgot_password_token: tokenForAccountActivation,
      },
      {
        user_id: userData.user_id,
        username: emailLowerCase,
        status: ACCOUNT.PENDING,
        role: userData.member_type,
        member_type: userData.member_type,
        forgot_password_token: tokenForAccountActivation,
      }
    );
    userData.login_details = loginDetails._id;
    let dataObj = {};

    if ([MEMBER.PLAYER, MEMBER.coach, MEMBER.PARENT].includes(userData.member_type)) {
      dataObj.first_name = EncryptionUtility.encrypt(userData.first_name);
      dataObj.last_name = EncryptionUtility.encrypt(userData.last_name);
      dataObj.player_type = userData.player_type;
    } else {
      dataObj.name = EncryptionUtility.encrypt(userData.name);
    }

    dataObj.email = EncryptionUtility.encrypt(
      userData.email ? userData.email.toLowerCase() : ""
    );

    dataObj.phone = EncryptionUtility.encrypt(userData.phone);
    dataObj.country_code = userData.country_code;
    dataObj.termsAccepted = userData.termsAccepted;
    dataObj.member_type = userData.member_type;
    dataObj.user_id = userData.user_id;
    dataObj.avatar_url = userData.avatar_url;

    let dataObjForMongo = {
      email: emailLowerCase,
      first_name: userData.first_name,
      last_name: userData.last_name,
      country_code: userData.country_code,
      phone: userData.phone,
      name: userData.name,
      termsAccepted: userData.termsAccepted,
      member_type: userData.member_type,
      user_id: userData.user_id,
      avatar_url: userData.avatar_url,
    };

    if (userData.member_type === MEMBER.PLAYER) {
      dataObj.player_type = "amateur";
      dataObjForMongo.player_type = "amateur";
      await this.playerUtilityInst.insert(dataObj, dataObjForMongo);
    } else if (userData.member_type === MEMBER.coach) {
      await this.coacheUtilityInst.insert(dataObj, dataObjForMongo);
    } else if (userData.member_type === MEMBER.PARENT) {
      await this.parentUtilityInst.insert(dataObj, dataObjForMongo);
    } else {
      await this.clubAcademyUtilityInst.insert(dataObj, dataObjForMongo);
    }

    await this.updateFootPlayerCollection({
      member_type: userData.member_type,
      email: emailLowerCase,
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
    });

    await redisServiceInst.setKeyValuePair(
      `keyForForgotPassword${tokenForAccountActivation}`,
      userData.user_id
    );
    await redisServiceInst.setKeyValuePair(
      userData.user_id,
      JSON.stringify({
        ...userData,
        forgot_password_token: tokenForAccountActivation,
      })
    );

    let response = {
      email: emailLowerCase,
      name: userData.first_name || userData.name,
    };
    console.log("return response is", response);
    return response;
  } catch (e) {
    console.log(e);
    return Promise.reject(e);
  }
}


  /**
   * updates footPlayerCollection
   *
   * @param {*} [requestedData={}]
   * @returns
   * @memberof UserRegistrationService
   */
  async updateFootPlayerCollection(requestedData = {}) {
    try {
      
      console.log(requestedData)
      if (requestedData.member_type === 'player') {
        
        let footplayerInvite =
          await this.footPlayerUtilityInst.findOneFootRequest({
            "send_to.email": requestedData.email,
            status: FOOTPLAYER_STATUS.INVITED,
          });
        if (_.isEmpty(footplayerInvite)) {
          return Promise.resolve();
        }
        if (_.isEmpty(footplayerInvite)) {
          return Promise.resolve();
        }
        let updatedDoc = {};
        if (requestedData.member_type != MEMBER.PLAYER) {
          updatedDoc = { status: FOOTPLAYER_STATUS.REJECTED };
        } else {
          updatedDoc = {
            "send_to.user_id": requestedData.user_id,
            "send_to.name": `${requestedData.first_name} ${requestedData.last_name}`,
            "send_to.phone": requestedData.phone,
            status: FOOTPLAYER_STATUS.PENDING,
          };
        }
        await this.footPlayerUtilityInst.updateMany(
          {
            "send_to.email": requestedData.email,
            status: FOOTPLAYER_STATUS.INVITED,
          },
          updatedDoc
        );
      }
      else {
          let footcoachInvite =
            await this.footCoachUtilityInst.findOneFootRequest({
              "send_to.email": requestedData.email,
              status: FOOTPLAYER_STATUS.INVITED,
            });
          if (_.isEmpty(footcoachInvite)) {
            return Promise.resolve();
          }
          if (_.isEmpty(footcoachInvite)) {
            return Promise.resolve();
          }
          let updatedDoc = {};
          if (requestedData.member_type != MEMBER.coach) {
            updatedDoc = { status: FOOTPLAYER_STATUS.REJECTED };
          } else {
            updatedDoc = {
              "send_to.user_id": requestedData.user_id,
              "send_to.name": `${requestedData.first_name} ${requestedData.last_name}`,
              "send_to.phone": requestedData.phone,
              status: FOOTPLAYER_STATUS.PENDING,
            };
          }
          await this.footCoachUtilityInst.updateMany(
            {
              "send_to.email": requestedData.email,
              status: FOOTPLAYER_STATUS.INVITED,
            },
            updatedDoc
          );
        
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   *
   *
   * @param {*}
   *
   * @returns
   * @memberof UserRegistrationService
   */
  toAPIResponse({
    user_id,
    name,
    dob,
    role,
    email,
    avatar_url,
    state,
    country,
    phone,
    token,
    status,
    first_name,
    last_name,
    member_type,
    registration_number,
    is_email_verified,
  }) {
    return {
      user_id,
      name,
      dob,
      role,
      email,
      token,
      avatar_url,
      first_name,
      last_name,
      member_type,
      registration_number,
      state,
      country,
      phone,
      status,
      is_email_verified,
    };
  }

  async adminRegistration(adminDetails = {}) {
    const user = await this.loginUtilityInst.findOne({
      username: adminDetails.email,
    });
    if (!_.isEmpty(user)) {
      return Promise.reject(
        new errors.Conflict(RESPONSE_MESSAGE.EMAIL_ALREADY_REGISTERED)
      );
    }

    adminDetails.user_id = uuid();
    adminDetails.avatar_url = config.app.default_avatar_url; // default user icon

    let loginDetails = await this.loginUtilityInst.insert({
      user_id: adminDetails.user_id,
      username: adminDetails.email,
      status: ACCOUNT.ACTIVE,
      role: ROLE.ADMIN,
      password: adminDetails.password,
      profile_status: PROFILE.VERIFIED,
      is_email_verified: true,
    });
    adminDetails.login_details = loginDetails._id;

    await this.adminUtilityInst.insert(adminDetails);
  }

  /**
   * returns player type wrt dob
   *
   * @param {*} dob
   * @memberof UserRegistrationService
   */
  async getPlayerTypeFromDOB(dob) {
    try {
      let now = moment();
      let age = now.diff(dob, "years", true);
      let playerType = age > 12 ? PLAYER_TYPE.AMATEUR : PLAYER_TYPE.GRASSROOT;
      return Promise.resolve(playerType);
    } catch (e) {
      console.log(
        "Error in getPlayerTypeFromDOB() of UserRegistrationService",
        e
      );
      return Promise.reject(e);
    }
  }
}

module.exports = UserRegistrationService;
