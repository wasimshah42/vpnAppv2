const express = require("express");
const enrollmentController = require("../controller/enrollmentController");
// const parser = require("../../../middleware/request_parser");
const authChecker = require("../../../middleware/auth_checker");
const enrollmentValidation = require("../validation/enrollment");
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
    routes.route("/login").post(enrollmentController.login);
    routes.route("/createUser").post(enrollmentController.createUser);
    routes.route("/forgot-password").post(enrollmentController.forgotPassword);
    routes.route("/reset-password").post(enrollmentController.resetPassword);
    routes.route("/createGuestUser").post(enrollmentController.createGuestUser);
    routes.route("/getServerList").get( authChecker('both'),enrollmentController.getServerList);
    routes.route("/verifyEmail").post(enrollmentController.verifyEmail);
    routes.route("/logout").post(authChecker('both'),enrollmentController.logout);
    routes.route("/usageTime").post(authChecker('both'),enrollmentController.usageTime);
    routes.route("/createReferalCode").get(authChecker('both'),enrollmentController.createReferalCode);
    routes.route("/verifyReferalCode").post(authChecker('both'),enrollmentController.verifyReferalCode);
    routes.route("/checkServerHealth").post(authChecker('both'),enrollmentController.checkServerHealth);
    routes.route("/userDetails").get(authChecker('both'),enrollmentController.userDetails);
    routes.route("/checkSubscription").post(authChecker('both'),enrollmentController.checkSubscription);
    routes.route("/userTransactionID").post(authChecker('both'),enrollmentController.userTransactionID);
    routes.route("/defaultData").get(authChecker('both'),enrollmentController.defaultData);
    routes.route("/stripePayment").post(authChecker('both'),enrollmentController.stripePayment);
    routes.route("/usdTPayment").post(authChecker('both'),enrollmentController.usdTPayment);
    routes.route("/fetchPackages").get(enrollmentController.fetchPackages);
    routes.route("/remainingFreeTrial").post(authChecker('both'),enrollmentController.remainingFreeTrial);
    routes.route("/paypalPayment").post(authChecker('both'),enrollmentController.paypalPayment);
    routes.route("/defaultAppData").get(authChecker('both'),enrollmentController.defaultAppData);
    routes.route("/aliPayPayment").post(authChecker('both'),enrollmentController.aliPayPayment);
    routes.route("/adsDetails").get(authChecker('both'),enrollmentController.adsDetails);
    routes.route("/getV2rayServersDetails").get(authChecker('both'),enrollmentController.getV2rayServersDetails);
    routes.route("/getvMessServersDetails").get(authChecker('both'),enrollmentController.getvMessServersDetails);
    routes.route("/referral-list").get(authChecker('both'),enrollmentController.referralList);
    routes.route("/discount-codes").get(authChecker('both'),enrollmentController.discountCodes);
    routes.route("/add-ios-file").post([upload],enrollmentController.addiOSFile);
    routes.route("/discount-codes").get(authChecker('both'),enrollmentController.discountCodes);
    routes.route("/user-subscription-success").get(authChecker('both'),enrollmentController.userSubscriptionSuccess);
    routes.route("/order-history").get(authChecker('both'),enrollmentController.orderHistory);
    routes.route("/paymentudt").post(enrollmentController.paymentUDT)
    routes.route("/payment-alipay").post(enrollmentController.paymentAliPay)
    routes.route("/payment-alipay-notify").post(enrollmentController.paymentAliPayNotify)

    //--//
    return routes;
};
//--//
module.exports = routes;
