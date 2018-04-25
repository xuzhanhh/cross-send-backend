const Sequelize = require('sequelize');
const sequelize = new Sequelize('crosssend', 'root', 'kbcici3146', {
  host: '127.0.0.1',
  dialect: 'mysql',
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

});

const UserModel = sequelize.define('userTest3', {
  username: {
    type: Sequelize.STRING,
    length: 20,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  }
});

const beeBoxModel = sequelize.define('beebox',{
  fileName: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  fileSize: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  sender: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  receiver:{
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  authCode:{
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  }
})
UserModel.sync({ force: false });
beeBoxModel.sync({ force: false });
console.log(UserModel)
//  export { sequelize, UserModel}
exports.sequelize = sequelize
exports.UserModel = UserModel
exports.beeBoxModel = beeBoxModel