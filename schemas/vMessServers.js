module.exports = function (sequelize,DataTypes) {
  let Model = sequelize.define(
    "vMessServers",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      server_name: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      server_flag: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      vmess_url: {
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
      tableName: "vMessServers",
    }
  );
  return Model;
};
