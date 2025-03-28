const Promise = require("bluebird");
const errors = require("../errors");
const LoginUtility = require("../db/utilities/LoginUtility");
const TraningCenterUtility = require("../db/utilities/TraningCenterUtility");
const ClubAcademyUtility = require("../db/utilities/ClubAcademyUtility");
const uuid = require("uuid/v4");
const AuthUtility = require("../db/utilities/AuthUtility");
const EmailService = require("./EmailService");
const _ = require("lodash");
const FootPlayerUtility = require("../db/utilities/FootPlayerUtility");
const PaymentSetupUtility = require("../db/utilities/PaymentSetupUtility");
const PlayerFeeStatusUtility = require("../db/utilities/PlayerFeeStatusUtility");
const PlayerPaymentDetailsUtility = require("../db/utilities/PlayerPaymentDetailsUtility");
const ParentUtility = require("../db/utilities/ParentUtility");
const PlayerUtility = require("../db/utilities/PlayerUtility");
const MpinUtility = require("../db/utilities/MpinUtility");
const OrderCreateUtility = require("../db/utilities/OrderCreateUtility");

const PaymentRecordUtility = require("../db/utilities/PaymentRecordUtility");
const RESPONSE_MESSAGE = require("../constants/ResponseMessage");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const config = require("../config");
const crypto = require("crypto");

class PaymentService {
  constructor() {
    this.traningCenterUtilityInst = new TraningCenterUtility();
    this.clubAcademyUtilityInst = new ClubAcademyUtility();
    this.loginUtilityInst = new LoginUtility();
    this.authUtilityInst = new AuthUtility();
    this.emailService = new EmailService();
    this.footPlayerUtilityInst = new FootPlayerUtility();
    this.parentUtilityInst = new ParentUtility();
    this.paymentSetupUtilityInst = new PaymentSetupUtility();
    this.playerFeeStatusUtility = new PlayerFeeStatusUtility();
    this.playerPaymentDetailsUtility = new PlayerPaymentDetailsUtility();
    this.PlayerUtilityInst = new PlayerUtility();
    this.mPinUtilityInst = new MpinUtility();
    this.paymentRecordUtilityInst = new PaymentRecordUtility();
    this.orderCreateUtilityInst = new OrderCreateUtility()
  }

  async setupPayment(data = {}) {
    try {
      const formatDateForMySQL = (isoDate) => {
        return new Date(isoDate).toISOString().split("T")[0]; // Converts to YYYY-MM-DD
      };

      // Ensure data.body exists
      if (!data.body) {
        throw new Error("Request body is missing");
      }

      // Convert and update dates in `data.body`
      data.body.start_date = formatDateForMySQL(data.body.start_date);
      data.body.end_date = formatDateForMySQL(data.body.end_date);

      // Insert into database
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

  async sendFeeReminder(data = {}) {
    try {
      console.log("data for fee reminder", data);

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

      // Check if user already has an mPIN
      let existingMPIN = await this.mPinUtilityInst.findManyFormMysql({
        academy_user_id: user_id,
      });

      // Check if data exists
      if (res && Object.keys(res).length > 0) {
        return Promise.resolve({
          status: true,
          mpinSet: existingMPIN && existingMPIN.length > 0, // Check if MPIN exists
        });
      } else {
        return Promise.resolve({
          status: false,
          message: "No data found",
          mpinSet: existingMPIN && existingMPIN.length > 0,
        });
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

  async manageFeesReminder(data) {
    try {
      const user_id = data.criteria.sentBy;

      const feeStatusRecord =
        await this.playerFeeStatusUtility.findManyFormMysql({
          academy_user_id: user_id,
          fee_status: "due",
        });
      console.log("999999999 =>", feeStatusRecord);

      if (!feeStatusRecord.length) {
        return {
          status: false,
          message: "No records found for sent_by with the specified status",
        };
      }

      // Extract unique user IDs
      const PlayeruserIds = [
        ...new Set(
          feeStatusRecord.map((record) => record.player_user_id).filter(Boolean)
        ),
      ];
      const ParentuserIds = [
        ...new Set(
          feeStatusRecord.map((record) => record.parent_user_id).filter(Boolean)
        ),
      ];

      //Fetch Player details
      const playerDetails = await this.PlayerUtilityInst.find(
        {
          user_id: { $in: PlayeruserIds },
        },
        { first_name: 1, last_name: 1, user_id: 1, _id: 0 }
      );

      const parentDetails = await this.parentUtilityInst.find(
        { user_id: { $in: ParentuserIds } },
        { first_name: 1, last_name: 1, user_id: 1, _id: 0 }
      );

      const formatDate = (dateString) => {
        if (!dateString) return "N/A"; // Handle missing dates
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date);
      };
      console.log("player details:", playerDetails);
      console.log("parent details:", parentDetails);
      // Fetch fee statuses for each player
      const mergedResponse = await Promise.all(
        playerDetails.map(async (player, index) => {
          const parent = parentDetails[index] || {
            first_name: "N/A",
            last_name: "N/A",
            user_id: "N/A",
          };
          const feeStatusRecords = feeStatusRecord[index] || {
            start_date: "N/A",
            end_date: "N/A",
            academy_user_id: "N/A",
            fees: "N/A",
          };

          return {
            player: {
              player_name: `${player.first_name} ${player.last_name}`,
              player_user_id: player.user_id,
            },
            parent: {
              parent_name: `${parent.first_name} ${parent.last_name}`,
              parent_user_id: parent.user_id,
            },
            payment: {
              start_date: formatDate(feeStatusRecords?.start_date),
              end_date: formatDate(feeStatusRecords?.end_date),
              fees: feeStatusRecords?.fees,
              academy_user_id: feeStatusRecords?.academy_user_id,
              status: feeStatusRecords?.fee_status,
            },
          };
        })
      );
      console.log("mergerdResponse =>", mergedResponse);
      return Promise.resolve(mergedResponse);
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
      // Step 1: Fetch child details based on parent ID
      const firstQueryResults = await this.footPlayerUtilityInst.find({
        sent_by: user_id,
      });

      if (!firstQueryResults.length) {
        return { status: false, message: "No records found for sent_by" };
      }

      // Extract unique child user IDs & names
      const studentNames = firstQueryResults.map((item) => ({
        name: item.send_to.name,
        user_id: item.send_to.user_id,
      }));

      const userIds = [...new Set(studentNames.map((s) => s.user_id))];

      if (!userIds.length) {
        return { status: false, message: "No user_id found in child records" };
      }

      // Step 2: Fetch academies associated with these children
      const secondQueryResults = await this.footPlayerUtilityInst.find({
        "send_to.user_id": { $in: userIds },
      });

      const academyUserIds = [
        ...new Set(
          secondQueryResults.map((record) => record.sent_by).filter(Boolean)
        ),
      ];

      if (!academyUserIds.length) {
        return { status: false, message: "No academy user_id found" };
      }

      // Step 3: Fetch active academies (excluding parents)
      const activeAcademies = await this.loginUtilityInst.find({
        user_id: { $in: academyUserIds },
        status: "active",
        role: { $ne: "parent" },
      });

      const activeAcademyIds = activeAcademies.map((rec) => rec.user_id);

      // Step 4: Fetch academy details & student-academy relationships in parallel
      const [academyDetails, studentAcademyMappings] = await Promise.all([
        this.clubAcademyUtilityInst.find(
          { user_id: { $in: activeAcademyIds } },
          { name: 1, user_id: 1, _id: 0 }
        ),
        this.footPlayerUtilityInst.find({
          "send_to.user_id": { $in: userIds },
          sent_by: { $in: activeAcademyIds },
        }),
      ]);

      // Step 5: Fetch Payment Setup (single query for all academies)
      const paymentSetup = await this.paymentSetupUtilityInst.findManyFormMysql(
        {
          academy_userid: activeAcademyIds,
        }
      );

      // Step 6: Format date utility
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(dateString));
      };

      // Step 7: Merge academy, student, and payment details
      const mergedResponse = await Promise.all(
        academyDetails.map(async (academy) => {
          const studentEntry = studentAcademyMappings.find(
            (record) => record.sent_by === academy.user_id
          ) || { send_to: { name: "N/A", user_id: "N/A" } };

          const studentName = studentEntry.send_to;

          // Fetch fee status for this specific academy
          const feeStatusRecordArray =
            await this.playerFeeStatusUtility.findManyFormMysql({
              player_user_id: studentName.user_id,
              academy_user_id: academy.user_id,
            });

          // If no fee status record found, fallback to payment setup

          const finalPaymentData = feeStatusRecordArray.length
            ? feeStatusRecordArray.map((record) => {
                const today = new Date();
                const firstDayOfNextMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  1
                );

                const isBlocked =
                  record.fee_status === "paid" &&
                  new Date(record.end_date) < firstDayOfNextMonth;

                return {
                  start_date: formatDate(record.start_date),
                  end_date: formatDate(record.end_date),
                  fees: record.fees,
                  academy_user_id: record.academy_user_id,
                  status: record.fee_status || "due",
                  block: isBlocked, // Add block condition
                };
              })
            : paymentSetup
                .filter((record) => record.academy_userid === academy.user_id)
                .map((record) => ({
                  start_date: record.start_date || "N/A",
                  end_date: record.end_date || "N/A",
                  fees: record.fees || 0,
                  academy_user_id: record.academy_userid,
                  status: "due",
                  block: false, // Default to false for unpaid records
                }));

          return {
            academy,
            player: {
              player_name: studentName.name,
              player_user_id: studentName.user_id,
            },
            payment: finalPaymentData.length
              ? finalPaymentData
              : [
                  {
                    start_date: null,
                    end_date: null,
                    fees: 0,
                    academy_user_id: academy.user_id,
                    status: "due",
                  },
                ],
          };
        })
      );

      // Step 8: Calculate total fees & GST
      const Amount = mergedResponse.reduce((sum, item) => {
        const fee = item.payment.reduce(
          (acc, pay) => acc + parseFloat(pay.fees || 0),
          0
        );
        return sum + fee;
      }, 0);

      const platformFee = (Amount * 2.5) / 100;
      const totalAmount = Amount + platformFee;
      const gstAmount = (totalAmount * 18) / 100;
      const grandTotal = totalAmount + gstAmount;

      return {
        totalAmount: Amount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        records: mergedResponse,
      };
    } catch (error) {
      console.error("Error in parentChildList:", error);
      return Promise.reject(error);
    }
  }

  // async createOrder(data, user_id) {
  //   try {
  //     // 1️ Calculate Total Fees
  //     console.log("data recive for create order", data);
  //     const Amount = data.reduce((sum, item) => {
  //       const paymentFees = item.payment.reduce(
  //         (acc, paymentItem) => acc + parseFloat(paymentItem.fees || 0),
  //         0
  //       );
  //       return sum + paymentFees;
  //     }, 0);

  //     const platformFee = (Amount * 2.5) / 100;
  //     const totalAmount = Amount + platformFee;
  //     const gstAmount = (totalAmount * 18) / 100;

  //     const grandTotal = parseFloat((totalAmount + gstAmount).toFixed(2));

  //     //console.log("grand total is=>", grandTotal);
  //     const parentDetails = await this.parentUtilityInst.findOne({
  //       user_id: user_id,
  //     });
  //     // console.log("parentDetails is", parentDetails);
  //     // console.log("data inside createOrder", data);

  //     const response = await axios.post(
  //       "https://sandbox.cashfree.com/pg/orders",
  //       {
  //         order_id: "order_dyt_yft_" + Date.now(),
  //         order_amount: grandTotal,
  //         order_currency: "INR",
  //         customer_details: {
  //           customer_id: parentDetails.user_id,
  //           customer_phone: parentDetails.phone,
  //           customer_email: parentDetails.email,
  //           customer_name:
  //             parentDetails.first_name + " " + parentDetails.last_name,
  //         },
  //         order_note: "Payment for services",
  //         return_url: "https://test.yftchain.com/",
  //         notify_url: "https://yourbackend.com/payment-webhook",
  //         order_meta: {
  //           notify_url: "https://test.yftchain.com/v3/api/payment-webhook",
  //         },
  //       },
  //       {
  //         headers: {
  //           "x-client-id": config.cashfree.x_client_id,
  //           "x-client-secret": config.cashfree.x_client_secret,
  //           "x-api-version": config.cashfree.x_api_version,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     //console.log("Response from Cashfree:", response.data);
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error creating order:", error.response?.data || error);
  //     throw error;
  //   }
  // }

  async createOrder(data, user_id) {
    try {
      console.log("Data received for createOrder:", data);

      // Fetch Parent Details
      const parentDetails = await this.parentUtilityInst.findOne({ user_id });

      // 1️⃣ Calculate Total Fees for All Players
      const totalAmount = data.reduce((sum, item) => {
        const playerFees = item.payment.reduce(
          (acc, paymentItem) => acc + parseFloat(paymentItem.fees || 0),
          0
        );
        return sum + playerFees;
      }, 0);

      if (!totalAmount || isNaN(totalAmount)) {
        console.error("Invalid Total Amount:", totalAmount);
        throw new Error("Total amount is invalid.");
      }

      const platformFee = (totalAmount * 2.5) / 100;
      const totalWithFee = totalAmount + platformFee;
      const gstAmount = (totalWithFee * 18) / 100;
      const grandTotal = parseFloat((totalWithFee + gstAmount).toFixed(2));

      console.log(`Grand Total for all players:`, grandTotal);

      // 2️⃣ Create a Single Order Payload
      const order_id = `order_dyt_yft_${Date.now()}`;

      const orderPayload = {
        order_id: order_id,
        order_amount: grandTotal,
        order_currency: "INR",
        customer_details: {
          customer_id: parentDetails.user_id,
          customer_phone: parentDetails.phone,
          customer_email: parentDetails.email,
          customer_name: `${parentDetails.first_name} ${parentDetails.last_name}`,
        },
        order_note: `Payment for ${data.length} players`,
        return_url: "https://test.yftchain.com/",
        "order_meta": {
         "notify_url": "https://test.yftchain.com/v3/registration/in/payment-webhook",
        },
      };

      console.log("Order Payload:", JSON.stringify(orderPayload, null, 2));
      console.log("Sending request to Cashfree...");

      // 3️⃣ Call Cashfree API (Only Once)
      const response = await axios.post(
        "https://sandbox.cashfree.com/pg/orders",
        orderPayload,
        {
          headers: {
            "x-client-id": config.cashfree.x_client_id,
            "x-client-secret": config.cashfree.x_client_secret,
            "x-api-version": config.cashfree.x_api_version,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Cashfree Order Response:", response.data);

      // 4️⃣ Store Order in Database (Linking All Players to One Order)
      for (const item of data) {

         const Fees = item.payment.reduce(
        (acc, paymentItem) => acc + parseFloat(paymentItem.fees || 0),
        0
    );
        const data = {
          order_id: response.data.order_id,
          parent_user_id: parentDetails.user_id,
          player_id: item.player.player_user_id,
          academy_id: item.academy.user_id,
          fee:Fees,
          amount: grandTotal, // Store the full amount
          currency: "INR",
          payment_status: "PENDING", // Initial status
          order_date: new Date(),
        };
        await this.orderCreateUtilityInst.insertInSql(data);
        console.log("====>===>", data)
      }
      return response.data;
    } catch (error) {
      console.error(
        "Error creating order:",
        error.response?.data || error.message || error
      );
      throw error;
    }
  }

  async getOrderStatus(order_id, user_id, data, res) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!order_id) {
          return reject(new Error("Invalid order ID"));
        }

        console.log("data inside getOrderStatus =>", data);
        console.log("order_id inside =>", order_id);

        const CASHFREE_API_URL = "https://sandbox.cashfree.com/pg/orders/";
        const response = await axios.get(`${CASHFREE_API_URL}${order_id}`, {
          headers: {
            "x-api-version": config.cashfree.x_api_version,
            "x-client-id": config.cashfree.x_client_id,
            "x-client-secret": config.cashfree.x_client_secret,
          },
        });

        const paymentResponse = response.data;
        if (paymentResponse.order_status !== "PAID") {
          return reject({
            message: "Payment not successful",
            data: paymentResponse,
          });
        }

        // Prepare order data
        const orderData = {
          id: uuid(),
          user_id: uuid(),
          cf_order_id: paymentResponse.cf_order_id,
          order_id: paymentResponse.order_id,
          order_status: paymentResponse.order_status,
          order_date: new Date(paymentResponse.created_at),
          fees: paymentResponse.order_amount,
          currency: paymentResponse.order_currency,
          customer_name: paymentResponse.customer_details.customer_name,
          customer_email: paymentResponse.customer_details.customer_email,
          customer_phone: paymentResponse.customer_details.customer_phone,
          customer_user_id: paymentResponse.customer_details.customer_id,
        };

        // Generate PDF
        const pdfBuffer = await this.generateInvoicePDF(orderData, data);
        console.log("PDF Buffer generated successfully");

        // Save PDF to database (optional)
        orderData.invoice_pdf = pdfBuffer;
        await this.playerPaymentDetailsUtility.insertInSql(orderData);

        // Update fee status
        for (const entry of data) {
          const existingRecord =
            await this.playerFeeStatusUtility.findOneForProfileFetch({
              player_user_id: entry.player.player_user_id,
              academy_user_id: entry.academy.user_id,
            });

          if (existingRecord && Object.keys(existingRecord).length > 0) {
            // Update existing record
            const updateData = { fee_status: "paid" };
            await this.playerFeeStatusUtility.updateInSql(updateData, {
              player_user_id: entry.player.player_user_id,
              academy_user_id: entry.academy.user_id,
            });
          } else {
            const paymentDetails =
              entry.payment.length > 0 ? entry.payment[0] : {};
            console.log("paymentDetailsss=>", paymentDetails);
            // Insert new record if not exists
            const formatDate = (dateString) => {
              if (!dateString) return "N/A"; // Handle missing dates
              const date = new Date(dateString);
              return new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(date);
            };
            const newData = {
              player_user_id: entry.player.player_user_id,
              parent_user_id: user_id,
              academy_user_id: entry.academy.user_id,
              fee_status: "paid", // Set default fee status
              start_date: paymentDetails.start_date.split("T")[0] || null,
              end_date: paymentDetails.end_date.split("T")[0] || null,
              fees: paymentDetails.fees || null, // Add required fields
            };
            await this.playerFeeStatusUtility.insertInSql(newData);
          }
        }

        // Return PDF buffer instead of sending response
        resolve(pdfBuffer);
      } catch (error) {
        console.error("Error verifying payment:", error.message);
        reject({
          message: "Error verifying payment",
          error: error.message,
        });
      }
    });
  }

  async paymentWebhook(req) {
    console.log("inside paymentwebhook method");
    try {
      console.log("Data received for payment webhook:", req);
      if (!this.verifyCashfreeSignature(req)) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.INVALID_SIGNATURE)
        );
      }
      const data = req.body; // Extract data from request body

      // Extract necessary details for MySQL insertion
      const dataToInsert = {
        id: uuid(),
        order_id: data.data.order.order_id,
        order_amount: data.data.order.order_amount,
        order_currency: data.data.order.order_currency,

        cf_payment_id: data.data.payment.cf_payment_id,
        payment_status: data.data.payment.payment_status,
        payment_amount: data.data.payment.payment_amount,
        payment_currency: data.data.payment.payment_currency,
        payment_message: data.data.payment.payment_message,
        payment_time: new Date(data.data.payment.payment_time),
        payment_group: data.data.payment.payment_group,
        bank_reference: data.data.payment.bank_reference || null,
        auth_id: data.data.payment.auth_id || null,

        payment_method: JSON.stringify(data.data.payment.payment_method), // Store as JSON
        payment_user_id: data.data.customer_details.customer_id,

        customer_id: data.data.customer_details.customer_id,
        customer_name: data.data.customer_details.customer_name || null,
        customer_email: data.data.customer_details.customer_email,
        customer_phone: data.data.customer_details.customer_phone,

        gateway_name: data.data.payment_gateway_details.gateway_name,
        gateway_order_id: data.data.payment_gateway_details.gateway_order_id,
        gateway_payment_id:
          data.data.payment_gateway_details.gateway_payment_id,
        gateway_order_reference_id:
          data.data.payment_gateway_details.gateway_order_reference_id,
        gateway_settlement:
          data.data.payment_gateway_details.gateway_settlement,
        gateway_status_code:
          data.data.payment_gateway_details.gateway_status_code || null,

        payment_offers: JSON.stringify(data.data.payment_offers), // Store as JSON

        event_time: new Date(data.event_time),
        webhook_type: data.type,
      };
      let orderDetails = await this.orderCreateUtilityInst.findManyFormMysql({
	             order_id: data.data.order.order_id,
	           });
	console.log("check fetched orderDetailss", orderDetails);
	  const playerUserIds = [
            ...new Set(orderDetails.map((record) => record.player_id).filter(Boolean)
	  ),
	];
	 const academyUserIds = [
	    ...new Set(orderDetails.map((record) => record.academy_id).filter(Boolean)
	 ),
	];
      console.log("playerUserid and academy userid is=>",playerUserIds,academyUserIds)
	const playerDetails = await this.PlayerUtilityInst.find({
	user_id:{$in:playerUserIds}
	})
	const academyDetails = await this.clubAcademyUtilityInst.find({
	user_id:{$in: academyUserIds}
	});
	const existingRecord = await this.bankDetailsUtility.findOneFromMysql({
		      parent_user_id: data.data.customer_details.customer_id,
		    });
	console.log("999999999999999999999999999999")
	 console.log("player details", playerDetails);
	 console.log("academy details", academyDetails);
    // const pdfBuffer = await this.generateInvoicePDF(dataToInsert);
      // Save PDF to database (optional)
     // req.body.pdf_invoice = pdfBuffer;
      // Call the function that inserts data into MySQL
      await this.paymentRecordUtilityInst.insertInSql(dataToInsert);

      console.log("✅ Data successfully inserted into MySQL.");
    } catch (error) {
      console.error("❌ Error processing JSON data:", error);
    }
  }

  async generateInvoicePDF(orderData) {
    console.log("orderData in generateInvoicePdf=>", orderData);
   // const totalRecords = data.length;
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const pdfChunks = [];

        doc.on("data", (chunk) => pdfChunks.push(chunk)); // Collect chunks
        doc.on("end", () => resolve(Buffer.concat(pdfChunks))); // Convert to Buffer

        // Title
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("TAX INVOICE", { align: "center" });
        doc.moveDown(1);

        // Logo
        const logoPath = path.join(__dirname, "public", "logo.jpg");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 400, 80, { width: 100 });
        }

        // Customer & Company Details
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Bill To:", 50, 100)
          .font("Helvetica")
          .text(`${orderData.customer_name}`, 50, 115)
          .text(
            "Second Floor, Plot No 165, F.I.E, Patparganj Industrial Area,",
            50,
            130
          )
          .text("East Delhi, Delhi, 110092", 50, 145)
          .font("Helvetica-Bold")
          .text("GST / PAN - XXXXXXX", 50, 160);

        doc
          .font("Helvetica-Bold")
          .text("Provided by:", 400, 180)
          .font("Helvetica")
          .text("Decoding Youth Talent Private Limited", 400, 195)
          .text(
            "E-895, Third Floor, C R Park, New Delhi, India, 110019",
            400,
            220
          )
          .font("Helvetica-Bold")
          .text("GST - 07AAHCD7678R1ZL", 400, 245);

        // Invoice Details
        doc
          .font("Helvetica-Bold")
          .text("Invoice Number:", 50, 180)
          .font("Helvetica")
          .text(orderData.order_id, 150, 180)
          .font("Helvetica-Bold")
          .text("Place of Supply:", 50, 195)
          .font("Helvetica")
          .text("New Delhi", 150, 195)
          .font("Helvetica-Bold")
          .text("Payment Date:", 50, 210)
          .font("Helvetica")
          .text(new Date(orderData.order_date).toLocaleDateString(), 150, 210);

        // Table Header
        doc.rect(50, 275, 500, 20).fill("black").stroke();
        doc
          .fillColor("white")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("S.no", 55, 280)
          .text("Description", 80, 280)
          .text("Unit Price", 350, 280)
          .text("Total Amount", 450, 280)
          .fillColor("black");

        // Table Rows
        let y = 310;
        doc.font("Helvetica").fontSize(10);

        data.forEach((item, index) => {
          const academyName = item.academy?.name || "N/A";
          const playerName = item.player?.player_name || "Unknown Player";
          const feesArray = item.payment || [];

          feesArray.forEach((payment, i) => {
            doc.text(`${index + 1}`, 55, y);
            doc.text(`${academyName}`, 80, y);
            doc.text(`${playerName}`, 220, y);
            doc.text(`₹${totalRecords || "0.00"}`, 350, y);
            doc.text(`₹${orderData.fees || "0.00"}`, 450, y);
            y += 20;
          });
        });

        // Payment Details
        doc
          .font("Helvetica-Bold")
          .text("Method of payment: CashFree", 50, y + 120);
        doc
          .font("Helvetica")
          .text(`Order Id: ${orderData.order_id}`, 50, y + 135)
          .text(`Order Status: ${orderData.order_status}`, 50, y + 150);

        // Total Summary
        doc
          .font("Helvetica-Bold")
          .text("Subtotal", 400, y + 165)
          .text("GST (18%)", 400, y + 180)
          .text("Total", 400, y + 195);

        doc
          .font("Helvetica")
          .text(`${orderData.fees}`, 480, y + 165)
          .text("₹3,600.00", 480, y + 180)
          .text("₹23,600.00", 480, y + 195);

        // Footer
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Make all checks payable to", 0, y + 300, { align: "center" });
        doc.text("Decoding Youth Talent Private Limited", 0, y + 315, {
          align: "center",
        });
        doc
          .fontSize(10)
          .font("Helvetica")
          .text("Thank you for your business!", 0, y + 330, {
            align: "center",
          });
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            "E-895, Third Floor, C R Park, New Delhi, India, 110019",
            0,
            y + 345,
            { align: "center" }
          );
        doc
          .fontSize(10)
          .font("Helvetica")
          .text("contact@yftchain.com", 0, y + 360, { align: "center" });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async createmPinCode(data, user_id) {
    try {
      console.log("data recive for set mpin code", data, user_id);
      const { password, confirmPassword } = data;
      await this.validateCreatePassword(password, confirmPassword);

      // Check if user already has an mPIN
      let existingMPIN = await this.mPinUtilityInst.findManyFormMysql({
        academy_user_id: user_id,
      });
      console.log("--->>>", existingMPIN);
      if (existingMPIN && existingMPIN.length > 0) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.ALREADY_EXISTS)
        );
      }
      const dataToInsert = {
        password: data.password,
        academy_user_id: user_id,
      };
      data.academy_user_id = user_id;
      // Insert into database
      await this.mPinUtilityInst.insertInSql(dataToInsert);

      //return response.data;
    } catch (error) {
      console.error("Error creating order:", error.response?.data || error);
      throw error;
    }
  }

  async mpinLogin(data, user_id) {
    try {
      console.log("data recive for set mpin code", data, user_id);
      const { password } = data;
      await this.validateLoginPassword(password);

      // Check if user already has an mPIN
      let existingMPIN = await this.mPinUtilityInst.findManyFormMysql({
        academy_user_id: user_id,
        password: password,
      });

      // Check if the array is empty and return an error
      if (!existingMPIN || existingMPIN.length === 0) {
        return Promise.reject(
          new errors.ValidationFailed(RESPONSE_MESSAGE.MPIN_NOT_FOUND)
        );
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error creating order:", error.response?.data || error);
      throw error;
    }
  }
  async verifyCashfreeSignature(req) {
    const secretKey = config.cashfree.x_client_secret; // Get from Cashfree Dashboard
    const receivedSignature = req.headers["x-webhook-signature"];
    const payload = JSON.stringify(req.body);

    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(payload)
      .digest("base64");

    return receivedSignature === generatedSignature;
  }
  validateCreatePassword(password, confirmPassword) {
    // Validate 4-digit mPIN
    if (!/^\d{4}$/.test(password)) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.PASSWORD_Length)
      );
    }

    if (!password) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.PASSWORD_REQUIRED)
      );
    }
    if (!confirmPassword) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.CONFIRM_PASSWORD_REQUIRED)
      );
    }
    if (password !== confirmPassword) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.PASSWORDS_DO_NOT_MATCH)
      );
    }
    return Promise.resolve();
  }

  validateLoginPassword(password) {
    // Validate 4-digit mPIN
    if (!/^\d{4}$/.test(password)) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.PASSWORD_Length)
      );
    }

    if (!password) {
      return Promise.reject(
        new errors.ValidationFailed(RESPONSE_MESSAGE.PASSWORD_REQUIRED)
      );
    }

    return Promise.resolve();
  }
}

module.exports = PaymentService;
