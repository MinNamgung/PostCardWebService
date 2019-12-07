require('dotenv').config();

const express = require('express');
const app = express();
const session = require('express-session')
const cookie = require('cookie-parser')
const bodyParser = require("body-parser");

const mongoose = require('mongoose')
const passport = require('passport')
//const LocalStrategy = require('passport-local').Strategy
const flash = require("connect-flash");
const userController = require("./controllers/UserController")

//Configure Server

mongoose.connect(process.env.DB_URL,{ useNewUrlParser: true, useUnifiedTopology: true })
    .then(() =>  console.log('connection succesful'))
    .catch((err) => console.error(err));
mongoose.promise = global.Promise

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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

passport.serializeUser((user, done) => {
    done(null, user._id)
})
passport.deserializeUser(userController.deserializeUser)

app.use(flash())

//initialises postCardList
userController.initPostcardList()
app.use(require('./routes'))

//Run on the port defined in the .env file.
app.listen(process.env.PORT, () => {
    console.log('server start, ', process.env.PORT);
});

module.exports = app