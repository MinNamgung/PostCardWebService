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
userController.auth = (data, req, res) => {
    let hash = crypto.createHash('sha256')

    User.findById(data.username,(err, user)=>{
        if(err){
            res.writeHead(200,{'Content-Type':'application/json'})
            res.write(JSON.stringify({'success':false, 'message':"Username or Password is incorrect"}))
            res.end()
        }else{
            if(user === null){
                res.writeHead(200,{'Content-Type':'application/json'})
                res.write(JSON.stringify({'success':false, 'message':"Username or Password is incorrect"}))
                res.end()
            }else{
                let hashedpass = hash.update(data.password + user.auth.salt,'utf8').digest('hex')

                if(user.auth.password === hashedpass){                
                    req.session.user = user
                    res.cookie('loggedin', true)      
                    res.writeHead(200,{'Content-Type':'application/json'})
                    res.write(JSON.stringify({'success':true, 'message':"Login Sucessful"}))
                    res.end()                   
                }else{
                    res.writeHead(200,{'Content-Type':'application/json'})
                    res.write(JSON.stringify({'success':false, 'message':"Username or Password is incorrect"}))
                    res.end()
                }
            }
        }
    })
}

module.exports = userController