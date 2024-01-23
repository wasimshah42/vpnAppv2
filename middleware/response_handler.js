const multer = require("multer");
const responseH = require("./../utils/response");
const Exception = require("./../utils/exceptions");
const sequelize = require("./../sequelize/sequelize");
//--//
module.exports = async function (data, req, res, next) {
    let console_error = true;
    let response = new responseH();
    //--//
    if (data && !isNaN(data)) {
        console_error = false;
        response.setError(data, Exception(data), data);
    }
    else if (data && data instanceof sequelize.sequelize.ValidationError) {
        response.setError(data.errors[0], Exception(422), 422);
        response.message = data.errors[0].message;
    }
    else if (data && data instanceof sequelize.sequelize.ValidationErrorItem) {
        response.setError(data.errors[0], Exception(422), 422);
        response.message = data.errors[0].message;
    }
    else if (data && data instanceof sequelize.sequelize.DatabaseError) {
        response.setError(data, Exception(400), 400);
    }
    else if (data && data instanceof sequelize.sequelize.InstanceError) {
        response.setError(data, Exception(400), 400);
    }
    else if (data && data instanceof multer.MulterError) {
        response.setError(data, Exception(411), 411);
    }
    else if (data && data instanceof Error) {
        response.setError(data.message, Exception(500), 500);
    }
    else {
        console_error = false;
        response.setSuccess(data, Exception(200), 200);
    }
    //--//
    if (response.status === "error") {
        if (console_error) { console.log(data); }
        else { console.log(data); }
    }
    //--//
    response.sendRes(req, res);
    return next();
};
