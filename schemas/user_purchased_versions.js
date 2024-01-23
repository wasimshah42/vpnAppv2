module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("user_purchased_versions", {
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
        version_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
    }, {
        tableName: "user_purchased_versions"
    });
    //--//
    return Model;
};