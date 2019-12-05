const fs = require('fs')
const path = require('path')
const appController = {}

/**
 * Serves Homepage
 */
appController.showHome = (req,res) => {
    if(req.user && !req.params.user){
        res.redirect('/profile/'+req.user._id)
    }else{
        res.sendFile("/templates/index.html", {root: './postcardApp'})
    }    
}

/**
 * Serves Registration Page
 */
appController.showRegister = (req,res) => {
    if(req.user){
        res.redirect('/')
    }else{
        res.sendFile("/templates/register.html", {root: './postcardApp'})
    }
}

/**
 * Serves Profile Page
 */
appController.showProfile = (req,res) => {
    res.sendFile("/templates/profile.html", {root: './postcardApp'})
}

/**
 * Serves Design Page
 */
appController.showDesign = (req, res)=> {
    if(req.params.visibility === 'private'){
        if(!req.user){
            res.redirect('/design')
        }else{
            if(req.user._id !== req.params.username){
                res.redirect('/design')
            }else{
                res.sendFile("/templates/design.html", {root: './postcardApp'})
            }
        }
    }else{
        res.sendFile("/templates/design.html", {root: './postcardApp'})
    }  
}

/**
 * Serves 404 page
 */
appController.show404 = (req,res) => {
    res.sendFile("/templates/404.html", {root: './postcardApp'})
}

/**
 * Serves Accoutn Management page
 */
appController.showAccountManagement = (req, res) => {
    if(req.user){
        res.sendFile("/templates/account.html", {root: './postcardApp'})
    }else{
        res.redirect("/")
    }
}

/**
 * Handles Sucessful Login Attempt
 * (Unsuccessful attempt is handled by handling 401 error on client side)
 */
appController.handleLogin = (req, res) => {
    res.send({'success': true, 'message':'Login Successful'})  
}

/**
 * Handles Logout
 */
appController.handleLogout = (req, res) => {
    if(req.user){
        req.logout()
        res.send({success: true})
    }else{
        res.redirect(req.get('referer'));
    }
}

/**
 * Returns currently authenticated user, if any
 */
appController.getUser = (req, res) => {
    if(req.user){
        let user = req.user
        if(req.query.from === "/account"){
            res.send({
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email
            })
        }else{
            res.send({username: user._id, voted_on: user.postcards.voted_on})
        }        
    }else{
        res.send(null)
    }
}

/**
 * Serves image
 */
appController.getImage = (req, res) => {
    let imagePath = '.' + req.url //path.join('./', req.url);
    imagePath = imagePath.replace(new RegExp("%20", "g"), " ");
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath, {root: './'});
    }
    else {
        res.writeHeader(404);
        res.end();
    }
}

/**
 * Handles Image upload
 */
appController.uploadImage = (req, res) => {
    if (req.user && req.user._id) {
        let makeNonexistingDir = function (directoryPath) {
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath);
            }
        }
        let username = req.user._id;
        let filename = req.body.fileName;
        let imagesDirectory = "images";
        makeNonexistingDir(imagesDirectory);
        let userDirectory = path.join(imagesDirectory, username);
        makeNonexistingDir(userDirectory);
        let destination = path.join(userDirectory, filename);
        fs.copyFileSync(req.file.path, destination);
        fs.unlinkSync(req.file.path);
        let imageUrl = "url(" + encodeURI(`/${imagesDirectory}/${username}/${filename}`) + ")"
        res.writeHead(200,{'Content-Type':'application/json'});
        res.write(JSON.stringify({'success':true,'message':"Succesfully saved image.", "src": imageUrl}));
        res.end();
    }else {
        res.writeHead(200,{'Content-Type':'application/json'});
        res.write(JSON.stringify({'success':false,'message':"Unauthorized User"}));
        res.end();
    }
}

module.exports = appController