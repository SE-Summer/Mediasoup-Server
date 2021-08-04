"use strict";
exports.__esModule = true;
var nodemailer = require('nodemailer'); //引入模块
var transporter = nodemailer.createTransport({
    service: '163',
    port: 465,
    secure: true,
    auth: {
        user: 'summer_mymeeting@163.com',
        pass: 'AZTESQQZXQWHXHYB'
    }
});
function sendMail(mail, code, call) {
    var mailOptions = {
        from: '"MyMeeting官方" <summer_mymeeting@163.com>',
        to: mail,
        subject: 'MyMeeting验证邮件',
        text: '',
        html: '<h2>欢迎使用MyMeeting，你的验证码是：</h2>' +
            '<div style="font-size: 40px; color: #00000099; font-weight: bold; text-align: center">' +
            '<p>' + code + '</p>' +
            '</div>' +
            '<p>验证码三十分钟内有效。 </p>' +
            '<p>更多内容请访问www.</p>'
    };
    console.log("Sending Email: ", code, " To: ", mail);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            call(false);
        }
        else {
            call(true);
        }
    });
}
exports.sendMail = sendMail;
