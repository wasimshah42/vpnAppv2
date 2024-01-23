const express = require("express");
const enterpriseController = require("../controller/enterpriseController");
const authChecker = require("../../../middleware/auth_checker");
const filter = require("../../../middleware/filter_validator");
const multer = require("../../../utils/multer");
//--//
let routes = function () {
    let routes = express.Router({ mergeParams: true });
    //-Screens crud-//
    routes.route("/add-member").post(authChecker('app'),enterpriseController.addMember);
    routes.route("/edit-member").post(authChecker('app'),enterpriseController.editMember);
    routes.route("/get-member-list").get( authChecker('app'),enterpriseController.getMemberList);
    routes.route("/delete-member").get(authChecker('app'),enterpriseController.deleteMember);
    routes.route("/delete-device").get(authChecker('app'),enterpriseController.deleteDevice);
    routes.route("/set-companyname").post(authChecker('app'),enterpriseController.setCompanyName);
    routes.route("/get-company-list").get( authChecker('app'),enterpriseController.getCompaniesList);
    routes.route("/add-plan-details").post(authChecker('app'),enterpriseController.addPlanDetails);
    routes.route("/get-plan-list").get( authChecker('app'),enterpriseController.getPlanList);
    routes.route("/enterprise-dashboard-details").get(authChecker('app'),enterpriseController.enterpriseDashboardDetails);
    routes.route("/withdraw-history").get( authChecker('app'),enterpriseController.withdrawHistory);
    //--//
    return routes;
};
//--//
module.exports = routes;
