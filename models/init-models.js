var DataTypes = require("sequelize").DataTypes;
var _admin_timing = require("./admin_timing");

function initModels(sequelize) {
  var admin_timing = _admin_timing(sequelize, DataTypes);


  return {
    admin_timing,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
