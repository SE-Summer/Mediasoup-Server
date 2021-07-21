const nodemailer = require('nodemailer'); //引入模块
let transporter = nodemailer.createTransport({
    service: '163',
    port: 465,
    secure: true,
    auth: {
        user: 'zjcxjz@163.com',
        pass: 'YFNQEBEHISUPJWIY'
    }
});

export function sendMail(mail, code, call) {
    let mailOptions = {
        from: '"MyMeeting官方" <zjcxjz@163.com>',
        to: mail,
        subject: 'MyMeeting验证邮件',
        text: '',
        html: '<h2>欢迎使用MyMeeting，你的验证码是：</h2>' +
            '<div style="font-size: 40px; color: #00000099; font-weight: bold; text-align: center">' +
            '<p>'+ code +'</p>' +
            '</div>',
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            call(false)
        } else {
            call(true)
        }
    });

}