module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("enterprise_plan_details", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        members_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        devices_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        enterprise_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "enterprise_plan_details"
    });
    //--//
    return Model;
};
