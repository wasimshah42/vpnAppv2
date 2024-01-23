module.exports = function (sequelize,DataTypes) {
  let Model = sequelize.define(
    "serverDetails",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      platform: {
        type: DataTypes.ENUM,
        values: ['all','android','ios','mac','windows'],
        allowNull: true,
        defaultValue: 'all',
      },
      IsRecommended: {
        type: DataTypes.ENUM,
        values: ['0','1'],
        allowNull: true,
        defaultValue: '0',
      },
      server_ip: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      flag: {
        type: DataTypes.BIGINT,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      port: {
        type: DataTypes.BIGINT,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
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
      server_status: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      plugin: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "serverDetails",
    }
  );
  return Model;
};
