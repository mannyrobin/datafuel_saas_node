'use strict';
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

(function (exports, require, module) {
    var transport = nodemailer.createTransport(smtpTransport({
        service: "gmail",
        auth: {
            user: "beta.datafuel@gmail.com",
            pass: "qweASDzx"
        }
    }));

    class MailService {
        constructor() {
        }

        send(userEmail, subject, body) {
            var mailOptions = {
                to: userEmail,
                subject: subject,
                text: body,
                from: 'data.fuel@datafuel.com'
            };

            transport.sendMail(mailOptions, function (error, response) {
                // console.log(arguments);
                if (error) {
                    // console.log(error);
            //        response.end("error");
                } else {
                    // console.log("Message sent: " + response.message);
            //        response.end("sent");
                }
            });

            // send the message and get a callback with an error or details of the message that was sent
            /*server.send({
                text: body,
                from: "root@datafuel.ru",
                to: userEmail,
                subject: subject
            }, function (err, message) { // console.log(err || message); });*/
        }
    }

    module.exports = new MailService();
})(module.exports, null, module);