module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("users_participation", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            }
        },
        planing_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.ENUM('in_progress', 'completed', 'not_completed'),
            allowNull: true
        },
    }, {
        tableName: "users_participation"
    });
    //--//
    return Model;
};
