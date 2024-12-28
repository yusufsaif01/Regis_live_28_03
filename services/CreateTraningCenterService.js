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
const crypto = require('crypto')
const CountryUtility = require("../db/utilities/CountryUtility");
const StateUtility = require("../db/utilities/StateUtility");
const DistrictUtility = require("../db/utilities/DistrictUtility");
class CreateTraningCenterService {
  constructor() {
    this.traningCenterUtilityInst = new TraningCenterUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.loginUtilityInst = new LoginUtility();
    this.authUtilityInst = new AuthUtility();
    this.emailService = new EmailService();
    this.adminUtilityInst = new AdminUtility();
    this.footPlayerUtilityInst = new FootPlayerUtility();
    this.countryUtilityInst = new CountryUtility();
    this.stateUtilityInst = new StateUtility();
    this.districtUtilityInst = new DistrictUtility();
  }

  async createTraningCenter(data = {}) {
    try {
      data.user_id = uuid();

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
      await this.traningCenterUtilityInst.insert(data, dataForMongo);
      return Promise.resolve();
    } catch (e) {
      console.log(e);
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
      
      await this.traningCenterUtilityInst.updateTrainingCenter({user_id:data.user_id},data);
    } catch (error) {
      console.log(e);
      return Promise.reject(e);
    }
  }

}

module.exports = CreateTraningCenterService;
