const User = require('../models/user')
const crypto = require("crypto")
const uuid = require('uuid/v4')

const userController = {}

/**
 * Create New User
 */
userController.createUser = (req, res) => {

    if(typeof(req.body.firstname) === 'undefined' || typeof(req.body.lastname) === 'undefined' || typeof(req.body.email) === 'undefined' || typeof(req.body.username) === 'undefined' || typeof(req.body.password) === 'undefined'){
        res.status(400)
        response.send("Bad Request") 
    }else{
        let salt = uuid()
        let hash = crypto.createHash('sha256')

        let data = {
            _id: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            auth:{
                salt: salt, 
                password: hash.update(req.body.password + salt,'utf8').digest('hex') 
            },
            postcards: {
                public: [],
                private: []
            }
        }

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
}

/**
 * Authenticates User
 * Used by passport.authenticate() method
 */
userController.auth = (data, done) => {
    let hash = crypto.createHash('sha256')

    User.findById(data.username,(err, user)=>{
        if(err){
            return done(err)
        }else{
            if(!user){
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

/**
 * Returns a user's information
 * Only returs _id, firstname, lastname, postcards records
 */
userController.getUser = (req, res) => {

    User.findOne({_id: req.params.id}, "_id firstname lastname postcards", (err, user) => {
        if(err){
            throw err
        }else{
            if(user){
                if(req.user){
                    if(req.user._id !== user._id){
                        user.postcards.private = null
                    }
                    res.send(user)
                }else{
                    user.postcards.private = null
                    res.send(user)
                }
                
            }else{
                res.status(401)
                res.end("User not found")
            }
        }        
    })
}

/**
 * Searches users
 * matches by _id, firstname and lastname
 *  return _id, firstname and lastname of successful matches
 */
userController.handleSearch = (req, res) => {
    if(req.query.query === ""){
        res.send([])
    }else{
        let regex = new RegExp(".*"+req.query.query+".*", "i")

        let data = {$or: [
            {'_id': regex},
            {'firstname': regex},
            {'lastname': regex}
        ]}
    
        User.find(data, "_id firstname lastname", (err, users) => {
            if(err){
                res.writeHeader(404)
                res.end()
            }else{
                res.send(users)
            }
        })
    }
}
 /**
  * Takes username and returns User object
  * Used by passport.deserializeUser() method
  */
userController.deserializeUser = (username, done) => {
    User.findOne({_id: username}, (err, user) => {
        if(err){
            return done(err)
        }
        if(!user){
            return done(null, false, {message: "Username or Password is incorrect"})
        }else{
            return done(null, user)
        }
    })
}

/**
 * Modfies Current User Document
 */
userController.updateUser = (req, res) => {
    if(req.user){
        let data = req.body

        if(req.body.password){
            let salt = uuid()
            let hash = crypto.createHash('sha256')                 
            data = {
                auth: {
                    password: hash.update(req.body.password + salt,'utf8').digest('hex'),
                    salt: salt
                }
            }
        }

        User.findOne({_id: req.user._id},(err, user) => {
            if(err){
                res.send({
                    success: false,
                    err: err
                })
            }else if(user){
                for(prop in data){
                    user[prop] = data[prop]
                }
    
                user.save()
                res.send({
                    success: true
                })
            }
        })
    }else{
        res.redirect("/")
    }
}

/**
 * Deletes Current user Document
 */
userController.deleteUser = (req, res) => {
    if(req.user){
        User.deleteOne({_id: req.user._id}, (err) => {
            if(err){
                res.send({success: false, err: err})
            }else{
                req.logout()
                res.send({success: true})
            }
        })
    }else{
        res.redirect("/")
    }
}
 /**
  * Saves Postcard to current user
  */
userController.savePostcard = (req, res) => {
    let postcard = req.body.postcard;
    if (req.user) {
        let userId = req.user._id;
        User.findOne({_id: userId}, (err, user) => {
            if (err) {
                res.send({success: false, message: err.message});
            }
            else {
                if (JSON.parse(req.body.isPrivate)) {
                    if (postcard._id) {
                        user.postcard.private[postcard._id] = postcard;
                    }
                    else {
                        postcard._id = user.postcards.private.length;
                        user.postcards.private.push(postcard);
                    }
                }
                else {
                    if (postcard._id) {
                        user.postcard.public[postcard_id] = postcard;
                    }
                    else {
                        postcard._id = user.postcards.public.length;
                        user.postcards.public.push(postcard);
                    }
                }
                user.save((err) => {
                    if (err) {
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.write(JSON.stringify({'success':false,'message':"Failed to save postcard.", 'user': user}))
                        res.end()
                    }
                    else {
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.write(JSON.stringify({'success':true,'message':"Successfully saved postcard.", 'user': user}))
                        res.end()
                    }
                });
            }
        })
    }
    else {
        res.writeHead(200,{'Content-Type':'application/json'});
        res.write(JSON.stringify({'success':false,'message':"You must be logged in to save a postcard.", 'user': null}))
        res.end()
    }
}

/**
 * Get postcard from any user
 */
userController.getPostcard = (req, res) => {
    
    User.findOne({_id: req.params.username}, (err, user) => {
        if(err){
            res.end(400)
        }else{
            if(user){
                let postcard = user.postcards[req.params.visibility][req.params.id]
                if(postcard){
                    res.json(JSON.stringify(postcard));
                }else{
                    res.writeHeader(400);
                    res.end()
                }                
            }
        }
    })
}

module.exports = userController