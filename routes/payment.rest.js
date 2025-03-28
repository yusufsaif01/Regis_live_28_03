const responseHandler = require("../ResponseHandler");
const { checkAuthToken, checkRole } = require("../middleware/auth");
const PaymentService = require("../services/PaymentService");
const crypto = require("crypto");
module.exports = (router) => {
 
  router.post("/payment/setup", async (req, res) => {
    try {
     
      console.log("Body before merging in registration:", req.body);
       let serviceInst = new PaymentService();
       responseHandler(
         req,
         res,
         serviceInst.setupPayment(
           req.body
         )
       );
      
    } catch (error) {
      console.error("Error in /payment/setup:", error);

      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.get("/payment/setup-check/:user_id", async (req, res) => {
    try {
      console.log("response in regis",req.params.user_id)
      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.paymentSetupCheck(req.params.user_id));
    } catch (error) {
      console.error("Error in /payment/setup:", error);
      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.get("/manage/footplayer/fees/:user_id", async (req, res) => {
    try {
      console.log("manage footplayer fee", req.params.user_id);
      let filters = {
        footplayers: Number(req.query.footplayers) || 0,
        search: req.query.search,
        page_no: Number(req.query.page_no) || 1,
        page_size: Number(req.query.page_size) || 10,
        position:
          req.query && req.query.position
            ? req.query.position.split(",")
            : null,
        footplayer_category:
          req.query && req.query.footplayer_category
            ? req.query.footplayer_category.split(",")
            : null,
        age: req.query && req.query.age ? req.query.age.split(",") : null,
        country: req.query && req.query.country ? req.query.country : null,
        state: req.query && req.query.state ? req.query.state : null,
        district: req.query && req.query.district ? req.query.district : null,
        strong_foot:
          req.query && req.query.strong_foot
            ? req.query.strong_foot.split(",")
            : null,
        ability:
          req.query && req.query.ability ? req.query.ability.split(",") : null,
        status:
          req.query && req.query.status ? req.query.status.split(",") : null,
      };

      let criteria = {
        sentBy:
          req.query && req.query.user_id
            ? req.query.user_id
            : req.params.user_id,
      };

      const params = {
        filters,
        criteria,
      };

      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.manageFootplayerFees(params));
    } catch (error) {
      console.error("Error in /payment/setup:", error);
      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });
  
  router.get("/manage/fees/reminder/:user_id", async (req, res) => {
    try {
      console.log("manage footplayer fee", req.params.user_id);
      let filters = {
        footplayers: Number(req.query.footplayers) || 0,
        search: req.query.search,
        page_no: Number(req.query.page_no) || 1,
        page_size: Number(req.query.page_size) || 10,
        position:
          req.query && req.query.position
            ? req.query.position.split(",")
            : null,
        footplayer_category:
          req.query && req.query.footplayer_category
            ? req.query.footplayer_category.split(",")
            : null,
        age: req.query && req.query.age ? req.query.age.split(",") : null,
        country: req.query && req.query.country ? req.query.country : null,
        state: req.query && req.query.state ? req.query.state : null,
        district: req.query && req.query.district ? req.query.district : null,
        strong_foot:
          req.query && req.query.strong_foot
            ? req.query.strong_foot.split(",")
            : null,
        ability:
          req.query && req.query.ability ? req.query.ability.split(",") : null,
        status:
          req.query && req.query.status ? req.query.status.split(",") : null,
      };

      let criteria = {
        sentBy:
          req.query && req.query.user_id
            ? req.query.user_id
            : req.params.user_id,
      };

      const params = {
        filters,
        criteria,
      };

      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.manageFeesReminder(params));
    } catch (error) {
      console.error("Error in /payment/setup:", error);
      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });
  router.post("/change/fee/status", async (req, res) => {
    try {
      console.log("***********",req.body)
      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.changeFeeStatus(req.body));
    } catch (error) {
      console.error("Error in /payment/setup:", error);

      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.post("/send/fee/reminder", async (req, res) => {
    try {
      console.log("***********", req.body);
      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.sendFeeReminder(req.body));
    } catch (error) {
      console.error("Error in /payment/setup:", error);

      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.get("/parent/child-list/:user_id", async (req, res) => {
    try {
      console.log("response in regis", req.params.user_id);
      let serviceInst = new PaymentService();
      responseHandler(
        req,
        res,
        serviceInst.parentChildList(req.params.user_id)
      );
    } catch (error) {
      console.error("Error in /payment/setup:", error);
      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.post("/payment/create-order/:user_id", async (req, res) => {
    try {
      let serviceInst = new PaymentService();
      responseHandler(req, res, serviceInst.createOrder(req.body, req.params.user_id));
    } catch (error) {
      console.error("Error in /payment/setup:", error);

      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });
  
    // router.put("/verify/payment/:order_id", async (req, res) => {
    //   try {
    //     const order_id = req.params.order_id
    //     console.log("order_id in regis", req.params.order_id);
    //     let serviceInst = new PaymentService();
    //     responseHandler(req, res, serviceInst.getOrderStatus(order_id, req.body, res));
    //   } catch (error) {
    //     console.error("Error in /payment/setup:", error);
    //     // Send appropriate error response
    //     return responseHandler(
    //       req,
    //       res,
    //       Promise.reject(error.response?.data || "Internal Server Error")
    //     );
    //   }
    // });

  router.put("/verify/payment/:order_id/:user_id" ,async (req, res) => {
    try {
      const order_id = req.params.order_id;
      const user_id = req.params.user_id;
      console.log("order_id in regis", order_id);

      let serviceInst = new PaymentService();
      const pdfBuffer = await serviceInst.getOrderStatus(
        order_id,
        user_id,
        req.body,
        res
      );

      if (pdfBuffer instanceof Buffer) {
        // If response is a PDF, send it directly
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename=invoice_${order_id}.pdf`
        );
        return res.send(pdfBuffer);
      }

      // Otherwise, use responseHandler
      //responseHandler(req, res, Promise.resolve(pdfBuffer));
    } catch (error) {
      console.error("Error in /verify/payment:", error);
      return responseHandler(req, res, Promise.reject(error));
    }
  });

   router.post("/setup/mpin/:user_id", async (req, res) => {
     try {
       let serviceInst = new PaymentService();
       responseHandler(
         req,
         res,
         serviceInst.createmPinCode(req.body, req.params.user_id)
       );
     } catch (error) {
       console.error("Error in /payment/setup:", error);

       // Send appropriate error response
       return responseHandler(
         req,
         res,
         Promise.reject(error.response?.data || "Internal Server Error")
       );
     }
   });
  
  router.post("/mpin/login/:user_id", async (req, res) => {
    try {
      let serviceInst = new PaymentService();
      responseHandler(
        req,
        res,
        serviceInst.mpinLogin(req.body, req.params.user_id)
      );
    } catch (error) {
      console.error("Error in /payment/setup:", error);

      // Send appropriate error response
      return responseHandler(
        req,
        res,
        Promise.reject(error.response?.data || "Internal Server Error")
      );
    }
  });

  router.post("/payment-webhook", async (req, res) => {
     console.log("---------------------")
     try {
       console.log("webshook response in registration=>", req.body)
        
       let serviceInst = new PaymentService();
       responseHandler(
         req,
         res,
         serviceInst.paymentWebhook(req)
       );
     } catch (error) {
       console.error("Error in /payment/setup:", error);

       // Send appropriate error response
       return responseHandler(
         req,
         res,
         Promise.reject(error.response?.data || "Internal Server Error")
       );
     }
   });
  

};
