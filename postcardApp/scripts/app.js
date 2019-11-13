const app = angular.module("PostcardService", [])

app.controller("ProfileController", ['$scope', '$http', function($scope, $http){

    $scope.query = window.location.pathname.slice(9)

    return $http.get('/user/'+$scope.query)
    .then(res => {
        if(res.data.error){
        }else{
            $scope.user = res.data
        }
    })    
}])

app.controller("SearchController", ['$scope', '$http', function($scope, $http){

    $scope.query = ""
    $scope.results = []

    $scope.search = function(query){
        $http.get('/search?query='+query)
        .then(res => {
            if(res.data.error){

            }else{
                $scope.results = res.data
            }
        })
    }

    

}])