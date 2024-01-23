module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("referral_users", {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        referral_user_id : {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('commission_pending', 'commission_received'),
            allowNull: true,
        },
        is_deleted: {
            type: DataTypes.ENUM('0', '1'),
            defaultValue: '0',
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: "referral_users",
        timestamps: true,
        paranoid: true,
    });
    //--//
    Model.prototype.toJSON = function (options) {
        let attributes = Object.assign({}, this.get());
        return attributes;
    };
    return Model;
};
