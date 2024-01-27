const { Sequelize, useInflection } = require('sequelize');
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
        // Example usage
  const pastDate = "2024-01-01T12:00:00";  // Replace with your past date string
  const currentDate = new Date();  // Current date
  
  const minutesDifference = calculateMinutesBetweenDates(pastDate, currentDate);
  
  console.log(`The distance in minutes is: ${minutesDifference}`);
  return false;
  
        let verificationCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
        let request = await reqBody.loginRequest(req);
        let email = request.email;
        let password = request.password;
        // let password = request.password;
        // if (!email || !password) { return next(412); }
        // if (email === "" || password === "") { return next(412); }
        let [userData, error] = await users.findUser(email);
        if (error) { return next(error); }
        if (!userData) { 
            req.statusMessage = "Email not found";
            return next(404); 
        }
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
            userData.device_id = request.device_id;
            userData.device_type = request.device_type;
            userData.device_token = request.device_token;
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

            if(authkey === null){
                var Authkey = new models.auth_keys({});
                Authkey.user_id = userData.id;
                Authkey.token = token;
                await Authkey.save();
            }
            else if(authkey !== null){
                authkey.token = token;
                await authkey.save();
            }
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
const addUserParticipation = async function (req, res, next) {
    try {
        let userInstance = new sequelize.db(models.users_participation);
        let [user, userError] = await userInstance.findOne({ where : { user_id: req.body.user_id,planing_id: req.body.planing_id }, });
        if(user){ req.statusMessage = "Your participation request already sent."; return next(404) }
        let userParticipationInstance = new sequelize.db(models.users_participation);
        let [userParticipation, error] = await userParticipationInstance.create(req.body);
        if (error) { 
            return next(error);
        }
         const result = await sendEmail(
                req.body.email,
                `Hello from VPN`,
                `<p>You're successfullt participated:</p> <br> <strong></strong>`,
              );
            console.log('Email sent successfully:', result.response);
        return next({ userParticipation });
    } catch (error) {
        return next(error);
    }
};

const userTask = async function (req, res, next) {
    try {
        let userTaskInstance = new sequelize.db(models.users_tasks);
        let [userTask, error] = await userTaskInstance.create(req.body);
        if (error) { 
            return next(error);
        }
        return next({ userTask });
    } catch (error) {
        return next(error);
    }
};
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
    addUserParticipation,
    userTask
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
