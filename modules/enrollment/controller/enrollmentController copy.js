const { Sequelize } = require('sequelize');
const { Op ,literal } = require("sequelize");
const crypto = require("crypto");
// const argon2 = require('argon2');
const axios = require('axios');
const ping = require('ping');
const jwt = require("jsonwebtoken");
const fs = require('fs');
const config = require("../../../config/db");
const sequelize = require("../../../sequelize/sequelize");
const models = sequelize.models;
let reqBody = require('../../../utils/data_requests');
let users = require("../../../services/users");
const { sendEmail } = require("../../../helpers/mailer");
const configPaypal = require('./../../../utils/paypal-config.json');
const net = require('net');
const stripe = require('stripe')('sk_test_51MrOuYF0PpMfvATc9tUoZt9OU2zRnQVKAcryJUUMxIYZKu4bkD7UAIBJMPNVI7k9b7uPquLkf2UwjZ1GagpgDfYt00O81YtF5W');
const paypal = require('paypal-rest-sdk');
const appid = "zh1gxbf7";
const secret = "peqwlbh5yboxcusn";
const receive_address = "TRwE8ezMr7h6uR1ryPwfyk2Qqmm49r2ZR8";
const querystring = require('querystring');
const AlipaySdk = require('alipay-sdk').default;
const AlipayFormData = require('alipay-sdk/lib/form').default;
const configAlipay = require('./../../../utils/alipay-config.json');
const alipaySdk = new AlipaySdk({
    appId: configAlipay.appId,
    privateKey: configAlipay.privateKey,
    alipayPublicKey: configAlipay.alipayPublicKey,
    gateway: 'https://openapi.alipay.com/gateway.do',
    timeout: 5000,
    camelcase: true
});

const urlencode = require('urlencode');

const privateKeyPath = './rsa_private_key.pem'; // Update with your private key file path
const publicKeyPath = './rsa_public_key.pem'; // Update with your public key file path
const SignatureTool = require('../../../utils/signatureTool');

/*******************************************************/
const generateAccessToken = function (length) {
    length = parseInt(length) || 40;
    return Math.floor(Math.random() * 999) + "___" + crypto.randomBytes(length).toString('hex');
}
//*******************************************************/
function calculateMinutesBetweenDates(date1, date2) {
    // Parse the input date strings into Date objects
    const parsedDate1 = new Date(date1);
    const parsedDate2 = new Date(date2);
  
    // Calculate the difference in minutes
    const minutesDifference = Math.abs((parsedDate2 - parsedDate1) / (1000 * 60));
  
    return minutesDifference;
  }

  const login = async function (req, res, next) {
    try {
        let verificationCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
        if(!req.body.device_id || req.body.device_id === ""){
            let response = {
                status: 412,
                message: "Device ID required",
                error: null
            };
            return res.status(response.status).json(response);
        }
        let request = await reqBody.loginRequest(req);
        let email = request.email;
        let password = request.password;

        let findQuery = {
            where: {
                email: email
            }
        }
        let instanceUser = new sequelize.db(models.users);
        let [users_data, errorR] = await instanceUser.findAll(findQuery);
        if (!users_data.length <= 0) { 
            req.statusMessage = "Email not found";
            return next(404); 
        }
        if (errorR) return next(errorR)
        for (let i = 0; i < users_data.length; i++) {
            let user = users_data[i];
            let verify = await verifyPassword(password, user.password);
            if (verify) {
                console.log('Password is correct. Login successful!');
            } 
            else {
                console.log('false');
                req.statusMessage = "Invalid Password";
                return next(401); 
            }
        }
        // let password = request.password;
        // if (!email || !password) { return next(412); }
        // if (email === "" || password === "") { return next(412); }
        // let [userData, error] = await users.findUser(email);
        // if (error) { return next(error); }
        // if (!userData) { 
        //     req.statusMessage = "Email not found";
        //     return next(404); 
        // }
        //------validate password---------//
        let verify = await verifyPassword(password, userData.password);
        if (verify) {
            console.log('Password is correct. Login successful!');
        } 
        else {
            req.statusMessage = "Invalid Password";
            return next(401); 
        }
       
        if(userData.user_type === "free"){
            let findQueryAuth = {
                where: {
                    token: {
                        [Op.not]: ''
                    },
                    user_id: userData.id
                }
            }
            let authUserInstance = new sequelize.db(models.auth_keys);
            let [authen, aerror] = await authUserInstance.findAll(findQueryAuth);
            if (aerror) { return next(aerror); }
            if(authen && authen.length >= 2){
                req.statusMessage = "Free user login limited to 3";
                return next(208);
            }
        }
        if (userData) { 
            userData.device_id = req.body.device_id;
            userData.device_type = req.body.device_type;
            userData.device_token = req.body.device_token;
            await userData.save();
            userData.verification_code = verificationCode;
            await userData.save();
            // const result = await sendEmail(
            //     email,
            //     'Hello from VPN',
            //     '<p>Email verification Code:</p> <br> <strong>'+verificationCode+'</strong>',
            //   );
            // console.log('Email sent successfully:', result.response);
            var token = jwt.sign({id: userData.id}, config.secret, {
                expiresIn: 86400 // 24 hours
            });
            let whereAuth = {
                where: { user_id: userData.id }
            }
            let authkeyInstance = new sequelize.db(models.auth_keys);
            let [authkey, a_error] = await authkeyInstance.findOne(whereAuth);
            
            // if(authkey === null){
                var Authkey = new models.auth_keys({});
                Authkey.user_id = userData.id;
                Authkey.token = token;
                await Authkey.save();
            // }
            // else if(authkey !== null){
            //     authkey.token = token;
            //     await authkey.save();
            // }
            let loginData = {
                token: token,
                data: userData
            }
            return next(loginData);
        }
        // return next({
        //     user,
        //     authentication: authentication
        // });
    }
    catch (error) { return next(error); }
};
const createUser = async function (req, res, next) {
    try {
        let verificationCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
        let request = await reqBody.enrollmentRequest(req);
        const username = extractUsernameFromEmail(request.email);
        let userInstance = new sequelize.db(models.users);
        //---email check--//
        let [checkEmail, e_error] = await users.findByEmail(request.email);
        if (e_error) { return next(e_error); }
        if (checkEmail) { 
            req.statusMessage = "Email already exists";
            return next(400); 
        }
        //-----check invitation code--------//
        let invitation_code = request.invitation_code;
        let ReferalInstance = new sequelize.db(models.referral_users);
        if(request.invitation_code && request.invitation_code != null){
            let findInvCode = {
                where: { invitation_code: invitation_code }
            }
            let [checkInviteCode, inv_error] = await userInstance.findOne(findInvCode);
            if(!checkInviteCode){
                req.statusMessage = "Invalid Invite Code";
                return next(403);
            }
        }
        else {
            invitation_code = null;
        }
        //--//
        //-----------//
        const hashedPassword = await hashPassword(request.password);

        let userObject = {
            user_name: username,
            password: hashedPassword,
            email: request.email,
            verification_code:verificationCode,
            invitation_code: invitation_code
        }
        let [user, error] = await userInstance.create(userObject);
        //-- add user --//
        if(request.invitation_code && request.invitation_code != null){
            let findInvCode = {
                where: { invitation_code: invitation_code }
            }
            let [checkInviteCode, inv_error] = await userInstance.findOne(findInvCode);
            if(checkInviteCode){
                let userObject = {
                    user_id: user.id,
                    referral_user_id: checkInviteCode.id,
                    status: "commission_pending"
                }
                let [ref, error] = await ReferalInstance.create(userObject);    
            }
        }
        if (error) { return next(error); }
        // const result = await sendEmail(
        //     request.email,
        //     'Hello from VPN',
        //     '<p>Email verification Code:</p> <br> <strong>'+verificationCode+'</strong>',
        //   );
        //   console.log('Email sent successfully:', result.response);
        return next(user);
    }
    catch (error) { return next(error); }
};
async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        hash.update(password);
        resolve(hash.digest('hex'));
      });
}
async function verifyPassword(enteredPassword, storedHash) {
    try {
        const hashedEnteredPassword = await hashPassword(enteredPassword);
        return hashedEnteredPassword === storedHash;
      } catch (error) {
        throw error;
      }
}
const createGuestUser = async function (req, res, next) {
    try {
        let device_id = req.body.device_id;
        let user_type = 'Guest';
        let userInstance = new sequelize.db(models.users);
        
        let findQuery = {
            where: { device_id: device_id }
        }
        let [userGuest, s_error] = await userInstance.findOne(findQuery);
        //-----------//
        if(!userGuest){
            let userObject = {
                device_id: device_id,
                type: user_type
            }
            let [user, error] = await userInstance.create(userObject);
            if (error) { return next(error); }
            return next(user);
        }
        return next(userGuest);
    }
    catch (error) { return next(error); }
};
const verifyEmail = async(req, res, next) => {
    try{
        const {verify_code, email} = req.body;
        if(!email || email === ""){
            let response = {
                status: 412,
                message: "User ID required",
                error: null
            };
            return res.status(response.status).json(response);
        }
        if(!verify_code || verify_code === ""){
            let response = {
                status: 412,
                message: "Verify Code required",
                error: null
            };
            return res.status(response.status).json(response);
        }
        let findQuery = {
            where: { email: email,verification_code:verify_code }
        }
        let userStatusInstance = new sequelize.db(models.users);
        let [userStatus, s_error] = await userStatusInstance.findOne(findQuery);

        if(!userStatus || !userStatus.id){
            let response = {
                status: 412,
                message: "No user found Or code invalid",
                error: null
            };
            return res.status(response.status).json(response);
        }
        userStatus.email_verified = '1';
        let result = await userStatus.save();
        //---------------//
        if(result && result.id){
            var token = jwt.sign({id: result.id}, config.secret, {
                expiresIn: 86400 // 24 hours
            });
            let whereAuth = {
                where: { user_id: result.id }
            }
            let authkeyInstance = new sequelize.db(models.auth_keys);
            let [authkey, a_error] = await authkeyInstance.findOne(whereAuth);

            if(authkey === null){
                var Authkey = new models.auth_keys({});
                Authkey.user_id = result.id;
                Authkey.token = token;
                await Authkey.save();
            }
            else if(authkey !== null){
                authkey.token = token;
                await authkey.save();
            }
        }
         
        if(result.id){
            res.status(200).json({
                status: 200,
                message: "User verified successfully!",
                data: {authtoken: token, user: userStatus}
            });
        }
        else{
            let response = {
                status: 412,
                message: "Error in verification",
                error: null
            };
            return res.status(response.status).json(response);
        }
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const getServerList = async function (req, res, next) {
    try {
        let serverType = req.query.platform;
        if(!serverType){
            serverType = 'all';
        }
        //-----recommended---//
        let findQueryR = {
            where: {
                platform: serverType,
                IsRecommended: '1'
            }
        }
        let serverInstanceR = new sequelize.db(models.serverDetails);
        let [serversR, Rerror] = await serverInstanceR.findAll(findQueryR);
        //--//
            let findQueryP = {
                where: {
                    platform: serverType,
                    [Sequelize.Op.or]: [
                        { parent_id: null },
                        { parent_id: 0 }
                    ]
                },
                attributes:['name'],
                include: [{
                    model: models.serverDetails,
                    as: 'serverDetails_',
                    required: false
                }],
                
            }
            let serverInstanceP = new sequelize.db(models.serverDetails);
            let [serversP, errorP] = await serverInstanceP.findAll(findQueryP);
            let data = {
                recommended_servers: serversR,
                // parent_servers: servers,
                parent_with_child: serversP

            }
            return next(data); 
    }
    catch (error) { return next(error); }
};
const getV2rayServersDetails = async function (req, res, next) {
    try {
            let purchased_versions =  req.user_purchased_versions;
            let idsArray = purchased_versions ? purchased_versions.split(',').map(id => Number(id)) : [];

            // let findQueryP = { where: {} }
            // let serverInstanceP = new sequelize.db(models.v2rayServersDetails);
            // let [serversP, errorP] = await serverInstanceP.findAll(findQueryP);
            // if(errorP){
            //     return next(errorP);
            // }
            // return next(serversP); 
                // let serverType = req.query.platform;
                // if(!serverType){
                //     serverType = 'all';
                // }
                //-----recommended---//
                let findQueryR = {
                    where: Sequelize.literal(`FIND_IN_SET(server_version, '${purchased_versions}')`),
                    is_recommended: '1',
                    // where: {
                    //     server_version: {
                    //         // [Sequelize.Op.in]: purchased_versions.split(',').map(id => Number(id)),
                    //         // [Sequelize.Op.in]: idsArray,
                    //     },
                    //     // platform: serverType,
                    //     is_recommended: '1'
                    // },
                    logging:true
                }
                let serverInstanceR = new sequelize.db(models.v2rayServersDetails);
                let [serversR, Rerror] = await serverInstanceR.findAll(findQueryR);
                //--//
                    let findQueryP = {
                        where: {
                            // platform: serverType,
                            [Sequelize.Op.or]: [
                                { parent_id: null },
                                { parent_id: 0 }
                            ]
                        },
                        attributes:['server_name'],
                        include: [{
                            model: models.v2rayServersDetails,
                            as: 'v2rayServersDetails_',
                            required: false
                        }],
                        
                    }
                    let serverInstanceP = new sequelize.db(models.v2rayServersDetails);
                    let [serversP, errorP] = await serverInstanceP.findAll(findQueryP);
                    let data = {
                        recommended_servers: serversR,
                        // parent_servers: servers,
                        parent_with_child: serversP
                    }
                    return next(data); 
    }
    catch (error) { return next(error); }
};
const getvMessServersDetails = async function (req, res, next) {
    try {
            let findQueryP = { where: {} }
            let serverInstanceP = new sequelize.db(models.vMessServers);
            let [serversP, errorP] = await serverInstanceP.findAll(findQueryP);
            if(errorP){
                return next(errorP);
            }
            if(serversP.length > 0){
                return next(serversP); 
            } else {
                return next(404);
            }
    }
    catch (error) { return next(error); }
};
const createReferalCode = async function (req, res, next) {
    try {
        let ReferalInstance = new sequelize.db(models.referral_invitations);
        let referalCode = Math.floor(Math.random() * (9999999 - 1000000) + 1000000);
        let user_id = req.user_id;
        //-----------//
        let userObject = {
            inviter_user_id: user_id,
            referal_code: referalCode,
            invitation_date: new Date()
        }
        let [ref, error] = await ReferalInstance.create(userObject);
        if (error) { return next(error); }
        return next(ref);
    }
    catch (error) { return next(error); }
};
const verifyReferalCode = async(req, res, next) => {
    try{
        const {validate_code, device_id} = req.body;
        console.log("code",validate_code);
        if(!validate_code || validate_code === ""){
            let response = {
                status: 412,
                message: "Referal Code required",
                error: null
            };
            return res.status(response.status).json(response);
        }
        let findQuery = {
            where: { referal_code: validate_code }
        }
        let invitationInstance = new sequelize.db(models.referral_invitations);
        let [referal, s_error] = await invitationInstance.findOne(findQuery);
        if(!referal || !referal.id){
            let response = {
                status: 412,
                message: "No user found Or code invalid",
                error: null
            };
            return res.status(response.status).json(response);
        }
        referal.invited_device_id = device_id;
        referal.invitation_status = 'accepted';
        let result = await referal.save();
        //---------------//
        const currentDate = new Date().toISOString().split('T')[0];
        console.log(currentDate); // Example output: "2023-09-11"
        
        if(result.id){
            let refObject = {
                user_id: req.user_id,
                recharge_duration: 30,
                recharge_date:currentDate,
                recharge_type: 'by_invitation'
            }
            let rechargeHistoryInstance = new sequelize.db(models.recharge_history);
            let [ref, error] = await rechargeHistoryInstance.create(refObject);
            let user_id = referal.inviter_user_id;
            let whereauthkey = {
                where: {id: user_id}
            };
            let userInstance = new sequelize.db(models.users);
            let [userData, user_err] = await userInstance.findOne(whereauthkey);
            if (userData) {
                let usageTime = userData.free_usage_time;
                userData.free_usage_time = parseInt(usageTime)+parseInt(30);
                await userData.save();
            }
            res.status(200).json({
                status: 200,
                message: "Code validated successfully!",
                data: result
            });
        }
        else{
            let response = {
                status: 412,
                message: "Error in validation",
                error: null
            };
            return res.status(response.status).json(response);
        }
    }
    catch(error){
        console.log(error);
        return next(error)
    }
}; 

const logout = async (req, res, next) => {
    try {
        let token = req.headers.authentication;
        console.log("token===========>",token);
        let whereauthkey = {
            where: {user_id: req.user_id,token:token}
        };
        let authInstance = new sequelize.db(models.auth_keys);
        let [auth_keyData, user_err] = await authInstance.findOne(whereauthkey);
        if (auth_keyData) {
            console.log("auth_keyData.auth_key", auth_keyData.auth_key);
            auth_keyData.token = '';
            try {
                // await auth_keyData.destroy();
                await auth_keyData.save();
                console.log("Column nullified successfully.");
              } catch (error) {
                console.error("Error saving record:", error);
              }
            res.status(200).json({
                status: 200,
                message: "Logged out successfully",
                data: null
            });
        }
        else {
            return next(404);
        }
    } catch (error) {
        console.log(error);
        sendResponse.error(error, next, res);
    }
};
const usageTime = async (req, res, next) => {
    try {
        let usage_time = req.body.usage_time;
        let device_id = req.body.device_id;
        let whereauthkey = {
            where: {id: req.user_id}
        };
        let userInstance = new sequelize.db(models.users);
        let [userData, user_err] = await userInstance.findOne(whereauthkey);
        if (userData) {
            let usageTime = userData.free_usage_time;
            let lastUsageTime = ((parseInt(usageTime))-(parseInt(usage_time)));
            if (lastUsageTime <= 0) {
              lastUsageTime = 0;
            }
            userData.free_usage_time = lastUsageTime;
            try {
                await userData.save();
                console.log("updated successfully.");
              } catch (error) {
                console.error("Error saving record:", error);
              }
            res.status(200).json({
                status: 200,
                message: "Time Updated successfully",
                data: userData
            });
        } else if(device_id){
            let whereauthkeyD = {
            where: {device_id: device_id}
            };
            let userInstanceD = new sequelize.db(models.users);
            let [userDataD, user_errD] = await userInstanceD.findOne(whereauthkeyD);
            if(userDataD){
                 let usageTimeD = userDataD.free_usage_time;
            let lastUsageTimeD = ((parseInt(usageTimeD))-(parseInt(usage_time)));
            if (lastUsageTimeD <= 0) {
              lastUsageTimeD = 0;
            }
            userDataD.free_usage_time = lastUsageTimeD;
            try {
                await userDataD.save();
                console.log("updated successfully.");
              } catch (error) {
                console.error("Error saving record:", error);
              }
            res.status(200).json({
                    status: 200,
                    message: "Time Updated successfully",
                    data: userDataD
                });
            } else {
                return next(404);
            }
        }
        else {
            return next(404);
        }
    } catch (error) {
        console.log(error);
        sendResponse.error(error, next, res);
    }
};
const checkServerHealth = async(req, res, next) => {
    try{
        const serverIP = req.body.serverIP;
        try {
            const response = await ping.promise.probe(serverIP);
            console.log("response.alive",response.alive);
            if (response.alive) {
                console.log(`${serverIP}: Server is up - Response Time: ${response.time} ms`);
                res.status(200).json({
                status: 200,
                message: "Server is up",
                data: {
                    ip: serverIP,
                    response_time: response.time,
                    ip_status: "Normal"
                }
            });
            } else {
              console.log(`${serverIP}: Server is down - Response Time: ${response.time} ms`);
              res.status(400).json({
                status: 400,
                message: "Server is down",
                data: {
                    ip: serverIP,
                    response_time: 0,
                    ip_status: "Under Maintenance"
                }
            });
            }
          } catch (error) {
            console.error(`Error occurred: ${error.message}`);
        }
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const userDetails = async(req, res, next) => {
    try{
    let user_id = req.user_id;
    let ress = await sequelize.connection.query(`
        SELECT users.id,
        users.type,
        users.user_name,
        users.email,
        users.device_id,
        users.device_type,
        users.device_token,
        users.email_verified,
        users.balance,
        users.user_type,
        users.user_purchased_versions,
        users.start_trial_period,
        users.free_usage_time,
        users.subscription_start_date,
        users.subscription_end_date,
        users.referrer_id,
        users.vpn_connected,
        users.login_limit,
        users.transaction_id,
        users.user_status,
        users.recipient_id,
        users.role, 
        GROUP_CONCAT(versions.name) AS version_name
        FROM users
        LEFT JOIN versions ON FIND_IN_SET(versions.id, users.user_purchased_versions)
        WHERE users.id = `+user_id+`
    `);
    let results = ress[0];
    let v_name = results.name;
    results.version_name = v_name;
    return next(results);
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};

const checkSubscription = async(req, res, next) => {
    try{
        let receipt = req.body.receipt;
        let user_id = req.user_id;
        let findQuery = {
            where: { id: user_id }
        }
        let userInstance = new sequelize.db(models.users);
        let [user, s_error] = await userInstance.findOne(findQuery);
        user.recipient_id = receipt;
        await user.save();
        //--//
        const appleReceiptVerify = require('node-apple-receipt-verify');
        appleReceiptVerify.config({
            secret: "cc72df505e7f4a0da996de81b7802e82",
            environment: ['production']
        });
        appleReceiptVerify.validate({
          receipt: receipt,
          ignoreExpired: false
        }, (err, products) => {
          if (err) {
            console.error(err);
          return next(err);
          }
        //   console.log("sdf",products);
          return next(products);
        });
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const userTransactionID = async (req, res, next) => {
    try {
        let transaction_id = req.body.transaction_id;
        let whereauthkey = {
            where: {id: req.user_id}
        };
        let userInstance = new sequelize.db(models.users);
        let [userData, user_err] = await userInstance.findOne(whereauthkey);
        if (userData) {
            userData.transaction_id = transaction_id;
            try {
                await userData.save();
                console.log("updated successfully.");
              } catch (error) {
                console.error("Error saving record:", error);
              }
            res.status(200).json({
                status: 200,
                message: "Transaction ID added successfully",
                data: null
            });
        }
        else {
            return next(404);
        }
    } catch (error) {
        console.log(error);
        sendResponse.error(error, next, res);
    }
};
const defaultData = async(req, res, next) => {
try{
    let user_id = req.user_id;
    let type = req.query.type;
    let findQuery = {
        where: {type: type}
    };
    let pageInstance = new sequelize.db(models.default_data);
    let [defaultData, user_err] = await pageInstance.findOne(findQuery);
    return next(defaultData);
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const defaultAppData = async(req, res, next) => {
try{
    let user_id = req.user_id;
    let type = req.query.type;
    let findQuery = {
        where: {type: type}
    };
    let pageInstance = new sequelize.db(models.defaults);
    let [defaultData, user_err] = await pageInstance.findOne(findQuery);
    return next(defaultData);
    }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const stripePayment = async function (req, res, next) {
    try {
        let package_id = req.body.package_id;
        let user_id = req.user_id;
        
        const customer = await stripe.customers.create({
            email: req.body.email,
            source: req.body.stripeToken,
            name: req.body.name
        });

        const charge = await stripe.charges.create({
            amount: (req.body.amount) * 100, // Charging Rs
            description: 'Thank you for your payment',
            currency: 'USD',
            customer: customer.id
        });

        // Check if the charge is successful
        if (charge.status === 'succeeded') {
            
            const packageInstance = new sequelize.db(models.packages);
            const findQueryPackage = {
                where: { id: package_id }
            };
            const [packageData,perror] = await packageInstance.findOne(findQueryPackage);

            if (packageData) {
                const months = packageData.months;
                const minutes = monthsToMinutes(months);

                const userInstance = new sequelize.db(models.users);
                const findQuery = {
                    where: { id: user_id }
                };

                const [userData,error] = await userInstance.findOne(findQuery);

                if (userData) {
                    const freeUsageTime = userData.free_usage_time;
                    userData.free_usage_time = freeUsageTime + minutes;
                    await userData.save();
                }

                // -----------add sub package-----------//
                const currentDate = new Date();
                const numberOfMonthsToAdd = months;
                // Calculate the end date
                const endDateToAdd = addMonthsToDate(currentDate, numberOfMonthsToAdd);
                // ---//
                const subInstance = new sequelize.db(models.user_subscription);

                // -----------//
                const subObject = {
                    user_id: user_id,
                    package_id: package_id,
                    payment_method: 'stripe',
                    start_date: new Date(),
                    end_date: endDateToAdd,
                };

                const sub = await subInstance.create(subObject);
            }
        } else {
            // Handle unsuccessful charge here
            // You can return an error response or perform other actions
        }

        return next(charge);
        // res.send("Success")  // If no error occurs
    } catch (error) {
        return next(error);
    }
};

const fetchPackages = async function (req, res, next) {
    try {
        let user_type = req.query.user_type;
        if(!user_type){
            user_type = '1';
        }
        let findQuery = {
            where: {
                user_type_versions: user_type
            },
            include: [{
                attributes:['name'],
                model: models.versions,
                as: 'versions',
                required: false
            }],
        }
        let packageInstance = new sequelize.db(models.packages);
        let [packages, error] = await packageInstance.findAll(findQuery);
        if (error) { return next(error); }
        if(packages && packages.length > 0){
            return next(packages); 
        }
        else { return next(404); }

    }
    catch (error) { return next(error); }
};
const remainingFreeTrial = async (req, res, next) => {
    try {
        // let usage_time = req.body.usage_time;
        let device_id = req.body.device_id;
        let device_type = req.body.device_type;
        let whereauthkey = {
            where: {id: req.user_id}
        };
        let userInstance = new sequelize.db(models.users);
        let [userData, user_err] = await userInstance.findOne(whereauthkey);
        if(device_type == "mac" || device_type == "ios"){
            if(userData){
                if(userData.recipient_id && userData.recipient_id != ""){
                    let receipt = userData.recipient_id;
                    const appleReceiptVerify = require('node-apple-receipt-verify');
                    appleReceiptVerify.config({
                        secret: "2ee1aed8b57748e9b4888d5a779f9903",
                        environment: ['sandbox']
                    });
                    appleReceiptVerify.validate({
                      receipt: receipt,
                      ignoreExpired: false
                    }, (err, products) => {
                      if (err) {
                        console.error(err);
                        return next(err);
                      }
                      let latestSubscription = products[0];
                      console.log("laest",latestSubscription);
                      let purchaseDate = latestSubscription.purchaseDate;
                      let expirationDate = latestSubscription.expirationDate;
                      const timeDifferrence = timeDifferenceInMinutes(purchaseDate,expirationDate);
                      console.log("timeDifferrence",timeDifferrence);
                        res.status(200).json({
                        status: 200,
                        message: "Time Updated successfully",
                        data: {
                            latestSubscription: latestSubscription,
                            timeDifferrence: timeDifferrence
                        }
                        });
                    });
                }
                else {
                let usageTime = userData.free_usage_time;
                let start_time = userData.start_trial_period;
                var currentDate = new Date();
                var date1 = new Date(start_time);
                var date2 = new Date(currentDate);
                // Calculate the time difference in milliseconds
                var timeDifferenceMs = date2 - date1;
                // Convert milliseconds to minutes
                var minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));
                console.log('Difference in minutes:', minutesDifference);
                let lastUsageTime = ((parseInt(usageTime))-(parseInt(minutesDifference)));
                if (lastUsageTime <= 0) {
                  lastUsageTime = 0;
                  userData.free_usage_time = lastUsageTime;
                }
                try {
                    await userData.save();
                    console.log("updated successfully.");
                  } catch (error) {
                    console.error("Error saving record:", error);
                  }
                res.status(200).json({
                    status: 200,
                    message: "Time Updated successfully",
                    data: userData
                });
                }
            }  
            else if(device_id){
                let whereauthkeyD = {
                where: {device_id: device_id}
                };
                let userInstanceD = new sequelize.db(models.users);
                let [userDataD, user_errD] = await userInstanceD.findOne(whereauthkeyD);
                if(userDataD){
                let usageTimeD = userDataD.free_usage_time;
                let start_time = userDataD.start_trial_period;
                var currentDate = new Date();
                var date1 = new Date(start_time);
                var date2 = new Date(currentDate);
                // Calculate the time difference in milliseconds
                var timeDifferenceMs = date2 - date1;
                // Convert milliseconds to minutes
                var minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));
                console.log("usageTimeD",usageTimeD);
                console.log('Difference in minutes:', minutesDifference);
                
                
                let lastUsageTimeD = ((parseInt(usageTimeD))-(parseInt(minutesDifference)));
                console.log("lastUsageTimeD",lastUsageTimeD);
                if (lastUsageTimeD <= 0) {
                  lastUsageTimeD = 0;
                userDataD.free_usage_time = lastUsageTimeD;
                }
                try {
                    await userDataD.save();
                    console.log("updated successfully.");
                  } catch (error) {
                    console.error("Error saving record:", error);
                  }
                res.status(200).json({
                        status: 200,
                        message: "Time Updated successfully",
                        data: userDataD
                    });
                } else {
                    return next(404);
                }
            }
        } else {
            if (userData) {
                let usageTime = userData.free_usage_time;
                let start_time = userData.start_trial_period;
                var currentDate = new Date();
                var date1 = new Date(start_time);
                var date2 = new Date(currentDate);
                // Calculate the time difference in milliseconds
                var timeDifferenceMs = date2 - date1;
                // Convert milliseconds to minutes
                var minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));
                console.log('Difference in minutes:', minutesDifference);
                let lastUsageTime = ((parseInt(usageTime))-(parseInt(minutesDifference)));
                if (lastUsageTime <= 0) {
                  lastUsageTime = 0;
                  userData.free_usage_time = lastUsageTime;
                }
                try {
                    await userData.save();
                    console.log("updated successfully.");
                  } catch (error) {
                    console.error("Error saving record:", error);
                  }
                res.status(200).json({
                    status: 200,
                    message: "Time Updated successfully",
                    data: userData
                });
            } else if(device_id){
                let whereauthkeyD = {
                where: {device_id: device_id}
                };
                let userInstanceD = new sequelize.db(models.users);
                let [userDataD, user_errD] = await userInstanceD.findOne(whereauthkeyD);
                if(userDataD){
                let usageTimeD = userDataD.free_usage_time;
                let start_time = userDataD.start_trial_period;
                var currentDate = new Date();
                var date1 = new Date(start_time);
                var date2 = new Date(currentDate);
                // Calculate the time difference in milliseconds
                var timeDifferenceMs = date2 - date1;
                // Convert milliseconds to minutes
                var minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));
                console.log("usageTimeD",usageTimeD);
                console.log('Difference in minutes:', minutesDifference);
                
                
                let lastUsageTimeD = ((parseInt(usageTimeD))-(parseInt(minutesDifference)));
                console.log("lastUsageTimeD",lastUsageTimeD);
                if (lastUsageTimeD <= 0) {
                  lastUsageTimeD = 0;
                userDataD.free_usage_time = lastUsageTimeD;
                }
                try {
                    await userDataD.save();
                    console.log("updated successfully.");
                  } catch (error) {
                    console.error("Error saving record:", error);
                  }
                res.status(200).json({
                        status: 200,
                        message: "Time Updated successfully",
                        data: userDataD
                    });
                } else {
                    return next(404);
                }
            }
            else {
                return next(404);
            }
        }
    } catch (error) {
        console.log(error);
        sendResponse.error(error, next, res);
    }
};

const usdTPayment = async function(req, res, next) {
    try {
        let package_id = req.body.package_id;
        let user_id = req.user_id;
        let pay_amount = req.body.pay_amount;
        let chain_type = req.body.chain_type;
        const timestamp = new Date().getTime();
        const randomInRange = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        // Combine the timestamp and the random number with an underscore
        const df_sn = `${timestamp}_${randomInRange}`;

        let data = {
        'appid': 'zh1gxbf7',
        'chain_type': chain_type,
        'channel_type': '2',
        'money_type': '1',
        'notify_url': `https://testguider.com/successUsdT.php/${user_id}/${package_id}`,
        'order_sn': df_sn,
        'pay_money': pay_amount
    };

        const appsecret = 'peqwlbh5yboxcusn';
        const signature = sign(data, appsecret);
        data.signature = signature;

        const formData = Object.keys(data)
            .map(key => `${key}=${data[key]}`)
            .join('&');
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        console.log(formData);
        const response = await axios.post('https://web.upay.ink/api/pay/unifiedorder', formData, config);
        console.log("response",response.data);
        return next(response.data);
    } catch (error) {
        console.error('Error processing USDT payment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
const paypalPayment = async function (req, res, next) {
    try {
        let user_id = req.user_id;
        let package_id = req.body.package_id;
        paypal.configure(configPaypal);
        let amount = req.body.amount;

        const createPayment = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal',
            },
            redirect_urls: {
                return_url: 'http://testguider.com/success.php?user_id='+user_id+'&package_id='+package_id,
                cancel_url: 'http://testguider.com/cancel.php',
            },
            transactions: [
                {
                    amount: {
                        total: amount,
                        currency: 'USD',
                    },
                    description: 'Thank you for your payment',
                },
            ],
        };

        // Create a PayPal payment using async/await
        const createPaymentResponse = await new Promise((resolve, reject) => {
            paypal.payment.create(createPayment, (error, payment) => {
                if (error) {
                    console.error('Payment creation failed:', error);
                    reject(error);
                } else {
                    console.log('Payment created:', payment);
                    resolve(payment);
                }
            });
        });

        // Handle the rest of your logic
        // let package_id = req.body.package_id;
        // let user_id = req.user_id;

        // if (createPaymentResponse) {
        //     // --------add usage time-------//
        //     const packageInstance = new sequelize.db(models.packages);
        //     const findQueryPackage = {
        //         where: { id: package_id },
        //     };
        //     const [packageData,p_error] = await packageInstance.findOne(findQueryPackage);

        //     if (packageData) {
        //         const months = packageData.months;
        //         const minutes = monthsToMinutes(months);

        //         const userInstance = new sequelize.db(models.users);
        //         const findQuery = {
        //             where: { id: user_id },
        //         };

        //         const [userData,uerror] = await userInstance.findOne(findQuery);

        //         if (userData) {
        //             const freeUsageTime = userData.free_usage_time;
        //             userData.free_usage_time = freeUsageTime + minutes;
        //             await userData.save();
        //         }

        //         // -----------add sub package-----------//
        //         const currentDate = new Date();
        //         const numberOfMonthsToAdd = months;

        //         // Calculate the end date
        //         const endDateToAdd = addMonthsToDate(currentDate, numberOfMonthsToAdd);

        //         // ---//
        //         const subInstance = new sequelize.db(models.user_subscription);

        //         // -----------//
        //         const subObject = {
        //             user_id: user_id,
        //             package_id: package_id,
        //             payment_method: 'paypal',
        //             start_date: new Date(),
        //             end_date: endDateToAdd,
        //         };

        //         const sub = await subInstance.create(subObject);
        //     }
        // }

        // Continue with your processing logic

        return next(createPaymentResponse);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const aliPayPayment = async function (req, res, next) {
    try {
        let user_id = req.user_id;
        let package_id = req.body.package_id;
        let package_name = req.body.package_name;
        let amount = req.body.amount;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'alipay'],
            line_items: [{
              price_data: {
                currency: 'cny',
                product_data: {
                  name: package_name,
                },
                unit_amount: amount*100,
              },
              quantity: 1,
            }],
            mode: 'payment',
            success_url: 'http://testguider.com/success.php?user_id='+user_id+'&package_id='+package_id,
            cancel_url: 'http://testguider.com/cancel.php?type=Alipay',
          });          
        return next(session);
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
function monthsToMinutes(months) {
  const daysInMonth = 30.44; // Average number of days in a month
  const minutesInDay = 1440; // Minutes in a day (24 hours * 60 minutes)
  
  const minutes = months * daysInMonth * minutesInDay;
  
  return minutes;
}
function addMonthsToDate(startDate, monthsToAdd) {
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + monthsToAdd);
  return endDate;
}

const adsDetails = async function (req, res, next) {
    try {
        let user_id = req.user_id;
        let type = req.query.device_type;
        let findQuery = {
            where: {device_type: type}
        };
        let instance = new sequelize.db(models.adsDetails);
        let [ad, err] = await instance.findOne(findQuery);
        if(ad && ad.id){
            return next(ad);
        }
        else {
            return next(404);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const forgotPassword = async function (req, res, next) {
    try {
        let email = req.body.email;
        let findQuery = {
            where: {email:email}
        };
        let instance = new sequelize.db(models.users);
        let [user, err] = await instance.findOne(findQuery);
        if(!user){
            req.statusMessage = "Email not found";
            return next(404); 
        }
        else {
            let forgotcode = Math.floor(Math.random() * (9999 - 1000) + 1000);
            user.password_reset_code = forgotcode;
            await user.save();
            const result = await sendEmail(
                email,
                'Hello from VPN',
                '<p>Your account reset password code is :</p> <br> <strong>'+forgotcode+'</strong>',
              );
            req.statusMessage = "Password reset code send successfully";
            return next(200); 
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const resetPassword = async function (req, res, next) {
    try {
        let code = req.body.code;
        let password = req.body.password;
        let findQuery = {
            where: {password_reset_code:code}
        };
        console.log("findQuery",findQuery);
        let instance = new sequelize.db(models.users);
        let [user, err] = await instance.findOne(findQuery);
        console.log("instan",user);
        if(!user){
            req.statusMessage = "Invalid code";
            return next(400); 
        }
        else if(user){
            var token = jwt.sign({ id: user.id }, config.secret, {
                expiresIn: 86400 // 24 hours
            });
            //-----------//
            const hashedPassword = await hashPassword(password);
            user.password = hashedPassword;
            await user.save();
            req.statusMessage = "Password reset successfully";
            return next(200); 
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
const referralList = async (req, res, next) => {
    try {
        let user_id = req.user_id;
        let ress = await sequelize.connection.query(`
        SELECT users.id,
        users.type,
        users.user_name,
        users.email,
        users.device_id,
        users.device_type,
        users.device_token,
        users.email_verified,
        users.balance,
        users.user_type,
        users.user_purchased_versions,
        users.start_trial_period,
        users.free_usage_time,
        users.subscription_start_date,
        users.subscription_end_date,
        users.referrer_id,
        users.vpn_connected,
        users.login_limit,
        users.transaction_id,
        users.user_status,
        users.recipient_id,
        users.role
        FROM users
        LEFT JOIN referral_users ON (referral_users.referral_user_id = users.id)
        WHERE users.id = `+user_id+`
        `);
        let results = ress[0];
        return next(results);
    }
    catch (error) { return next(error); }
}
const discountCodes = async function (req, res, next) {
    try {
       
        let findQueryR = {
            where: {
                status: '1'
            }
        }
        let InstanceR = new sequelize.db(models.discount_codes);
        let [discountCodes, Rerror] = await InstanceR.findAll(findQueryR);
        return next(discountCodes); 
    }
    catch (error) { return next(error); }
};
const addiOSFile = async function (req, res, next) {
    try {
        const { server_name } = req.body;
        let serverDetails = new sequelize.db(models.v2rayServersDetails);
        let user_id = req.user_id;
        //-----------//
        let userObject = {
            server_name: server_name,
            file: req.files[0].filename,
            platform: "iOS"
        }
        let [server, error] = await serverDetails.create(userObject);
        if (error) { return next(error); }
        return next(server);
    }
    catch (error) { return next(error); }
};
const userSubscriptionSuccess = async function (req, res, next) {
        try {
            const {package_id, device_type, subascription_id} = req.body;
            let user_id = req.user_id;
            const packageInstance = new sequelize.db(models.packages);
            const findQueryPackage = {
                where: { id: package_id }
            };
            const [packageData,perror] = await packageInstance.findOne(findQueryPackage);

            if (packageData) {
                const months = packageData.months;
                const minutes = monthsToMinutes(months);
                const userInstance = new sequelize.db(models.users);
                const findQuery = {
                    where: { id: user_id }
                };

                const [userData,error] = await userInstance.findOne(findQuery);

                if (userData) {
                    const freeUsageTime = userData.free_usage_time;
                    userData.free_usage_time = freeUsageTime + minutes;
                    await userData.save();
                }
                // -----------add sub package-----------//
                const currentDate = new Date();
                const numberOfMonthsToAdd = months;
                // Calculate the end date
                const endDateToAdd = addMonthsToDate(currentDate, numberOfMonthsToAdd);
                // ---//
                const subInstance = new sequelize.db(models.user_subscription);
                // -----------//
                const subObject = {
                    user_id: user_id,
                    package_id: package_id,
                    subascription_id: subascription_id,
                    device_type: device_type,
                    start_date: new Date(),
                    end_date: endDateToAdd,
                };

                const sub = await subInstance.create(subObject);
                return next(sub);
            }
            return next(404);
            // res.send("Success")  // If no error occurs
        } catch (error) {
            return next(error);
        }
};
const orderHistory = async function (req, res, next) {
    try {
        let user_id = req.user_id;
        let findQuery = {
            where: {
                user_ud: user_id
            },
            include: [{
                model: models.packages,
                as: 'packages',
                required: false
            }],
        }
        let subInstance = new sequelize.db(models.user_subscription);
        let [subscriptoins, error] = await subInstance.findAll(findQuery);
        if (error) { return next(error); }
        if(subscriptoins && subscriptoins.length > 0){
            return next(subscriptoins); 
        }
        else { return next(404); }

    }
    catch (error) { return next(error); }
};

const paymentUDT = async function (req, res, next) {
    try {

        const appsecret = 'mSoyxFRzeG9aXMrf0QiQcBTOk1bKCk9C7cy8DkBBEdeEUd8kZFzWHcX9jQPWnipcW64mJLTGlUtesURYe55jU58AY4zC9tMgC2H5mUU01CRoAo8Vo676qdA0hDV1gKKz'; // Replace with your actual API payment key
        // const requestData = {};
        const apiUrl = 'https://api.cryptomus.com/v1/payment';



        let data = {
            "amount": "15",
            "currency": "USD",
            "order_id": "1",
        }
        // let data = { /* Your data object here */ };
        data = JSON.stringify(data);
        const sign = crypto.createHash('md5')
                         .update(Buffer.from(data).toString('base64') + appsecret)
                         .digest('hex');
        console.log("sign",sign)
            // const appsecret = 'peqwlbh5yboxcusn';
            const signature = signT(data, appsecret);
            // data.signature = signature;
    
            // const formData = Object.keys(data)
            //     .map(key => `${key}=${data[key]}`)
            //     .join('&');
            // const config = {
            //     headers: {
            //         'merchant': '05fa0cb1-d40a-4081-bf8d-37b084636f33',
            //         'sign': signature,
            //         'Content-Type': 'application/json',
            //     },
            // };
            // console.log(formData);
            // const response = await axios.post('https://api.cryptomus.com/v1/payment', formData, config);
            // console.log("response",response.data);
            // return next(response.data);





// // Example request data and API key
// const requestData = {
//   amount: 15,
//   currency: "USD",
//   order_id: 1
// };

// // Generate the signature
// const signature = generateSignatureT(requestData, apiKey);
// console.log("signa",signature);
// // Set up request headers
// console.log("sig",signature);
const headers = {
  'merchant': '05fa0cb1-d40a-4081-bf8d-37b084636f33',
  'sign': sign,
  'Content-Type': 'application/json'
};

// Make the POST request
axios.post(apiUrl, data, { headers })
  .then(response => {
    console.log('Response:', response);
    return next(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
    return next(error);
  });
    }
    catch (error) { return next(error); }
};

const paymentAliPay = async function (req, res, next) {
    try {

        const privateKey = "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCxh32m3yHl9vz7yFT6M3f2Vpm2jKeXKGn72JuFFdNOGXIcVSbzHy6mKTM8hKRupPVUCPt3ULsqsnkDQo9SSw5T2w5+q9mKDeQMjCIPazMck9GB/Cop/IRMKPMyJPBenAg6Hc1cViLxVy2CikpnuvDLvqNL8At3vejcTPw8fOwNuA5WGkLVcXifZHPYGCfIJVArzZKPKRSBiMe1grRjfutNLRBfNIysVxH14g9JRpXz/jMKoIVEU6D/VLLUkCv5W3Yvsyiucx3M5KdbhlqVBSAWjO/Kk8xttImUmXVSIjMG1YrnAuFGZdwCTQlrLPDTHj1jQZiu+ASxcpqlRsF/qoIxAgMBAAECggEAKybd+gPev4EruR/W2AJOtIgUUPUbf3iJWngqRU0q0Z8Jx61DDHGV6zm0hI9RULu0DjsotLXg6N384Df7kmtADk3+1fd7pzz9I7ekR88s21Nq54ed0BrbJZAGnTexXa3bqhS4aCtfzv37x/FJaLFd+ohaNQkiIHb+9R2ZajKLRkIATKLzjJteyAduEeQbytYe0xxlT1i9f9eRN7353HGMdJi5kh8cNmBNBOY/ZTiZVpD4JspllJb2TCOOJqvht1uxOpBddws/Jp8eAFiEqF9PH1OguZIL8+e+tVb4YZ+FYY8C03kOyVe6BSgX5JmAcT7ijX2nmtPp0EzeE+gG3nnvYQKBgQD0h4UtwJNoxo75rAOlgUBDxt5w6J5Nnl4JzyJpk5P4Q304+CkbWMjRIi/Ik14ej84b7P0hLHyAqZ5yxYyDRonD777DhCZaGbVbJ/EdVm81wCKiTaXymIXoXxJ3NgP/SSz2cjxvOUEjo6dHGr4m5TbluTspVkWAnMBxifGpuLyN7QKBgQC522LoacSmBIJ02QahFagdgWQd1Hhg/gT1pJCrlLEtoLqS3XjP0/s4OeIYwg6sLf5r6BVKlvraN+uAqFtM2lRWpRuS+aCl+NRD8zJsQHuBAKbrR3eETq20L8+7NzbOQW3Bo1lKtG1WCZHIaObI/DeRk1SdjpKfRLP8jCTvC/yc1QKBgBCxd7wJ24ZZl8UfoxgXXMXDu8fFeZke6JiO1XCTrJRUNyY+er/tLbhpNw3gUZqQgqeRZC5xlQZLjg+TwOXtWNZRdZpvWRbpjmHsth8kmW738OVXm66WDv4wD1ioDVnOKw2f+tQ0+mducqr9/mE1YKwKGynVQ+VlzhVyL1dAz055AoGAHdEWcxbU15WNoFVY/OrOh71EZIy7q0PVY9s84mn+asWIaRti0GS/vut6XGJ1nCXc1U7sa4UBRZUHESLxUskMEsJ2RAQMQ9RBqY0Qn9FQfwetv709bVp5/5hUCUL4ZeqVQyWDo7qCd/UdEDvUGpZsC8zJHGXNHAQXpAKPwlH3+ukCgYB6g0C7fiv+T/aODL5s0gC7JfSR2qS65Zb+3zNEHqJJx6yRB3i98STvrEfhbprLplq0M2vX7eD4fi1JxsviIL8LINjSusFvtADtG8BD/mus63Av9rjo93+TTNOg7oRwtzT153CrJ1F6fsoIAx2oDB1OXigjLgJXu0MuK+Z3Yv9MZQ==";
        const publicKeyAli = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhDPNcKey50wf3uidtV+e8l8G6e20rweCrvjPwJVZRgSCyb1/Zh1vGAe+xAyh9eWJD453u2+GbLLNkgZMtkt1Xz1rwY+Zx1PpeOzNa7Pzm+AdkiQ6lm4po0wS7IjaQQ5P4ooCQquEmvC+teMdJ8cVb3eLbzKrZ7ghQm4sZWT/3IbPvSLWlL+31wDrKrmyDl9UngyKkji3X5dT92a2a31hJCEXCjCBQ+A1wh0oN9W+b70pyqJQ8gDxPU9O1UfXuova62wyirqOXCpztYU15yjMlvTncWXekX5F/PD7Pk2qXL3il93ClQLnL5N78fmxQKczObLyrHlFtUxGHZfMtGpj/QIDAQAB";
        
        // const contentAli = "We are such stuff as dreams are made on, and our little life is rounded with a sleep";
        
        // const signatureAli = signContentNew(contentAli, base64KeyToPEMNew(privateKey, "PRIVATE"), "utf8");
        
        // console.log("Signature:", signatureAli);
        // console.log("Verify signature:", verifySignatureNew(contentAli, base64KeyToPEMNew(publicKeyAli, "PUBLIC"), signatureAli, "utf8"));
        

        const httpMethod = 'POST';
        const httpUri = '/ams/api/v1/payments/pay';
        const clientId = 'SANDBOX_5Y945A2Z9PTR03433';
        const requestTime = '2019-05-28T12:12:12+08:00';
        const requestBody = {
            "order": {
                "orderId": "OrderID_0101010101",
                "orderDescription": "sample_order",
                "orderAmount": {
                    "value": "100",
                    "currency": "USD"
                }
            }
        };
        
        // Construct the content to be signed
        const contentAli = constructContentToBeSigned(httpMethod, httpUri, clientId, requestBody, requestTime);
        
        const signatureAli = signContentNew(contentAli, base64KeyToPEMNew(privateKey, "PRIVATE"), "utf8");
        
        console.log("Signature:", signatureAli);
        console.log("Verify signature:", verifySignatureNew(contentAli, base64KeyToPEMNew(publicKeyAli, "PUBLIC"), signatureAli, "utf8"));
        
//         console.log(contentToBeSigned);
        try {
            const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            
            const signer = crypto.createSign('RSA-SHA256');
            signer.update(contentAli);
            
            const signature = signer.sign(privateKey, 'base64');
            
            console.log("Signature:", signature);
            const headers = {
                'signature': 'algorithm=RSA256, keyVersion=1, signature='+signature,
                'Content-Type': 'application/json; charset=UTF-8',
                'client-id': clientId,
                'request-time': '1685599933871'
              };
              let data = {
                "env": {
                  "terminalType": "WEB"
                },
                "order": {
                  "merchant": {
                    "referenceMerchantId": "SM_001"
                  },
                  "orderAmount": {
                    "currency": "CNY",
                    "value": "1314"
                  },
                  "orderDescription": "Cappuccino #grande (Mika's coffee shop)",
                  "referenceOrderId": "ORDER_04064611172949XXXX"
                },
                "paymentAmount": {
                  "currency": "CNY",
                  "value": "1314"
                },
                "paymentMethod": {
                  "paymentMethodType": "ALIPAY_CN"
                },
                "paymentNotifyUrl": "https://www.gaga.com/notify",
                "paymentRedirectUrl": "https://global.alipay.com/doc/cashierpayment/intro",
                "paymentRequestId": "Y0RrWTtZCEnvvrhIdVIF0WgUFWSGByCstM1SMrYGaWikP1Pr96IGzlnuZ63EHIwe",
                "productCode": "CASHIER_PAYMENT",
                "settlementStrategy": {
                  "settlementCurrency": "USD"
                }
              };
              axios.post('https://open-na-global.alipay.com/ams/api/v1/payments/pay', data, { headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
              
        } catch (error) {
            console.error("Error occurred:", error);
            return next(error);
        }
return false;
// Example usage
// const privateKeyP = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCEM81wp7LnTB/e6J21X57yXwbp7bSvB4Ku+M/AlVlGBILJvX9mHW8YB77EDKH15YkPjne7b4Zsss2SBky2S3VfPWvBj5nHU+l47M1rs/Ob4B2SJDqWbimjTBLsiNpBDk/iigJCq4Sa8L614x0nxxVvd4tvMqtnuCFCbixlZP/chs+9ItaUv7fXAOsqubIOX1SeDIqSOLdfl1P3ZrZrfWEkIRcKMIFD4DXCHSg31b5vvSnKolDyAPE9T07VR9e6i9rrbDKKuo5cKnO1hTXnKMyW9OdxZd6RfkX88Ps+TapcveKX3cKVAucvk3vx+bFApzM5svKseUW1TEYdl8y0amP9AgMBAAECggEAWRtFdJJD/qyLqsZlTlPWIY01bsUejP7l8aOY/DhuBMiTkwDb9usN70eBKElPfRsqZ8biIv8HvwpBjxQZ7qErynbuw3dT8ks3yZ7q0pZnM4A6zj8HEk/MVtm2w6F2YnUQGSRmY6OR7JEqKhSbmS0R4KDV5axkZbNxD4KNAAa0gmGIpb3cvp8qqwyY6PJLLxGMBeYNVNU4pbYyiXLAlFN4R9yiZrKZVtSmwA4ak6EyRaxjgtR97sxEr1hf/JYyC9Aefa57kOKik6P9gIRui/EualDqHJhrh8PBAvZWELxZ3aUfvmf8R5+43jhRjXUV1RPxlJoQwjuX9Kp1RAe+rtU2rQKBgQDoY54BxML0z11R+38sPn0z8UzGGOGGk0MkPCGaXC0vYKA3BTPUst1mvFzduXzqID1ta0HShOEJMxz8B1Y9nFG1ZmvhMpCqDBMXHq4q3I5yfWPK+Jq4NCNDziY/pjsa40NQYfQOEMw3HGwdKVzVdBpKir9r9O/Kg/cKNE3F3VDCawKBgQCRolo5/c/i66+zC9LHULdtN8HLZnBIKmOW0+749OdCavBNNuKnDXMjMNFL/Ah1mN7iMSoYBpdhqI+q/7+Sj5KQrXQIcSV8E0VmQ7wDVlDIe1y63l9GDYW0Wi4WwVPXkzdZHH1157/hHCikCLwuV4Z6XuVO2/QIxdB6s5m+eb+dNwKBgHsC+EnRYK178tcJvLir31SWf2BBHWhCHYFZvyPZdSWmDUjynQwTHjVasgHARQodxMZdxzrrkb9v6gDS1WjJjUrri2Fqhb8toxFS8TjJBTI/g4qWbDfjiWNEBWUd1h2WfTRYlXq4k5D8n5IUKgrnaV9Z8Jfx0NivYB5rr1t0mmI/AoGBAIui9YwhFtDnVuH/9ivx8s4f5gsWv5YSPscBkmLWv15pltsSQyQVu04EosmOcLYAy8Rpi4jZ2RBkRMyax57JVqiuB1GI234qJCK303AHtRFlZzYtvYA3uvmAdiyPVcqfdzRUIt+IQ+ydyUHutjBg76opjwib0VMQCKN9zW5a4iTlAoGAQt/P9LBKZRMge3HMXO4TeZyqIcGYKbBUXbWELlKNdAHjj3XTU0iXuQlmsJWqRg8JqTTQ7kI0sfZCGn9LS/GP+btmFOpOrOD9WSq7y99yFkq8pZ3qAeMQ6XsXFbbST196kAcSx/0fkJ5gsiGeEE+mrEH4pANElxDS4M+2VaKzBjk='; // Replace with your private key
// const privateKey = `-----BEGIN PRIVATE KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkg2AzO7s1pzgRdpMXumuTKoZxl1IGNboW3CR/44xl+TuyOjhU5Z666C8GLLp7AZWBGogCu6li6MxdCYRXVO8lkR0rUVU5NGbJluTHNXePugVR7oGICvr9xLOrkpIWyW/dPpbbFLgb+y87L4lCgieBwTewpF1IGpQ3TKDl9U9x6eS6HEo77ujdZ0whxlJgKVGh1rg63doTOi6Tqn6SUQaveK0DwTgXiQA0crkCddhEVGcE80DtBjdiD1wywz0I7gwdMqC0unnKsyhcABfCLVdKJu2efCiR6DR5TPMwWQ+pHPY+CaNUy5cC5voUEKDmfzK234zxXH0Eil06EpQFyDfXQIDAQAB
// -----END PRIVATE KEY-----`;

// let privateKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkg2AzO7s1pzgRdpMXumuTKoZxl1IGNboW3CR/44xl+TuyOjhU5Z666C8GLLp7AZWBGogCu6li6MxdCYRXVO8lkR0rUVU5NGbJluTHNXePugVR7oGICvr9xLOrkpIWyW/dPpbbFLgb+y87L4lCgieBwTewpF1IGpQ3TKDl9U9x6eS6HEo77ujdZ0whxlJgKVGh1rg63doTOi6Tqn6SUQaveK0DwTgXiQA0crkCddhEVGcE80DtBjdiD1wywz0I7gwdMqC0unnKsyhcABfCLVdKJu2efCiR6DR5TPMwWQ+pHPY+CaNUy5cC5voUEKDmfzK234zxXH0Eil06EpQFyDfXQIDAQAB"
const generatedSignature = generateSignaturerrrrrrrrrrrr(contentToBeSigned, privateKeyPath);

console.log("generatedSignature",generatedSignature);






















        return false;
        const requestString = JSON.stringify(req.body);
        // Generated private & public keys - configured in Alipay Developer Account
        // const privateKey = configAlipay.privateKey;  // Replace with your private key
        const publicKey = configAlipay.alipayPublicKey;   // Replace with your public key
        
        // Construct Signature Content
        const clientID = configAlipay.appId;    // Replace with your Client ID
        
        const content = `POST /ams/sandbox/api/v1/payments/pay?_output_charset=utf-8&_input_charset=utf-8\n${clientID}.${new Date().toISOString()}.${requestString}`;
        console.log("content--------------->",content);
        
        // Generate signature
        const signature = signContent(content, base64KeyToPEM(privateKey, "PRIVATE"), "utf8");
        console.log("Signature:", signature);
        
        // URL-Encode the signature
        // Use the url-encoded signature for the Alipay Payment APIs
        const url_encoded = encodeURIComponent(signature);
        console.log("URL Encoded Signature:", url_encoded);
        
        // Verify the generated signature
        // Use the generated signature without url encoding for verification
        console.log("Verify signature:", verifySignature(content, base64KeyToPEM(publicKey, "PUBLIC"), signature, "utf8"));
        // const signedRequest = { ...requestString, signature: url_encoded };
        const requestBodyObject = JSON.parse(requestString); // Parse back to object
const signedRequest = { ...requestBodyObject, signature: url_encoded };

        // Make the payment request to Alipay API
        axios.post(configAlipay.gatewayUrl, signedRequest)
            .then(response => {
                // Handle the response from Alipay
                const responseData = response.data;
                console.log("response",responseData)
                    // Check if responseData is empty or undefined
                    if (!responseData || responseData === "") {
                        console.error("Response data is empty or undefined.");
                        // Handle the error or exit the function
                    } else {
                        const responseContent = JSON.stringify(responseData);
                        const isSignatureValid = verifySignature(responseContent, base64KeyToPEM(publicKey, "PUBLIC"), signature, "utf8");
                    }

                // if (isSignatureValid) {
                //     console.log("Signature verification passed. Response is from Alipay.");
                //     // Process the payment response
                // } else {
                //     console.log("Signature verification failed. Response may have been tampered with.");
                //     // Handle potential security threat
                // }
            })
            .catch(error => {
                console.error("Error making payment request:", error);
                // Handle error
            });
        

        // const { totalAmount, subject, body } = req.body;
        // let YOUR_ORDER_ID = Math.floor(Math.random() * (9999 - 1000) + 1000);
        // // const formData = alipaySdk.buildFormData({
        // //   subject,
        // //   outTradeNo: YOUR_ORDER_ID, // Replace with your unique order ID
        // //   totalAmount,
        // //   body,
        // // });
        // const formData = {
        //     subject,
        //     outTradeNo: YOUR_ORDER_ID.toString(), // Replace with your unique order ID
        //     totalAmount,
        //     body,
        // };
        // console.log("formData----------",formData);
        // let alipay = {
        //     appId: configAlipay.appId,
        //     privateKey: fs.readFileSync(privateKeyPath, 'utf8'),
        //     alipayPublicKey: fs.readFileSync(publicKeyPath, 'utf8'),
        //     gatewayUrl: configAlipay.gatewayUrl,
        //     notifyUrl: configAlipay.notifyUrl,
        //     encryptKey: configAlipay.encryptKey,
        // }
        // console.log("alipay",alipay);
        // const alipayClient = new alipaySdk(alipay);
        // const result = await alipayClient.pageExec('alipay.trade.page.pay', formData);
        // // res.send(result);
        // // const result = await alipaySdk.makeFormSubmitRequest(formData, alipay);
        // console.log("result",result);
        // res.json(result);
      } catch (err) {
        next(err);
      }
    
}; 
function signContentNew(content, privateKey, encoding) {
    const sign = crypto.createSign("SHA256");
    sign.write(content, encoding);
    sign.end();
    return sign.sign(privateKey, "base64");
}

function verifySignatureNew(content, publicKey, signature, encoding) {
    const verify = crypto.createVerify("SHA256");    
    verify.write(content, encoding);
    verify.end();
    return verify.verify(publicKey, Buffer.from(signature, "base64"));
}

function base64KeyToPEMNew(base64Key, keyType) {
    return [`-----BEGIN ${keyType} KEY-----`, ...splitStringIntoChunksNew(base64Key, 64), `-----END ${keyType} KEY-----`].join("\n");
}

function splitStringIntoChunksNew(input, chunkSize) {
    const chunkCount = Math.ceil(input.length / chunkSize)
    return Array.from( { length: chunkCount } ).map((v, chunkIndex) => input.substr(chunkIndex * chunkSize, chunkSize));
}


function formatDate(date) {
    return new Date(date).toISOString();
}

// Function to construct content to be signed
function constructContentToBeSigned(httpMethod, httpUri, clientId, requestBody, requestTime) {
    const contentToBeSigned = `${httpMethod} ${httpUri}\n${clientId}.${formatDate(requestTime)}.${JSON.stringify(requestBody)}`;
    return contentToBeSigned;
}
function generateSignaturerrrrrrrrrrrr(contentToBeSigned, privateKey) {
    const sign = crypto.createSign('RSA-SHA256');
    // Update the sign object with the content to be signed
    sign.update(contentToBeSigned);
    // Sign the content with the private key and return the signature
    const signature = sign.sign(privateKey, 'base64');
    // Encode the signature to URL-safe format
    const urlSafeEncodedSignature = encodeURIComponent(signature)
        .replace(/[!'()*]/g, (c) => {
            return '%' + c.charCodeAt(0).toString(16);
        })
        .replace(/%20/g, '+')
        .replace(/%3D/g, '=');
    console.log("urlSafeEncodedSignature",urlSafeEncodedSignature)
    return urlSafeEncodedSignature;
}
// function sign(httpMethod, path, clientId, reqTime, content, merchantPrivateKey) {
//     const signContent = genSignContent(httpMethod, path, clientId, reqTime, content);
//     const signValue = signWithSHA256RSA(signContent, merchantPrivateKey);
//     return encodeURIComponent(signValue);
// }

// function verify(httpMethod, path, clientId, rspTime, rspBody, signature, alipayPublicKey) {
//     const rspContent = genSignContent(httpMethod, path, clientId, rspTime, rspBody);
//     return verifySignatureWithSHA256RSA(rspContent, signature, alipayPublicKey);
// }

// function genSignContent(httpMethod, path, clientId, timeString, content) {
//     const payload = `${httpMethod} ${path}\n${clientId}.${timeString}.${content}`;
//     return payload;
// }

// function signWithSHA256RSA(signContent, merchantPrivateKey) {
//     const priKey = `-----BEGIN RSA PRIVATE KEY-----\n${merchantPrivateKey}\n-----END RSA PRIVATE KEY-----`;

//     const sign = crypto.createSign('RSA-SHA256');
//     sign.update(signContent);
//     const signValue = sign.sign(priKey, 'base64');
//     return signValue;
// }

// function verifySignatureWithSHA256RSA(rspContent, rspSignValue, alipayPublicKey) {
//     const pubKey = `-----BEGIN PUBLIC KEY-----\n${alipayPublicKey}\n-----END PUBLIC KEY-----`;
    
//     const originalRspSignValue = Buffer.from(rspSignValue, 'base64');

//     const verify = crypto.createVerify('RSA-SHA256');
//     verify.update(rspContent);
//     const verifyResult = verify.verify(pubKey, originalRspSignValue);
//     return verifyResult;
// }

// function signContent(content, privateKey, encoding) {
//     const sign = crypto.createSign("SHA256");
//     sign.write(content, encoding);
//     sign.end();
//     return sign.sign(privateKey, "base64");
// }

// /** Function to verify the generated signature using a public key. */
// function verifySignature(content, publicKey, signature, encoding) {
//     const verify = crypto.createVerify("SHA256");
//     verify.write(content, encoding);
//     verify.end();
//     return verify.verify(publicKey, Buffer.from(signature, "base64"));
// }
// function base64KeyToPEM(base64Key, keyType) {
//     return [`-----BEGIN ${keyType} KEY-----`, ...splitStringIntoChunks(base64Key, 64), `-----END ${keyType} KEY-----`].join("\n");
// }
// /** Function to split a string into chunks used while creating the PEM format key. */
// function splitStringIntoChunks(input, chunkSize) {
//     const chunkCount = Math.ceil(input.length / chunkSize)
//     return Array.from({ length: chunkCount }).map((v, chunkIndex) => input.substr(chunkIndex * chunkSize, chunkSize));
// }

const paymentAliPayNotify = async function (req, res, next) {
    try {
    const { signStatus, serialNo } = req.body;

    if (signStatus === 'ABORTED') {
      // Handle payment abort scenario
      return res.status(400).json({ message: 'Payment aborted' });
    }

    if (signStatus === 'SUCCEEDED') {
      // Handle successful payment scenario
      // Update your database with the payment details
      await db.updatePaymentStatus(serialNo, 'succeeded');
      return res.status(200).json({ message: 'Payment successful' });
    }

    res.status(400).json({ message: 'Invalid payment notification' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }

};
// function generateSignatureT(data, apiKey) {
//     // Convert data to JSON string
//     const jsonData = JSON.stringify(data);
  
//     // Generate MD5 hash of base64 encoded data concatenated with API key
//     const hash = crypto.createHash('md5')
//                        .update(Buffer.from(jsonData, 'utf-8'))
//                        .digest('base64');
//     const sign = crypto.createHash('md5')
//                        .update(Buffer.from(hash + apiKey, 'utf-8'))
//                        .digest('hex');
  
//     return sign.toLowerCase(); // Convert the signature to lowercase
//   }
  
  
module.exports = {
    login,
    createUser,
    createGuestUser,
    getServerList,
    verifyEmail,
    logout,
    usageTime,
    createReferalCode,
    verifyReferalCode,
    checkServerHealth,
    userDetails,
    checkSubscription,
    userTransactionID,
    defaultData,
    stripePayment,
    fetchPackages,
    remainingFreeTrial,
    usdTPayment,
    paypalPayment,
    defaultAppData,
    aliPayPayment,
    adsDetails,
    getV2rayServersDetails,
    getvMessServersDetails,
    forgotPassword,
    resetPassword,
    referralList,
    discountCodes,
    addiOSFile,
    userSubscriptionSuccess,
    orderHistory,
    paymentUDT,
    paymentAliPay,
    paymentAliPayNotify
};

async function checkIPQuality(ip) {
    try {
        const pingResult = await ping.promise.probe(ip);
        console.log("ping result",pingResult);
        if (pingResult.alive && pingResult.avg < 100) {
          return 'Normal';
        } else {
          return 'Under Maintenance';
        }
      // Step 1: Perform an HTTP request to the IP itself (without a specific domain).
    //   const response = await axios.get(`http://${ip}/health`, {
    //   timeout: 5000, // Adjust the timeout as needed
    // });

    // if (response.status === 200 && response.data.status === 'healthy') {
    //   return 'Normal';
    // } else {
    //   return 'Under Maintenance';
    // }
    
    
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            // Handle timeout error
            console.error(`Timeout while checking IP quality for ${ip}`);
            return 'Under Maintenance';
          }
    }
}
// async function timeDifferenceInMinutes(purchaseDateTimestamp,expirationDateTimestamp) {
//     try {
//         const purchaseDate = new Date(purchaseDateTimestamp);
//         const expirationDate = new Date(expirationDateTimestamp);
//         const timeDifferenceMs = expirationDate - purchaseDate;
//         const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
//         return timeDifferenceMinutes;
//     } catch (error) {
//         if (error.code === 'ECONNABORTED') {
//             // Handle timeout error
//             console.error(`Timeout while checking IP quality for ${ip}`);
//             return 'Under Maintenance';
//           }
//     }
// }
function timeDifferenceInMinutes(purchaseDateTimestamp,expirationDateTimestamp) {
    // const purchaseDate = new Date(purchaseDateTimestamp);
    const purchaseDate = new Date();
    console.log("purchaseDate",purchaseDate);
    const expirationDate = new Date(expirationDateTimestamp);
    console.log("expirationDate",expirationDate);
    const timeDifferenceMs = expirationDate - purchaseDate;
    console.log("timeDifferenceMs",timeDifferenceMs);
    const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
console.log("timeDifferenceMinutes",timeDifferenceMinutes);
    return timeDifferenceMinutes;
}
function checkServerHealthIP(serverIP, serverPort, timeout = 5000, callback) {
  const socket = new net.Socket();
  
  socket.setTimeout(timeout);

  socket.on('connect', () => {
    socket.end();
    callback(null, true); // Server is healthy and reachable
  });

  socket.on('timeout', () => {
    socket.destroy();
    callback('Connection timed out. Server may be unreachable.', false);
  });

  socket.on('error', (error) => {
    socket.destroy();
    callback(`Error connecting to the server: ${error.message}`, false);
  });

  socket.connect(serverPort, serverIP);
}
function extractUsernameFromEmail(email) {
    const atIndex = email.indexOf('@');
    if (atIndex !== -1) {
      return email.substring(0, atIndex);
    } else {
      // Invalid email format, handle accordingly
      return null;
    }
}
// Function to sign the data
function sign(data, appsecret) {
    const sortedData = {};
    Object.keys(data).sort().forEach(key => {
        sortedData[key] = data[key];
    });
    const queryString = Object.keys(sortedData)
        .map(key => `${key}=${sortedData[key]}`)
        .join('&');
    const signatureString = queryString + `&appsecret=${appsecret}`;
    const sign = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
    return sign;
}
function signT(data, appsecret) {
    const sortedData = {};
    Object.keys(data).sort().forEach(key => {
        sortedData[key] = data[key];
    });
    const queryString = Object.keys(sortedData)
        .map(key => `${key}=${sortedData[key]}`)
        .join('&');
    const signatureString = queryString + `&appsecret=${appsecret}`;
    const sign = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
    return sign;
}
function md5(input) {
    var crypto = require('crypto');
    return crypto.createHash('md5').update(input).digest('hex');
}
function generateSignature(parameters, appsecret) {
    // Sort the parameters in ascending ASCII lexicographic order by parameter name
    const sortedParameters = Object.keys(parameters).sort().reduce((obj, key) => {
        if (parameters[key] !== '') { // Exclude parameters with empty values
            obj[key] = parameters[key];
        }
        return obj;
    }, {});

    // Concatenate the parameters using URL key-value pairs format
    let paramString = '';
    for (const key in sortedParameters) {
        paramString += `${key}=${sortedParameters[key]}&`;
    }
    paramString = paramString.slice(0, -1); // Remove the trailing "&"

    // Append "&appsecret=secretkey" to construct stringSignTemp
    const stringSignTemp = `${paramString}&appsecret=${appsecret}`;

    // Apply MD5 hashing algorithm on stringSignTemp and convert it to uppercase
    const md5 = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();

    return md5;
}
async function createUnifiedOrder(orderDetails, appsecret) {
    const signature = generateSignature(orderDetails, appsecret);
    orderDetails.signature = signature;

    try {
        const response = await axios.post('https://web.upay.ink/api/pay/unifiedorder', orderDetails);
        return response.data;
    } catch (error) {
        console.error('Error creating unified order:', error);
    }
}
