'use strict';
const nodemailer = require('nodemailer');
const logger = require('./common').logger();
const config = require('../config/config').email;

// create reusable transporter object using the default SMTP transport
let poolConfig = {
    pool: false,
    host: config.server_host,
    port: config.server_port,
    secure: true, // use TLS
    auth: {
        user: config.host_user,
        pass: config.host_pwd,
    }
};
let transporter = nodemailer.createTransport(poolConfig);

let mailOptions = {
    from: config.from, // sender address
    to: config.receivers, // list of receivers
}

function sendEmail(title, body) {
    return new Promise((resolve, reject) => {
        // setup email data with unicode symbols
        mailOptions.subject = title;
        mailOptions.text = body;
        mailOptions.html = '<b>' + body + '</b>';
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            }
            resolve(info);
        })
    })
}

exports.sendEmail = sendEmail;
/**
 * @Test
 */
exports.test = function () {
    sendEmail('IP address has changed!',
            'Current IP address is 127.0.0.1')
        .then(info => {
            logger.info(info);
        })
        .catch(error => {
            logger.error(error);
        });
}