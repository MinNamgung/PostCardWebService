//load environment variables 
const parse = require('querystring')
const path = require('path')
const mongoose = require('mongoose')
const crypto = require("crypto")
const uuid = require('uuid/v4')
const session = require('express-session')
const cookie = require('cookie-parser')
require('dotenv').config();
let fs = require("fs");
const express = require('express');
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();

const userController = require("./controller")

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
}));

mongoose.connect(process.env.DB_URL)
    .then(() =>  console.log('connection succesful'))
    .catch((err) => console.error(err));
mongoose.promise = global.Promise


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

app.use(cookie())

let ttl = 2629746  // 1 month

app.use(session({
    key: "id",
    secret: uuid(),
    resave: false, 
    saveUninitialized: false,
    cookie: {
        expires: ttl
    }
}))

app.use((req, res, next) => {
    if(req.cookies.id && !req.session.user){
        res.clearCookie('id')
    }
    next()
})

let sessionChecker = (req, res, next) => {
    if(req.session.user && req.cookies.id){
        res.redirect('/profile');
    }else{
        next()
    }
}

function register(data, request, response){

    if(typeof(data.firstname) === 'undefined' || typeof(data.lastname) === 'undefined' || typeof(data.email) === 'undefined' || typeof(data.username) === 'undefined' || typeof(data.password) === 'undefined'){
        response.writeHeader(400)
        response.end() 
    }else{
        let salt = uuid()
        let hash = crypto.createHash('sha256')

        let user = {
            _id: data.username,
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            auth:{
                salt: salt, 
                password: hash.update(data.password + salt,'utf8').digest('hex') 
            }
        }
        userController.create(user, response)
    }
}

function login(data, request, response){

    if(typeof(data.username) === 'undefined' || typeof(data.password) === 'undefined'){
        response.writeHeader(400)
        response.end() 
    }else{  
        userController.auth(data, request, response)
    }
} 

app.get('/', sessionChecker, (req,res) => {
    res.sendFile(path.join(__dirname+"/templates/index.html"))
})

app.route('/register')
    .get(sessionChecker, (req,res) => {
        res.sendFile(path.join(__dirname+"/templates/register.html"))
    })
    .post((req,res)=>{
        register(req.body,req,res)
    })

app.post("/login", (req,res)=>{
    login(req.body,req,res)
})

app.get('/profile',(req,res) => {
    if(req.session.user && req.cookies.id) {
        res.sendFile(path.join(__dirname+"/templates/profile.html"))
    }else{
        res.redirect('/')
    }
})

app.get('/logout', (req, res) => {
    if(typeof(req.query.from) !== 'undefined' && req.query.from === "design"){
        res.clearCookie('id')
    }else if(req.session.user && req.cookies.id){
        res.clearCookie('id')
        res.redirect('/')
    }else{
        res.redirect('/')
    }
})

app.get('/design', (req, res)=> {
    res.sendFile(path.join(__dirname+"/templates/design.html"))
})

//get data from our client index page 
app.post('/send',function(req,res){
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
	var mailOptions={
		to: recipientList,
		subject: body.subject,
        text: body.text,
        html: "<img src='cid:postcardImage'/>",
        attachments: [{
            filename: filename,
            path: postcardPath,
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
        fs.unlinkSync(postcardPath);
        fs.rmdirSync(directory);
    });
});

app.get('/:file',(req,res) => {

    var type = {
        html: {
            dir: '/templates',
            type:'text/html'
        },
        js: {
            dir: '/scripts',
            type:'text/javascript'
        },
        css: {
            dir: '/css',
            type:'text/css'
        },
        svg: {
            dir: '/resources\\SVG',
            type: 'image/svg+xml'
        },
        otf:{
            dir: '/resources\\fonts',
            type: 'application/x-font-opentype'
        }
    }

    let ext = path.extname(req.params.file).slice(1)
    let file = __dirname + type[ext].dir+"\\"+req.params.file;
    res.sendFile(file, {headers: {'Content-Type':type[ext].type}})
})
//Run on the port defined in the .env file.
app.listen(process.env.PORT, () => {
    console.log('server start, ', process.env.PORT);
});

module.exports = app