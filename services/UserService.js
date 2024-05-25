const Promise = require("bluebird");
const errors = require("../errors");
const PlayerUtility = require("../db/utilities/PlayerUtility");
const coacheUtility = require("../db/utilities/CoacheUtility");
const ClubAcademyUtility = require("../db/utilities/ClubAcademyUtility");
const AuthUtility = require("../db/utilities/AuthUtility");
const LoginUtility = require("../db/utilities/LoginUtility");
const BaseService = require("./BaseService");
const _ = require("lodash");
const UserListResponseMapper = require("../dataModels/responseMapper/UserListResponseMapper");
const MemberListResponseMapper = require("../dataModels/responseMapper/MemberListResponseMapper");
const MEMBER = require("../constants/MemberType");
const EMAIL_VERIFIED = require("../constants/EmailVerified");
const PLAYER = require("../constants/PlayerType");
const CONNECTION_REQUEST = require("../constants/ConnectionRequestStatus");
const RESPONSE_MESSAGE = require("../constants/ResponseMessage");
const ACCOUNT = require("../constants/AccountStatus");
const AchievementUtility = require("../db/utilities/AchievementUtility");
const ConnectionUtility = require("../db/utilities/ConnectionUtility");
const ConnectionRequestUtility = require("../db/utilities/ConnectionRequestUtility");
const AchievementListResponseMapper = require("../dataModels/responseMapper/AchievementListResponseMapper");
const redisServiceInst = require("../redis/RedisService");
const PROFILE_STATUS = require("../constants/ProfileStatus");
const PROFILE_DETAIL = require("../constants/ProfileDetailType");
const responseHandler = require("../ResponseHandler");
var crypto = require("crypto");
class UserService extends BaseService {
  constructor() {
    super();
    this.playerUtilityInst = new PlayerUtility();
    this.coacheUtilityInst = new coacheUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.achievementUtilityInst = new AchievementUtility();
    this.connectionUtilityInst = new ConnectionUtility();
    this.connectionRequestUtilityInst = new ConnectionRequestUtility();
    this.authUtilityInst = new AuthUtility();
    this.loginUtilityInst = new LoginUtility();
  }

  async getList(requestedData = {}) {
    try {
      let member_type = requestedData.member_type,
        response = {},
        data;

      let conditions = this._prepareSearchCondition(
        requestedData.filter,
        member_type
      );

      let paginationOptions = requestedData.paginationOptions || {};
      let sortOptions = requestedData.sortOptions || {};

      let skipCount = (paginationOptions.page_no - 1) * paginationOptions.limit;
      let options = {
        limit: paginationOptions.limit,
        skip: skipCount,
        sort: {},
      };

      if (!_.isEmpty(sortOptions.sort_by) && !_.isEmpty(sortOptions.sort_order))
        options.sort[sortOptions.sort_by] = sortOptions.sort_order;

      if (
        requestedData.filterConditions &&
        (requestedData.filterConditions.email_verified ||
          requestedData.filterConditions.profile_status)
      ) {
        let _condition = {};
        if (requestedData.filterConditions.email_verified)
          _condition.is_email_verified =
            String(
              requestedData.filterConditions.email_verified
            ).toLowerCase() === EMAIL_VERIFIED.TRUE;
        if (requestedData.filterConditions.profile_status)
          _condition.profile_status = {
            status: requestedData.filterConditions.profile_status,
          };

        let users = await this.loginUtilityInst.find(_condition, {
          user_id: 1,
        });
        users = _.map(users, "user_id");
        conditions.user_id = { $in: users };
      }

      if (requestedData.filter && requestedData.filter.search) {
        let _condition = {};
        _condition.status = new RegExp(requestedData.filter.search, "i");

        let users = await this.loginUtilityInst.find(_condition, {
          user_id: 1,
        });
        users = _.map(users, "user_id");
        if (conditions.$or) conditions.$or.push({ user_id: { $in: users } });
      }

      filterConditions = this._prepareFilterCondition(
        requestedData.filterConditions,
        member_type
      );
      if (filterConditions) {
        conditions.$and = filterConditions.$and;
      }

      if (member_type === MEMBER.PLAYER) {
        response = await this.getPlayerList(conditions, options, member_type);
      } else {
        response = await this.getClubAcademyList(
          conditions,
          options,
          member_type
        );
      }
      return response;
    } catch (e) {
      console.log("Error in getList() of UserUtility", e);
      return Promise.reject(e);
    }
  }

  async getPlayerList(conditions, options, member_type) {
    try {
      let totalRecords = 0,
        amateur_count = 0,
        professional_count = 0,
        grassroot_count = 0;
      console.log("conditions is ====>");
      console.log(conditions);
      totalRecords = await this.playerUtilityInst.countList(conditions);
      amateur_count = await this.playerUtilityInst.countList({
        ...conditions,
        player_type: PLAYER.AMATEUR,
      });
      professional_count = await this.playerUtilityInst.countList({
        ...conditions,
        player_type: PLAYER.PROFESSIONAL,
      });
      grassroot_count = await this.playerUtilityInst.countList({
        ...conditions,
        player_type: PLAYER.GRASSROOT,
      });

      let baseOptions = {
        conditions: conditions,
        options: options,
        projection: {
          first_name: 1,
          last_name: 1,
          player_type: 1,
          email: 1,
          position: 1,
          user_id: 1,
          avatar_url: 1,
        },
      };

      let toBePopulatedOptions = {
        path: "login_details",
        projection: { status: 1, is_email_verified: 1, profile_status: 1 },
      };
      let data = await this.playerUtilityInst.populate(
        baseOptions,
        toBePopulatedOptions
      );

      data = new UserListResponseMapper().map(data, member_type);
      let response = {
        total: totalRecords,
        records: data,
        players_count: {
          grassroot: grassroot_count,
          professional: professional_count,
          amateur: amateur_count,
        },
      };
      return response;
    } catch (e) {
      console.log("Error in getPlayerList() of UserService", e);
      throw e;
    }
  }

  async getClubAcademyList(conditions, options, member_type) {
    try {
      conditions.member_type = member_type;
      const totalRecords = await this.clubAcademyUtilityInst.countList(
        conditions
      );

      let baseOptions = {
        conditions: conditions,
        options: options,
        projection: { name: 1, email: 1, user_id: 1 },
      };

      let toBePopulatedOptions = {
        path: "login_details",
        projection: { status: 1, is_email_verified: 1, profile_status: 1 },
      };

      let data = await this.clubAcademyUtilityInst.populate(
        baseOptions,
        toBePopulatedOptions
      );

      data = new UserListResponseMapper().map(data, member_type);
      let response = {
        total: totalRecords,
        records: data,
      };
      return response;
    } catch (e) {
      console.log("Error in getPlayerList() of UserService", e);
      throw e;
    }
  }

  async getMemberList(requestedData = {}) {
    try {
      let paginationOptions = requestedData.paginationOptions || {};
      let skipCount = (paginationOptions.page_no - 1) * paginationOptions.limit;
      let options = { limit: paginationOptions.limit, skip: skipCount };
      let playerConditions = this._preparePlayerSearchCondition(
        requestedData.filter
      );
      let clubAcademyConditions = this._prepareClubAcademySearchCondition(
        requestedData.filter
      );
      let playerProjection = {
        first_name: 1,
        last_name: 1,
        player_type: 1,
        position: 1,
        user_id: 1,
        avatar_url: 1,
        email: 1,
      };
      let clubAcademyProjection = {
        name: 1,
        avatar_url: 1,
        user_id: 1,
        member_type: 1,
        email: 1,
      };
      let matchCondition = {
        "profile_status.status": PROFILE_STATUS.VERIFIED,
        status: ACCOUNT.ACTIVE,
        is_deleted: false,
        $or: [
          { member_type: MEMBER.ACADEMY },
          { member_type: MEMBER.CLUB },
          { member_type: MEMBER.PLAYER },
        ],
      };
      let data = await this.loginUtilityInst.aggregate([
        { $match: matchCondition },
        { $project: { user_id: 1, _id: 0 } },
        {
          $lookup: {
            from: "club_academy_details",
            localField: "user_id",
            foreignField: "user_id",
            as: "club_academy_detail",
          },
        },
        {
          $unwind: {
            path: "$club_academy_detail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            clubAcademyNameLowerCase: { $toLower: "$club_academy_detail.name" },
            user_id: 1,
            club_academy_detail: clubAcademyProjection,
          },
        },
        {
          $lookup: {
            from: "player_details",
            localField: "user_id",
            foreignField: "user_id",
            as: "player_detail",
          },
        },
        {
          $unwind: { path: "$player_detail", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            clubAcademyNameLowerCase: 1,
            club_academy_detail: 1,
            user_id: 1,
            player_detail: playerProjection,
            full_name: {
              $toLower: {
                $concat: [
                  "$player_detail.first_name",
                  " ",
                  "$player_detail.last_name",
                ],
              },
            },
          },
        },
        { $match: { $or: [clubAcademyConditions, playerConditions] } },
        { $sort: { full_name: 1, clubAcademyNameLowerCase: 1 } },
        {
          $facet: {
            data: [{ $skip: options.skip }, { $limit: options.limit }],
            total_data: [{ $group: { _id: null, count: { $sum: 1 } } }],
          },
        },
      ]);
      let responseData = [],
        totalRecords = 0;
      if (data && data.length && data[0] && data[0].data) {
        responseData = new MemberListResponseMapper().map(data[0].data);
        if (
          data[0].data.length &&
          data[0].total_data &&
          data[0].total_data.length &&
          data[0].total_data[0].count
        ) {
          totalRecords = data[0].total_data[0].count;
        }
      }
      let response = { total: totalRecords, records: responseData };
      return response;
    } catch (e) {
      console.log("Error in getMemberList() of UserService", e);
      return Promise.reject(e);
    }
  }

  async getDetails(requestedData = {}) {
    try {
      let user = requestedData.user;

      let loginDetails = await this.loginUtilityInst.findOneForProfileFetch({
        user_id: user,
      });

      if (loginDetails) {
        if (loginDetails.is_email_varified !== "true") {
          return responseHandler(
            req,
            res,
            Promise.reject(
              new errors.Unauthorized(RESPONSE_MESSAGE.EMAIL_NOT_VERIFIED)
            )
          );
        }
        let data = {},
          projection = {};
        projection = await this.getProfileProjection(requestedData._category);

        if (loginDetails.member_type == MEMBER.PLAYER) {
          data = await this.playerUtilityInst.findOneForProfileFetch(
            { user_id: user },
            projection
          );
        } else if (loginDetails.member_type == MEMBER.coache) {
          data = await this.coacheUtilityInst.findOneForProfileFetch(
            { user_id: user },
            projection
          );
        } else {
          if (requestedData._category === PROFILE_DETAIL.PROFESSIONAL) {
            console.log(user);
            data = await this.clubAcademyUtilityInst.findOneProfessionalInMongo(
              { user_id: user },
              projection
            );
            console.log("return data in else from mongoDb is", data);
            return data;
          } else {
            data = await this.clubAcademyUtilityInst.findOneForProfileFetch(
              { user_id: user },
              projection
            );
          }
        }
        if (!_.isEmpty(data)) {
          console.log("data value inside !_.isEmpty function are=>", data);
          data.member_type = loginDetails.member_type;
          data.profile_status = loginDetails.profile_status;

          var algorithm = "aes256"; // or any other algorithm supported by OpenSSL
          var key = "password";
          var decipher_for_email = crypto.createDecipher(algorithm, key);
          var decipher_for_first_name = crypto.createDecipher(algorithm, key);
          var decipher_for_name = crypto.createDecipher(algorithm, key);
          var decipher_for_last_name = crypto.createDecipher(algorithm, key);
          var decipher_for_phone = crypto.createDecipher(algorithm, key);
          var decipher_for_bio = crypto.createDecipher(algorithm, key);
          var decipher_for_gender = crypto.createDecipher(algorithm, key);
          var decipher_for_country = crypto.createDecipher(algorithm, key);
          // var decipher_for_state = crypto.createDecipher(algorithm, key);
          // var decipher_for_district = crypto.createDecipher(algorithm, key);

          var decipher_for_school = crypto.createDecipher(algorithm, key);
          var decipher_for_dob = crypto.createDecipher(algorithm, key);
          var email =
            decipher_for_email.update(data.email, "hex", "utf8") +
            decipher_for_email.final("utf8");

          // if (data.institute_school != null)
          //   {
          //     var school =
          //       decipher_for_school.update(data.institute_school, "hex", "utf8") +
          //       decipher_for_school.final("utf8");
          //      data.institute_school = school;
          //     }
          if (data.country_name != null) {
            var country =
              decipher_for_country.update(data.country_name, "hex", "utf8") +
              decipher_for_country.final("utf8");
            data.country_name = country;
          }

          // if (data.state_name != null) {
          //   var state =
          //     decipher_for_state.update(data.state_name, "hex", "utf8") +
          //     decipher_for_state.final("utf8");
          //   data.state_name = state;
          //  }
          //  if (data.district_name != null) {
          //    var district =
          //     decipher_for_district.update(data.district_name, "hex", "utf8") +
          //      decipher_for_district.final("utf8");
          //    data.district_name = district;
          //  }
          var phone =
            decipher_for_phone.update(data.phone, "hex", "utf8") +
            decipher_for_phone.final("utf8");
          if (data.bio != null) {
            var bio =
              decipher_for_bio.update(data.bio, "hex", "utf8") +
              decipher_for_bio.final("utf8");
            data.bio = bio;
          }

          if (data.member_type == "player" || data.member_type == "coache") {
            var first_name =
              decipher_for_first_name.update(data.first_name, "hex", "utf8") +
              decipher_for_first_name.final("utf8");
            var last_name =
              decipher_for_last_name.update(data.last_name, "hex", "utf8") +
              decipher_for_last_name.final("utf8");

            if (data.gender != null) {
              var gender =
                decipher_for_gender.update(data.gender, "hex", "utf8") +
                decipher_for_gender.final("utf8");
              data.gender = gender;
            }
            var dob =
              decipher_for_dob.update(data.dob, "hex", "utf8") +
              decipher_for_dob.final("utf8");
            data.first_name = first_name;
            data.last_name = last_name;
            data.dob = dob;
          } else {
            console.log("inside else block");
            var name =
              decipher_for_name.update(data.name, "hex", "utf8") +
              decipher_for_name.final("utf8");
            data.name = name;
          }

          data.email = email;

          data.phone = phone;
          console.log("data while fetching in getProfile api", data);

          return data;
        } else {
          return Promise.reject(
            new errors.NotFound(RESPONSE_MESSAGE.USER_NOT_FOUND)
          );
        }
      }
      throw new errors.NotFound(RESPONSE_MESSAGE.USER_NOT_FOUND);
    } catch (e) {
      console.log("Error in getDetails() of UserUtility", e);
      return Promise.reject(e);
    }
  }

  /**
   * returns required projections
   *
   * @param {*} _category
   * @returns
   * @memberof UserService
   */
  async getProfileProjection(_category) {
    if (_category === PROFILE_DETAIL.PERSONAL) {
      return {
        gender: 1,
        first_name: 1,
        last_name: 1,
        height: 1,
        weight: 1,
        dob: 1,
        institute: 1,
        bio: 1,
        player_type: 1,
        email: 1,
        name: 1,
        avatar_url: 1,
        state: 1,
        country: 1,
        district: 1,
        phone: 1,
        founded_in: 1,
        address: 1,
        stadium_name: 1,
        short_name: 1,
        mobile_number: 1,
        social_profiles: 1,
        _id: 0,
      };
    }
    if (_category === PROFILE_DETAIL.PROFESSIONAL) {
      return {
        position: 1,
        strong_foot: 1,
        weak_foot: 1,
        former_club_academy: 1,
        player_type: 1,
        contact_person: 1,
        trophies: 1,
        club_academy_details: 1,
        top_signings: 1,
        associated_club_academy: 1,
        type: 1,
        league: 1,
        league_other: 1,
        association: 1,
        association_other: 1,
        _id: 0,
      };
    }
    if (_category === PROFILE_DETAIL.DOCUMENT) {
      return {
        documents: 1,
        _id: 0,
      };
    }
  }

  async getPublicProfileDetails(user_id, sent_by) {
    try {
      let loginDetails =
        await this.loginUtilityInst.findOneGetPublicProfileDetails({
          user_id: user_id,
        });
      if (loginDetails) {
        let data = {},
          projection = {};
        projection = this.getPublicProfileProjection();
        if (loginDetails.member_type === MEMBER.PLAYER) {
          data = await this.playerUtilityInst.findOneGetPublicProfileDetails(
            { user_id: user_id },
            projection
          );
        } else {
          data =
            await this.clubAcademyUtilityInst.findOneGetPublicProfileDetails(
              { user_id: user_id },
              projection
            );
        }
        if (!_.isEmpty(data)) {
          data.member_type = loginDetails.member_type;
          data.profile_status = loginDetails.profile_status;
          data.is_followed = await this.isFollowed({
            sent_by: user_id,
            send_to: sent_by,
          });
          console.log("inside get public profile !._Empty=>", data);
          data.member_type = loginDetails.member_type;
          data.profile_status = loginDetails.profile_status;

          var algorithm = "aes256"; // or any other algorithm supported by OpenSSL
          var key = "password";
          var decipher_for_email = crypto.createDecipher(algorithm, key);
          var decipher_for_first_name = crypto.createDecipher(algorithm, key);
          var decipher_for_name = crypto.createDecipher(algorithm, key);
          var decipher_for_last_name = crypto.createDecipher(algorithm, key);
          var decipher_for_phone = crypto.createDecipher(algorithm, key);
          var decipher_for_bio = crypto.createDecipher(algorithm, key);
          var decipher_for_gender = crypto.createDecipher(algorithm, key);
          var decipher_for_country = crypto.createDecipher(algorithm, key);
          // var decipher_for_state = crypto.createDecipher(algorithm, key);
          // var decipher_for_district = crypto.createDecipher(algorithm, key);

          var decipher_for_school = crypto.createDecipher(algorithm, key);
          var decipher_for_dob = crypto.createDecipher(algorithm, key);
          var email =
            decipher_for_email.update(data.email, "hex", "utf8") +
            decipher_for_email.final("utf8");

          // if (data.institute_school != null)
          //   {
          //     var school =
          //       decipher_for_school.update(data.institute_school, "hex", "utf8") +
          //       decipher_for_school.final("utf8");
          //      data.institute_school = school;
          //     }
          if (data.country_name != null) {
            var country =
              decipher_for_country.update(data.country_name, "hex", "utf8") +
              decipher_for_country.final("utf8");
            data.country_name = country;
          }

          // if (data.state_name != null) {
          //   var state =
          //     decipher_for_state.update(data.state_name, "hex", "utf8") +
          //     decipher_for_state.final("utf8");
          //   data.state_name = state;
          //  }
          //  if (data.district_name != null) {
          //    var district =
          //     decipher_for_district.update(data.district_name, "hex", "utf8") +
          //      decipher_for_district.final("utf8");
          //    data.district_name = district;
          //  }
          var phone =
            decipher_for_phone.update(data.phone, "hex", "utf8") +
            decipher_for_phone.final("utf8");
          if (data.bio != null) {
            var bio =
              decipher_for_bio.update(data.bio, "hex", "utf8") +
              decipher_for_bio.final("utf8");
            data.bio = bio;
          }
 data.footmate_status = await this.isFootMate({
   sent_by: user_id,
   send_to: sent_by,
 });
          if (
            data.member_type == "player" ||
            data.member_type == "coache" 
          
          ) {
           
            var first_name =
              decipher_for_first_name.update(data.first_name, "hex", "utf8") +
              decipher_for_first_name.final("utf8");
            var last_name =
              decipher_for_last_name.update(data.last_name, "hex", "utf8") +
              decipher_for_last_name.final("utf8");

            if (data.gender != null) {
              var gender =
                decipher_for_gender.update(data.gender, "hex", "utf8") +
                decipher_for_gender.final("utf8");
              data.gender = gender;
            }
         
            data.first_name = first_name;
            data.last_name = last_name;
           
          } else {
            console.log("inside else block");
            var name =
              decipher_for_name.update(data.name, "hex", "utf8") +
              decipher_for_name.final("utf8");
            data.name = name;
          }

          data.email = email;

          data.phone = phone;
          console.log("inside public profile call===>", data);

          return data;
        } else {
          return Promise.reject(
            new errors.NotFound(RESPONSE_MESSAGE.MEMBER_NOT_FOUND)
          );
        }
      }
      throw new errors.NotFound(RESPONSE_MESSAGE.MEMBER_NOT_FOUND);
    } catch (e) {
      console.log("Error in getPublicProfileDetails() of UserService", e);
      return Promise.reject(e);
    }
  }

  async isFollowed(requestedData = {}) {
    let following = await this.connectionUtilityInst.findOneInMongo(
      {
        user_id: requestedData.sent_by,
        followings: requestedData.send_to,
      },
      { followings: 1, _id: 0 }
    );

    if (_.isEmpty(following)) {
      return false;
    }
    return true;
  }

  async isFootMate(requestedData = {}) {
    let footMateRequest =
      await this.connectionRequestUtilityInst.findOneInMongo({
        sent_by: requestedData.sent_by,
        send_to: requestedData.send_to,
      });
    if (!_.isEmpty(footMateRequest)) {
      return CONNECTION_REQUEST.PENDING;
    }
    let connection = await this.connectionUtilityInst.findOneInMongo(
      {
        user_id: requestedData.sent_by,
        footmates: requestedData.send_to,
      },
      { footmates: 1, _id: 0 }
    );
    if (!_.isEmpty(connection)) {
      return CONNECTION_REQUEST.ACCEPTED;
    }
    return CONNECTION_REQUEST.NOT_FOOTMATE;
  }

  getPublicProfileProjection() {
    return {
      gender: 1,
      first_name: 1,
      last_name: 1,
      height: 1,
      weight: 1,
      dob: 1,
      institute: 1,
      bio: 1,
      player_type: 1,
      email: 1,
      name: 1,
      avatar_url: 1,
      state: 1,
      country: 1,
      district: 1,
      phone: 1,
      founded_in: 1,
      address: 1,
      stadium_name: 1,
      short_name: 1,
      mobile_number: 1,
      social_profiles: 1,
      position: 1,
      strong_foot: 1,
      weak_foot: 1,
      former_club_academy: 1,
      contact_person: 1,
      trophies: 1,
      club_academy_details: 1,
      top_signings: 1,
      associated_club_academy: 1,
      type: 1,
      league: 1,
      league_other: 1,
      association: 1,
      association_other: 1,
      _id: 0,
    };
  }

  async update(requestedData = {}) {
    try {
      return this.playerUtilityInst.findOneAndUpdate(
        { id: requestedData.id },
        requestedData.updateValues
      );
    } catch (e) {
      console.log("Error in update() of UserUtility", e);
      return Promise.reject(e);
    }
  }

  async activate(user_id) {
    try {
      let loginDetails = await this.loginUtilityInst.findOne({
        user_id: user_id,
      });
      if (loginDetails) {
        if (!loginDetails.is_email_verified) {
          return Promise.reject(
            new errors.Unauthorized(RESPONSE_MESSAGE.EMAIL_NOT_VERIFIED)
          );
        }
        if (loginDetails.status === ACCOUNT.ACTIVE) {
          return Promise.reject(
            new errors.Conflict(RESPONSE_MESSAGE.STATUS_ALREADY_ACTIVE)
          );
        }
        await this.loginUtilityInst.findOneAndUpdate(
          { user_id: user_id },
          { status: ACCOUNT.ACTIVE }
        );
        return Promise.resolve();
      }
      throw new errors.NotFound(RESPONSE_MESSAGE.USER_NOT_FOUND);
    } catch (e) {
      console.log("Error in activate() of UserService", e);
      return Promise.reject(e);
    }
  }

  async deactivate(user_id) {
    try {
      let loginDetails = await this.loginUtilityInst.findOne({
        user_id: user_id,
      });
      if (loginDetails) {
        if (!loginDetails.is_email_verified) {
          return Promise.reject(
            new errors.Unauthorized(RESPONSE_MESSAGE.EMAIL_NOT_VERIFIED)
          );
        }
        if (loginDetails.status === ACCOUNT.BLOCKED) {
          return Promise.reject(
            new errors.Conflict(RESPONSE_MESSAGE.STATUS_ALREADY_BLOCKED)
          );
        }
        await this.loginUtilityInst.findOneAndUpdate(
          { user_id: user_id },
          { status: ACCOUNT.BLOCKED }
        );
        await redisServiceInst.clearAllTokensFromCache(user_id);
        return Promise.resolve();
      }
      throw new errors.NotFound(RESPONSE_MESSAGE.USER_NOT_FOUND);
    } catch (e) {
      console.log("Error in deactivate() of UserService", e);
      return Promise.reject(e);
    }
  }

  async delete(user_id) {
    try {
      let loginDetails = await this.loginUtilityInst.findOne({
        user_id: user_id,
      });
      if (loginDetails) {
        let date = Date.now();
        await this.loginUtilityInst.findOneAndUpdate(
          { user_id: user_id },
          { is_deleted: true, deleted_at: date }
        );
        await this.manageConnection(user_id);
        if (loginDetails.member_type === MEMBER.PLAYER) {
          await this.playerUtilityInst.findOneAndUpdate(
            { user_id: user_id },
            { deleted_at: date }
          );
        } else {
          await this.clubAcademyUtilityInst.findOneAndUpdate(
            { user_id: user_id },
            { deleted_at: date }
          );
        }
        await redisServiceInst.clearAllTokensFromCache(user_id);
        return Promise.resolve();
      }
      throw new errors.NotFound(RESPONSE_MESSAGE.USER_NOT_FOUND);
    } catch (e) {
      console.log("Error in delete() of UserService", e);
      return Promise.reject(e);
    }
  }

  async manageConnection(user_id) {
    try {
      let connection_of_user = await this.connectionUtilityInst.findOne({
        user_id: user_id,
      });
      if (connection_of_user) {
        if (connection_of_user.footmates) {
          await this.connectionUtilityInst.updateMany(
            { user_id: { $in: connection_of_user.footmates } },
            { $pull: { footmates: user_id } }
          );
        }
        if (connection_of_user.followers) {
          await this.connectionUtilityInst.updateMany(
            { user_id: { $in: connection_of_user.followers } },
            { $pull: { followings: user_id } }
          );
        }
        if (connection_of_user.followings) {
          await this.connectionUtilityInst.updateMany(
            { user_id: { $in: connection_of_user.followings } },
            { $pull: { followers: user_id } }
          );
        }
        let updatedDoc = { is_deleted: true, deleted_at: Date.now() };
        await this.connectionUtilityInst.updateOne(
          { user_id: user_id },
          updatedDoc
        );
        let condition = {
          $or: [
            { sent_by: user_id, status: CONNECTION_REQUEST.PENDING },
            { send_to: user_id, status: CONNECTION_REQUEST.PENDING },
          ],
        };
        updatedDoc.status = CONNECTION_REQUEST.REJECTED;
        await this.connectionRequestUtilityInst.updateMany(
          condition,
          updatedDoc
        );
      }
      return Promise.resolve();
    } catch (e) {
      console.log("Error in manageConnection() of UserService", e);
      return Promise.reject(e);
    }
  }

  /**
   *
   *
   * @param {*} { name,first_name,last_name,member_type,role,email,state,country,phone}
   * @returns
   * @memberof UserRegistrationService
   */
  async create({
    name,
    first_name,
    last_name,
    member_type,
    role,
    email,
    state,
    country,
    phone,
  }) {
    email = email.toLowerCase();
    let member = {};
    member.member_type = member_type;
    member.role = role;
    member.email = email;
    member.phone = phone;
    member.state = state;
    let user = [];
    user.push({ email: email });
    if (member_type == MEMBER.PLAYER) {
      member.first_name = first_name;
      member.last_name = last_name;
      member.country = country;
    } else {
      member.name = name;
      member.type = member_type;
      let address = {};
      address.country = country;
      member.address = address;
    }
    let foundPlayer = await this.playerUtilityInst.findOne({ $or: user });
    let foundClub = await this.clubAcademyUtilityInst.findOne({ $or: user });
    if (foundPlayer || foundClub) {
      return Promise.reject(
        new errors.Conflict(RESPONSE_MESSAGE.USER_ALREADY_EXISTS)
      );
    }

    return this._create(member);
  }

  /**
   *
   *
   * @param {*} member
   * @returns
   * @memberof UserRegistrationService
   */
  _create(member) {
    if (member.member_type == MEMBER.PLAYER) {
      return this.playerUtilityInst.insert(member).catch((err) => {
        console.log(err);
        if (err.constructor.name === "Conflict") {
          err.message = RESPONSE_MESSAGE.USER_ALREADY_EXISTS;
        }

        return Promise.reject(err);
      });
    } else {
      return this.clubAcademyUtilityInst.insert(member).catch((err) => {
        console.log(err);
        if (err.constructor.name === "Conflict") {
          err.message = RESPONSE_MESSAGE.USER_ALREADY_EXISTS;
        }

        return Promise.reject(err);
      });
    }
  }

  _prepareFilterCondition(filterConditions = {}, member_type) {
    let condition = {};
    let filterArr = [];
    if (filterConditions) {
      if (filterConditions.email) {
        filterArr.push({ email: new RegExp(filterConditions.email, "i") });
      }

      if (filterConditions.from && filterConditions.to) {
        filterArr.push({
          createdAt: {
            $gte: filterConditions.from,
            $lte: filterConditions.to,
          },
        });
      }
      if (member_type === MEMBER.PLAYER) {
        if (filterConditions.name) {
          let nameArr = filterConditions.name.split(/\s+/);
          if (nameArr.length) {
            let name = [];
            nameArr.forEach((search) => {
              name.push({ first_name: new RegExp(search, "i") });
              name.push({ last_name: new RegExp(search, "i") });
            });
            filterArr.push({ $or: name });
          } else {
            filterArr.push({
              $or: [
                { first_name: new RegExp(filterConditions.name, "i") },
                { last_name: new RegExp(filterConditions.name, "i") },
              ],
            });
          }
        }
        if (filterConditions.position) {
          filterArr.push({
            position: {
              $elemMatch: {
                name: new RegExp(filterConditions.position, "i"),
                priority: 1,
              },
            },
          });
        }
        if (filterConditions.type) {
          filterArr.push({
            player_type: new RegExp(filterConditions.type, "i"),
          });
        }
      } else {
        if (filterConditions.name) {
          filterArr.push({
            name: new RegExp(filterConditions.name, "i"),
          });
        }
      }
      condition = {
        $and: filterArr,
      };
    }
    return filterArr.length ? condition : null;
  }

  _prepareSearchCondition(filters = {}, member_type) {
    let condition = {};
    let filterArr = [];
    if (filters.search) {
      filters.search = filters.search.trim();
      if (member_type == MEMBER.PLAYER) {
        let searchArr = filters.search.split(/\s+/);
        if (searchArr.length) {
          let name = [];
          searchArr.forEach((search) => {
            name.push({ first_name: new RegExp(search, "i") });
            name.push({ last_name: new RegExp(search, "i") });
          });
          filterArr.push({ $or: name });
        } else {
          filterArr.push({ first_name: new RegExp(filters.search, "i") });
          filterArr.push({ last_name: new RegExp(filters.search, "i") });
        }
        filterArr.push({ player_type: new RegExp(filters.search, "i") });
        filterArr.push({
          position: {
            $elemMatch: {
              name: new RegExp(filters.search, "i"),
              priority: 1,
            },
          },
        });
      } else {
        filterArr.push({ name: new RegExp(filters.search, "i") });
      }
      filterArr.push({
        email: new RegExp(filters.search, "i"),
      });
      condition = {
        $or: filterArr,
      };
    }
    return condition;
  }
  _prepareClubAcademySearchCondition(filters = {}) {
    let condition = {};
    let filterArr = [];
    if (filters.search) {
      filters.search = filters.search.trim();
      filterArr.push({
        "club_academy_detail.name": new RegExp(filters.search, "i"),
      });
      filterArr.push({
        "club_academy_detail.email": new RegExp(filters.search, "i"),
      });
      condition = { $or: filterArr };
    }
    return condition;
  }
  _preparePlayerSearchCondition(filters = {}) {
    let condition = {};
    let filterArr = [];
    if (filters.search) {
      filters.search = filters.search.trim();
      filterArr.push({ full_name: new RegExp(filters.search, "i") });
      filterArr.push({
        "player_detail.first_name": new RegExp(filters.search, "i"),
      });
      filterArr.push({
        "player_detail.last_name": new RegExp(filters.search, "i"),
      });
      filterArr.push({
        "player_detail.email": new RegExp(filters.search, "i"),
      });
      condition = {
        $or: filterArr,
      };
    }
    return condition;
  }
}

module.exports = UserService;
