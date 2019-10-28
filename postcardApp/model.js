const mongoose = require('mongoose')

let UserSchema = new mongoose.Schema({
    firstname: String, 
    lastname: String, 
    email: String,
    _id: String, 
    auth:{
        salt: String,
        password: String
    }
}, { collection: 'User'})

module.exports = mongoose.model("User", UserSchema)