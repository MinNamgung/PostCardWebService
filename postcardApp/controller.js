const mongoose = require('mongoose')
const User = require('./model')
const crypto = require("crypto")

const userController = {}

userController.create = (data, res) => {
    let user = new User(data)
    user.save((err) => {
        if(err){
            res.writeHead(200,{'Content-Type':'application/json'})
            res.write(JSON.stringify({'success':false,'message':"Username already exists"}))
            res.end()
        }else{
            res.writeHead(200,{'Content-Type':'application/json'})
            res.write(JSON.stringify({'success':true,'message':"Registration successful"}))
            res.end()
        }
    })
}

userController.auth = (data, done) => {
    let hash = crypto.createHash('sha256')

    User.findById(data.username,(err, user)=>{
        if(err){
            return done(err)
        }else{
            if(user === null){
                return done(null, false, {message: "Username or Password is incorrect"})
            }else{
                let hashedpass = hash.update(data.password + user.auth.salt,'utf8').digest('hex')

                if(user.auth.password === hashedpass){           
                    return done(null, user)           
                }else{
                    return done(null, false, {message: "Username or Password is incorrect"})
                }
            }
        }
    })
}

userController.get = (data, req, res, callback) => {
    User.find(data, (err, users) =>{
        if(err){
            callback(err)
        }else{
            callback(null, users, req, res)
        }
    })
}

module.exports = userController