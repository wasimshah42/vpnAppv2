module.exports = function (sequelize, DataTypes) {
    let Model = sequelize.define("adsDetails", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        ad_type: {
          type: DataTypes.ENUM,
          values: ['Simple', 'Mediation', 'Bidding'],
          allowNull: true,
          defaultValue: null,
        },
        device_type: {
          type: DataTypes.ENUM,
          values: ['android', 'ios'],
          allowNull: true,
          defaultValue: null,
        },
        banner_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        banner_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        interstitial_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        interstitial_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        interstitial_video_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        interstitial_video_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        native_advance_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        native_advance_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        native_advnace_video_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        native_advnace_video_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        reward_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        reward_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
        reward_video_ad: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
        },
        reward_video_ad_status: {
          type: DataTypes.ENUM,
          values: ['on', 'off'],
          allowNull: true,
          defaultValue: 'off',
        },
    }, {
        tableName: "adsDetails"
    });
    //--//
    return Model;
};