const Sequelize = require('sequelize');
const sequelize = new Sequelize('crosssend', 'root', 'kbcici3146', {
  host: '127.0.0.1',
  dialect: 'mysql',
  // operatorsAliases: false,
  dialectOptions: {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    supportBigNumbers: true,
    bigNumberStrings: true
  },
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
  },
  nickname: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: true,
  }
});
const friendModel = sequelize.define('friend', {
  from: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  to: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  }
})
const messageModel = sequelize.define('message',{
  from: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  to: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  message: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  }
})


const beeBoxModel = sequelize.define('beebox', {
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
  key: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  lastModified: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  sender: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: true,
  },
  receiver: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: true,
  },
  authCode: {
    type: Sequelize.STRING,
    length: 255,
    allowNull: false,
  },
  isUsed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  }
})
UserModel.sync({ force: false });
beeBoxModel.sync({ force: false });
friendModel.sync({ force: false })
messageModel.sync({ force: false })
console.log(UserModel)
//  export { sequelize, UserModel}
exports.sequelize = sequelize
exports.UserModel = UserModel
exports.beeBoxModel = beeBoxModel
exports.friendModel = friendModel
exports.messageModel = messageModel