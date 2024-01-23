const sequelize = require("./../sequelize/sequelize");
const users = new sequelize.db(sequelize.models.users);
const users_profiles = new sequelize.db(sequelize.models.user_profiles);
//--//
const Op = sequelize.sequelize.Op;
//--//
const handle = function (promise) {
    return promise
        .then(function (data) { return Promise.resolve([data, undefined]); })
        .catch(function (error) { return Promise.resolve([undefined, error]); });
};
const findUser = async function (email) {
    try {
        let findQuery = { email: email };
        return await users.fetchOne(findQuery);
    }
    catch (error) { return [undefined, error]; }
};
const validatePassword = async function (email, password) {
    try {
        let findQuery = { email: email, password: password };
        return await users.fetchOne(findQuery);
    }
    catch (error) { return [undefined, error]; }
};
const findByEmail = async function (email) {
    try {
        console.log("email", email);
        let findQuery = { email: email };
        return await users.fetchOne(findQuery);
    }
    catch (error) { return [undefined, error]; }
};
const findByPhone = async function (phone) {
    try {
        let findQuery = { phone: phone };
        return await users.fetchOne(findQuery);
    }
    catch (error) { return [undefined, error]; }
};
const userApp = async function (id) {
    try {
        let response = {
            rates: "",
            general: "",
            owner: "",
            owner_bank: "",
            boat_condition: ""
        };
        let findQuery = { id: id };
        let [profile, err] = await handle(users_profiles.findOne(findQuery));
        response.owner = profile;
        return response;
    }
    catch (error) { return [undefined, error]; }
};
//--//
module.exports = {
    findUser,
    validatePassword,
    userApp,
    findByEmail,
    findByPhone
};
