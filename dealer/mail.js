const _ = require("lodash");
const nodemailer = require('nodemailer');
const moment = require('moment');
const credential = require('../secret')


let transporter = nodemailer.createTransport({
    host: credential.mail_host,
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
        user: credential.mail_usr,
        pass: credential.mail_pass
    }
});

let send = (subject, text, html, to) => {
    // setup email data with unicode symbols
    let mailOptions = {
        from: `"南岳建行支付平台" <${credential.mail_usr}>`, // sender address
        to: to || credential.to_admin,   //credential.receivers, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html // html body
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('发送邮件失败', error);
        }
        console.log('邮件发送成功， 标题: %s', subject);
    });
}

module.exports = {
    send
}
