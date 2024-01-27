const express = require("express");
const cmsController = require("../controller/cms");
const authChecker = require("../../../middleware/auth_checker");
const filter = require("../../../middleware/filter_validator");
const multer = require("../../../utils/multer");
const upload = function(req, res, next){
    let uploader = multer.uploader.any();
    uploader(req, res, function(err){
        if(err){return next(err);}
        return next();
    });
};
//--//
let routes = function () {
    let routes = express.Router({ mergeParams: true });
    //-Screens crud-//
    routes.route("/login").post(cmsController.login);
    routes.route("/add-v2rayserver").post(authChecker('app'),[upload],cmsController.addV2rayServer);
    routes.route("/server-list").get(authChecker('both'),cmsController.serverList);
    //--//
    routes.route("/list").get(cmsController.findAll);
    routes.route("/update").post(cmsController.update);
    routes.route("/delete").post(cmsController.deleteAccount);
    //--//
    routes.route("/user-list").get(cmsController.filterByType);
    routes.route("/server-detail").get(cmsController.serverDetail);
    //-defaults setting-//
    routes.route("/defaults").get(cmsController.defaults);
    routes.route("/update-defaults").post(cmsController.updateDefault);
    //-default_data setting-//
    routes.route("/default-data").get(cmsController.defaultData);
    routes.route("/update-default-data").post(cmsController.updateDefaultData);
    //-Planing center CRUD-//
    routes.route("/plan").post(cmsController.addPlan)
    routes.route("/plan-list").get(cmsController.planList);
    routes.route("/update-plan").post(cmsController.updatePlan);
    routes.route("/delete-plan").post(cmsController.deletePlan);
    
    //--//
    return routes;
};
//--//
module.exports = routes;
