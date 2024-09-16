const mongoose = require("mongoose");
class ModelProvider {
	getModel(schemaObj = {}) {
		
		let existingModels = mongoose.modelNames();
		if (existingModels.includes(schemaObj.schemaName)) {
			return mongoose.model(schemaObj.schemaName);
		}
		let _schema = mongoose.Schema(schemaObj.fields, schemaObj.options);
		return mongoose.model(schemaObj.schemaName, _schema);
	}
}

module.exports = new ModelProvider();