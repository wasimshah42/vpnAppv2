const crypto = require("crypto");
module.exports = function (sequelize,DataTypes) {
  let Model = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM,
        values: ['Normal','Guest'],
        allowNull: true,
        defaultValue: 'Normal',
      },
      user_name: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      verification_code: {
        type: DataTypes.INTEGER,
        unique: { args: true },
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      email_verified: {
        type: DataTypes.ENUM,
        values: ['0','1'],
        allowNull: true,
        defaultValue: '0',
      },
      user_type: {
        type: DataTypes.ENUM,
        values: ['Enterprise','Individual','Partner'],
        allowNull: true,
        defaultValue: 'Individual',
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      device_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      device_token: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      recipient_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      user_purchased_versions: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      balance: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      free_usage_time: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      subscription_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      subscription_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      start_trial_period: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      
      vpn_connected: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true, //
          //isAlphanumeric: true
        },
      },
      invitation_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      password_reset_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
      user_status: {
        type: DataTypes.ENUM,
        values: ['pending','active','inactive'],
        allowNull: true,
        defaultValue: 'active',
      },
      login_limit: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "users",
    }
  );
  //--//
  Model.prototype.toJSON = function (options) {
    let attributes = Object.assign({}, this.get());
    delete attributes.password;
    return attributes;
  };
  Model.prototype.hashPassword = function () {
    if (this.password) {
      this.password = crypto
        .createHash("sha1")
        .update(this.password)
        .digest("hex");
    }
  };
  Model.prototype.validatePassword = function (password) {
    password = String(password).trim();
    let password_Hash = crypto.createHash("sha1").update(password).digest("hex");
    let hashedPassword = String(this.password).trim();
    return password_Hash === hashedPassword;
  };
  return Model;
};
