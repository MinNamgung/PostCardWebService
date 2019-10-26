//load environment variables 
require('dotenv').config();

var express=require('express');
var nodemailer = require("nodemailer");
var app = express();

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
app.get('/send',function(req,res){
	var mailOptions={
		to : req.query.to,
		subject : req.query.subject,
		text : req.query.text
	}
	console.log(mailOptions);
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
