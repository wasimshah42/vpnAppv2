/*******************************************************/
// Importing Files.
/*******************************************************/
// const networkRequest = require("../network_requests");
// const hpsConfig = require('../../config/hps');
// const entityHelper = require('../../helpers/entityAccessHelper');
/*******************************************************/
// Importing Npm Modules.
/*******************************************************/
// require('dotenv').config();
/*******************************************************/
const isValidEntityAccess = async (req) => {
    let entity = String(req.entity) || "";
    let entityType = String(req.entityType) || "";
    // calling store procedure here //
    return true;
}
module.exports = {
    isValidEntityAccess,
}