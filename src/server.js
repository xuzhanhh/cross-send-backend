
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
let  router = new Router();
var certOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
  cert: fs.readFileSync(path.resolve(__dirname,'server.crt')),
  requestCert: false,
  rejectUnauthorized: false
}
let id2socket = {}
const main = serve(path.resolve(__dirname,'../public'));

router
  .get('/room/:id/get', (ctx, next)=>{
    let roomId = ctx.params.id
    let socket = null
    if(id2socket[roomId]){
      socket = id2socket[roomId]
    } else {
      socket = io.of(`${roomId}`).on('connection', connectionHandle)
      id2socket[roomId] = socket
    }
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname,'../public/get/index.html'))
  })
  .get('/room/:id/send', (ctx, next)=>{
    let roomId = ctx.params.id
    let socket = null
    if(id2socket[roomId]){
      socket = id2socket[roomId]
    } else {
      socket = io.of(`${roomId}`).on('connection', connectionHandle)
      id2socket[roomId] = socket
    } 
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(path.resolve(__dirname,'../public/send/index.html'))
  })
// app.use(router.get('/:id/send', send))
// app.use(router.get('/:id/get', get))
app.use(enforceHttps());
app
  .use(router.routes())
  .use(router.allowedMethods());
app.use(main)






const httpsServer = require('https').createServer(certOptions, app.callback());

httpsServer.listen(443,() => console.log('>>> https://localhost:' + 443));

// let server1 = io(httpsServer);
let io = require('socket.io')(httpsServer)


// server1.on('connection',connectionHandle);

function connectionHandle(socket) {
  // console.log(socket)
  // mysocket = socket
  // console.log('connect ' + socket.id);
  

  socket.on('getFileInfo',function (fileInfo){
    // fileName = fileInfo.fileName
    // console.log('getFileInfo', JSON.stringify(fileInfo))
    // fileType = fileInfo.fileType
    socket.broadcast.emit('fileInfo', {
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
    })
  })
  socket.on('upload',function (reciveData){
    data = reciveData
    // console.log('sending', data)
    socket.broadcast.emit('binary', data);
  })
  socket.on('getChunkLength', function(chunkLength){
    // console.log('getChunkLength', chunkLength)
    socket.broadcast.emit('sendChunkLength', chunkLength);
  })


  socket.on('disconnect', () => console.log('disconnect ' + socket.id));
}



