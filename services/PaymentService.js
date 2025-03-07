const Promise = require("bluebird");
const errors = require("../errors");
const LoginUtility = require("../db/utilities/LoginUtility");
const TraningCenterUtility = require("../db/utilities/TraningCenterUtility");
const ClubAcademyUtility = require("../db/utilities/ClubAcademyUtility");
const uuid = require("uuid/v4");
const AuthUtility = require("../db/utilities/AuthUtility");
const EmailService = require("./EmailService");
const _ = require("lodash");
const AdminUtility = require("../db/utilities/AdminUtility");
const FootPlayerUtility = require("../db/utilities/FootPlayerUtility");
const crypto = require("crypto");
const CountryUtility = require("../db/utilities/CountryUtility");
const StateUtility = require("../db/utilities/StateUtility");
const DistrictUtility = require("../db/utilities/DistrictUtility");
const PaymentSetupUtility = require("../db/utilities/PaymentSetupUtility");
const PlayerFeeStatusUtility = require("../db/utilities/PlayerFeeStatusUtility");
const ParentUtility = require("../db/utilities/ParentUtility");
class PaymentService {
  constructor() {
    this.traningCenterUtilityInst = new TraningCenterUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.loginUtilityInst = new LoginUtility();
    this.authUtilityInst = new AuthUtility();
    this.emailService = new EmailService();
    this.adminUtilityInst = new AdminUtility();
    this.footPlayerUtilityInst = new FootPlayerUtility();
    this.parentUtilityInst = new ParentUtility();
    this.countryUtilityInst = new CountryUtility();
    this.stateUtilityInst = new StateUtility();
    this.districtUtilityInst = new DistrictUtility();
    this.paymentSetupUtilityInst = new PaymentSetupUtility();
    this.playerFeeStatusUtility = new PlayerFeeStatusUtility();
  }

  async setupPayment(data = {}) {
    try {
      await this.paymentSetupUtilityInst.insertInSql(data.body);
      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  async changeFeeStatus(data = {}) {
    try {
      console.log("data in regis is", data)
      await this.playerFeeStatusUtility.insertInSql(data.body);
      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  async paymentSetupCheck(user_id = {}) {
    try {
      const res = await this.paymentSetupUtilityInst.findOneForProfileFetch({
        academy_userid: user_id,
      });
      // Check if data exists and is not an empty object
      if (res && Object.keys(res).length > 0) {
        return Promise.resolve({ status: true });
      } else {
        return Promise.resolve({ status: false, message: "No data found" });
      }
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  async manageFootplayerFees(data) {
    try {
      const user_id = data.criteria.sentBy;

      // Fetch footplayer details
      const firstQueryResults = await this.footPlayerUtilityInst.find({
        sent_by: user_id,
        status: { $in: ["added", "pending"] },
      });

      if (!firstQueryResults.length) {
        return {
          status: false,
          message: "No records found for sent_by with the specified status",
        };
      }

      // Extract footplayer names
      const studentNames = firstQueryResults.map((item) => ({
        name: item.send_to.name,
        user_id: item.send_to.user_id,
      }));


      // Extract unique user IDs
      const userIds = [
        ...new Set(
          firstQueryResults
            .map((record) => record.send_to?.user_id)
            .filter(Boolean)
        ),
      ];

      if (!userIds.length) {
        return {
          status: false,
          message: "No user_id found in first query results",
        };
      }

      // Fetch records where send_to.user_id matches extracted userIds
      const secondQueryResults = await this.footPlayerUtilityInst.find({
        "send_to.user_id": { $in: userIds },
      });
      // Extract unique sent_by user_ids from secondQueryResults
      const userIdsToCheck = [
        ...new Set(
          secondQueryResults.map((record) => record.sent_by).filter(Boolean)
        ),
      ];
      if (!userIdsToCheck.length) {
        return {
          status: false,
          message: "No user_id found in second query results",
        };
      }

      // Fetch parent details
      
      const parentIds = await this.loginUtilityInst.find({
        user_id: { $in: userIdsToCheck },
        role: "parent",
        status: "active",
      });

      console.log("check parent id =>", parentIds);
      const parentsIdsExtract = [
        ...new Set(parentIds.map((record) => record.user_id).filter(Boolean)),
      ];

      const parentDetails = await this.parentUtilityInst.find(
        { user_id: { $in: parentsIdsExtract } },
        { first_name: 1, last_name: 1,user_id:1 ,_id: 0 }
      );

      console.log("Parent details:", parentDetails);

      // Fetch payment setup details
      const paymentSetup =
        await this.paymentSetupUtilityInst.findOneForProfileFetch({
          academy_userid: user_id,
        });

      if (!paymentSetup || Object.keys(paymentSetup).length === 0) {
        return { status: false, message: "No payment setup found" };
      }

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
      };

      // Merge responses into a single array of objects
      console.log("student name is", studentNames);
      const mergedResponse = studentNames.map((name, index) => ({
        player: name,
        parent: {
          parent_name: parentDetails[index]
            ? `${parentDetails[index].first_name} ${parentDetails[index].last_name}`
            : "N/A",
          parent_user_id: parentDetails[index]
            ? `${parentDetails[index].user_id}`
            : "N/A",
        },
        payment: {
          start_date: formatDate(paymentSetup.start_date), // Format date
          end_date: formatDate(paymentSetup.end_date), // Format date
          fees: paymentSetup.fees,
          academy_user_id: paymentSetup.academy_userid,
        },
        status: "due",
      }));
      console.log("Merged Response is", mergedResponse);
      return { status: true, records: mergedResponse };
    } catch (e) {
      console.error("Error in manageFootplayerFees:", e);
      return Promise.reject(e);
    }
  }

  async updateTraningCenter(data = {}) {
    try {
      if (data.country && data.state && data.district) {
        let { country, state, district } = data;
        console.log("before country findone");
        console.log(country);
        let foundCountry = await this.countryUtilityInst.findOne(
          { id: country },
          { name: 1 }
        );
        if (_.isEmpty(foundCountry)) {
          return Promise.reject(
            new errors.NotFound(RESPONSE_MESSAGE.COUNTRY_NOT_FOUND)
          );
        }
        let foundState = await this.stateUtilityInst.findOne(
          {
            id: state,
            country_id: country,
          },
          { name: 1 }
        );
        if (_.isEmpty(foundState)) {
          return Promise.reject(
            new errors.NotFound(RESPONSE_MESSAGE.STATE_NOT_FOUND)
          );
        }
        let foundDistrict = await this.districtUtilityInst.findOne(
          {
            id: district,
            state_id: state,
          },
          { name: 1 }
        );
        if (_.isEmpty(foundDistrict)) {
          return Promise.reject(
            new errors.NotFound(RESPONSE_MESSAGE.DISTRICT_NOT_FOUND)
          );
        }
        let countryObj = {
          id: country,
          name: foundCountry.name,
        };
        let stateObj = {
          id: state,
          name: foundState.name,
        };
        let districtObj = {
          id: district,
          name: foundDistrict.name,
        };
        data.country = countryObj;
        data.state = stateObj;
        data.district = districtObj;
      }
      const dataForMongo = data;

      await this.traningCenterUtilityInst.updateTrainingCenter(
        { user_id: data.user_id },
        data
      );
    } catch (error) {
      console.log(e);
      return Promise.reject(e);
    }
  }
}

module.exports = PaymentService;
