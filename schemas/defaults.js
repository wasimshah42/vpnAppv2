module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("defaults", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        type: {
          type: DataTypes.ENUM,
          values: ['duration', 'paypal', 'usdt', 'stripe'],
          allowNull: true,
          defaultValue: null,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        secret_key: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        public_key: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        mode: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        client_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        client_secret: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        app_id: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        app_secret: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        receive_address: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        notify_url: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
    }, {
        tableName: "defaults"
    });
    //--//
    return Model;
};
