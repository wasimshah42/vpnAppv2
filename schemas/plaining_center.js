module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("plaining_center", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        eligibility_criteria: {
          type: DataTypes.ENUM,
          values: ['individual', 'enterprise', 'partner'],
          allowNull: true,
          defaultValue: null,
        },
        plan_title: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        plan_description: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        },
        eligibility_criteria: {
            type: DataTypes.ENUM,
            values: ['in_progress', 'ended'],
            allowNull: true,
            defaultValue: null,
          },
    }, {
        tableName: "plaining_center"
    });
    //--//
    return Model;
};
