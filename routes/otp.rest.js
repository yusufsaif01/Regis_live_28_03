const { checkAuthToken, checkRole } = require("../middleware/auth");
const responseHandler = require("../ResponseHandler");
const OtpService = require("../services/OtpService");

module.exports = (router) => {

    router.get("/verifyIdentity/:id/:dataToVerify", function (req, res) {
        console.log("id inside verifyIdentity is=>",req.params.id,req.params.dataToVerify)

        var StrObj = req.params.dataToVerify;
        console.log("StrObj is",StrObj)
        var emailsArray = StrObj.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
        console.log("isEmail",emailsArray)
        if (emailsArray != null && emailsArray.length) {
            let serviceInst = new OtpService();
            return responseHandler(req, res, serviceInst.sendOtpForVerificationEmail(req.params.id,req.params.dataToVerify));
        }

        else{
            let serviceInst = new OtpService();
            return responseHandler(req, res, serviceInst.sendOtpForVerificationOnSms(req.params.id,req.params.dataToVerify));
        }
       
    });
};
