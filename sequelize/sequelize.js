let { config, sequelize, connection } = require("./connection");
//--//
let models = {
    users: (require("./../schemas/users"))(connection, sequelize),
    auth_keys: (require("../schemas/auth_keys"))(connection, sequelize),
    serverDetails: (require("../schemas/serverDetails"))(connection, sequelize),
    referral_invitations: (require("../schemas/referral_invitations"))(connection, sequelize),
    recharge_history: (require("../schemas/recharge_history"))(connection, sequelize),
    default_data: (require("../schemas/default_data"))(connection, sequelize),
    packages: (require("../schemas/packages"))(connection, sequelize),
    user_subscription: (require("../schemas/user_subscription"))(connection, sequelize), 
    defaults: (require("../schemas/defaults"))(connection, sequelize), 
    adsDetails: (require("../schemas/adsDetails"))(connection, sequelize),  
    v2rayServersDetails: (require("../schemas/v2rayServersDetails"))(connection, sequelize),
    vMessServers: (require("../schemas/vMessServers"))(connection, sequelize),
    versions: (require("../schemas/versions"))(connection, sequelize),
    user_purchased_versions: (require("../schemas/user_purchased_versions"))(connection, sequelize),
    referral_users: (require("../schemas/referral_users"))(connection, sequelize),
    discount_codes: (require("../schemas/discount_codes"))(connection, sequelize),
    enterprise_members: (require("../schemas/enterprise_members"))(connection, sequelize),
    enterprise_companies: (require("../schemas/enterprise_companies"))(connection, sequelize),
    enterprise_plan_details: (require("../schemas/enterprise_plan_details"))(connection, sequelize),
    enterprise_users_transactions: (require("../schemas/enterprise_users_transactions"))(connection, sequelize),
    enterprise_user_bank_information: (require("../schemas/enterprise_user_bank_information"))(connection, sequelize),
    admin: (require("../schemas/admin"))(connection, sequelize),
    plaining_center: (require("../schemas/plaining_center"))(connection, sequelize),
    users_participation: (require("../schemas/users_participation"))(connection, sequelize),
    users_tasks: (require("../schemas/users_tasks"))(connection, sequelize),
    packages: (require("../schemas/packages"))(connection, sequelize),
    
};
//--//
let instance = require("./instance");
(require("./associations"))(models);
(require("./scopes"))(models);
//--//
module.exports = {
    config,
    sequelize,
    connection,
    models,
    db: instance
};
