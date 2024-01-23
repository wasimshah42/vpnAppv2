module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("enterprise_users_transactions", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        type: {
          type: DataTypes.ENUM,
          values: ['Withdrawn','Earning','Commission'],
          allowNull: true,
          defaultValue: null,
        },
        referral_user_id:{
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        bank_id:{
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        commission_amount: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: null,
        },
        status: {
          type: DataTypes.ENUM,
          values: ['Pending','Completed','Failed'],
          allowNull: true,
          defaultValue: null,
        }
    }, {
        tableName: "enterprise_users_transactions"
    });
    //--//
    return Model;
};
