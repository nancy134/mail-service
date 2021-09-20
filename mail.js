const nodemailer = require("nodemailer");
const aws = require("aws-sdk");
const jwt = require("./jwt");
const mustache = require('mustache');
const axios = require("axios")

const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1"
});

const transporter = nodemailer.createTransport({
    SES: {ses, aws},
});

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');

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
exports.uploadListing = function(html){
    return new Promise(function(resolve, reject){
        var uuid = uuidv1();
        var key = "mailPreview/" + uuid + ".html";
       
        var params = {
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: html,
            ContentType: "text/html"
        };
        s3.upload(params, function(s3Err, s3Data){
            if (s3Err){
                reject(s3Err);
            } else {
                resolve(s3Data);
            }
        });
    });
}


exports.sendListing = function(authParams, fromAddress, body){
    return new Promise(function(resolve, reject){
        var url = "https://ph-mail-template.s3.amazonaws.com/listing.html";
        var options = {
            url: url,
            method: 'GET'
        };
        axios(options).then(function(html){


            var finalHtml = mustache.render(html.data, body.listing);
            if (!body.preview){ 
                var sendData = {
                    from: fromAddress,
                    to: body.to,
                    replyTo: body.replyTo,
                    subject: body.subject,
                    text: finalHtml
                };
                sendMail(sendData).then(function(result){
                    resolve(result);
                }).catch(function(err){
                    reject(err);
                });
            } else {
              
                exports.uploadListing(finalHtml).then(function(link){
                    resolve(link);
                }).catch(function(err){
                    reject(err);
                });
            }
        }).catch(function(err){
            
            reject(err);
        });
    });
}

exports.sendListings = function(authParams, body){
    return new Promise(function(resolve, reject){
        exports.getListingsTemplates().then(function(templates){
        console.log(templates);
            var finalHeader = mustache.render(templates.header, body);
            var finalListing = mustache.render(templates.listing, body.listings[0]);

            var finalHtml = finalHeader + finalListing + templates.footer;

            var sendData = {
                from: body.from,
                to: body.to,
                replyTo: body.replyTo,
                subject: body.subject,
                text: finalHtml
            };
            sendMail(sendData).then(function(result){
                resolve(result);
            }).catch(function(err){
                console.log(err)
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}

exports.getListingsTemplates = function(){
    return new Promise(function(resolve, reject){
        var urlHeader = "https://ph-mail-template.s3.amazonaws.com/header.html";
        var urlSingleListing = "https://ph-mail-template.s3.amazonaws.com/singleListing.html";
        var urlFooter = "https://ph-mail-template.s3.amazonaws.com/footer.html";
        var options = {
            url: urlHeader,
            method: 'GET'
        };
        axios(options).then(function(header){
            options.url = urlSingleListing;
            axios(options).then(function(singleListing){
                options.url = urlFooter;
                axios(options).then(function(footer){
                    var templates = {
                        header: header.data,
                        listing: singleListing.data,
                        footer: footer.data
                    };
                    resolve(templates);
                }).catch(function(err){
                    reject(err);
                });
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}
