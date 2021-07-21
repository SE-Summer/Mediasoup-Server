"use strict";
exports.__esModule = true;
exports.sendMail = void 0;
var nodemailer = require('nodemailer'); //引入模块
var transporter = nodemailer.createTransport({
    //node_modules/nodemailer/lib/well-known/services.json  查看相关的配置，如果使用qq邮箱，就查看qq邮箱的相关配置
    service: '163',
    port: 465,
    secure: true,
    auth: {
        user: 'zjcxjz@163.com',
        pass: 'YFNQEBEHISUPJWIY' // smtp 的授权码
    }
});
function sendMail(mail, code, call) {
    // 发送的配置项
    var mailOptions = {
        from: '"MyMeeting官方" <zjcxjz@163.com>',
        to: mail,
        subject: 'MyMeeting验证邮件',
        text: '',
        html: '<h2>欢迎使用MyMeeting，你的验证码是：</h2>' +
            '<div style="font-size: 40px; color: #00000099; font-weight: bold; text-align: center">' +
            '<p>' + code + '</p>' +
            '</div>'
    };
    //发送函数
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            call(false);
        }
        else {
            call(true); //因为是异步 所有需要回调函数通知成功结果
        }
    });
}
exports.sendMail = sendMail;
