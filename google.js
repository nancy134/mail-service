const axios = require("axios")
const utilities = require('./utilities');
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    ['https://local.phowma.com']
);

exports.sendMail = function(body){
    return new Promise(function(resolve, reject){
        oAuth2Client.setCredentials(body.tokens);
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        const mailComposer = new MailComposer(body.options);
        mailComposer.compile().build().then(function(message){
           var buffer = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
           gmail.users.messages.send({
               userId: 'me',
               resource: {
                   raw: buffer
               }
           }).then(function(sentMail){
               resolve(sentMail);
           }).catch(function(err){
               reject(err);
           });
        }).catch(function(err){
           reject(err);
        });
    });
}

