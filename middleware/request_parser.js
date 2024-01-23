const dataReviver = require("./../utils/data_reviver");
module.exports = async function (req, res, next) {
    try { req.body = JSON.parse(JSON.stringify(req.body || {}), dataReviver); }
    catch (e) {
        req.body = {};
        if (e) { console.log(e); }
    }
    try { req.query = JSON.parse(JSON.stringify(req.query || {}), dataReviver); }
    catch (e) {
        req.query = {};
        if (e) { console.log(e); }
    }
    try { req.params = JSON.parse(JSON.stringify(req.params || {}), dataReviver); }
    catch (e) {
        req.params = {};
        if (e) { console.log(e); }
    }
    return next();
};
