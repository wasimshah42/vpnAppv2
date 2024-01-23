let connection = null;
let sequelize = require("sequelize");
let config = require("./../config/db");
//--//
sequelize.DataTypes.DATE.prototype._stringify = function _stringify(date, options){
    date = this._applyTimezone(date, options);
    return date.format("YYYY-MM-DD HH:mm:ss");
};
//--//
let dbConfig = {
    host: config.host,
    port: config.port,
    logging: config.logging,
    dialect: config.dialect,
    pool: config.pool,
    dialectOptions: config.dialectOptions,
    omitNull: true,
    benchmark: true,
    define: {
        paranoid: true,
        timestamp: true,
        subQuery: false,
        underscored: true,
        duplicating: false,
        underscoredAll: true,
        // createdAt: "created_at",
        // updatedAt: "updated_at",
        // deletedAt: "deleted_at",
        defaultScope: {
            omitNull: true,
            benchmark: true,
            paranoid: false,
            subQuery: false,
            duplicating: false,
            // where: {deleted_at: null},
            // attributes: {exclude: ["deleted_at"]}
        }
    }
};
///*if(config.dialect === "mssql"){dbConfig.define.schema = config.schema;}*/
//--//
if(!connection){connection = new sequelize(config.name, config.user, config.pass, dbConfig);}
//--//
module.exports = {
    config,
    sequelize,
    connection
};
