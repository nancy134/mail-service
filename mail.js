const nodemailer = require("nodemailer");
const aws = require("aws-sdk");
const jwt = require("./jwt");

const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1"
});

const transporter = nodemailer.createTransport({
    SES: {ses, aws},
});

function sendMail(body){
    return new Promise(function(resolve, reject){
         transporter.sendMail({
            from: "support@sabresw.com",
            to: body.broker,
            replyTo: body.client,
            subject: body.subject,
            text: body.message,
            ses: {},
        },
        (err, info) => {
            if (err){
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
}

exports.sendListingInquiryMe = function(authParams, body){
    var message = body.client + " is interested in 49 Bemis St";
    body.message = message;
    return new Promise(function(resolve, reject){
        jwt.verifyToken(authParams).then(function(jwtResult){
            sendMail(body).then(function(result){
                resolve(result);
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.sendListingInquiry = function(body){
    return new Promise(function(resolve, reject){
        sendMail(body).then(function(result){
            resolve(result);
        }).catch(function(err){
            reject(err);
        });
    });
}

