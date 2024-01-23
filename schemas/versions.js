module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("versions", {
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
    }, {
        tableName: "versions"
    });
    //--//
    return Model;
};