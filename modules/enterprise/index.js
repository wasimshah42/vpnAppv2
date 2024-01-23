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
    router.use("/usertype/", require("./routes/enterprise")());
    return router;
};
//--//
module.exports = routes;
