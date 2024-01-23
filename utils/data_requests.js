const moment = require('moment');
const loginRequest = async function (req) {
    try {
        let requestBody = (req.body || {});
        let requestBodyObject = {
            email: String(requestBody.email).trim(),
            password: String(requestBody.password).trim()
        }
        return JSON.parse(JSON.stringify(requestBodyObject));
    }
    catch (error) { return [undefined, error]; }
};
const enrollmentRequest = async function (req) {
    try {
        // let random_password = Math.random().toString(36).slice(-6);
        let requestBody = (req.body || {});
        let requestBodyObject = {
            // username: String(requestBody.username || "").trim(),
            email: String(requestBody.email || "").trim(),
            password: String(requestBody.password || "").trim(),
            invitation_code: requestBody.invitation_code
        }
        return JSON.parse(JSON.stringify(requestBodyObject));
    }
    catch (error) { return [undefined, error]; }
};
//--//
module.exports = {
    loginRequest,
    enrollmentRequest
};
