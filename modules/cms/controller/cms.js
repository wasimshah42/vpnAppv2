const { Sequelize } = require('sequelize');
const { Op, literal } = require("sequelize");
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
            var token = jwt.sign({ id: admin.id }, config.secret, {
                expiresIn: 86400 // 24 hours
            });
            let whereAuth = {
                where: { admin_id: admin.id }
            }
            let authkeyInstance = new sequelize.db(models.auth_keys);
            let [authkey, a_error] = await authkeyInstance.findOne(whereAuth);

            if (authkey === null) {
                var Authkey = new models.auth_keys({});
                Authkey.admin_id = admin.id;
                Authkey.token = token;
                await Authkey.save();
            }
            else if (authkey !== null) {
                authkey.token = token;
                await authkey.save();
            }
            let loginData = {
                token: token,
                data: admin
            }
            return next(loginData);
        }
        else {
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
        if (req.body.platform) {
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
const serverUpdate = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 0) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.v2rayServersDetails);
        let [v2rayServersDetails, v2rayServersDetailsErr] = await instance.findOne({ id: id });
        // console.log('v2rayServersDetails', v2rayServersDetails);
        if (v2rayServersDetailsErr) { return next(v2rayServersDetailsErr); }
        if (!v2rayServersDetails || !v2rayServersDetails.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = v2rayServersDetails;
        v2rayServersDetails = v2rayServersDetails.toJSON();
        //--//
        [v2rayServersDetails, v2rayServersDetailsErr] = await instance.update(req.body);
        if (v2rayServersDetailsErr) { return next(v2rayServersDetailsErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ v2rayServersDetails: v2rayServersDetails });
    }
    catch (error) { return [null, error]; }

};
const serverDelete = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 1) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.v2rayServersDetails);
        let [v2rayServersDetails, v2rayServersDetailsErr] = await instance.find(id);
        if (v2rayServersDetailsErr) { return next(v2rayServersDetailsErr); }
        if (!v2rayServersDetails || !v2rayServersDetails.id) { return next(404); }
        //--//
        await v2rayServersDetails.destroy();
        //--//
        req.statusMessage = "Successfully deleted";
        return next({ v2rayServersDetails: v2rayServersDetails });
    }
    catch (error) { return [null, error]; }
};
//--//
const findAll = async function (req, res, next) {
    try {
        let condition = [];
        let findQuery = { where: { deletedAt: null } };
        //--//
        findQuery.where[Op.and] = condition;
        let pagination = new Pagination(req, findQuery);
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.users);
        let [data, err] = await instance.findAndCountAll(findQuery);
        if (err) { return next(err); }
        //--//
        pagination.setCount(data.count);
        return next({ users: data.rows, pagination: pagination });
    }
    catch (error) { return next(error); }
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
const filterByType = async function (req, res, next) {
    try {
        let user_type = req.query.user_type
        if (!user_type || user_type == "") { req.statusMessage = "User type is required."; return next(404) };
        let condition = [];
        let findQuery = { where: { deletedAt: null, user_type: user_type } };
        //--//
        findQuery.where[Op.and] = condition;
        let pagination = new Pagination(req, findQuery);
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.users);
        let [data, err] = await instance.findAndCountAll(findQuery);
        if (err) { return next(err); }
        //--//
        pagination.setCount(data.count);
        return next({ users: data.rows, pagination: pagination });
    }
    catch (error) { return next(error); }
};
const serverDetail = async function (req, res, next) {
    try {
        let serverType = req.query.serverType;
        let parent_with_child = req.query.parent_with_child;
        let condition = [];
        let findQuery = { where: { deletedAt: null, } };
        //--//
        if (serverType == 'iOS') {
            findQuery.where['platform'] = serverType;
        }
        if (serverType == '1') {
            findQuery.where['is_recommended'] = serverType;
        }
        if(parent_with_child == '1'){
            findQuery.where['parent_id'] = parent_with_child;
            findQuery.include = [{
                model: sequelize.models.v2rayServersDetails,
                as: 'v2rayServersDetails_',  // Assuming you have 'children' as the association alias
            }];
        }
        findQuery.where[Op.and] = condition;
        let pagination = new Pagination(req, findQuery);
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.v2rayServersDetails);
        let [data, err] = await instance.findAndCountAll(findQuery);
        if (err) { return next(err); };
        //--//
        pagination.setCount(data.count);
        return next({ v2rayServer: data.rows, pagination: pagination });
    }
    catch (error) { return next(error); }
};
//--//
const defaults = async function (req, res, next) {
    try {
        let type = req.body.type;
        if(!type  || type == "" ) {req.statusMessage ="Defaults Type is requiired"; return  next(404)  };
        let condition = [];
        let findQuery = { where: { type: type } };
        //--//
        findQuery.where[Op.and] = condition;
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.defaults);
        let [data, err] = await instance.findOne(findQuery);
        if (err) { return next(err); }
        //--//
        return next({ defaults: data, });
    }
    catch (error) { return next(error); }
};
const updateDefault = async function (req, res, next) {
    try {
        let type = req.body.type;
        if (!type || type == "") { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.defaults);
        let [defaults, defaultsErr] = await instance.findOne({ type: type });
        if (defaultsErr) { return next(defaultsErr); }
        if (!defaults || !defaults.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = defaults;
        defaults = defaults.toJSON();
        //--//
        [defaults, defaultsErr] = await instance.update(req.body);
        if (defaultsErr) { return next(defaultsErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ default: defaults });
    }
    catch (error) { return [null, error]; }

};
//--//
const defaultData = async function (req, res, next) {
    try {
        let type = req.body.type;
        if(!type  || type == "" ) {req.statusMessage ="Defaults Type is requiired"; return  next(404)  };
        let condition = [];
        let findQuery = { where: { type: type } };
        //--//
        findQuery.where[Op.and] = condition;
        findQuery.order = [["id", "DESC"]];
        //--//
        let instance = new sequelize.db(sequelize.models.default_data);
        let [data, err] = await instance.findOne(findQuery);
        if (err) { return next(err); }
        //--//
        return next({ defaultData: data, });
    }
    catch (error) { return next(error); }
};
const updateDefaultData = async function (req, res, next) {
    try {
        let type = req.body.type;
        if (!type || type == "") { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.default_data);
        let [defaults, defaultsErr] = await instance.findOne({ type: type });
        if (defaultsErr) { return next(defaultsErr); }
        if (!defaults || !defaults.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = defaults;
        defaults = defaults.toJSON();
        //--//
        [defaults, defaultsErr] = await instance.update(req.body);
        if (defaultsErr) { return next(defaultsErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ default: defaults });
    }
    catch (error) { return [null, error]; }

};
//--//
const addPlan = async function (req, res, next) {
    try {
        let plaining_center = new sequelize.db(models.plaining_center);
        let [plaining, error] = await plaining_center.create(req.body);
        if (error) { return next(error); }
        return next({plan: plaining});
    }
    catch (error) { return next(error); }
};
const planList = async function (req, res, next) {
    try {
        let plaining_center = new sequelize.db(models.plaining_center);
        let [plans, Rerror] = await plaining_center.findAll({ where: { deleted_at: null } });
        return next(plans);
    }
    catch (error) { return next(error); }
};
const updatePlan = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 0) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.plaining_center);
        let [plans, plansErr] = await instance.findOne({ id: id });
        if (plansErr) { return next(plansErr); }
        if (!plans || !plans.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = plans;
        plans = plans.toJSON();
        //--//
        [plans, plansErr] = await instance.update(req.body);
        if (plansErr) { return next(plansErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ plans: plans });
    }
    catch (error) { return [null, error]; }

};
const deletePlan = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 1) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.plaining_center);
        let [plan, planErr] = await instance.find(id);
        if (planErr) { return next(planErr); }
        if (!plan || !plan.id) { return next(404); }
        //--//
        await plan.destroy();
        //--//
        req.statusMessage = "Successfully deleted";
        return next({ plan: plan });
    }
    catch (error) { return [null, error]; }
};
//--- Packages CRUD ---//
const addPackages = async function (req, res, next) {
    try {
        let packages = new sequelize.db(models.packages);
        let [package, error] = await packages.create(req.body);
        if (error) { return next(error); }
        return next({package: package});
    }
    catch (error) { return next(error); }
};
const packagesList = async function (req, res, next) {
    try {
        let packages = new sequelize.db(models.packages);
        let [package, Rerror] = await packages.findAll({ where: { deleted_at: null } });
        return next(package);
    }
    catch (error) { return next(error); }
};
const updatePackage = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 0) { return next(412); }
        //--//
        console.log('id', typeof id);
        let instance = new sequelize.db(sequelize.models.packages);
        let [package, packageErr] = await instance.findOne({ id: id });
        // console.log('package', package);
        if (packageErr) { return next(packageErr); }
        if (!package || !package.id) { return next(404); }
        //--//
        delete req.body.id;
        instance.model = package;
        package = package.toJSON();
        //--//
        [package, packageErr] = await instance.update(req.body);
        if (packageErr) { return next(packageErr); }
        //--//
        req.statusMessage = "Successfully updated";
        return next({ package: package });
    }
    catch (error) { return [null, error]; }

};
const deletePackage = async function (req, res, next) {
    try {
        let id = req.body.id;
        if (!id || id < 1) { return next(412); }
        //--//
        let instance = new sequelize.db(sequelize.models.packages);
        let [package, packageErr] = await instance.find(id);
        if (packageErr) { return next(packageErr); }
        if (!package || !package.id) { return next(404); }
        //--//
        await package.destroy();
        //--//
        req.statusMessage = "Successfully deleted";
        return next({ package: package });
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
    deleteAccount,
    filterByType,
    serverDetail,
    updateDefault,
    defaults,
    defaultData,
    updateDefaultData,
    addPlan,
    planList,
    updatePlan,
    deletePlan,
    //--//
    addPackages,
    packagesList,
    updatePackage,
    deletePackage,
    //--//
    serverDelete,
    serverUpdate
};