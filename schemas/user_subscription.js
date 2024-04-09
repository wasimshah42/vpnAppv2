const crypto = require("crypto");
module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("user_subscription", {
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
        payment_method: {
          type: DataTypes.ENUM,
          values: ['PayPal','Stripe','usdt'],
          allowNull: true,
          defaultValue: null,
        },
        package_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        device_type: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        subscription_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        response: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.BIGINT,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: "user_subscription"
    });
    //--//
    return Model;
};
