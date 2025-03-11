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
const PlayerPaymentDetailsUtility = require("../db/utilities/PlayerPaymentDetailsUtility")
const ParentUtility = require("../db/utilities/ParentUtility");
const axios = require("axios");
const fetch = require("node-fetch");
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
    this.playerPaymentDetailsUtility = new PlayerPaymentDetailsUtility();
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
      console.log("data in regis is", data);

      for (const entry of data.body) {
        const existingRecord =
          await this.playerFeeStatusUtility.findOneForProfileFetch({
            player_user_id: entry.player_user_id,
            parent_user_id: entry.parent_user_id,
            academy_user_id: entry.academy_user_id,
          });

        console.log("check existing record", existingRecord);

        if (existingRecord && Object.keys(existingRecord).length > 0) {
          // Update existing record
          await this.playerFeeStatusUtility.updateInSql(entry, {
            player_user_id: entry.player_user_id,
            parent_user_id: entry.parent_user_id,
            academy_user_id: entry.academy_user_id,
          });
        } else {
          // Insert new record
          await this.playerFeeStatusUtility.insertInSql(entry);
        }
      }

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

      // Extract footplayer names and user_ids
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
        { first_name: 1, last_name: 1, user_id: 1, _id: 0 }
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
        if (!dateString) return "N/A"; // Handle missing dates
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
      };

      console.log("Student names:", studentNames);

      // Fetch fee statuses for each player
      const mergedResponse = await Promise.all(
        studentNames.map(async (player, index) => {
          const parent = parentDetails[index] || {
            first_name: "N/A",
            last_name: "N/A",
            user_id: "N/A",
          };

          // Fetch fee status for this player-parent-academy combination
          const feeStatusRecord =
            await this.playerFeeStatusUtility.findOneForProfileFetch({
              player_user_id: player.user_id,
              parent_user_id: parent.user_id,
              academy_user_id: paymentSetup.academy_userid,
            });

          console.log("Fee Status Record:", feeStatusRecord);

          return {
            player,
            parent: {
              parent_name: `${parent.first_name} ${parent.last_name}`,
              parent_user_id: parent.user_id,
            },
            payment: {
              start_date: feeStatusRecord?.start_date
                ? formatDate(feeStatusRecord.start_date)
                : formatDate(paymentSetup.start_date),
              end_date: feeStatusRecord?.end_date
                ? formatDate(feeStatusRecord.end_date)
                : formatDate(paymentSetup.end_date),
              fees: feeStatusRecord?.fees ?? paymentSetup.fees,
              academy_user_id: paymentSetup.academy_userid,
            },
            status: feeStatusRecord?.fee_status || "due", // Use stored fee status or "due" as default
          };
        })
      );

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

  async parentChildList(user_id) {
    try {
      // Fetch footplayer details
      const firstQueryResults = await this.footPlayerUtilityInst.find({
        sent_by: user_id,
      });

      if (!firstQueryResults.length) {
        return {
          status: false,
          message: "No records found for sent_by with the specified status",
        };
      }

      // Extract children names and user_ids
      const studentNames = firstQueryResults.map((item) => ({
        name: item.send_to.name,
        user_id: item.send_to.user_id,
      }));

      // Extract children unique user IDs
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

      // Fetch academy details related to children
      const secondQueryResults = await this.footPlayerUtilityInst.find({
        "send_to.user_id": { $in: userIds },
      });

      console.log("academy details is ", secondQueryResults);

      // Extract academy unique user_id
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

      // Fetch academy/club details
      const academyIds = await this.loginUtilityInst.find({
        user_id: { $in: userIdsToCheck },

        status: "active",
      });

      console.log("check academy id =>", academyIds);
      const academyIdsExtract = [
        ...new Set(academyIds.map((record) => record.user_id).filter(Boolean)),
      ];

      const academyDetails = await this.clubAcademyUtilityInst.find(
        { user_id: { $in: academyIdsExtract } },
        { name: 1, user_id: 1, _id: 0 }
      );

      console.log("academy details:", academyDetails);

      // Fetch payment setup details
      const paymentSetup =
        await this.paymentSetupUtilityInst.findOneForProfileFetch({
          academy_userid: academyIdsExtract, // Directly pass the array
        });

      console.log("payment setu check", paymentSetup);

      if (!paymentSetup || Object.keys(paymentSetup).length === 0) {
        return { status: false, message: "No payment setup found" };
      }

      const formatDate = (dateString) => {
        if (!dateString) return "N/A"; // Handle missing dates
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
      };

      console.log("Student names:", studentNames);

      // Fetch fee statuses for each player
      const mergedResponse = await Promise.all(
        studentNames.map(async (player, index) => {
          const academy = academyDetails[index] || {
            name: "N/A",
            user_id: "N/A",
          };

          // Fetch fee status for this player-parent-academy combination
          const feeStatusRecord =
            await this.playerFeeStatusUtility.findOneForProfileFetch({
              player_user_id: player.user_id,
              parent_user_id: academy.user_id,
              academy_user_id: paymentSetup.academy_userid,
            });

          console.log("Fee Status Record:", feeStatusRecord);

          return {
            player,
            academy: {
              academy_name: academy.name,
              academy_user_id: academy.user_id,
            },
            payment: {
              start_date: feeStatusRecord?.start_date
                ? formatDate(feeStatusRecord.start_date)
                : formatDate(paymentSetup.start_date),
              end_date: feeStatusRecord?.end_date
                ? formatDate(feeStatusRecord.end_date)
                : formatDate(paymentSetup.end_date),
              fees: feeStatusRecord?.fees ?? paymentSetup.fees,
              academy_user_id: paymentSetup.academy_userid,
            },
            status: feeStatusRecord?.fee_status || "due",
          };
        })
      );

      // **Calculate total amount**
      const totalAmount = mergedResponse.reduce(
        (sum, item) => sum + parseFloat(item.payment.fees),
        0
      );

      // **Calculate GST (18%)**
      const gstAmount = (totalAmount * 18) / 100;

      // **Calculate Grand Total (Total Fees + GST)**
      const grandTotal = totalAmount + gstAmount;

      // **Final response with totalAmount, GST, and Grand Total**
      const finalResponse = {
        totalAmount: totalAmount.toFixed(2), // Keep 2 decimal places
        gstAmount: gstAmount.toFixed(2), // Keep 2 decimal places
        grandTotal: grandTotal.toFixed(2), // Keep 2 decimal places
        records: mergedResponse,
      };

      console.log("Final Response:", finalResponse);

      return finalResponse;
    } catch (e) {
      console.error("Error in manageFootplayerFees:", e);
      return Promise.reject(e);
    }
  }

  async createOrder(data) {
    try {
      console.log("Creating Order...", data.body.order_id);

      const response = await axios.post(
        "https://sandbox.cashfree.com/pg/orders",
        {
          order_id: data.body.order_id,
          order_amount: 1,
          order_currency: "INR",
          customer_details: {
            customer_id: "78568" + Date.now(),
            customer_phone: "7992337665",
            customer_email: "yusufsaif0@gmail.com",
            customer_name: "yusuf",
          },
          order_note: "Payment for services",
          return_url: "https://test.yftchain.com/",
          notify_url: "https://yourbackend.com/payment-webhook",
        },
        {
          headers: {
            "x-client-id": "TEST1047531463e2fc08ea3b45409a3641357401",
            "x-client-secret":
              "cfsk_ma_test_b4ee7c703c55bf2b28515cb91ae4f87d_c8eb9553",
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from Cashfree:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error.response?.data || error);
      throw error;
    }
  }
  async getOrderStatus(order_id) {
  try {
    const orderId = order_id;
    const CASHFREE_API_URL = "https://sandbox.cashfree.com/pg/orders/";
    const response = await axios.get(`${CASHFREE_API_URL}${orderId}`, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": "TEST1047531463e2fc08ea3b45409a3641357401",
        "x-client-secret":
          "cfsk_ma_test_b4ee7c703c55bf2b28515cb91ae4f87d_c8eb9553",
      },
    });

    const paymentResponse = response.data;
  
    if (paymentResponse.order_status === "PAID") {
      console.log(`💰 Payment successful! Order ID: ${orderId}`);
      console.log("✅ Payment Verification Response:", paymentResponse);

      // Prepare the object for MySQL insertion
      const orderData = {
        id: uuid(),
        user_id:uuid(),
        cf_order_id: paymentResponse.cf_order_id,
        order_id: paymentResponse.order_id,
        order_status: paymentResponse.order_status,
        order_date: new Date(paymentResponse.created_at), // Convert to MySQL-compatible format
        start_date: null, // Set if applicable
        end_date: null, // Set if applicable
        fees: paymentResponse.order_amount,
        currency: paymentResponse.order_currency,
        customer_name: paymentResponse.customer_details.customer_name,
        customer_email: paymentResponse.customer_details.customer_email,
        customer_phone: paymentResponse.customer_details.customer_phone,
        customer_user_id: paymentResponse.customer_details.customer_id,
        parent_user_id: null, // Add if applicable
        academy_userid: null, // Add if applicable
      };
      const isInsert = await this.playerPaymentDetailsUtility.insertInSql(
        orderData
      );
      console.log("isInsert=>", isInsert);
      return Promise.resolve({
        message: "Payment verified",
        data: paymentResponse,
      });
    } else {
      console.log(`❌ Payment not successful for Order ID: ${orderId}`);
      return Promise.reject({
        message: "Payment not successful",
        data: paymentResponse,
      });
    }
  } catch (error) {
    console.error("❌ Error verifying payment:", error.message);
    return Promise.reject({
      message: "Error verifying payment",
      error: error.message,
    });
  }
 }
}

module.exports = PaymentService;
