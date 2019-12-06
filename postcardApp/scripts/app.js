const app = angular.module("PostcardService", ["ngSanitize"])

app.controller("AuthController", ["$scope", "$http", "$rootScope",($scope, $http, $rootScope) => {

    $scope.user = null
    
    $scope.isAuthenticated = () => {
        $http.get('/user?from='+window.location.pathname).then(res => {
            if(res.data.error){
            }else{
                $rootScope.$broadcast("user", res.data)
            }
        })
    }

    $scope.$on("user", (event, data) => {
        $scope.user = data
        if($scope.user){
            $('#save').removeClass('hidden')
        }else{
            $('#save').addClass('hidden')
        }
    })

    $scope.isAuthenticated()
    
    $scope.showlogin = () => {
        $("#login").toggleClass('hidden')
    }

    $scope.login = {
        username: "",
        password: "",
        isValid: false
    }

    $scope.error = ""

    $scope.authenticate = () => {
        if($scope.login.isValid){
            $http.post('/login', $scope.login)
            .then(res => {
                if(res.data.success){
                    if(window.location.pathname.includes('/design')){
                        $scope.isAuthenticated()
                        $scope.showlogin()
                    }else{
                        location.reload()
                    }
                }                  
            })
            .catch(e => {
                $scope.error = "Username or Password is invalid"
                $("#uname").addClass('is-invalid')
                $("#pword").addClass('is-invalid')     
                $("#login-button").attr('disabled',true) 
            })
        }
    }

    $scope.validateLogin = () => {
        if($scope.login.username === ""){
            $scope.login.isValid = false
            $("#uname").addClass('is-invalid')
            $("#login-button").attr('disabled',true)
        }else{
            $("#uname").removeClass('is-invalid')
            $("#uname").addClass('is-valid')
        }
        if($scope.login.password === ""){
            $scope.login.isValid = false
            $("#pword").addClass('is-invalid')    
            $("#login-button").attr('disabled',true)        
        }else{
            $("#pword").removeClass('is-invalid')            
            $("#pword").addClass('is-valid')
        }        
        if($scope.login.password !== "" && $scope.login.username !== ""){
            $scope.login.isValid = true 
            $("#login-button").attr('disabled',false)
        }
    }

    $scope.logout = () => {
        $http.get('/logout').then(res => {
            if(res.data.success){
                if(window.location.pathname.includes('/design')){
                    if(window.location.pathname.includes('/private')){
                        location.reload()
                    }else{
                        $scope.isAuthenticated()
                    }                    
                }else{
                    location.reload()
                }
            }
        })
    }
}])

app.controller("RegistrationController", ['$scope', '$http', ($scope, $http) => {

    $scope.user = {
        firstname: "",
        lastname: "",
        email: "",
        username: "",
        password: "",
        confirm: "",
        isValid: false
    }

    $scope.error = ""

    $scope.register = () => {
        $http.post('/user', $scope.user)
        .then(res => {
            $scope.error = res.data.message
        })
    }

    $scope.validateRegistration = () => {

        for(prop in $scope.user){

            if($scope.user[prop] === ""){
                $scope.user.isValid = false
                $("#"+prop).addClass('is-invalid')
                $("#reg-btn").attr("disabled", true)
            }else if(prop === "confirm" && $scope.user.confirm !== $scope.user.password){
                $scope.user.isValid = false
                $("#confirm").addClass('is-invalid')
                $("#reg-btn").attr("disabled", true)
            }else if(prop === "email" && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test($scope.user.email)){
                $scope.user.isValid = false
                $("#email").addClass('is-invalid')
                $("#reg-btn").attr("disabled", true)
            }else{
                $scope.user.isValid = true
                $("#"+prop).removeClass('is-invalid')
                $("#"+prop).addClass('is-valid')
            }
        }

        if($scope.user.isValid){
            $("#reg-btn").attr("disabled", false)
        }

    }
}])

app.controller("ProfileController", ['$scope', '$http', '$sce',($scope, $http, $sce) =>{

    $scope.query = window.location.pathname.slice(9)
    $scope.currentUser = null
    
    $scope.trust = html => {
        return $sce.trustAsHtml(html)
    }

    $http.get('/user/'+$scope.query)
    .then(res => {
        if(res.data.error){
        }else{
            $scope.user = res.data
        }
    })    

    $scope.vote = (id, vote) => {
        console.log(id, vote)
        $http.post(`/vote/${$scope.user._id}/${id}`, {vote: vote, voter: $scope.currentUser.username})
            .then(res => {
                if(res.data.success){
                    $scope.user.postcards.public[id] = res.data.postcard
                    if($scope.currentUser && $scope.currentUser.voted_on){
                        $scope.currentUser.voted_on = res.data.voter
                    }
                }                
            })
    }

    $scope.voted = (id) => {
        if($scope.currentUser && $scope.currentUser.username !== $scope.user._id){
            if($scope.currentUser.voted_on[$scope.user._id] && $scope.currentUser.voted_on[$scope.user._id][id]){
                let p = $scope.currentUser.voted_on[$scope.user._id][id]
                if(p.vote == 'up'){
                    return "upvoted"
                }else if(p.vote == "down"){
                    return "downvoted"
                }else{
                    return "voted"
                }
            }
        }
    }
    
    $scope.delete = (visibility, id) => {
        $http.delete(`/postcard/${visibility}/${id}`)
        .then(res => {
            if (res.data.success){
                $scope.user.postcards[visibility].splice(id, 1);
            }
        })
    }

    $scope.$on('user', (event, data) =>{
        $scope.currentUser = data
    })
}])

app.controller("SearchController", ['$scope', '$http', function($scope, $http){

    $scope.query = ""
    $scope.results = []

    $scope.search = (query) => {
        $http.get('/search?query='+query)
        .then(res => {
            if(res.data.error){
            }else{
                $scope.results = res.data
            }
        })
    }
}])

app.controller("AccountController", ['$scope', '$http', ($scope, $http) => {

    $scope.user = null
    $scope.edit = {
        username: false,
        firstname: false,
        lastname: false, 
        email: false
    }
    $scope.auth = {
        password: "",
        confirm: ""
    }

    $scope.modify = name => {
        $scope.edit[name] = !$scope.edit[name]
        $('#'+name).attr('disabled', !$scope.edit[name])
        $('#save-btn').attr('disabled', !$scope.edit[name])
    }

    $scope.save = () => {
        $http.put('/user', $scope.user)
        .then((res) => {
            if(res.data.success){
                $scope.edit = {
                    username: false,
                    firstname: false,
                    lastname: false, 
                    email: false
                }
                location.reload()
            }
        })
    }

    $scope.validatePassword = () => {
        if($scope.auth.username === ""){
            $("#password").addClass('is-invalid')
            $("#change-password").attr('disabled',true)
        }else{
            $("#password").removeClass('is-invalid')
            $("#password").addClass('is-valid')
        }
        if($scope.auth.username === "" || $scope.auth.password !== $scope.auth.confirm){
            $("#confirm").addClass('is-invalid')    
            $("#change-password").attr('disabled',true)   
        }else{
            $("#confirm").removeClass('is-invalid')
            $("#confirm").addClass('is-valid')
            $("#change-password").attr('disabled',false)   
        }        
    }

    $scope.changePassword = () => {
        $http.put('/user', $scope.auth)
        .then((res) => {
            console.log(res.data)
            if(res.data.success){
                $scope.edit = {
                    username: false,
                    firstname: false,
                    lastname: false, 
                    email: false
                }
                location.reload()
            }
        })
    }

    $scope.$on("user", (event, data) => {
        $scope.user = data
    })

    $scope.toggleDelete = () => {
        $("#deletion-confirm").toggleClass("hidden")
    }

    $scope.delete = () => {
        $http.delete('/user')
        .then(res => {
            if(res.data.success){
                location.reload()
            }
        })
    }

}])