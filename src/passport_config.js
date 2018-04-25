const passport = require('koa-passport')
const LocalStrategy = require('passport-local')
const sql = require(__dirname + '/model/user')
var bcrypt = require('bcryptjs');

const UserModel = sql.UserModel
// 用户名密码验证策略
passport.use(new LocalStrategy(
  /**
   * @param username 用户输入的用户名
   * @param password 用户输入的密码
   * @param done 验证验证完成后的回调函数，由passport调用
   */
  function (username, password, done) {
    let where = { where: { username: username } }
    UserModel.findOne(where).then(function (result) {
      if (result != null) {
        // if (result.password == password) {
        if (bcrypt.compareSync(password, result.password)) {
          console.log('**************result', result)
          return done(null, result)
        } else {
          return done(null, false, { 'code': -1, 'message': '密码错误' })
        }
      } else {
        return done(null, false, { 'code': -1, 'message': '未知用户' })
      }
    }).catch(function (err) {
      log.error(err.message)
      return done(null, false, { message: err.message })
    })
  }
))

// serializeUser 在用户登录验证成功以后将会把用户的数据存储到 session 中
passport.serializeUser(function (user, done) {
  console.log('serializeUser', user.id)
  done(null, user)
})

// deserializeUser 在每次请求的时候将从 session 中读取用户对象
passport.deserializeUser(function (user, done) {
  console.log('deserializeUser', user)
  return done(null, user)
})

// Client ID
// d82a57b413ecf33fa457
// Client Secret
// 9389ecf0ebb4f375c3630662d9dcf0feacb4f9aa
var GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
  clientID: 'd82a57b413ecf33fa457',
  clientSecret: '9389ecf0ebb4f375c3630662d9dcf0feacb4f9aa',
  callbackURL: "http://127.0.0.1/xauth/github/callback"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile)
    console.log(profile.id, profile.emails[0] && profile.emails[0].value ?profile.emails[0].value: "NULL")
    const githubEmail = profile.emails[0] && profile.emails[0].value ? profile.emails[0].value : "NULL"
    // UserModel.findOrCreate({ githubId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
    UserModel.findOrCreate({
      where: {
        username: profile.username,
        email: githubEmail
      },
      defaults: {
        password: "NULL",
      }
    }).spread((user, created) => {
      console.log(user, created)
      return cb(null, user)
    })
  }
));
module.exports = passport