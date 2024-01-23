module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("enterprise_companies", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        enterprise_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "enterprise_companies"
    });
    //--//
    return Model;
};
