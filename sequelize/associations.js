module.exports = function (db) {  
    db.serverDetails.belongsTo(db.serverDetails, {
        required: false,
        as: "serverDetails",
        foreignKey: 'parent_id'
    });
    db.serverDetails.hasMany(db.serverDetails, {
        required: false,
        as: "serverDetails_",
        foreignKey: 'parent_id'
    }); 
    db.v2rayServersDetails.belongsTo(db.v2rayServersDetails, {
        required: false,
        as: "v2rayServersDetails",
        foreignKey: 'parent_id'
    });
    db.v2rayServersDetails.hasMany(db.v2rayServersDetails, {
        required: false,
        as: "v2rayServersDetails_",
        foreignKey: 'parent_id'
    }); 
    
    db.packages.belongsTo(db.versions, {
        required: false,
        as: "versions",
        foreignKey: 'user_type_versions'
    });
    db.versions.hasMany(db.packages, {
        required: false,
        as: "packages",
        foreignKey: 'user_type_versions'
    }); 
    db.user_subscription.belongsTo(db.packages, {
        required: false,
        as: "packages",
        foreignKey: 'package_id'
    });
    db.packages.hasMany(db.user_subscription, {
        required: false,
        as: "user_subscription",
        foreignKey: 'package_id'
    }); 
};