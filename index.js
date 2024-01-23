const cors = require("cors");
const ejs = require('ejs');
const morgan = require("morgan");
const moment = require("moment");
const express = require("express");
const bodyParser = require("body-parser");
//------------------------------------//
const app = express();
app.set('view engine', 'html');
app.set('views', './');
app.engine('.html', ejs.renderFile);
app.use(cors({ optionsSuccessStatus: 200 }));
app.options("*", cors({ optionsSuccessStatus: 200 }));
//------------------------------------//
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
//------------------------------------//
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use('/forms', express.static(__dirname+'/forms'));
//------------------------------------//
app.use(morgan("[:date] [:method] :url :status :res[content-length] - :response-time ms", {
}));
//------------------------------------//
const server_config = require("./config/server");
console.log("server host", server_config.host);
// app.use(require("./middleware/request_getters"));
//------------------------------------//
app.use("/api/enrollment/", require("./modules/enrollment/index.js")());
app.use("/api/enterprise/", require("./modules/enterprise/index.js")());
app.use("/api/cms/", require("./modules/cms/index.js")());
//------------------------------------//
//------------------------------------//
app.use(require("./middleware/not_found"));
app.use(require("./middleware/response_handler"));
//------------------------------------//
/*******************************************************/
const handle = function (promise) {
    return promise
        .then(function (data) { return Promise.resolve([data, undefined]); })
        .catch(function (error) { return Promise.resolve([undefined, error]); });
};
const os = require("os");
const sequelize = require("./sequelize/sequelize");
app.listen(server_config.port, async function (error) {
    if (error) { console.log("App Error", error); }
    {
        console.log("Server is listening on HOST", os.hostname(), "on PORT", server_config.port);
        sequelize.connection.authenticate().then(function () {
            console.log("DB Connection Successful");
        }).catch(function (error) {
            console.log("Unable to connect to database", error);
        });
    }
});
//------------------------------------//
module.exports = app;
//------------------------------------//