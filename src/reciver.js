
let socket = io('https://192.168.43.32:443/get', { secure: true });
console.log('socket', socket)
const upload = document.getElementById('upload')
const downloadInfo = document.getElementById('downloadInfo')
let fileName = undefined
let fileType = undefined
socket.on('binary', (data) => {
  console.log('[default] [binary]', data)
  var blob = new Blob([data]);
  var objectUrl = URL.createObjectURL(blob);
  if (document.getElementById('download')) {
    document.getElementById('download').href = objectUrl
    document.getElementById('download').innerHTML = '现在可以下载了'
  }
});

socket.on('fileInfo', (fileInfo) => {
  console.log('fileInfo')
  if (document.getElementById('download')) {
    document.getElementById('download').download = `${fileInfo.fileName}.${fileInfo.fileType ? fileInfo.fileType : ''}`
  }
  if (downloadInfo) {
    downloadInfo.innerHTML = `向您发送了：${fileInfo.fileName ? fileInfo.fileName : ''}.${fileInfo.fileType ? fileInfo.fileType : ''}   `
  }
})


upload.addEventListener('change', () => {
  let file = upload.files[0]
  // console.log(file)
  // 读取文件:
  let nameArray = file.name.split('.')
  fileName = nameArray[0]
  fileType = nameArray[1]
  var reader = new FileReader();
  reader.onload = function (e) {
    var data = e.target.result; // 'data:image/jpeg;base64,/9j/4AAQSk...(base64编码)...'            
    console.log(data)
    console.log(socket)
    socket.emit('getFileInfo', {
      fileName,
      fileType
    })
    socket.emit('upload', data);
    // preview.style.backgroundImage = 'url(' + data + ')';
  };
  // 以DataURL的形式读取文件:
  reader.readAsArrayBuffer(file);
})