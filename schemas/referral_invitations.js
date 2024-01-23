const crypto = require("crypto");
module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("referral_invitations", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        inviter_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        invited_device_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        referal_code: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        invitation_status: {
          type: DataTypes.ENUM,
          values: ['pending','accepted'],
          allowNull: true,
          defaultValue: 'pending',
        },
        invitation_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "referral_invitations"
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
