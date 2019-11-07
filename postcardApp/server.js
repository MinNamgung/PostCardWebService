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
            }, 
            postcards: {
                public: [],
                private: []
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
            res.end(error);
        } else {
            console.log("Mail is sent. Response: " + response);
            res.end(response);
        }
    });
});

app.post("/postcards", (req, res) => {
    let postcard = JSON.parse(req.body.postcard);
    let postcardId = postcard.id;
    let userId = req.body.userId;
    if (postcard && !isNaN(postcardId) && !isNaN(userId)) {
        //save the postcard to database
        res.send("Postcard successfully saved.");
    }
    else {
        res.status(400);
        res.send("Missing required attributes in body of the request.");
    }
})

app.get('/404', (req,res) => {
    res.sendFile(path.join(__dirname+"/templates/404.html"))
})

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
            dir: '/resources/SVG',
            type: 'image/svg+xml'
        },
        otf:{
            dir: '/resources/fonts',
            type: 'application/x-font-opentype'
        }
    }

    let ext = path.extname(req.params.file).slice(1)
    if(typeof(type[ext]) !== 'undefined'){        
        let file = __dirname + type[ext].dir+"/"+req.params.file;
        if(fs.existsSync(file)){
            res.sendFile(file, {headers: {'Content-Type':type[ext].type}})
        }else{
            if(ext === 'html'){
                res.redirect('/404')
            }else{
                res.sendStatus(404).end()
            }            
        }        
    }else{
        res.sendStatus(404).end()
    }
})
//Run on the port defined in the .env file.
app.listen(process.env.PORT, () => {
    console.log('server start, ', process.env.PORT);
});

module.exports = app