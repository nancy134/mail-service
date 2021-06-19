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


// {
//     from: "email address",
//     to: "email address",
//     replyTo: "email address",
//     subject: "string",
//     text: "string"
// }
function sendMail(body){
    return new Promise(function(resolve, reject){
         transporter.sendMail({
            from: body.from,
            to: body.to,
            replyTo: body.replyTo,
            subject: body.subject,
            html: body.text,
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

exports.sendListingInquiry = function(fromAddress, body){
    return new Promise(function(resolve, reject){
        var sendBody = {
            from: fromAddress,
            to: body.broker.toLowerCase(),
            replyTo: body.client.toLowerCase(),
            subject: body.subject,
            text: body.message
        };
        sendMail(sendBody).then(function(result){
            resolve(result);
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.sendAssociationInvite = function(authParams, fromAddress, body){
    return new Promise(function(resolve, reject){
        var sendBody = {
            from: fromAddress,
            to: body.associateEmail.toLowerCase(),
            replyTo: body.userEmail.toLowerCase(),
            subject: body.subject,
            text: body.message
        };
        jwt.verifyToken(authParams).then(function(jwtResult){
            sendMail(sendBody).then(function(result){
                resolve(result);
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}

