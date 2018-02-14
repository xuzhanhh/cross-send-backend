/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

let roomId = /\/room(.*)\//.exec(location.href)[1]
// let socket = io('https://192.168.43.32:443', { secure: true });
let socket = io.connect(roomId, { secure: true });
console.log('socket', socket)
const upload = document.getElementById('upload')
const currentInfo = document.getElementById('currentInfo')
const downloadInfo = document.getElementById('downloadInfo')
let fileName = undefined
let fileType = undefined
let fileSize = undefined
let totalRecive = 0
let tempRecive = 1
let tempBlob = []
//分片1M
let chunkSize = 1024*1024
socket.on('binary', (data) => {
  console.log('[default] [binary]', data.index, data.buffer.byteLength)
  //如果完全接受
  if (tempRecive === totalRecive) {
    //放入最后一个
    tempBlob.push(data.buffer)
    var blob = new Blob(tempBlob);
    var objectUrl = URL.createObjectURL(blob);
    console.log(blob.size)
    currentInfo.innerText = `${fileSize}/${fileSize}`  
    if (document.getElementById('download')) {
      document.getElementById('download').href = objectUrl
      document.getElementById('download').innerHTML = '现在可以下载了'
    }
  } else {
    currentInfo.innerText = `${chunkSize*(++tempRecive)}/${fileSize}`    
    tempBlob.push(data.buffer)
  }
});
socket.on('sendChunkLength', (res) => {
  tempBlob = []
  totalRecive = res.times
  fileSize = res.totalSize
})




socket.on('fileInfo', (fileInfo) => {
  console.log('fileInfo')
  if (document.getElementById('download')) {
    document.getElementById('download').download = `${fileInfo.fileName}.${fileInfo.fileType ? fileInfo.fileType : ''}`
  }
  if (downloadInfo) {
    downloadInfo.innerHTML = `向您发送了：${fileInfo.fileName ? fileInfo.fileName : ''}.${fileInfo.fileType ? fileInfo.fileType : ''}   `
  }
})


upload&&upload.addEventListener('change', () => {
  let file = upload.files[0]
  // console.log(file)
  // 读取文件:
  let nameArray = file.name.split('.')
  fileType = nameArray.pop()  
  fileName = nameArray.join(".")
  var reader = new FileReader();
  reader.onload = function (e) {
    var data = e.target.result; // 'data:image/jpeg;base64,/9j/4AAQSk...(base64编码)...'            
    console.log(data)
    console.log(socket)
    socket.emit('getFileInfo', {
      fileName,
      fileType
    })
    // debugger

    let a = data.slice(0, 1000)
    let b = data.slice(1000, data.byteLength)
    let times = Math.ceil(data.byteLength/chunkSize)
    // debugger
    socket.emit('getChunkLength', {times:times, totalSize:data.byteLength})
    let chunkIndex = 0
    for(let i=0; i<data.byteLength;){
      if(i+chunkSize<=data.byteLength){
        socket.emit('upload', {buffer:data.slice(i,i+chunkSize), index:chunkIndex});
        i+=chunkSize
        chunkIndex++
      } else {
        socket.emit('upload', {buffer:data.slice(i,data.byteLength), index:chunkIndex});
        i+=chunkSize
        chunkIndex++        
      }
      console.log('sended', chunkIndex)
    }

    // socket.emit('upload', a);
    // socket.emit('upload', b);
    // preview.style.backgroundImage = 'url(' + data + ')';
  };
  // 以DataURL的形式读取文件:
  reader.readAsArrayBuffer(file);

})

/***/ })
/******/ ]);