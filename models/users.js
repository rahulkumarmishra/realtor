const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "email"
    },
    country_code: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "Admin = 0, Users = 1,"
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING(11),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    latitude: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    longitude: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_verified: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: "0 = Not verified, 1 = verified"
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1 = active. 0 = inactive"
    },
    device_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    device_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "1= Android, 2= IOS"
    },
    forgot_password_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_notification: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "1 = on, 2 = off"
    },
    social_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "0"
    },
    social_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0: Normal Login, 1: Twitter, 2:  Google, 3:  Apple"
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  });
};
