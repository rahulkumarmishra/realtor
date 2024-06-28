const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('socket_user', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    socket_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_online: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: "1=Online, 0=Offline"
    }
  }, {
    sequelize,
    tableName: 'socket_user',
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
    ]
  });
};
