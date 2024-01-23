module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("recharge_history", {
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
        recharge_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        recharge_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        recharge_type: {
          type: DataTypes.ENUM,
          values: ['by_card','by_invitation'],
          allowNull: true,
          defaultValue: null,
        },
        payment_gateway: {
          type: DataTypes.ENUM,
          values: ['PayPal','Alipay','Stripe','USDT'],
          allowNull: true,
          defaultValue: null,
        },
        transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
    }, {
        tableName: "recharge_history"
    });
    //--//
    Model.prototype.toJSON = function (options) {
        let attributes = Object.assign({}, this.get());
        // delete attributes.password;
        return attributes;
    };
    return Model;
};
