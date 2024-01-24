const { Sequelize } = require('sequelize');
const { Op ,literal } = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../../../config/db");
const sequelize = require("../../../sequelize/sequelize");
const models = sequelize.models;
const Pagination = require("./../../../helpers/pagination");

/*******************************************************/
//*******************************************************/
const login = async function (req, res, next) {
    try {
        let username = req.body.username;
        let password = req.body.password;
        let where = {
            where: { username: username, password: password }
        }
        let adminInstance = new sequelize.db(models.admin);
        let [admin, a_error] = await adminInstance.findOne(where);
        //------validate password---------//
        if (admin) { 
            var token = jwt.sign({id: admin.id}, config.secret, {
                expiresIn: 86400 // 24 hours
            });
            let whereAuth = {
                where: { admin_id: admin.id }
            }
            let authkeyInstance = new sequelize.db(models.auth_keys);
            let [authkey, a_error] = await authkeyInstance.findOne(whereAuth);

            if(authkey === null){
                var Authkey = new models.auth_keys({});
                Authkey.admin_id = admin.id;
                Authkey.token = token;
                await Authkey.save();
            }
            else if(authkey !== null){
                authkey.token = token;
                await authkey.save();
            }
            let loginData = {
                token: token,
                data: admin
            }
            return next(loginData);
        }
        else{
            return next(401);
        }
    }
    catch (error) { return next(error); }
};
const addV2rayServer = async function (req, res, next) {
    try {
        let v2rayServersDetailsInstance = new sequelize.db(models.v2rayServersDetails);
        let user_id = req.user_id;
        let platform = req.body.platform;
        if(req.body.platform){
            platform = platform;
        } else {
            platform = 'all';
        }
        //-----------//
        const data = {
            server_flag: req.files[0].filename,
            file: req.files[1].filename,
            uid: req.body.uid,
            platform: platform,
            is_recommended: req.body.recommended,
            server_name: req.body.serverName,
            server_address: req.body.serverAddress,
            server_port: req.body.serverPort,
            alter_id: req.body.alterId,
            network_security: req.body.networkSecurity,
            encryption_methods: req.body.encryption_methods,
            network: req.body.network,
            host: req.body.host,
            path: req.body.path,
            enable_udp: req.body.enableUDP,
        };
        let [server, error] = await v2rayServersDetailsInstance.create(data);
        if (error) { return next(error); }
        return next(server);
    }
    catch (error) { return next(error); }
};
const serverList = async function (req, res, next) {
    try {
        let findQueryR = {
        }
        let serverInstanceR = new sequelize.db(models.v2rayServersDetails);
        let [serversR, Rerror] = await serverInstanceR.findAll(findQueryR);
        return next(serversR); 
    }
    catch (error) { return next(error); }
};

//--//

const findAll = async function(req, res, next){
    try{
        let condition = [];
        let findQuery = {where: { deletedAt : null }};
        //--//
        findQuery.where[Op.and] = condition;
        let pagination = new Pagination(req, findQuery);
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.users);
        let [data, err] = await instance.findAndCountAll(findQuery);
        if(err){ return next(err); }
        //--//
        pagination.setCount(data.count);
        return next({users: data.rows, pagination: pagination});
    }
    catch(error){ return next(error); }
};
const update = async function (req, res, next) {
    try {
        let user_id = req.body.user_id;
        if (!user_id || user_id < 1) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.users);
        let [user, userErr] = await instance.find(user_id);
        if (userErr) { return next(userErr); }
        if (!user || !user.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = user;
        user = user.toJSON();
        req.body.status = req.body.status;
        //--//
        [user, userErr] = await instance.update(req.body);
        if (userErr) { return next(userErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ user: user });
    }
    catch (error) { return [null, error]; }
    
};
const deleteAccount = async function (req, res, next) {
    try {
        let user_id = req.body.user_id;
        if (!user_id || user_id < 1) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.users);
        let [user, userErr] = await instance.find(user_id);
        if (userErr) { return next(userErr); }
        if (!user || !user.id) { return next(404); }
        //--//
        await user.destroy();
        //--//
        req.statusMessage = "Successfully deleted";
        return next({ user: user });
    }
    catch (error) { return [null, error]; }
};
//--//
module.exports = {
    login,
    addV2rayServer,
    serverList,
    //--//
    findAll,
    update,
    deleteAccount
};