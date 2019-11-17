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
const Nexmo = require('nexmo')  //sms texting api 
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require('twilio')(accountSid, authToken);    //whatsapp api
const cloudinary = require('cloudinary').v2;                //save image to cloud api

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

const flash = require("connect-flash");

const userController = require("./controller")

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy


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
        user: process.env.Emailuser, 
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
    secret: process.env.SESSION_SECRET,
    resave: false, 
    saveUninitialized: false,
    cookie: {
        expires: ttl
    }
}))

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy((username, password, done) => {
    userController.auth({username: username, password: password}, done)
}))

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser((username, done) => {
    userController.get({_id: username}, null, null, null, (err, user, req, res) => {
        if(err){
            return done(err)
        }
        if(!user){
            return done(null, false, {message: "Username or Password is incorrect"})
        }else{
            return done(null, user)
        }
    })
})

app.use(flash())

app.get('/', (req,res) => {
    if(req.user){
        res.redirect('/profile')
    }else{
        res.sendFile(path.join(__dirname+"/templates/index.html"))
    }    
})

app.route('/register')
    .get((req,res) => {
        res.sendFile(path.join(__dirname+"/templates/register.html"))
    })
    .post((req,res)=>{

        let data = req.body

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
            userController.create(user, res)
        }
    })

app.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if(err){
            return next(err)
        }
        if(!user){
            return ((res) => {
                res.writeHead('200',{'Content-Type':'application/json'})
                res.write(JSON.stringify({'success': false, 'message':'Username or Password is incorrect'}))
                res.send()
            })(res)
        }else{
            req.login(user, err => {
                if(err){
                    return next(err)
                }
                return ((res) => {
                    res.writeHead('200',{'Content-Type':'application/json'})
                    res.write(JSON.stringify({'success': true, 'message':'Login Successful'}))
                    res.send()  
                })(res)
            })
        }
    })(req, res, next)
})

app.get('/user', (req, res) => {
    if(req.user){
        let user = req.user[0]
        res.send({username: user._id})
    }else{
        res.send(null)
    }
})

app.get('/profile',(req,res) => {
    if(req.user){
        res.redirect('/profile/'+req.user[0]._id)
    }else{
        res.sendFile(path.join(__dirname+"/templates/profile.html"))
    }    
})

app.get("/profile/:user", (req, res) =>{
    res.sendFile(path.join(__dirname+"/templates/profile.html"))
})

app.get('/logout', (req, res) => {
    if(req.user){
        req.logout()
        res.send({success: true})
    }else{
        res.redirect(req.get('referer'));
    }
})

app.get('/design', (req, res)=> {
    res.sendFile(path.join(__dirname+"/templates/design.html"))
})

app.get('/design/:username/:visibility/:id', (req, res) => {
    if(req.params.visibility === 'private'){
        if(!req.user){
            res.redirect('/design')
        }else{
            if(req.user[0]._id !== req.params.username){
                res.redirect('/design')
            }else{
                res.sendFile(path.join(__dirname+"/templates/design.html"))
            }
        }
    }else{
        res.sendFile(path.join(__dirname+"/templates/design.html"))
    }
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
            res.end("error");
	    } else {
            console.log("Mail is sent: " + response.message);
            res.end("sent");
         }
    });
});


//Send txt message 
app.post('/sendtxt', (req, res) => {
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
})

//send whatsapp
app.post('/sendwhatsapp', (req, res) =>{
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
})

app.post('/facebookSend', (req, res) =>{
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
     
});

app.get('/404', (req,res) => {
    res.sendFile(path.join(__dirname+"/templates/404.html"))
})

//Retrun data from db
app.get('/user/:id',(req,res) => {
    
    let data= {
        _id: req.params.id
    }

    userController.get(data, "_id firstname lastname postcards  ", req, res, (err, data, req, res) => {
        if(err){
            console.log(err)
        }else{
            if(data.length > 0){
                let user = data[0]['_doc']

                if(req.user){
                    if(req.user[0]._id !== user._id){
                        delete user.postcards.private
                    }
                }else{
                    delete user.postcards.private
                }
                res.send(user)
            }else{
                res.writeHeader(400)
                res.end()
            }
        }
    })
})

app.get('/search', (req, res) => {

    let q = req.query.query
    if(q === ""){
        res.send([])
    }else{
        let regex = new RegExp(".*"+q+".*", "i")

        let data = {$or: [
            {'_id': regex},
            {'firstname': regex},
            {'lastname': regex}
        ]}
    
        userController.get(data, "_id firstname lastname", req, res, (err, users, req, res) => {
            if(err){
                res.writeHeader(404)
                res.end()
            }else{
                res.send(users)
            }
        })
    }
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
        jpg: {
            dir: '/resources',
            type: 'image/jpeg'
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

app.post("/postcards", (req, res) => {
    userController.savePostcard(req, res);
})

//Get a postcard to load into the design page
app.get('/postcard/:username/:visibility/:id', (req, res) => {

    data = {_id: req.params.username}
    
    userController.get(data, null, res, req, (err, users, res, req) => {
        if(err){
            res.end(400)
        }else{
            if(users.length > 0){
                let user = users[0]
                let postcard = user.postcards[req.params.visibility][req.params.id]
                if(postcard){
                    res.json(JSON.stringify(postcard));
                }else{
                    res.writeHeader(400).end()
                }                
            }
        }
    })
})

//Run on the port defined in the .env file.
app.listen(process.env.PORT, () => {
    console.log('server start, ', process.env.PORT);
});

module.exports = app