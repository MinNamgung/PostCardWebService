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
                private: [],
                voted_on: {}
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
                        user.postcards.voted_on = null
                    }
                    res.send(user)
                }else{
                    user.postcards.private = null
                    user.postcards.voted_on = null
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

/*
 * Adds a postcard to the end of array and sets the _id property of postcard.
 */
function addPostcard(array, postcard) {
    postcard._id = array.length;
    array.push(postcard);
}

/*
 * Removes a postcard from the array and sets the remaining postcards _id property.
 */
function removePostcard(array, postcard) {
    array.splice(postcard._id, 1);
    setAllPostcardId(array);
}

/*
 * Sets the _id property of each postcard to its index in the array.
 */
function setAllPostcardId(postcardArray) {
    postcardArray.forEach((postcard, index) => postcard._id = index);
}

 /*
  * Saves Postcard to current user
  */
userController.savePostcard = (req, res) => {
    let postcard = req.body.postcard;
    postcard.rating = {
        up: 0,
        down: 0,
        score: 0
    }
    //true if the _id property is nonempty and defined
    let idIsSet = (postcard._id != "") && (typeof postcard._id != "undefined");
    let isPrivate = JSON.parse(req.body.isPrivate);
    let isUpdate = JSON.parse(req.body.isUpdate);
    let privateStateChanged = JSON.parse(req.body.isPrivateStateChanged);
    let username = req.body.username;
    if (req.user) {
        let userId = req.user._id;
        User.findOne({_id: userId}, (err, user) => {
            if (err) {
                res.send({success: false, message: err.message});
            }
            else {
                //retrieve the collection to save the postcard to
                let postcards = user.postcards.public;
                if (isPrivate) {
                    postcards = user.postcards.private;
                }
                /* If username doesn't match the logged in user, then 
                the logged in user is trying to save another user's public postcard. */
                let copyOtherUsersPostcard = username != req.user._id;
                if (copyOtherUsersPostcard) {
                    addPostcard(postcards, postcard);
                }
                /* 
                If the postcard has been moved from private <=> public and this is an update, remove 
                it from its original collection and add to the new collection.
                */
                else if (privateStateChanged && isUpdate && idIsSet) {
                    //remove the postcard from its old collection. (could be public or private)
                    let newCollection = postcards;
                    let oldCollection = newCollection === user.postcards.private ? user.postcards.public : user.postcards.private;
                    removePostcard(oldCollection, postcard);
                    //add to the new collection (could be public or private)
                    addPostcard(newCollection, postcard);
                }
                else {
                    //_id field must be defined to be an update, else save it as a new postcard
                    if (isUpdate && idIsSet) {
                        postcards.set(postcard._id, postcard);
                    }
                    else {
                        addPostcard(postcards, postcard);
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
 * Deletes single postcard from logged in user
 */
userController.deletePostcard = (req, res) => {
    if (req.user) {
        let userId = req.user._id;
        User.findOne({_id: userId}, (err, user) => {
            if (err) {
                res.send({success: false, message: err.message});
            }
            else {
                //retrieve the collection to delete the postcard from
                let postcard = user.postcards[req.params.visibility][req.params.id];
                
                removePostcard(user.postcards[req.params.visibility], postcard);

                user.save((err) => {
                    if (err) {
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.write(JSON.stringify({'success':false,'message':"Failed to save postcard.", 'user': user}))
                        res.end()
                    }
                    else {
                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.write(JSON.stringify({'success':true,'message':"Successfully deleted postcard.", 'user': user}))
                        res.end();
                    }
                });
            }
        })
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

/**
 * Modifies Postcard Rating
 */
userController.vote = (req, res) => {

    //Determine if user has already voted on postcard
    User.findOne({_id: req.body.voter}, (err, voter) => {
        if(err){
            res.status(400)
            res.end()
        }else{
            if(voter){
                if(voter.postcards.voted_on[req.params.username] && voter.postcards.voted_on[req.params.username][req.params.id]){
                    res.send({success: false, message: "Cannot vote on postcard multiple times"})
                }else{
                    User.findOne({_id: req.params.username}, (err, user) => {
                        if(err){
                            res.status(400)
                            res.end()
                        }else{
                            if(user){
                                //Find and modify postcard
                                let postcard = user.postcards.public[req.params.id]
                                if(postcard){
                                    if(req.body.vote == 'up'){
                                        postcard.rating.up += 1
                                    }else if(req.body.vote == 'down'){
                                        postcard.rating.down += 1
                                    }else{
                                        res.status(400)
                                        res.end()
                                    }
                
                                    postcard.rating.score = postcard.rating.up - postcard.rating.down
                                    user.postcards.public.set(postcard._id, postcard)
                
                                    user.save((err, user) => {
                                        if(err){
                                            res.status(400)
                                            res.end()
                                        }else{
                                            if(!voter.postcards.voted_on[user._id]){
                                                voter.postcards.voted_on[user._id] = {}                                                
                                            }
                                            voter.postcards.voted_on[user._id][postcard._id] = {
                                                owner: user._id,
                                                id: postcard._id,
                                                outerHTML: postcard.outerHTML, 
                                                vote: req.body.vote
                                            }
                                            voter.markModified("postcards")
                                            voter.save((err, voter) => {
                                                if(err){
                                                    throw err
                                                }else{
                                                    res.send({success: true, postcard: postcard, voter: voter.postcards.voted_on})  
                                                }                                                
                                            })                                                                                         
                                        }
                                    })
                                }
                            }
                        }
                    })
                }
            }else{
                res.status(400)
                res.end()
            }
        }
    })
}

module.exports = userController