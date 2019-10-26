//load environment variables 
require('dotenv').config();
let fs = require("fs");
var express=require('express');
var nodemailer = require("nodemailer");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
}));

//use smtp server 
var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: process.env.Emailport,
    auth: {
        user: process.env.Emailuser, //this is our team's fake company gmail account
        pass: process.env.Emailpwd
    },
    tls: {rejectUnauthorized: false},
    debug:true
});

// read the whole css, js files 
app.use(express.static(__dirname));

//view index page 
app.get('/',function(req,res){
	res.sendfile('index.html');
});

//get data from our client index page 
app.post('/send',function(req,res){
    let body = req.body;
    var data = body.postcard.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    fs.writeFileSync('image.png', buf);
    let recipients = Array.from(body.to);
    let recipientList = recipients.join(",");
	var mailOptions={
		to: recipientList,
		subject: body.subject,
        text: body.text,
        html: "Embedded image: <img src='cid:postcardImage'/>",
        attachments: [{
            filename: "image.png",
            path: "./image.png",
            cid: "postcardImage"
        }]
    }
	smtpTransport.sendMail(mailOptions, function(error, response){
        if(error)
        {
            console.log(error);
		    res.end("error");
	    } else {
            console.log("Mail is sent: " + response.message);
		    res.end("sent");
    	 }
    });
});

//Run on the port defined in the .env file.
app.listen(process.env.PORT, () => {
    console.log('server start, ', process.env.PORT);
});
