// const express = require('express');
const Koa = require('koa')
// const app = express();
const websockify = require('koa-websocket');
const app = websockify(new Koa());
// const app = new Koa() 
const fs = require('fs')
const path = require('path');
// const io = require('socket.io');
const https = require('https');
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body');
const session = require("koa-session2")
const serve = require('koa-static');
const Router = require('koa-router');
const enforceHttps = require('koa-sslify');
var crypto = require('crypto');
var request = require('request-promise');
// let request = require('async-request')
const sql = require(__dirname + '/model/user')
const Op = require('sequelize').Op;
const UserModel = sql.UserModel
const beeBoxModel = sql.beeBoxModel
const friendModel = sql.friendModel
const sts = require('./sts-auth')
var bcrypt = require('bcryptjs');
const mail = require('./mail')

let router = new Router();
exports.router = router
// 认证相关
const passport = require(__dirname + '/passport_config.js')
var certOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'private.key')),
  cert: fs.readFileSync(path.resolve(__dirname, 'certificate.crt')),
  requestCert: false,
  rejectUnauthorized: false
}
// var devCertOptions = {
//   key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
//   cert: fs.readFileSync(path.resolve(__dirname, 'server.crt')),
//   requestCert: false,
//   rejectUnauthorized: false
// }
let id2socket = {}
const main = serve(path.resolve(__dirname, '../public'));


router
  .post('/beeInfo', async (ctx, next) => {
    console.log(ctx.request.body)
    let d = new Date().getTime();
    let authCode = 'xxxxx'.replace(/[xy]/g, function (c) {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    const { postData } = ctx.request.body
    for (let body of postData) {
      console.log(body)
      let data = await beeBoxModel.create({
        fileName: body.fileName,
        fileSize: body.fileSize,
        key: body.key,
        lastModified: body.lastModified,
        authCode: authCode,
        sender: body.sender ? body.sender : '',
        receiver: body.receiver ? body.receiver : '',
        isUsed: false
      })
    }
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, message: 'success', authCode: authCode.toString() }
  })
  .post('/getBeeInfo', async (ctx, next) => {
    const { authCode } = ctx.request.body

    let data = await beeBoxModel.findAll({ where: { authCode: authCode, isUsed: false } }).then(result => result)
    if (data.length > 0) {
      let idList = []
      data.forEach((item) => {
        idList.push(item.id)
      })
      console.log(idList)
      await beeBoxModel.update({ isUsed: true }, {
        where: { id: idList }
      })
    }
    ctx.response.type = 'json';
    if (data.length > 0) {
      ctx.response.body = { code: '0', data: data }
    } else {
      ctx.response.body = { code: '-1', errMessage: '提取码验证失败' }

    }
  })
  .post('/sendAuthMail', async (ctx, next) => {
    const { body } = ctx.request
    mail.mailOptions.to = body.receiver
    mail.mailOptions.html = `您的蜜蜂箱提取码为: ${body.authCode}`
    mail.transporter.sendMail(mail.mailOptions, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info);
    })
    ctx.response.type = 'json'
    ctx.response.body = { code: 0, message: 'success' }
  })
  .get('/sts-auth', async (ctx, next) => {
    // 获取前端过来的参数
    var method = sts.getParam(ctx.request.url, 'method');
    var pathname = decodeURIComponent(sts.getParam(ctx.request.url, 'pathname'));

    // 获取临时密钥，计算签名
    await sts.getTempKeys(function (err, tempKeys) {
      var data;
      if (err) {
        data = err;
      } else {
        data = {
          Authorization: sts.getAuthorization(tempKeys, method, pathname),
          XCosSecurityToken: tempKeys['credentials'] && tempKeys['credentials']['sessionToken'],
        };
      }
      // res.header('Access-Control-Allow-Origin', "*")

      // 返回数据给前端
      // res.writeHead(200, {
      //     'Content-Type': 'application/json',
      //     'Access-Control-Allow-Origin': '*',
      //     'Access-Control-Allow-Headers': 'origin,accept,content-type',
      // });
      // res.write(JSON.stringify(data) || '');
      // res.end();
      ctx.response.type = 'json'
      ctx.response.body = data
      console.log(ctx.response.body)
    });
    console.log(ctx.response.body)
  })
  .get('/hello', (ctx, next) => {
    ctx.response.type = 'json'
    ctx.response.body = { info: 'hello world' }
  })
  .get('/createUniqueId', (ctx, next) => {

    let d = new Date().getTime();
    let uuid = 'xxxxx'.replace(/[xy]/g, function (c) {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    //创建子房间
    if (id2socket[uuid]) {
      socket = id2socket[uuid]
    } else {
      socket = io.of(`${uuid}`).on('connection', connectionHandle)
      id2socket[uuid] = socket
    }
    ctx.response.type = 'json'
    ctx.response.body = { uuid: uuid }

    console.log('createUniqueId', uuid)
  })
  .get('/findUniqueId', (ctx, next) => {
    // console.log(ctx.)
    const { uuid } = ctx.query
    let room = id2socket[uuid]
    // console.log('room', room)    
    ctx.response.type = 'json'
    ctx.response.body = {}
    if (room) {
      ctx.response.body.code = 1
      // ctx.response.body.room = room
    } else {
      ctx.response.body.code = -1
      ctx.response.body.errMessage = '木有找到该uuid'
    }
  })
  .get('/room/:id/get', (ctx, next) => {
    let roomId = ctx.params.id
    let socket = null
    if (id2socket[roomId]) {
      socket = id2socket[roomId]
    } else {
      socket = io.of(`${roomId}`).on('connection', connectionHandle)
      id2socket[roomId] = socket
    }
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/get/index.html'))
  })
  .get('/room/:id/send', (ctx, next) => {
    let roomId = ctx.params.id
    let socket = null
    if (id2socket[roomId]) {
      socket = id2socket[roomId]
    } else {
      socket = io.of(`${roomId}`).on('connection', connectionHandle)
      id2socket[roomId] = socket
    }
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/send/index.html'))
  })
  .get('/', (ctx, next) => {
    console.log('in....')
    ctx.response.redirect('/intro')
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/index.html'))
  })
  .get('/.well-known/acme-challenge/:id', (ctx, next) => {
    let id = ctx.params.id
    // ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(`/home/xuzhanhong/fast-share/public/.well-known/acme-challenge/${id}`)
  })
  .get('/sts-post', (ctx, next) => {
    // ctx.response.type = 'html';
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/sts-post.html'))
  })
  .get('/intro', (ctx, next) => {
    // console.log('in....')
    // ctx.response.redirect('/intro')
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/index.html'))
  })
  .get('/send', (ctx, next) => {
    // console.log('in....')
    // ctx.response.redirect('/intro')
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname, '../public/index.html'))
  })
  .post('/uploadFile', (ctx, next) => {
    console.log('in uploadFile')
    console.log(ctx.request.body)
    const file = ctx.request.body.files.file;
    const reader = fs.createReadStream(file.path);
    const stream = fs.createWriteStream(path.join(os.tmpdir(), Math.random().toString()));
    reader.pipe(stream);
    console.log('uploading %s -> %s', file.name, stream.path);
    ctx.response.body = { code: 0, message: '上传成功' }
  })
  /**
 * 认证登录
 */
  .get('/xauth/github',
    passport.authenticate('github'))
  .get('/xauth/github/callback', function (ctx, next) {
    return passport.authenticate('github',
      function (req, res) {
        console.log(ctx, req, res)
        // Successful authentication, redirect home.
        ctx.redirect('/');
      })(ctx, next)
  })
  .post('/xauth/login', function (ctx, next) {
    return passport.authenticate('local', function (err, user, info, status) {
      if (user) {
        ctx.body = { 'code': 0, 'message': '登陆成功', username: user.username, userid: user.id, nickname: user.nickname }
        return ctx.login(user)
      } else {
        ctx.body = info
      }
    })(ctx, next)
  })
  .post('/showFriends', async function (ctx, next) {
    if (ctx.isAuthenticated()) {
      const { userId } = ctx.request.body
      let data = await sql.sequelize.query(`select userTest3s.* from friends, userTest3s where friends.from='${userId}' and friends.to = userTest3s.id`)
      ctx.response.body = { code: 0, data }
    } else {
      ctx.response.body = { code: -1, errMessage: '请登录' }
    }
  })
  .post('/showUser', async function (ctx, next) {
    console.log('showUser')
    if (ctx.isAuthenticated()) {
      const { keyword } = ctx.request.body
      let data = await UserModel.findAll({
        where: {
          nickname: {
            [Op.like]: `%${keyword}%`,
          }
        }
      }).then(result => result)
      console.log('data*************', data)
      ctx.response.body = { code: 0, userInfo: data }
    } else {

    }
  })
  .post('/addFriend', async function (ctx, next) {
    if (ctx.isAuthenticated()) {
      const { from, to } = ctx.request.body
      let original = await friendModel.create({
        from: from,
        to: to
      })
      let reverse = friendModel.create({
        from: to,
        to: from
      })
      ctx.response.body = { code: 0, data: { original: original, reverse: reverse } }
    } else {
      ctx.response.body = { code: -1, errMessage: '请登录' }
    }
  })
  .post('/postMessage', async function (ctx, next) {
    if (ctx.isAuthenticated()) {
      const { from, to, message } = ctx.request.body
      console.log(from, to, message)
      let ret = await sql.messageModel.create(
        {
          from: from,
          to: to,
          message
        }
      )
      ctx.response.body = { code: 0, data: { message: ret } }
    } else {
      ctx.response.body = { code: -1, errMessage: '请登录' }
    }
  })
  .post('/findMessage', async function (ctx, next) {
    if (ctx.isAuthenticated()) {
      const { from, to } = ctx.request.body
      let fromMessage = await sql.messageModel.findAll({
        where: {
          from: from,
          to: to,
        }
      })
      let toMessage = await sql.messageModel.findAll({
        where: {
          from: to,
          to: from,
        }
      })
      let message = [...fromMessage, ...toMessage]
      ctx.response.body = { code: 0, data: { message } }
    } else {
      ctx.response.body = { code: -1, errMessage: '请登录' }
    }
  })
  .post('/xauth/register', async function (ctx, next) {

    console.log(ctx.request.body)
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(ctx.request.body.password, salt);

    let data = await UserModel.create({
      username: ctx.request.body.username,
      email: ctx.request.body.email,
      password: hash,
      nickname: ctx.request.body.nickname,
    })
    // console.log(data)
    return passport.authenticate('local', function (err, user, info, status) {
      if (user) {
        ctx.body = { 'code': 0, 'message': '登陆成功', username: user.username, userid: user.id, nickname: user.nickname }
        return ctx.login(user)
      } else {
        ctx.body = info
      }
    })(ctx, next)
  })

  /**
  * 认证登出
  */
  .post('/logout', function (ctx, next) {
    console.log('logout', ctx.state.user)
    ctx.logout()
    // ctx.body = {code: 0, message: '登出成功'}
    ctx.body = { auth: ctx.isAuthenticated(), user: ctx.state.user }
    // ctx.redirect('/intro')
    // ctx.body = 'Y'
  })

  // 以下为自定义需要身份认证的路由
  .post('/xauth/test', function (ctx, next) {
    if (ctx.isAuthenticated()) {
      ctx.body = { message: '认证通过' }
    } else {
      // ctx.throw(401)
      ctx.body = { message: '非法访问' }
    }
  })
// app.use(router.get('/:id/send', send))
// app.use(router.get('/:id/get', get))
if (process.env.NODE_ENV === 'dev') {
} else {
  console.log('enforceHttps')
  app.use(enforceHttps());
}
app.use(session({ key: "SESSIONID" }))
// app.use(bodyParser({ multipart: true }))
app.use(koaBody({ multipart: true }));
app.use(passport.initialize())
app.use(passport.session())
app.use(router.routes())
app.use(router.allowedMethods());
app.use(main)





/*
httpsServer和socket.io部分
*/

let httpServer = null
if (process.env.NODE_ENV === 'dev') {
  console.log('dev')
  httpServer = require('http').createServer(app.callback());
  httpServer.listen(80, () => console.log('>>> http://localhost:' + 80));
  // httpServer = require('https').createServer(devCertOptions, app.callback());
  // httpServer.listen(443, () => console.log('>>> https://localhost:' + 443));
  // devCertOptions
} else {
  console.log('publish')
  httpServer = require('https').createServer(certOptions, app.callback());
  httpServer.listen(443, () => console.log('>>> https://localhost:' + 443));
}
// const httpsServer = require('http').createServer(app.callback());


// let server1 = io(httpsServer);
let io = require('socket.io')(httpServer)


// server1.on('connection',connectionHandle);

function connectionHandle(socket) {
  console.log('connect ' + socket.id);
  socket.on('clientInfo', function (clientInfo) {
    console.log('clientInfo', clientInfo)
  })

  socket.on('getFileInfo', function (totalFileInfo) {
    console.log('getFileInfo', totalFileInfo)
    socket.broadcast.emit('fileInfo', JSON.stringify(totalFileInfo))
  })
  socket.on('allowSend', function () {
    socket.broadcast.emit('allowSend')
  })
  socket.on('refuseSend', function () {
    socket.broadcast.emit('refuseSend')
  })
  socket.on('upload', function (reciveData, cb) {
    console.log('upload', reciveData.fileName)
    data = reciveData
    socket.broadcast.emit('binary', data);
    cb(reciveData.index, reciveData.fileName)
  })
  socket.on('getChunkLength', function (chunkLength) {
    socket.broadcast.emit('sendChunkLength', chunkLength);
  })


  socket.on('disconnect', () => console.log('disconnect ' + socket.id));
}



