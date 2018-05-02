let nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
let transporter = null
let mailOptions = null
if (process.env.NODE_ENV === 'dev') {
  transporter = nodemailer.createTransport(smtpTransport({
    host: "smtp.qq.com", // 主机
    secure: true, // 使用 SSL
    port: 465, // SMTP 端口
    auth: {
      user: "519281601@qq.com", // 账号
      pass: "tbndmfcdmtkecahd" // 密码
    }
  }));

  mailOptions = {
    from: '519281601@qq.com', // sender address
    to: '519281601@qq.com', // list of receivers
    subject: 'crosssend.club 蜜蜂箱提取码', // Subject line
    html: '您的蜜蜂箱提取码为: 123456'// plain text body
  };
} else {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'xuzhanhh@gmail.com',
      pass: 'kbcici3146'
    }
  });

  mailOptions = {
    from: 'xuzhanhh@gmail.com', // sender address
    to: '519281601@qq.com', // list of receivers
    subject: 'crosssend.club 蜜蜂箱提取码', // Subject line
    html: '您的蜜蜂箱提取码为: 123456'// plain text body
  };
}

mailOptions = {
  from: '519281601@qq.com', // sender address
  to: '519281601@qq.com', // list of receivers
  subject: 'crosssend.club 蜜蜂箱提取码', // Subject line
  html: '您的蜜蜂箱提取码为: 123456'// plain text body
};

// transporter.sendMail(mailOptions, function (err, info) {
//   if(err)
//     console.log(err)
//   else
//     console.log(info);
// });

exports.transporter = transporter
exports.mailOptions = mailOptions