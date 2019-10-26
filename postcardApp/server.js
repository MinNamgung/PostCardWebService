//load environment variables 
require('dotenv').config();

var express=require('express');
var nodemailer = require("nodemailer");
var app = express();
var PORT = process.env.PORT

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

//run port 8080
app.listen(PORT, () => {
    console.log('server start, ', 8080);
});
