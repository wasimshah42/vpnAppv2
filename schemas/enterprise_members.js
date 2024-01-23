module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("enterprise_members", {
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
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        authority: {
          type: DataTypes.ENUM,
          values: ['super_admin','admin','user'],
          allowNull: true,
          defaultValue: null,
        },
        enterprise_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        device_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        device_name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
    }, {
        tableName: "enterprise_members"
    });
    //--//
    return Model;
};
