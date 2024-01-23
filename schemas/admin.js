module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("admin", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        admin_fname: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        admin_lname: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        admin_email: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        admin_role: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        admin_status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
    }, {
        tableName: "admin"
    });
    Model.prototype.toJSON = function (options) {
      let attributes = Object.assign({}, this.get());
      delete attributes.password;
      return attributes;
    };
    //--//
    return Model;
    
};