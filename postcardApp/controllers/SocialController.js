const Nexmo = require('nexmo')  //sms texting api 
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require('twilio')(accountSid, authToken);    //whatsapp api
const cloudinary = require('cloudinary').v2;   
const nodemailer = require("nodemailer");
require('dotenv').config();
const fs = require("fs");

//cloud image saving - credential
cloudinary.config({
    cloud_name: process.env.Cloud_name ,
    api_key: process.env.Cloud_APIkey,
    api_secret: process.env.Cloud_APIsecret
});

//Init SMS Nexmo -credential
const nexmo = new Nexmo({
    apiKey: process.env.nexmo_APIkey,
    apiSecret: process.env.nexmo_APISecret,
}, {debug: true})

//use smtp server 
var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: process.env.Emailport,
    auth: {
        user: process.env.Emailuser, 
        pass: process.env.Emailpwd
    },
    tls: {rejectUnauthorized: false},
    debug:true
});

const socialController = {}

/**
 * Sending Email
 */
socialController.sendEmail = (req,res) => {
    let body = req.body;
    var data = body.postcard.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    let directory = "postcard" + Date.now();
    fs.mkdirSync(directory);
    let filename = "postcard.png";
    let postcardPath = directory + "/" + filename;
    fs.writeFileSync(postcardPath, buf);
    let recipients = Array.from(body.to);
    let recipientList = recipients.join(",");
    let subject = "Postcard From " + body.from;
    let html = "<div>" + body.message + "</div>" + "<img src='cid:postcardImage'/>";
    var mailOptions={
        from: body.from,
        to: recipientList,
        subject: subject,
        html: html,
        attachments: [{
            filename: filename,
            path: postcardPath,
            cid: "postcardImage"
        }]
    }
    smtpTransport.sendMail(mailOptions, function(error, response) {
        fs.unlink(postcardPath, (error) => { 
            if (error) { console.log(error); }
            fs.rmdir(directory, (error) => { if (error) {console.log(error); }});
        });
        if(error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("Mail is sent: " + response.message);
            res.end("sent");
        }
    });
}

socialController.verificationemail = (req, res) => {
    let mailOptions = {
        to: req.body.email,
        from: "postcardwebservice@gmail.com",
        subject: "PostCard Web Service Verification Email!",
        html: "<p> Hello <b>" + req.body.firstname +"</b> Your username is <b>"+ req.body.username + "</b><br/>" +
                "If this is not your email, please contact us to <i>postcardwebservice@gmail.com </i>" + "<br/>" + "Thank you for joining our service! <br/>"+
                "Please sign in <a href='https://postcard-service.herokuapp.com/'> PostCard Web Service </a></p>"
    }
    smtpTransport.sendMail(mailOptions, function(error, response) {
        if(error) {
            console.log(error);
            res.end("error")
        } else {
            console.log("verification mail is sent!")
            res.end("sent")
        }
    })
}


/**
 * Sending Text Messages
 */
socialController.sendText = (req, res) => {
    const number = req.body.number;
    const text = req.body.text;
    const postcard = req.body.postcard;
    
    nexmo.message.sendSms(
        process.env.nexmo_fromNumber, number, text, {type: 'unicode'},
        (err, responseData) => {
            if(err) {
                console.log(err);
            } else {
                console.dir(responseData);
            }
        }
    );
}

/**
 * Sending Whatsapp Messages
 */
socialController.sendWhatsappMsg = (req, res) =>{
    let body = req.body;
    var data = body.postcard.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    let filename = "postcard.png";
    let postcardPath = filename;
    fs.writeFileSync(postcardPath, buf);
    let recipient = body.recipient;
    let message = body.whatsappMessage;
    cloudinary.uploader.upload(postcardPath, function(error, result) {
        console.log(result, error)
        console.log(result.url)
        client.messages.create({
            from: 'whatsapp:+14155238886',
            body: message,
            mediaUrl: [result.url],
            to: 'whatsapp:+' + recipient
        }).then(message => console.log(message.status));
    }).then(fs.unlink(postcardPath, function (err) {
        if (err) throw err;
    })); 
}

/**
 * Making Facebook Post
 */
socialController.makeFacebookPost = (req, res) =>{
    var DataURL = req.body.dataURL;
    var data = DataURL.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    let filename = "postcard.png";
    let postcardPath = filename;
    fs.writeFileSync(postcardPath, buf);
    cloudinary.uploader.upload(postcardPath, function(error, result) {
        console.log(result, error)
        require("openurl").open('https://www.facebook.com/dialog/feed?app_id=2470548966598239&display=page&picture=' + result.url  + '&caption=TEST, test');
    }).then(fs.unlink(postcardPath, function (err) {
        if (err) throw err;
    }));      
}

module.exports = socialController