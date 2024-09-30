const ConnectionUtility = require("../db/utilities/ConnectionUtility");

const errors = require("../errors");
const _ = require("lodash");
const RESPONSE_MESSAGE = require("../constants/ResponseMessage");
const LoginUtility = require("../db/utilities/LoginUtility");






class ConnectionService {
  constructor() {
    this.connectionUtilityInst = new ConnectionUtility();
   
    this.loginUtilityInst = new LoginUtility();
    
  
    
  }

  async followMember(requestedData = {}, isUsedByAcceptRequestFunc) {
    try {
      if (!isUsedByAcceptRequestFunc)
        await this.followMemberValiation(requestedData);
      console.log("Inside followMember list");
      console.log("first is", requestedData);
      console.log("Second is", isUsedByAcceptRequestFunc);
      let connection_of_sent_by =
        await this.connectionUtilityInst.findOneInMongo(
          { user_id: requestedData.sent_by },
          { followings: 1 }
        );
      let connection_of_send_to =
        await this.connectionUtilityInst.findOneInMongo(
          { user_id: requestedData.send_to },
          { followers: 1 }
        );

      if (!connection_of_sent_by && !connection_of_send_to) {
        await this.createConnectionsAddFollwingsAddFollowers(
          requestedData.sent_by,
          requestedData.send_to
        );
      } else if (connection_of_sent_by && !connection_of_send_to) {
        await this.addFollowings(
          connection_of_sent_by,
          requestedData.sent_by,
          requestedData.send_to
        );
        await this.createConnectionAddFollowers(
          requestedData.sent_by,
          requestedData.send_to
        );
      } else if (!connection_of_sent_by && connection_of_send_to) {
        await this.createConnectionAddFollowings(
          requestedData.sent_by,
          requestedData.send_to
        );
        await this.addFollowers(
          requestedData.sent_by,
          requestedData.send_to,
          connection_of_send_to
        );
      } else {
        let following = await this.connectionUtilityInst.findOneInMongo(
          {
            user_id: requestedData.sent_by,
            followings: requestedData.send_to,
          },
          { followings: 1, _id: 0 }
        );
        if (_.isEmpty(following)) {
          await this.addFollowings(
            connection_of_sent_by,
            requestedData.sent_by,
            requestedData.send_to
          );
          await this.addFollowers(
            requestedData.sent_by,
            requestedData.send_to,
            connection_of_send_to
          );
        } else if (!isUsedByAcceptRequestFunc) {
          return Promise.reject(
            new errors.Conflict(RESPONSE_MESSAGE.ALREADY_FOLLOWED)
          );
        }
      }
      return Promise.resolve();
    } catch (e) {
      console.log("Error in followMember() of ConnectionService", e);
      return Promise.reject(e);
    }
  }

  async followMemberValiation(requestedData = {}) {
    if (requestedData.send_to === requestedData.sent_by) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.CANNOT_FOLLOW_YOURSELF)
      );
    }
    if (requestedData.send_to) {
      let to_be_followed_member = await this.loginUtilityInst.findOneInMongo({
        user_id: requestedData.send_to,
      });
      if (_.isEmpty(to_be_followed_member)) {
        return Promise.reject(
          new errors.ValidationFailed(
            RESPONSE_MESSAGE.MEMBER_TO_BE_FOLLOWED_NOT_FOUND
          )
        );
      }
    }
    return Promise.resolve();
  }

  async createConnectionsAddFollwingsAddFollowers(sent_by, send_to) {
    let records = [
      { user_id: sent_by, followings: [send_to] },
      { user_id: send_to, followers: [sent_by] },
    ];
    await this.connectionUtilityInst.insertMany(records);
  }

  async createConnectionAddFollowings(sent_by, send_to) {
    let record = { user_id: sent_by, followings: [send_to] };
    await this.connectionUtilityInst.insertInMongo(record);
  }

  async createConnectionAddFollowers(sent_by, send_to) {
    let record = { user_id: send_to, followers: [sent_by] };
    await this.connectionUtilityInst.insertInMongo(record);
  }

  async addFollowers(sent_by, send_to, connection_of_send_to) {
    let followers_of_send_to = connection_of_send_to.followers || [];
    followers_of_send_to.push(sent_by);
    await this.connectionUtilityInst.updateOneInMongo(
      { user_id: send_to, is_deleted: false },
      { followers: followers_of_send_to }
    );
  }

  async addFollowings(connection_of_sent_by, sent_by, send_to) {
    let followings_of_sent_by = connection_of_sent_by.followings || [];
    followings_of_sent_by.push(send_to);
    await this.connectionUtilityInst.updateOneInMongo(
      { user_id: sent_by, is_deleted: false },
      { followings: followings_of_sent_by }
    );
  }



}
module.exports = ConnectionService;
