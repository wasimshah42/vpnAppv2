const sequelize = require("./../sequelize/sequelize");
const models = sequelize.models;
module.exports = function (access) {
    return async function (req, res, next) {
        try {
            let role = String(req.role).trim().toLowerCase();
            if(!access.includes(role)){return next(403);}
            return next();
        } catch (error) {
            return next(error);
        }
    };
};
