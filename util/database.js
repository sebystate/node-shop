const Sequelize = require('sequelize').Sequelize;

const sequelize = new Sequelize('node-complete', 'root', 'mysqlrootpwd', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
