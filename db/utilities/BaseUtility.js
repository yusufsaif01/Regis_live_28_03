const _ = require("lodash");
const Model = require("../model");
const errors = require("../../errors");
var crypto = require("crypto");
const fs = require("fs");
var path = require("path");
var conn = require("../ConnectionMysql");
const { resolve } = require("bluebird");

class BaseUtility {
  constructor(schemaObj) {
    this.schemaObj = schemaObj;
  }

  async getModel() {
    this.model = await Model.getModel(this.schemaObj);
  }

  async findOneInMongo(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      let result = await this.model.findOne(conditions, projection, options);
      
      return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async findOneLean(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };
      
      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      let result = await this.model
        .findOne(conditions, projection, options)
        .lean();
      return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async findOnePosition(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }

      conditions.deleted_at = { $exists: false };
      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      let result = await this.model.findOne(conditions, projection, options);

      return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async findOneFootRequest(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }

      conditions.deleted_at = { $exists: false };
      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };

      let result = await this.model.findOne(conditions, projection, options);

      return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async findOne(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      //conditions.deleted_at = { $exists: false };

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      const modelnameis = await this.model.modelName;

      function processValue(value) {
        if (!isNaN(value)) {
          return value;
        }
        if (typeof value === "string") {
          return `"${escape(value)}"`;
        }
        throw new Error("Unsupported value type!");
      }

      function where(conditions) {
        return Object.entries(conditions)
          .reduce(function (statement, [key, value]) {
            return statement.concat(["AND", key, "=", processValue(value)]);
          }, [])
          .slice(1)
          .join(" ");
      }

      const sql = `Select * FROM ${modelnameis} where ?`;

      const [result, fields] = await conn.query(sql, where(conditions));

      const data = await this.model
        .findOne(conditions, projection, options)
        .lean();
      
      return data;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async findOneForProfileFetch(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      //conditions.deleted_at = { $exists: false };

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      const modelnameis = await this.model.modelName;

      const sql = `Select * FROM ${modelnameis} where ?`;
      const [result, fields] = await conn.query(sql, conditions);
      const data = await this.model
        .findOne(conditions, projection, options)
        .lean();
     
      const res = Object.assign({}, ...result);
      if (data !== null) {
        res.avatar_url = data.avatar_url;
        res.type = data.type;
      }

      return res;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async findOnePublicProfileDetails(
    conditions = {},
    projection = [],
    options = {}
  ) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      //conditions.deleted_at = { $exists: false };
      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      const modelnameis = await this.model.modelName;
      const sql = `Select * FROM ${modelnameis} where ?`;
      const [result] = await conn.query(sql, conditions);

      const data = await this.model
        .findOne(conditions, projection, options)
        .lean();
      console.log("public data from mongo",data)
      const res = Object.assign({}, ...result);
      //res.avatar_url = data.avatar_url;
      console.log("recive data from mysqll",res)
        res.avatar_url = data.avatar_url;
        res.strong_foot = data.strong_foot;
        res.association = data.association;
        res.weak_foot = data.weak_foot;
        res.former_club_academy = data.former_club_academy;
        res.associated_clud_academy = data.associated_club_academy;
        res.position = data.position;
        res.trophies = data.trophies;
        res.top_signings = data.top_signings;
        res.type = data.type;
        res.createdAt = data.createdAt;
        res.deleted_at = data.deleted_at;
        res.contact_person = data.contact_person
      //res.phone=data.phone
     
         res.current_role = data.current_role;
         res.year_of_exp = data.year_of_exp;
         res.academy_name = data.academy_name;
         res.coache_certificate = data.coache_certificate;
         res.area_of_spec = data.area_of_spec;
         res.language = data.language;
         res.traning_style = data.traning_style;

      delete res.contact_persion_name;
      delete res.contact_persion_email;
      delete res.contact_persion_mobile_number;
      delete res.contact_persion_designation;
     
      return res;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async findOnePlayer(conditions = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      //conditions.deleted_at = { $exists: false };

      const modelnameis = await this.model.modelName;

      const returnData = con.connect(function (err) {
        if (err) throw err;

        const sql = `Select * FROM ${modelnameis} where ?`;

        conn.query(sql, conditions, function (err, result) {
          if (err) throw err;

          return result;
        });
      });

      //let result = await this.model.findOne(conditions, projection, options).lean();
      //return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async findOneAnother(conditions = {}, projection = [], options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      //conditions.deleted_at = { $exists: false };

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };

      const modelnameis = await this.model.modelName;
      var emptydata = [];

      const sql = `Select * FROM ${modelnameis} where ?`;
      const [result, fields] = await conn.query(sql, conditions);

      // const data = await this.model
      //   .findOne(conditions, projection, options)
      //   .lean();

      const result1 = Object.assign({}, ...result);
     
      return result1;
      //let result = await this.model.findOne(conditions, projection, options).lean();
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async find(conditions = {}, projection = {}, options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      if (options && (!options.sort || !Object.keys(options.sort).length)) {
        options.sort = { createdAt: -1 };
      }

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };

      const result = await this.model.find(conditions, projection);

      return result;
    } catch (e) {
      console.log(
        `Error in find() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async otpVerify(conditions = {}) {
    try {
     
      const projection = {};
      const options = {};
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }

      const result = await this.model.findOne(conditions);
     
      return result;
    } catch (e) {
      console.log(
        `Error in find() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async countList(conditions = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      let count = await this.model.countDocuments(conditions);
      return count;
    } catch (e) {
      console.log(
        `Error in find() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async insertInMongo(record = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      
      let result = await this.model.create(record);
      
      return result;
    } catch (e) {
      console.log(
        `Error in insert() while inserting data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async insert(record_for_mysql = {}, record_for_mongoDb = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      
      await this.model.create(record_for_mongoDb);
      const modelnameis = await this.model.modelName;
      delete record_for_mysql.opening_days;
      //MySql Database
      const data = record_for_mysql;
      console.log("record for mysql", data)
      const sql = `INSERT INTO ${modelnameis} SET ?`;
      const [result, row] = await conn.query(sql, data, true);
      return result;
    } catch (e) {
      console.log(
        `Error in insert() while inserting data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async updateTrainingCenter(condition = {}, data = {}) {
    try {
      if (!this.model || _.isEmpty(this.model)) {
        await this.getModel();
      }
     
      // MongoDB Update
      const updateResult = await this.model.updateOne(
        condition,
        data
      );
      
      // Prepare data for MySQL Update
      const recordForMySQL = { ...data };
      delete recordForMySQL.opening_days;

      const modelnameis = await this.model.modelName;

      // MySQL Update Query
      const sql = `UPDATE ${modelnameis} SET ? WHERE id = ?`;
      const [result] = await conn.query(sql, [
        recordForMySQL,
        recordForMySQL.id,
      ]);
      
      return result;
    } catch (e) {
      console.error(
        `Error in updateTrainingCenter while processing data for ${this.schemaObj.schemaName}:`,
        e.message,
        e.stack
      );
      throw e;
    }
  }

  async insertOtp(requestData = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      const result = await this.model.create(requestData);
      return result;
    } catch (e) {
      console.log(
        `Error in insert() while inserting data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async insertMany(recordsToInsert = []) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      let result = await this.model.insertMany(recordsToInsert);
      return result;
    } catch (e) {
      if (e.code === 11000) {
        return Promise.reject(new errors.Conflict(e.errmsg));
      }
      console.log(
        `Error in insertMany() while inserting data for ${this.schemaObj.schemaName} :: ${e}`
      );
      return Promise.reject(new errors.DBError(e.errmsg));
    }
  }

  async updateMany(conditions = {}, updatedDoc = {}, options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };
     
      let result = await this.model.updateMany(conditions, updatedDoc, options);
      
      return result;
    } catch (e) {
      console.log(
        `Error in updateMany() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async updateOneInMongo(conditions = {}, updatedDoc = {}, options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      let result = await this.model.updateOne(conditions, updatedDoc, options);

      return result;
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async insertOneInCoach(conditions = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
 
      const results = await this.model.create(conditions);
      return results;
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async updateOne(conditions = {}, updatedDoc = {}, options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };
      conditions.deleted_at = { $exists: false };

      const results = await this.model.updateOne(
        conditions,
        updatedDoc,
        options
      );

      const modelnameis = await this.model.modelName;

      const sql = `UPDATE login_details SET is_email_varified= 'true', status= 'active' where user_id = '${conditions.user_id}'`;
      const [result, fields] = await conn.execute(sql);

      return result;

      //	let result = await this.model.updateOne(conditions, updatedDoc, options);
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async updateOneCoachProfessional(
    conditions = {},
    data = {},
    updatedDoc = {},
    options = {}
  ) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      const results = await this.model.updateOne(conditions, data, options);

      return results;
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async updateOneProfile(
    conditions = {},
    data = {},
    updatedDoc = {},
    options = {}
  ) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      if (data._category === "professional_details") {
        const results = await this.model.updateOne(conditions, data, options);
        return results;
      } else {
        const modelnameis = await this.model.modelName;
        //const isMongoUpdate= await this.model.updateOne(conditions, updatedDoc, options);
       
        var algorithm = "aes256"; // or any other algorithm supported by OpenSSL
        var key = "password";
        var cipher_for_fisrt_name = crypto.createCipher(algorithm, key);
        var cipher_for_last_name = crypto.createCipher(algorithm, key);
        //var cipher_for_phone = crypto.createCipher(algorithm, key);
        var cipher_for_gender = crypto.createCipher(algorithm, key);
        var cipher_for_dob = crypto.createCipher(algorithm, key);
        var cipher_for_height_feet = crypto.createCipher(algorithm, key);
        var cipher_for_height_inches = crypto.createCipher(algorithm, key);
        var cipher_for_weight = crypto.createCipher(algorithm, key);
        var cipher_for_school = crypto.createCipher(algorithm, key);
        var cipher_for_country_name = crypto.createCipher(algorithm, key);
        var cipher_for_state_name = crypto.createCipher(algorithm, key);
        var cipher_for_district_name = crypto.createCipher(algorithm, key);
        var cipher_for_enc_bio = crypto.createCipher(algorithm, key);
        var cipher_for_institute_school = crypto.createCipher(algorithm, key);
        var cipher_for_institute_college = crypto.createCipher(algorithm, key);
        var cipher_for_institute_university = crypto.createCipher(
          algorithm,
          key
        );
        var cipher_for_height_feet = crypto.createCipher(algorithm, key);
        var cipher_for_height_inches = crypto.createCipher(algorithm, key);

        var enc_first_name =
          cipher_for_fisrt_name.update(data.first_name, "utf8", "hex") +
          cipher_for_fisrt_name.final("hex");

        // var enc_phone =
        //   cipher_for_phone.update(data.phone, "utf8", "hex") +
        //   cipher_for_phone.final("hex");

        var enc_lastname =
          cipher_for_last_name.update(data.last_name, "utf8", "hex") +
          cipher_for_last_name.final("hex");

        var enc_gender =
          cipher_for_gender.update(data.gender, "utf8", "hex") +
          cipher_for_gender.final("hex");

        //  var enc_weight =
        //    cipher_for_weight.update(data.weight, "utf8", "hex") +
        //   cipher_for_weight.final("hex");

        //  var enc_school =
        //   cipher_for_school.update(data.school, "utf8", "hex") +
        //   cipher_for_school.final("hex");

        var enc_country_name =
          cipher_for_country_name.update(data.country.name, "utf8", "hex") +
          cipher_for_country_name.final("hex");

        // var enc_state_name =
        //  cipher_for_state_name.update(data.state.name, "utf8", "hex") +
        //  cipher_for_state_name.final("hex");

        var enc_height_feet =
          cipher_for_height_feet.update(data.height_feet, "utf8", "hex") +
          cipher_for_height_feet.final("hex");

        var enc_height_inches =
          cipher_for_height_inches.update(data.height_inches, "utf8", "hex") +
          cipher_for_height_inches.final("hex");

        // var enc_district_name =
        //   cipher_for_district_name.update(data.district.name, "utf8", "hex") +
        //  cipher_for_district_name.final("hex");

        var enc_bio =
          cipher_for_enc_bio.update(data.bio, "utf8", "hex") +
          cipher_for_enc_bio.final("hex");

       
        const weightis = data.weight ? data.weight : "";
        const collegeis = data.college ? data.college : "";
        const schoolis = data.school ? data.school : "";
        const universityis = data.university ? data.university : "";
        const sql = `UPDATE ${modelnameis} SET first_name='${enc_first_name}',last_name='${enc_lastname}',gender='${enc_gender}',dob='${data.dob}',height_feet='${data.height_feet}',height_inches='${data.height_inches}',weight='${weightis}',country_name='${enc_country_name}',country_id='${data.country.id}',state_id='${data.state.id}',state_name='${data.state.name}',district_id='${data.district.id}',district_name='${data.district.name}',bio='${enc_bio}',player_type='${data.player_type}',institute_college='${collegeis}',institute_university='${universityis}',institute_school='${schoolis}'
     
        where user_id = '${conditions.user_id}'`;

        const [result, fields] = await conn.execute(sql);
       
        return result;
      }
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async findOneProfessionalInMongo(
    conditions = {},
    projection = [],
    options = {}
  ) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      let result = await this.model
        .findOne(conditions, projection, options)
        .lean();
      return result;
    } catch (e) {
      console.log(
        `Error in findOne() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async updateOneProfileClub(
    conditions = {},
    data = {},
    updatedDoc = {},
    options = {}
  ) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      // const results = await this.model.updateOne(
      // conditions,
      //updatedDoc,
      // options
      //);

      const modelnameis = await this.model.modelName;

      if (data._category !== "professional_details") {
        var algorithm = "aes256"; // or any other algorithm supported by OpenSSL
        var key = "password";
        var cipher_for_name = crypto.createCipher(algorithm, key);
        // var cipher_for_phone = crypto.createCipher(algorithm, key);
        var cipher_for_short_name = crypto.createCipher(algorithm, key);
        var cipher_for_country_name = crypto.createCipher(algorithm, key);
        var cipher_for_state_name = crypto.createCipher(algorithm, key);
        var cipher_for_district_name = crypto.createCipher(algorithm, key);
        var cipher_for_enc_bio = crypto.createCipher(algorithm, key);
        var cipher_for_mobile_number = crypto.createCipher(algorithm, key);
        var cipher_for_pincode = crypto.createCipher(algorithm, key);
        var cipher_for_stadium_name = crypto.createCipher(algorithm, key);
        
        var enc_name =
          cipher_for_name.update(data.name, "utf8", "hex") +
          cipher_for_name.final("hex");

        // var enc_phone =
        //   cipher_for_phone.update(data.phone, "utf8", "hex") +
        //   cipher_for_phone.final("hex");

        var enc_short_name =
          cipher_for_short_name.update(data.short_name, "utf8", "hex") +
          cipher_for_short_name.final("hex");

        var enc_mobile_number =
          cipher_for_mobile_number.update(data.mobile_number, "utf8", "hex") +
          cipher_for_mobile_number.final("hex");

        // var enc_pincode =
        //   cipher_for_pincode.update(data.pincode, "utf8", "hex") +
        //  cipher_for_pincode.final("hex");

        var enc_country_name =
          cipher_for_country_name.update(data.country.name, "utf8", "hex") +
          cipher_for_country_name.final("hex");

        //  var enc_state_name =
        //  cipher_for_state_name.update(data.state.name, "utf8", "hex") +
        //   cipher_for_state_name.final("hex");

        var enc_district_name =
          cipher_for_district_name.update(data.district.name, "utf8", "hex") +
          cipher_for_district_name.final("hex");

        var enc_bio =
          cipher_for_enc_bio.update(data.bio, "utf8", "hex") +
          cipher_for_enc_bio.final("hex");
        const stadium_name = data.stadium_name ? data.stadium_name : "";
        const pincode = data.pincode ? data.pincode : "";
        const sql = `UPDATE ${modelnameis} SET name='${enc_name}',short_name='${data.short_name}',mobile_number='${data.mobile_number}',address_pincode='${pincode}',stadium_name='${stadium_name}',country_name='${enc_country_name}',country_id='${data.country.id}',state_id='${data.state.id}',state_name='${data.state.name}',district_id='${data.district.id}',district_name='${data.district.name}',address_fulladdress='${data.address.full_address}',founded_in='${data.founded_in}',bio='${enc_bio}'
      where user_id = '${conditions.user_id}'`;

        const [result, fields] = await conn.execute(sql);
       console.log("after update ", result)
        return result;
      } else {
        let mongoInsert = await this.model.updateOne(conditions, data, options);

        const top_sing = data.top_signings.map((item) => item.name).toString();
        const contact_person_name = data.contact_person
          .map((item) => item.name)
          .toString();
        const contact_person_email = data.contact_person
          .map((item) => item.email)
          .toString();
        const contact_persion_designation = data.contact_person
          .map((item) => item.designation)
          .toString();
        const contact_person_mobile = data.contact_person
          .map((item) => item.mobile_number)
          .toString();
        const sql = `UPDATE ${modelnameis} SET association='${data.association}',league='${data.league}',top_signings_name='${top_sing}',contact_persion_designation='${contact_persion_designation}',contact_persion_name='${contact_person_name}',contact_persion_email='${contact_person_email}',contact_persion_mobile_number='${contact_person_mobile}'
      where user_id = '${conditions.user_id}'`;

        const [result, fields] = await conn.execute(sql);
       
        return result;
      }
      //	let result = await this.model.updateOne(conditions, updatedDoc, options);
    } catch (e) {
      console.log(
        `Error in updateOne() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async findOneAndUpdate(conditions = {}, updatedDoc = {}, options = {}) {
    try {
      let entity = await this.findOne(conditions, null, options);
      if (!entity) {
        return Promise.reject(new errors.NotFound());
      }
      conditions.deleted_at = { $exists: false };
      options.new = true;
      return this.model.findOneAndUpdate(conditions, updatedDoc, options);
    } catch (e) {
      console.log(
        `Error in findOneAndUpdate() while updating data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async populate(baseOptions = {}, toBePopulatedOptions = {}) {
    try {
      baseOptions.projection = !_.isEmpty(baseOptions.projection)
        ? baseOptions.projection
        : { _id: 0, __v: 0 };
      toBePopulatedOptions.projection = !_.isEmpty(
        toBePopulatedOptions.projection
      )
        ? toBePopulatedOptions.projection
        : { _id: 0, __v: 0 };

      const data = await this.model
        .find(
          baseOptions.conditions || {},
          baseOptions.projection || null,
          baseOptions.options || {}
        )
        .populate({
          path: toBePopulatedOptions.path,
          match: toBePopulatedOptions.condition || {},
          select: toBePopulatedOptions.projection || null,
        })
        .exec();
      
      return data;
    } catch (e) {
      console.log(
        `Error in populate() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
  async aggregate(aggregations = []) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }

      const data = await this.model.aggregate(aggregations);
      return data;
    } catch (e) {
      console.log(
        `Error in aggregate() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }

  async cursor(conditions = {}, projection = {}, options = {}) {
    try {
      if (_.isEmpty(this.model)) {
        await this.getModel();
      }
      conditions.deleted_at = { $exists: false };

      if (options && (!options.sort || !Object.keys(options.sort).length)) {
        options.sort = { createdAt: -1 };
      }

      projection = !_.isEmpty(projection) ? projection : { _id: 0, __v: 0 };
      return this.model.find(conditions, projection, options).cursor();
    } catch (e) {
      console.log(
        `Error in find() while fetching data for ${this.schemaObj.schemaName} :: ${e}`
      );
      throw e;
    }
  }
}

module.exports = BaseUtility;
