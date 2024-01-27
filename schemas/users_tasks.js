module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("users_tasks", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Assuming you have a users table with an id column
            references: {
                model: "users",
                key: "id"
            }
        },
        plaining_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Assuming you have a plaining_center table with an id column
            references: {
                model: "plaining_center",
                key: "id"
            }
        },
        task_title: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        task_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        task_files: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.ENUM('in_progress', 'completed', 'not_completed'),
            allowNull: true,
            defaultValue: null,
        },
    }, {
        tableName: "users_tasks"
    });

    return Model;
};
