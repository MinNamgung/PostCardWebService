const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const multer = require('multer')

const userController = require("./controllers/UserController")
const appController = require("./controllers/AppController")
const socialController = require("./controllers/SocialController")

passport.use(new LocalStrategy((username, password, done) => {
    userController.auth({username: username, password: password}, done)
}))

const upload = multer(
    { 
        dest: 'uploads/',
        filename: function(req, file, cb) {
            let filteredName = file.originalName.replace(" ", "_");
            cb(null, filteredName);
        }
    }
 );


module.exports = router

// main Routes
router.get('/', appController.showHome)
router.get('/register', appController.showRegister) 
router.get(['/profile', '/profile/:user'], appController.showProfile)
router.get(['/design', '/design/:username/:visibility/:id'], appController.showDesign)
router.get('/404', appController.show404)
router.get('/account', appController.showAccountManagement)

//Current User Routes
router.get('/user',appController.getUser)
router.post('/user', userController.createUser)
router.put('/user', userController.updateUser)
router.delete('/user', userController.deleteUser)
router.delete('/postcard/:visibility/:id', userController.deletePostcard)

//General User Routes
router.get('/user/:id',userController.getUser)
router.get('/search', userController.handleSearch)

//Authentication Routes
router.post("/login", passport.authenticate('local'), appController.handleLogin)
router.get('/logout', appController.handleLogout)

//Social Feature Routes
router.post('/send', socialController.sendEmail); 
router.post('/sendtxt', socialController.sendText)
router.post('/sendwhatsapp', socialController.sendWhatsappMsg)
router.post('/facebookSend', socialController.makeFacebookPost);

//Postcard Routes
router.post("/postcards", userController.savePostcard)
router.get("/postcards/:page/:pageSize", userController.getPostcardPage)
router.get('/postcard/:username/:visibility/:id', userController.getPostcard)
router.get("/images/:username/:imageName", appController.getImage)
router.post("/images", upload.single("imageFile"), appController.uploadImage)
router.post('/vote/:username/:id', userController.vote)