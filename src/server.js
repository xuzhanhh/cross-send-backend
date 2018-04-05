
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
const serve = require('koa-static');
const Router = require('koa-router');
const enforceHttps = require('koa-sslify');
let router = new Router();
var certOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'private.key')),
  cert: fs.readFileSync(path.resolve(__dirname, 'certificate.crt')),
  requestCert: false,
  rejectUnauthorized: false
}
var devCertOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
  cert: fs.readFileSync(path.resolve(__dirname, 'server.crt')),
  requestCert: false,
  rejectUnauthorized: false
}
let id2socket = {}
const main = serve(path.resolve(__dirname, '../public'));

router
  .get('/hello', (ctx, next) => {
    ctx.response.type = 'json'
    ctx.response.body = { info: 'hello world' }
  })
  .get('/createUniqueId', (ctx, next) => {

    var d = new Date().getTime();
    var uuid = 'xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
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
// app.use(router.get('/:id/send', send))
// app.use(router.get('/:id/get', get))
if (process.env.NODE_ENV === 'dev') {
} else {
  console.log('enforceHttps')
  app.use(enforceHttps());
}
app
  .use(router.routes())
  .use(router.allowedMethods());
app.use(main)

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



