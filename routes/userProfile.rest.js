const { checkAuthToken, checkRole } = require("../middleware/auth");
const responseHandler = require("../ResponseHandler");
const UserProfileService = require("../services/UserProfileService");
const UserService = require("../services/UserService");
const userValidator = require("../middleware/validators").userValidator;
const StorageProvider = require("storage-provider");
const config = require("../config");
const STORAGE_PROVIDER_LOCAL = require("../constants/StorageProviderLocal");
const AVATAR = require("../constants/avatar");

module.exports = (router) => {
  /**
   * @api {get} /profile/:_category member profile
   * @apiName Profile
   * @apiGroup Profile
   *
   * @apiSuccess {String} status success
   * @apiSuccess {String} message Successfully done
   *
   * @apiParam (param) {String} _category  valid values (personal_details, professional_details, document_details)
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done",
   *       "data": {
   *                   "first_name": "denis",
   *                   "last_name": "menace",
   *                   "email": "denismenace@email.com",
   *                   "phone": "0987654321",
   *                   "avatar_url": "/uploads/avatar/user-avatar.png",
   *                   "player_type": "grassroot",
   *                   "district": {
   *                   "id": "354ab9a6-a617-428e-ad09-2d71464cc98b",
   *                   "name": "New delhi" },
   *                   "country": {
   *                   "id": "3bcda0b2-2bc6-4c0c-bc42-82c4aa42ec39",
   *                   "name": "India" },
   *                   "dob": "1997-09-06",
   *                   "gender": "Male",
   *                   "height": {
   *                   "feet": "6",
   *                   "inches": "1"   },
   *                   "institute": {
   *                   "school": "gfs",
   *                   "college": null,
   *                   "university": null },
   *                   "state": {
   *                   "id": "81d403b9-5d91-4078-86f8-db4c1d8bc831",
   *                   "name": "Delhi" },
   *                   "bio": "hi there",
   *                   "social_profiles": {
   *                   "facebook": "facebook.com",
   *                   "youtube": "youtube.com",
   *                   "twitter": "twitter.com",
   *                   "instagram": "instagram.com",
   *                   "linked_in": "linked_in.com" },
   *                   "weight": "60",
   *                   "member_type": "player",
   *                   "profile_status": {
   *                   "status": "non-verified"    }
   *                }
   *     }
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done",
   *       "data": {
   *                   "player_type": "grassroot",
   *                   "position": [
   *                       {
   *                   "_id": "5f05d6a21a4dba1d2068e288",
   *                   "name": "Ultimate Position",
   *                   "id": "6660b5b8-c7c3-4549-ac3c-49b7dfc54f3a",
   *                   "priority": "1" },
   *                       {
   *                   "_id": "5f05d6a21a4dba1d2068e289",
   *                   "name": "Right Wing",
   *                   "id": "1575cdee-b016-4081-9d9e-bf2446ba5206",
   *                   "priority": "2"
   *                                   },
   *                       {
   *                   "_id": "5f05d6a21a4dba1d2068e28a",
   *                   "name": "Goalkeeper",
   *                   "id": "fdc450e1-7495-4ddf-8f8c-0f3282acea2b",
   *                   "priority": "3"
   *                                   }],
   *                   "association": "All Manipur Football Association",
   *                   "association_other": "",
   *                   "strong_foot": "left",
   *                   "associated_club_academy": "yes",
   *                   "club_academy_details": {
   *                   "head_coach_name": "akshay",
   *                   "head_coach_phone": "0987654321",
   *                   "head_coach_email": "ak@ak.com" },
   *                   "former_club_academy": "former club",
   *                   "weak_foot": "3",
   *                   "member_type": "player",
   *                   "profile_status": {
   *                   "status": "non-verified"    }
   *               }
   *     }
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done",
   *       "data": {
   *                  "documents": [{
   *                   "status": "pending",
   *                   "_id": "5f057d58d6795d2fe8e78ee0",
   *                   "type": "aadhar",
   *                   "added_on": "2020-07-08T08:01:28.611Z",
   *                   "media": {
   *                   "attachment_type": "image",
   *                   "doc_front": "\\uploads\\documents\\sampleHouse1594195288607.png",
   *                   "doc_back": "\\uploads\\documents\\sampleHouse1594195288609.png",
   *                   "user_photo": "\\uploads\\documents\\sampleHouse1594195288604.png" },
   *                   "document_number": "123456789012" }],
   *                   "member_type": "player",
   *                   "profile_status": {
   *                   "status": "non-verified"   }
   *               }
   *     }
   *
   * @apiErrorExample {json} UNAUTHORIZED
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "message": "Unauthorized",
   *       "code": "UNAUTHORIZED",
   *       "httpCode": 401
   *     }
   *
   * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
   *     HTTP/1.1 500 Internal server error
   *     {
   *       "message": "Internal Server Error",
   *       "code": "INTERNAL_SERVER_ERROR",
   *       "httpCode": 500
   *     }
   *
   */
  router.get("/profile/:_category/:id", async function (req, res) {
    try {
      
      let serviceInst = new UserService();
      responseHandler(
        req,
        res,
        serviceInst.getDetails({
          user: req.params.id,
          _category: req.params._category,
        })
      );
    } catch (e) {
      console.log(e);
      responseHandler(req, res, Promise.reject(e));
    }
  });
  /**
   * @api {put} /update-details/:_category update profile details
   * @apiName Update profile details
   * @apiGroup Profile
   *
   * @apiParam (param) {String} _category  valid values (personal_details, professional_details, document_details)
   * @apiParam (body) {String} bio bio of member (when _category = personal_details)
   * @apiParam (body) {String} facebook facebook profile link of member (when _category = personal_details)
   * @apiParam (body) {String} twitter twitter profile link of member (when _category = personal_details)
   * @apiParam (body) {String} instagram instagram profile link of member (when _category = personal_details)
   * @apiParam (body) {String} youtube youtube profile link of member (when _category = personal_details)
   * @apiParam (body) {String} linked_in linked_in profile link of member (when _category = personal_details)
   * @apiParam (body) {String} aadhar_number player aadhar number (when _category = document_details)
   * @apiParam (body) {String} aadhar_media_type image or pdf (when _category = document_details)
   * @apiParam (body) {String} aadhar_front aadhar front image file (when _category = document_details)
   * @apiParam (body) {String} aadhar_back aadhar back image file (when _category = document_details)
   * @apiParam (body) {String} aadhar aadhar pdf file (when _category = document_details)
   * @apiParam (body) {String} first_name player first name (when _category = personal_details)
   * @apiParam (body) {String} last_name player last name (when _category = personal_details)
   * @apiParam (body) {String} dob player date of birth (when _category = personal_details)
   * @apiParam (body) {String} gender gender (when _category = personal_details)
   * @apiParam (body) {String} player_height_feet player height feet (when _category = personal_details)
   * @apiParam (body) {String} player_height_inches player height inches (when _category = personal_details)
   * @apiParam (body) {String} weight player weight (when _category = personal_details)
   * @apiParam (body) {String} country country id (when _category = personal_details)
   * @apiParam (body) {String} state state id (when _category = personal_details)
   * @apiParam (body) {String} district district id (when _category = personal_details)
   * @apiParam (body) {String} school player school (when _category = personal_details)
   * @apiParam (body) {String} college player college (when _category = personal_details)
   * @apiParam (body) {String} university player university (when _category = personal_details)
   * @apiParam (body) {String} phone member phone number (when _category = personal_details)
   * @apiParam (body) {String} mobile_number club/academy mobile number (when _category = personal_details)
   * @apiParam (body) {String} position player position (array of object with id and priority) (when _category = professional_details)
   * @apiParam (body) {String} strong_foot player strong foot (when _category = professional_details)
   * @apiParam (body) {String} weak_foot player weak foot (when _category = professional_details)
   * @apiParam (body) {String} associated_club_academy (yes or no) (when _category = professional_details)
   * @apiParam (body) {String} head_coach_name head coach name (when _category = professional_details)
   * @apiParam (body) {String} head_coach_email head coach email (when _category = professional_details)
   * @apiParam (body) {String} head_coach_phone head coach phone number (when _category = professional_details)
   * @apiParam (body) {String} former_club_academy player former club/academy (when _category = professional_details)
   * @apiParam (body) {String} pincode club/academy pincode (when _category = personal_details)
   * @apiParam (body) {String} address club/academy address (when _category = personal_details)
   * @apiParam (body) {String} document_type academy document_type (when _category = document_details)
   * @apiParam (body) {String} type club/academy type (when _category = professional_details)
   * @apiParam (body) {String} number academy PAN/ COI/ Tin Number (when _category = document_details)
   * @apiParam (body) {String} document document file for academy (when _category = document_details)
   * @apiParam (body) {String} aiff_id club AIFF Accreditation ID (when _category = document_details)
   * @apiParam (body) {String} aiff aiff file for club (when _category = document_details)
   * @apiParam (body) {String} stadium_name club/academy stadium name (when _category = personal_details)
   * @apiParam (body) {string} trophies club/academy trophies (when _category = professional_details)
   * @apiParam (body) {string} name club/academy name (when _category = personal_details)
   * @apiParam (body) {string} league club/academy league (when _category = professional_details)
   * @apiParam (body) {string} league_other club/academy other league (when _category = professional_details)
   * @apiParam (body) {string} association club/academy/player State association  (when _category = professional_details)
   * @apiParam (body) {string} association_other club/academy/player other association (when _category = professional_details)
   * @apiParam (body) {string} short_name club/academy short name (when _category = personal_details)
   * @apiParam (body) {string} founded_in club/academy founded year (when _category = personal_details)
   * @apiParam (body) {string} top_signings club/academy top_signings (when _category = professional_details)
   * @apiParam (body) {string} contact_person club/academy contact person (when _category = professional_details)
   *
   *
   * @apiSuccess {String} status success
   * @apiSuccess {String} message Successfully done
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done",
   *       "data": {"n": 1,
   *                "nModified": 1,
   *                "ok": 1}
   *     }
   *
   * @apiErrorExample {json} Unauthorized
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "message": "Unauthorized",
   *       "code": "UNAUTHORIZED",
   *       "httpCode": 401
   *     }
   *
   * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
   *     HTTP/1.1 500 Internal server error
   *     {
   *       "message": "Internal Server Error",
   *       "code": "INTERNAL_SERVER_ERROR",
   *       "httpCode": 500
   *     }
   *
   */
  router.put("/update-details/:_category", async function (req, res) {
    try {
     
      let serviceInst = new UserProfileService();
      req.body._category = req.params._category;
     // let reqObj = await serviceInst.uploadProfileDocuments(
     //   req.body,
     //   req.authUser.user_id,
      //  req.files
    //  );
   
      responseHandler(
        req,
        res,
        serviceInst.updateProfileDetails(req.body)
      );
    } catch (e) {
      console.log(e);
      responseHandler(req, res, Promise.reject(e));
    }
  });
  /**
   * @api {put} /update-avatar update avatar
   * @apiName Update avatar
   * @apiGroup Profile
   *
   * @apiParam (body) {String} avatar avatar will be an image file
   *
   * @apiSuccess {String} status success
   * @apiSuccess {String} message Successfully done
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done",
   *       "data": {"n": 1,
   *                "nModified": 1,
   *                "ok": 1,
   *                "avatar_url": "\uploads\documents\Sample.jpg"
   *               }
   *     }
   *
   * @apiErrorExample {json} Unauthorized
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "message": "Unauthorized",
   *       "code": "UNAUTHORIZED",
   *       "httpCode": 401
   *     }
   *
   * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
   *     HTTP/1.1 500 Internal server error
   *     {
   *       "message": "Internal Server Error",
   *       "code": "INTERNAL_SERVER_ERROR",
   *       "httpCode": 500
   *     }
   *
   */
  router.put("/update-avatar", checkAuthToken, async function (req, res) {
    try {
      let serviceInst = new UserProfileService();
      let reqObj = req.body;

      if (req.files) {
        const configForLocal = config.storage;
        let options = STORAGE_PROVIDER_LOCAL.UPLOAD_OPTIONS;
        options.allowed_extensions = AVATAR.ALLOWED_MEDIA_EXTENSIONS;
        let storageProviderInst = new StorageProvider(configForLocal);
        if (req.files.avatar) {
          let uploadResponse = await storageProviderInst.uploadDocument(
            req.files.avatar,
            options
          );
          reqObj.avatar_url = uploadResponse.url;
        }
      }
      responseHandler(
        req,
        res,
        serviceInst.updateAvatar({
          member_type: req.authUser.member_type,
          id: req.authUser.user_id,
          updateValues: reqObj,
        })
      );
    } catch (e) {
      console.log(e);
      responseHandler(req, res, Promise.reject(e));
    }
  });
  /**
   * @api {delete} /avatar delete avatar
   * @apiName Delete avatar
   * @apiGroup Profile
   *
   * @apiSuccess {String} status success
   * @apiSuccess {String} message Successfully done
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "status": "success",
   *       "message": "Successfully done"
   *     }
   *
   * @apiErrorExample {json} INTERNAL_SERVER_ERROR:
   *     HTTP/1.1 500 Internal server error
   *     {
   *       "message": "Internal Server Error",
   *       "code": "INTERNAL_SERVER_ERROR",
   *       "httpCode": 500
   *     }
   *
   * @apiErrorExample {json} UNAUTHORIZED
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "message": "Unauthorized",
   *       "code": "UNAUTHORIZED",
   *       "httpCode": 401
   *     }
   *
   */
  router.delete("/avatar", checkAuthToken, async function (req, res) {
    try {
      let serviceInst = new UserProfileService();
      responseHandler(
        req,
        res,
        serviceInst.updateProfileBio({
          member_type: req.authUser.member_type,
          id: req.authUser.user_id,
          updateValues: {
            avatar_url: "/uploads/avatar/user-avatar.png",
          },
        })
      );
    } catch (e) {
      console.log(e);
      responseHandler(req, res, Promise.reject(e));
    }
  });
};
