const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mail = require('./mail');
const jwt = require('./jwt');
const utilities = require('./utilities');

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("mail-service");
});

app.post('/listing/inquiry/me', (req, res) => {
    var authParmas = jwt.getAuthParams(req);
    mail.sendListingInquiryMe(authParams, req.body).then(function(result){
        res.send(result);
    }).catch(function(err){
        res.send(err);
    });

});

app.post('/listing/inquiry', (req, res) => {
    var fromAddress = utilities.getFromAddress(req); 
    if (fromAddress){
        mail.sendListingInquiry(fromAddress, req.body).then(function(result){
            res.send(result);
        }).catch(function(err){
            res.send(err);
        });
    } else {
        res.send("error getting from address");
    }
});

app.post('/associations/users/invite', (req, res) => {
    var fromAddress = utilities.getFromAddress(req);
    var authParams = jwt.getAuthParams(req);
    mail.sendAssociationInvite(authParams, fromAddress, req.body).then(function(result){
        res.send(result);
    }).catch(function(err){
        res.send(err);
    });
});

app.listen(PORT, HOST);
