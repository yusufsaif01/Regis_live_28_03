const Promise = require("bluebird");
const errors = require("../errors");
const LoginUtility = require("../db/utilities/LoginUtility");
const PlayerUtility = require("../db/utilities/PlayerUtility");
const coacheUtility = require("../db/utilities/CoacheUtility");
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
const {
  EmailClient,
  KnownEmailSendStatus,
} = require("@azure/communication-email");
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
    this.coacheUtilityInst = new coacheUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.loginUtilityInst = new LoginUtility();
    this.authUtilityInst = new AuthUtility();
    this.emailService = new EmailService();
    this.adminUtilityInst = new AdminUtility();
    this.footPlayerUtilityInst = new FootPlayerUtility();
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

    var mysql = require("mysql2/promise");

    var con = await mysql.createConnection({
      host: "yftregistration.mysql.database.azure.com",
      user: "yftregistration",
      password: "Dyt799@#mysqlServer",
      database: "yft_registration_in",
      port: 3306,
      ssl: {
        ca: fs.readFileSync(
          path.join(__dirname, "./certificate/DigiCertGlobalRootCA.crt.pem")
        ),
      },
    });

    const sql = "SELECT * FROM login_details WHERE username = 'abc0@gmail.com'";

    const [result, fields] = await con.query(sql);

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
      // await this.validateMemberRegistration(userData);

      userData.user_id = uuid();
      userData.avatar_url = config.app.default_avatar_url; // default user icon
      const tokenForAccountActivation = await this.authUtilityInst.getAuthToken(
        userData.user_id,
        userData.email,
        userData.member_type
      );

      //Encryption of Data
      var algorithm = "aes256"; // or any other algorithm supported by OpenSSL
      var key = "password";
      var cipher_for_name = crypto.createCipher(algorithm, key);
      var cipher_for_fisrt_name = crypto.createCipher(algorithm, key);
      var cipher_for_last_name = crypto.createCipher(algorithm, key);
      var cipher_for_email = crypto.createCipher(algorithm, key);
      var cipher_for_phone = crypto.createCipher(algorithm, key);
     
      let loginDetails = await this.loginUtilityInst.insert(
        {
          user_id: userData.user_id,
          username: userData.email,
          status: ACCOUNT.PENDING,
          role: userData.member_type,
          member_type: userData.member_type,
          forgot_password_token: tokenForAccountActivation,
        },
        {
          user_id: userData.user_id,
          username: userData.email,
          status: ACCOUNT.PENDING,
          role: userData.member_type,
          member_type: userData.member_type,
          forgot_password_token: tokenForAccountActivation,
        }
      );
      
      userData.login_details = loginDetails._id;
      var dataObj = {};
      if (
        userData.member_type == MEMBER.PLAYER ||
        userData.member_type == MEMBER.coach
      ) {
        var enc_first_name =
          cipher_for_fisrt_name.update(userData.first_name, "utf8", "hex") +
          cipher_for_fisrt_name.final("hex");

        var enc_last_name =
          cipher_for_last_name.update(userData.last_name, "utf8", "hex") +
          cipher_for_last_name.final("hex");

        dataObj.first_name = enc_first_name;
        dataObj.last_name = enc_last_name;
        dataObj.dob = userData.dob;
        dataObj.player_type = userData.player_type;
      } else {
        var enc_name =
          cipher_for_name.update(userData.name, "utf8", "hex") +
          cipher_for_name.final("hex");
      }
      var enc_email =
        cipher_for_email.update(userData.email, "utf8", "hex") +
        cipher_for_email.final("hex");

      var enc_phone =
        cipher_for_phone.update(userData.phone, "utf8", "hex") +
        cipher_for_phone.final("hex");

      dataObj.email = enc_email;
      dataObj.country_code = userData.country_code;

      dataObj.termsAccepted = userData.termsAccepted;
      dataObj.member_type = userData.member_type;
      dataObj.user_id = userData.user_id;
      dataObj.avatar_url = userData.avatar_url;

      dataObj.phone = enc_phone;

      var dataObjForMongo = {};

      dataObjForMongo.email = userData.email;
      dataObjForMongo.first_name = userData.first_name;
      dataObjForMongo.last_name = userData.last_name;
      dataObjForMongo.country_code = userData.country_code;
      dataObjForMongo.name = userData.name;
      dataObjForMongo.termsAccepted = userData.termsAccepted;
      dataObjForMongo.member_type = userData.member_type;
      dataObjForMongo.user_id = userData.user_id;
      dataObjForMongo.avatar_url = userData.avatar_url;
      if (userData.member_type == MEMBER.PLAYER) {
        userData.dob = moment(userData.dob).format("YYYY-MM-DD");
        const player_type = await this.getPlayerTypeFromDOB(userData.dob);
        dataObj.player_type = player_type;
        dataObjForMongo.player_type = player_type;
        await this.playerUtilityInst.insert(dataObj, dataObjForMongo);
      } else if (userData.member_type == MEMBER.coach) {
        userData.dob = moment(userData.dob).format("YYYY-MM-DD");
         const player_type = await this.getPlayerTypeFromDOB(userData.dob);
         dataObj.player_type = player_type;
         dataObjForMongo.player_type = player_type;
        await this.coacheUtilityInst.insert(dataObj, dataObjForMongo);
      } else {
        dataObj.name = enc_name;
        await this.clubAcademyUtilityInst.insert(dataObj, dataObjForMongo);
      }
      console.log("before updateFootplayerCollection===>")
      await this.updateFootPlayerCollection({
        member_type: userData.member_type,
        email: userData.email,
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
      let accountActivationURL =
        config.app.baseURL +
        "create-password?token=" +
        tokenForAccountActivation;

      //  this.emailService.emailVerification(
      //  userData.email,
      //accountActivationURL,
      // userData.first_name || userData.name
      //);

      // Function to generate OTP
      const serviceInst = new OtpService();
      // const OTP = await serviceInst.otp_generate(
      //   userData.email,
      //   accountActivationURL,
      //   userData.first_name || userData.name
      //);

      
      //  this.emailService.emailVerification(
      //  userData.email,
      //accountActivationURL,
      // userData.first_name || userData.name,
      // OTP
      //);
      let response = {
        email: userData.email,
        name: userData.first_name || userData.name,
      };
      return response;
      return Promise.resolve();
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
      console.log("before findone query in update FootPlayerColletction");
      console.log(requestedData)
      let footplayerInvite =
        await this.footPlayerUtilityInst.findOneFootRequest({
          "send_to.email": requestedData.email,
          status: FOOTPLAYER_STATUS.INVITED,
        });
      
      
       if (_.isEmpty(footplayerInvite)) {
         return Promise.resolve();
       }
      console.log("after find one query in FootPlayerCollection");
      console.log("footplayerInvite data is",footplayerInvite)
      if (_.isEmpty(footplayerInvite)) {
        console.log("inside _.isEmpty==>")
        return Promise.resolve();
      }
      let updatedDoc = {};
      if (requestedData.member_type != MEMBER.PLAYER) {
        updatedDoc = { status: FOOTPLAYER_STATUS.REJECTED };
      } else {
        console.log("updateedDoc inside else block")
        updatedDoc = {
          "send_to.user_id": requestedData.user_id,
          "send_to.name": `${requestedData.first_name} ${requestedData.last_name}`,
          "send_to.phone": requestedData.phone,
          status: FOOTPLAYER_STATUS.PENDING,
        };
      }
      console.log("Before Update DOc in UpdateMany Footplayer")
      console.log("update doc is",updatedDoc)
      await this.footPlayerUtilityInst.updateMany(
        {
          "send_to.email": requestedData.email,
          status: FOOTPLAYER_STATUS.INVITED,
        },
        updatedDoc
      );
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
