const crypto = require("crypto");
module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("auth_keys", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        auth_key: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        device_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        device_type: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        language: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        token: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: "auth_keys"
    });
    //--//
    Model.prototype.toJSON = function (options) {
        let attributes = Object.assign({}, this.get());
        // delete attributes.password;
        return attributes;
    };
    Model.prototype.generateAccessToken = function (length) {
        length = parseInt(length) || 40;
        return this.authentication = this.id + "___" + crypto.randomBytes(length).toString('hex');
    };
    return Model;
};
