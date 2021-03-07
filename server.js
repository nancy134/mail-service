const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const nodemailer = require("nodemailer");
const aws = require("aws-sdk");

const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1"
});

const transporter = nodemailer.createTransport({
    SES: {ses, aws},
});

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("mail-service");
});

app.get('/sendmailtest', (req, res) => {
transporter.sendMail(
  {
    from: "support@sabresw.com",
    to: "nancy_piedra@yahoo.com",
    subject: "Inquiry on 49 Bemis St, Weston, MA",
    text: "Someone is asking question about your listing",
    ses: {
      // optional extra arguments for SendRawEmail
      Tags: [
        {
          Name: "tag_name",
          Value: "tag_value",
        },
      ],
    },
  },
  (err, info) => {
    console.log(info.envelope);
    console.log(info.messageId);
  }
);
});

app.listen(PORT, HOST);
