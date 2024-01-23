const express = require("express");
//--//
let routes = function () {
    const router = express();
    //--//
    let handler = function (req, res, next) {
        req.portalID = "dashboard";
        return next();
    };
    router.use(handler);
    router.use("/admin/", require("./routes/cms")());
    return router;
};
//--//
module.exports = routes;
