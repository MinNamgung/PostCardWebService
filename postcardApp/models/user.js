const mongoose = require('mongoose')

let UserSchema = new mongoose.Schema({
    firstname: String, 
    lastname: String, 
    email: String,
    _id: String, 
    auth:{
        salt: String,
        password: String
    },
    postcards:{
        private: [{}],
        public: [{}],
        voted_on: {}
    }
}, { collection: 'User', minimize: false})

module.exports = mongoose.model("User", UserSchema)