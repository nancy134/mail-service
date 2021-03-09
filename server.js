const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mail = require('./mail');
const jwt = require('./jwt');
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
    mail.sendListingInquiry(req.body).then(function(result){
        res.send(result);
    }).catch(function(err){
        res.send(err);
    });
});

app.listen(PORT, HOST);
