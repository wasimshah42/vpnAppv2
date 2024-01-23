const crypto = require("crypto");
module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("default_data", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        type: {
          type: DataTypes.ENUM,
          values: ['about_us','privacy'],
          allowNull: true,
          defaultValue: null,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        details: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "default_data"
    });
    //--//
    return Model;
};
