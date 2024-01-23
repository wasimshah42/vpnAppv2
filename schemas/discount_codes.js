module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("discount_codes", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        discount_code: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        discount_amount: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: null,
        },
        discount_percentage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.ENUM,
            values: ['1', '0'],
            allowNull: true,
            defaultValue: '1',
        },
    }, {
        tableName: "discount_codes"
    });
    //--//
    return Model;
};
