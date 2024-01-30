const crypto = require("crypto");
module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("packages", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        device_type: {
            type: DataTypes.ENUM,
            values: ['android','ios'],
            allowNull: true,
            defaultValue: 'android',
          },
          product_id:{
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
          },
        user_type_versions: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        months: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        price: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "packages"
    });
    return Model;
};
