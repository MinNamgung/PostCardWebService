const app = angular.module("PostcardService", [])

app.controller("AuthController", ["$scope", "$http", "$rootScope",function($scope, $http, $rootScope){

    $scope.user = null
    
    $scope.isAuthenticated = () => {
        $http.get('/user').then(res => {
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
                }else{
                    $scope.error = res.data.message
                    $("#uname").addClass('is-invalid')
                    $("#pword").addClass('is-invalid')     
                    $("#login-button").prop('disabled',true)   
                }
            })
        }
    }

    $scope.validateLogin = () => {
        if($scope.login.username === ""){
            $scope.login.isValid = false
            $("#uname").addClass('is-invalid')
            $("#login-button").prop('disabled',true)
        }else{
            $("#uname").removeClass('is-invalid')
            $("#uname").addClass('is-valid')
        }
        if($scope.login.password === ""){
            $scope.login.isValid = false
            $("#pword").addClass('is-invalid')    
            $("#login-button").prop('disabled',true)        
        }else{
            $("#pword").removeClass('is-invalid')            
            $("#pword").addClass('is-valid')
        }        
        if($scope.login.password !== "" && $scope.login.username !== ""){
            $scope.login.isValid = true 
            $("#login-button").prop('disabled',false)
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

app.controller("ProfileController", ['$scope', '$http', function($scope, $http){

    $scope.query = window.location.pathname.slice(9)
    $scope.currentUser = null
    
    $http.get('/user/'+$scope.query)
    .then(res => {
        if(res.data.error){
        }else{
            $scope.user = res.data
        }
    })    

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