const nodemailer = require("nodemailer");
const aws = require("aws-sdk");
const jwt = require("./jwt");
const mustache = require('mustache');
const axios = require("axios")
const utilities = require('./utilities');

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
        var toField = "";
        if (body.toEmail){
            toField = body.toEmail;
        } else if (body.broker){
            toField = body.broker.toLowerCase();
        }
        var sendBody = {
            from: fromAddress,
            to: toField,
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
            Bucket: process.env.S3_BUCKET_MAIL_TEMPLATES,
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


exports.sendListing = function(authParams, fromAddress, domain, body){
    return new Promise(function(resolve, reject){
        var url = 
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/listing-new2.html";
        var options = {
            url: url,
            method: 'GET'
        };
        axios(options).then(function(html){

            var html = html.data;
            html = html.replace(/#38761d/g, body.color);
            html = html.replace(/#d9ead3/g, body.colorLight);

            if (!body.preview){
                var promises = [];
                for (var i=0; i<body.contacts.length; i++){
                    var unsubscribe = utilities.getUnsubscribeLink(domain, body.contacts[i]);
                    body.listing.unsubscribe = unsubscribe;
                    var finalHtml = mustache.render(html, body.listing);
                    finalHtml = finalHtml.replace(/&#x2F;/g, '/');
                    var sendData = {
                        from: fromAddress,
                        to: body.contacts[i],
                        replyTo: body.replyTo,
                        subject: body.subject,
                        text: finalHtml
                    }
                    var sendPromise = sendMail(sendData);
                    promises.push(sendPromise);
                }
                Promise.all(promises).then(function(result){
                    resolve(result);
                }).catch(function(err){
                    reject(err);
                });
            } else {
                var finalHtml = mustache.render(html, body.listing);
                finalHtml = finalHtml.replace(/&#x2F;/g, '/');
                exports.uploadListing(finalHtml).then(function(link){
                    if (body.content){
                        link.content= finalHtml;
                    }
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
            var finalHeader = mustache.render(templates.header, body);

            var finalHtml = finalHeader;
            var finalListing;
            for (var i=0; i<body.listings.length; i++){
                finalListing = mustache.render(templates.listing, body.listings[i]);
                finalHtml = finalHtml + finalListing;
            }

            var finalHtml = finalHtml + templates.footer;
            if (!body.preview){
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

exports.getListingsTemplates = function(){
    return new Promise(function(resolve, reject){
        var urlHeader =
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/header.html";
        var urlSingleListing =
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/singleListing.html";
        var urlFooter =
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/footer.html";
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

exports.sparkCreateEmail = function(fromAddress, body){
    return new Promise(function(resolve, reject){
        var url =
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/sparkListings.html";
        var options = {
            url: url,
            method: 'GET'
        };
        axios(options).then(function(html){
            var finalHtml = mustache.render(html.data, body);

                exports.uploadListing(finalHtml).then(function(link){
                    link.content = finalHtml;
                    resolve(link);
                }).catch(function(err){
                    reject(err);
                });

        }).catch(function(err){
            reject(err);
        });
    });
}

exports.findingcreCreateEmail = function(fromAddress, body){
    return new Promise(function(resolve, reject){
        var url =
           "https://" +
           process.env.S3_BUCKET_MAIL_TEMPLATES +
           ".s3.amazonaws.com/findingcreListings.html";
        var options = {
            url: url,
            method: 'GET'
        };
        axios(options).then(function(html){
            var newBody = utilities.convertFindingcreData(body);
            var finalHtml = mustache.render(html.data, newBody);

            exports.uploadListing(finalHtml).then(function(link){
                resolve(link);
            }).catch(function(err){
                reject(err);
            });
        }).catch(function(err){
            reject(err);
        });
    });
}
