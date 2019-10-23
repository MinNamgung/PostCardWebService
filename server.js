const http = require('http')
const port = 8080
const parse = require('querystring')
const path = require('path')
const fs = require('fs')
const url = require('url')
const MongoClient = require("mongodb").MongoClient
const assert = require("assert")
const crypto = require("crypto")
const uuid = require('uuid/v4')

const express = require('express')
const session = require('express-session')
const cookie = require('cookie-parser')

const app = express()

const client = new MongoClient("mongodb://localhost:27017")


app.use(cookie())

app.use(session({
    key: "id",
    secret: uuid(),
    resave: false, 
    saveUninitialized: false,
    cookie: {
        expires: 600000
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

function register(data, response){

    //console.log(data)

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

    console.log(user)

    client.connect((err,client)=>{
        assert.equal(null,err)
        console.log("connected to server")

        const userdb = client.db('PostcardService')
        userdb.collection('User').insertOne(user,(err,res)=>{
            if(!err){
                //assert.equal(null, err)
                //assert.equal(1, res.insertedCount)

                //console.log("user inserted",res)
                response.writeHeader(200,{'Content-Type':'application/json'})
                response.write(JSON.stringify({'success':true, 'message':'Registration Successful'}))
                response.end()       
            }else{
                //console.log('error',err.errmsg)
                response.writeHead(200,{'Content-Type':'application/json'})
                response.write(JSON.stringify({'success':false,'message':"Username already exists"}))
                response.end()
            }            
        })
    })
}

function login(username, password, request, response){

    let hash = crypto.createHash('sha256')

    client.connect((err,client)=>{
        assert.equal(null,err)
        console.log("connected to server")

        const userdb = client.db('PostcardService',)

        userdb.collection('User').findOne({_id:username},(err,res)=>{
            console.log('reached here 1', res)
            if(err || res == null){
                console.log('reached here 2')
                response.writeHead(555,{'Content-Type':'application/json'})
                response.write(JSON.stringify({'success':false,'message':'Username or Password is incorrect'}))
                response.end()
            }else{
                console.log('reached here 3')
                let salt = res.auth.salt
                let hashedpass = hash.update(password + salt,'utf8').digest('hex')

                if(res.auth.password === hashedpass){
                    console.log('reached here 4')
                    let user = {
                        id: res.username,
                        firstname: res.firstname, 
                        lastname: res.lastname, 
                        email: res.email
                    }

                    request.session.user = user
                    response.redirect('/profile')

                    /*response.writeHead(200,{'Content-Type':'application/json'})
                    response.write(JSON.stringify({'success':true, 'message':'Login Successful'}))
                    response.end()*/

                    
                }else{
                    response.writeHead(200,{'Content-Type':'application/json'})
                    response.write(JSON.stringify({'success':false, 'message':"Username or Password is incorrect"}))
                    response.end()
                }
            }
        })
    })    
}


app.get('/', sessionChecker, (req,res) => {
    res.sendFile(path.join(__dirname+"/app/templates/index.html"))
})

app.route('/register')
    .get(sessionChecker, (req,res) => {
        res.sendFile(path.join(__dirname+"/app/templates/register.html"))
    })
    .post((req,res)=>{
        //console.log(req)
        let data = ''
        req.on('data', chunk => {
            data += chunk.toString() // convert Buffer to string
        })
        req.on('end', () => {
            let formData = parse.parse(data)
            console.log(formData)   
            register(formData, res)        
        })
    })

app.post("/login", (req,res)=>{
    //console.log(req)
    let data = ''
    req.on('data', chunk => {
        data += chunk.toString() // convert Buffer to string
    })
    req.on('end', () => {
        let formData = parse.parse(data)
        console.log(formData)   
        login(formData.username, formData.password, req, res)        
    })
})

app.get('/profile',(req,res) => {
    if(req.session.user && req.cookies.id) {
        res.sendFile(path.join(__dirname+"/app/templates/profile.html"))
    }else{
        res.redirect('/')
    }
})


app.get('/logout', (req, res) => {
    if(req.session.user && req.cookies.id){
        res.clearCookie('id')
        res.redirect('/')
    }else{
        res.redirect('/login')
    }
})

app.get('/:file',(req,res) => {
    console.log(path.extname(req.params.file).slice(1))

    var type = {
        html: {
            dir: 'templates',
            type:'text/html'
        },
        js: {
            dir: 'js',
            type:'text/javascript'
        },
        css: {
            dir: 'css',
            type:'text/css'
        },
        svg: {
            dir: 'resources\\SVG',
            type: 'image/svg+xml'
        }
    }

    let ext = path.extname(req.params.file).slice(1)
    let file = __dirname + "\\app\\"+type[ext].dir+"\\"+req.params.file;
    
    console.log(file)

    res.sendFile(file, {headers: {'Content-Type':type[ext].type}})
})

app.use((req,res,next) => {
    res.status(404).sendFile(path.join(__dirname+"/app/templates/404.html"))
})

app.listen(port)

console.log("Server is running on port " + port)