
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


let sendingTimes = 0
let sendingChunkIndex = 0
let sendingData 
//分片1M
let chunkSize = 1024 * 1024
socket.on('binary', (data) => {
  console.log('[default] [binary]', data.index, data.buffer.byteLength)
  //如果完全接受
  if (tempRecive === totalRecive) {
    //放入最后一个
    tempBlob.push(data.buffer)
    var blob = new Blob(tempBlob);
    var objectUrl = URL.createObjectURL(blob);
    console.log(blob.size)
    // currentInfo.innerText = `${fileSize}/${fileSize}`
    currentInfo.innerText = `${fileSize}/${fileSize}`
    if (document.getElementById('download')) {
      document.getElementById('download').href = objectUrl
      document.getElementById('download').innerHTML = '现在可以下载了'
    }
  } else {
    // currentInfo.innerText = `${chunkSize * (++tempRecive)}/${fileSize}`
    currentInfo.innerText = `${chunkSize * (++tempRecive)}/${fileSize}`
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


upload && upload.addEventListener('change', () => {
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
    sendingData = data
    let times = Math.ceil(data.byteLength / chunkSize)
    sendingTimes = times
    // debugger
    socket.emit('getChunkLength', { times: times, totalSize: data.byteLength })
    let chunkIndex = 0
    let i = 0
    sendChunk(0)
    // socket.emit('upload', { buffer: data.slice(0, i + chunkSize), index: sendingChunkIndex }, (resIndex) => {
    //   console.log('upload success',resIndex)
    // });
    // for (let i = 0; i < data.byteLength;) {
    //   if (i + chunkSize <= data.byteLength) {
    //     socket.emit('upload', { buffer: data.slice(i, i + chunkSize), index: chunkIndex }, (resIndex) => {
    //       console.log('upload success',resIndex)
    //     });
    //     i += chunkSize
    //     chunkIndex++
    //   } else {
    //     socket.emit('upload', { buffer: data.slice(i, data.byteLength), index: chunkIndex }, (resIndex) => {
    //       console.log('upload success',resIndex)
    //     });
    //     i += chunkSize
    //     chunkIndex++
    //   }
    //   console.log('sended', chunkIndex-1)
    // }

    // socket.emit('upload', a);
    // socket.emit('upload', b);
    // preview.style.backgroundImage = 'url(' + data + ')';
  };
  // 以DataURL的形式读取文件:
  reader.readAsArrayBuffer(file);
})

const sendChunk = (reciveIndex)=>{
  let dataWillSend = sendingTimes-reciveIndex>1?
                                       sendingData.slice(reciveIndex*chunkSize, (reciveIndex+1)*chunkSize)
                                      :sendingData.slice(reciveIndex*chunkSize, sendingData.byteLength)


  socket.emit('upload', { buffer: sendingData.slice(reciveIndex*chunkSize, (reciveIndex+1)*chunkSize), index: reciveIndex }, (resIndex) => {
    console.log('upload success', resIndex)
    if(resIndex<sendingTimes)
    sendChunk(resIndex+1)
  });
}