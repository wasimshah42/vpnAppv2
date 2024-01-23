module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("v2rayServersDetails", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        uid: {
            type: DataTypes.STRING(255),
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            allowNull: true,
            defaultValue: null,
        },
        is_recommended: {
          type: DataTypes.ENUM,
          values: ['1','0'],
          allowNull: true,
          defaultValue: '0',
        },
        // user_type: {
        //   type: DataTypes.ENUM,
        //   values: ['Enterprise','Individual','Partner'],
        //   allowNull: true,
        //   defaultValue: 'Individual',
        // },
        server_version: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        file: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        server_version: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        platform: {
          type: DataTypes.ENUM,
          values: ['all','Android','iOS','Mac OS','Windows'],
          allowNull: true,
          defaultValue: 'all',
        },
        // user_type: {
        //   type: DataTypes.ENUM,
        //   values: ['Enterprise','Individual','Partner'],
        //   allowNull: true,
        //   defaultValue: 'Individual',
        // },
        server_flag: {
            type: DataTypes.STRING(255),
        },
        server_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        server_address: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        server_port: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        alter_id: {
            type: DataTypes.INTEGER,
        },
        network_security: {
            type: DataTypes.STRING(255),
        },
        network: {
            type: DataTypes.STRING(255),
        },
        host: {
            type: DataTypes.STRING(255),
        },
        path: {
            type: DataTypes.STRING(255),
        },
        enable_udp: {
            type: DataTypes.BIGINT,
        },
        encryption_methods: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
    }, {
        tableName: "v2rayServersDetails"
    });
    //--//
    return Model;
};
