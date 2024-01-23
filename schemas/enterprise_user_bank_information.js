module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("enterprise_user_bank_information", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        type: {
          type: DataTypes.ENUM,
          values: ['bank_account','paypal'],
          allowNull: true,
          defaultValue: 'bank_account',
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        bank_name: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        account_holder: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        iban: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        enterprise_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        status: {
          type: DataTypes.ENUM,
          values: ['0','1','2'],
          allowNull: true,
          defaultValue: '0',
        },
    }, {
        tableName: "enterprise_user_bank_information"
    });
    //--//
    return Model;
};
