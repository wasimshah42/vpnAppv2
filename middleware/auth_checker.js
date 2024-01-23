const sequelize = require("./../sequelize/sequelize");
const models = sequelize.models;
module.exports = function (access) {
    return async function (req, res, next) {
        try {
            let lang = "en";
            let token = req.headers.authentication;
            // if(req.headers.language === "" || req.headers.language === undefined || req.headers.language === "undefined"){
            //     lang = "en";
            // }
            // else {
            //     lang = req.headers.language;
            // }
            if (access === "all" && token === "@") {
                req.lang = lang;
                next();
            }
            else if (access === "app") {
                let findQuery = {
                    where: {
                        token: token
                    }
                };
                let authInstance = new sequelize.db(models.auth_keys);
                let [auth, error] = await authInstance.findOne(findQuery);
                if (error) { next(error); }
                if (!auth) {
                    next(401);
                } else {
                    req.user_id = auth.user_id;
                    req.lang = lang;
                    //-- defining role--//
                    let findQueryRole = {
                        where: {
                            id: auth.user_id
                        }
                    };
                    let roleInstance = new sequelize.db(models.users);
                    let [role, r_error] = await roleInstance.findOne(findQueryRole);
                    req.user_purchased_versions = role.user_purchased_versions;
                    if(r_error){ return next(r_error); }
                    //--//
                    next();
                }
            }
            else if (access === "cms") {
                let findQuery = {
                    where: {
                        token: token
                    }
                };
                let authInstance = new sequelize.db(models.auth_keys);
                let [auth, error] = await authInstance.findOne(findQuery);
                if (error) { next(error); }
                if (!auth) {
                    next(401);
                } else {
                    req.admin_id = auth.admin_id;
                    req.lang = lang;
                    //-- defining role--//
                    // let findQueryRole = {
                    //     where: {
                    //         id: auth.admin_id
                    //     }
                    // };
                    // let roleInstance = new sequelize.db(models.users);
                    // let [role, r_error] = await roleInstance.findOne(findQueryRole);
                    // req.user_purchased_versions = role.user_purchased_versions;
                    // if(r_error){ return next(r_error); }
                    //--//
                    next();
                }
            }
            else if (access === "both") {
                if(token === "guestUser"){
                    next();
                } else {
                let findQuery = {
                    where: {
                        token: token
                    }
                };
                let authInstance = new sequelize.db(models.auth_keys);
                let [auth, error] = await authInstance.findOne(findQuery);
                if (error) { next(error); }
                if (!auth) {
                    next(401);
                } else {
                    req.user_id = auth.user_id;
                    req.lang = lang;
                    //-- defining role--//
                    let findQueryRole = {
                        where: {
                            id: auth.user_id
                        }
                    };
                    let roleInstance = new sequelize.db(models.users);
                    let [role, r_error] = await roleInstance.findOne(findQueryRole);
                    if(role){
                        req.user_purchased_versions = role.user_purchased_versions;
                    }
                    else{
                        req.user_purchased_versions = '1';
                    }
                    if(r_error){ return next(r_error); }
                    //--//
                    next();
                }
            }
            }
            else {
                next(401);
            }
        } catch (error) {
            return next(error);
        }
    };
};
